import type { TechEntry } from '@/data/materials';
import { getOverlapCorrection } from '@/data/overlapCorrection';
import { getHospitalCorrection } from '@/data/hospitalCorrection';
import { getEnergyWeight } from '@/data/energyWeight';

export const CATEGORY_LABELS: Record<string, string> = {
  '能源高效利用技术': '能源高效利用技术',
  '智能控制及优化技术': '智能控制及优化技术',
  '可再生能源利用技术': '可再生能源利用技术',
};

export const CATEGORY_COLORS: Record<string, string> = {
  '能源高效利用技术': '#1677ff',
  '智能控制及优化技术': '#8b5cf6',
  '可再生能源利用技术': '#22c55e',
};

export const CATEGORY_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '能源高效利用技术', value: '能源高效利用技术' },
  { label: '智能控制及优化技术', value: '智能控制及优化技术' },
  { label: '可再生能源利用技术', value: '可再生能源利用技术' },
];

export function parseRateRange(
  rateStr: string
): { lower: number; upper: number } | null {
  const match = rateStr.match(/(\d+(?:\.\d+)?)\s*%-?\s*(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  return {
    lower: parseFloat(match[1]) / 100,
    upper: parseFloat(match[2]) / 100,
  };
}

export interface ComprehensiveRateInput {
  techs: TechEntry[];
  climateZone: string;
  hvacYear: number;
  // 以下 3 个字段用于 original 能耗计算（ComprehensiveRateModal 用）
  hospitalLevel: '三级' | '二级';
  province: string;
  totalArea: number;
}

export interface SystemGroupTech {
  techId: string;
  techName: string;
  baseRate: number;
  adaptation: number;
  adjustedRate: number;
}

export interface SystemGroupContribution {
  system: string;
  techs: SystemGroupTech[];
  groupSum: number;
  techCount: number;
  overlapCorrection: number;
  energyWeight: number;
  contribution: number;
}

export interface ComprehensiveRateResult {
  groups: SystemGroupContribution[];
  preliminaryRate: number;
  hospitalCorrection: number;
  finalRate: number;
}

/**
 * 系统名归一化映射。
 * affectedSystems 中的非标准名 -> energyWeight 表中的标准名。
 *
 * TODO Phase 1.7: "全机电系统" 理论上应按各子系统权重分摊（权重和=1.0），
 * 当前简化映射到空调制冷系统（与 PM 文档算例一致）。
 * "洁净空调系统" 是空调制冷系统的子集，映射合理。
 */
const SYSTEM_NAME_NORMALIZE: Record<string, string> = {
  '全机电系统': '空调制冷系统',
  '洁净空调系统': '空调制冷系统',
};

/**
 * 综合节能率计算（加法公式）
 *
 * 公式（来源 docs/step2-综合节能率计算逻辑说明.md 第五节）:
 *   综合节能率 =
 *     Σ_s [ (Σ_{i∈s} 修正后节能率_i) × 重叠修正系数(|s|) × 系统能耗权重(s, 气候区) ]
 *     × 医院整体修正系数(投产年份)
 *
 * 其中:
 *   修正后节能率_i = 基准节能率 × 适配度%
 *   基准节能率 = energySavingRate 区间上限（"5%-15%" 取 15%）
 *   适配度% = 暂时硬编 1.0，TODO Phase 1.7 接 techBoundaries 打分
 *
 * 分组规则:
 *   按 techEntry.affectedSystems 分组。affectedSystems 是 string[]，如
 *   ['供暖系统（电耗）', '供暖系统（气耗）']。需去除能耗种类后缀（如"（电耗）"）
 *   得到逻辑系统名（如"供暖系统"），并在同一技术内去重（同一技术作用于同一逻辑
 *   系统的多种能耗种类时只算一次）。跨系统技术（如地源热泵同时作用于空调制冷+
 *   供暖）在每个作用的系统中都参与计算。
 *
 *   系统名映射见 SYSTEM_NAME_NORMALIZE 常量。"全机电系统" 当前简化映射到空调制冷系统
 *   （与 PM 文档算例一致），TODO Phase 1.7 改为按各子系统权重分摊。
 *
 * @returns null 当 techs 为空
 */
export function calcComprehensiveRate(
  input: ComprehensiveRateInput
): ComprehensiveRateResult | null {
  const { techs, climateZone, hvacYear } = input;

  if (!techs || techs.length === 0) return null;

  // Step 1: 每个技术算 baseRate（区间上限）和 adjustedRate（baseRate × adaptation）
  // affectedSystems 是 string[]，去除能耗种类后缀并去重得到逻辑系统名
  const techDataList = techs.map((t) => {
    const range = parseRateRange(t.energySavingRate);
    const baseRate = range ? range.upper : 0;
    const adaptation = 1.0; // TODO Phase 1.7: 接 techBoundaries 打分
    const normalizedSystems = Array.from(
      new Set(
        (t.affectedSystems || [])
          .map((s) => {
            const base = s.replace(/（[^）]*）$/, '').trim();
            return SYSTEM_NAME_NORMALIZE[base] || base;
          })
          .filter(Boolean)
      )
    );
    return {
      techId: t.id,
      techName: t.name,
      baseRate,
      adaptation,
      adjustedRate: baseRate * adaptation,
      systems: normalizedSystems,
    };
  });

  // Step 2: 按作用系统分组
  // 一个技术作用于多个系统时，在每个系统都参与计算
  const systemGroups = new Map<string, typeof techDataList>();
  for (const td of techDataList) {
    for (const sys of td.systems) {
      if (!systemGroups.has(sys)) systemGroups.set(sys, []);
      systemGroups.get(sys)!.push(td);
    }
  }

  // Step 3: 计算每个系统的贡献
  const groups: SystemGroupContribution[] = [];
  for (const [system, techsInGroup] of systemGroups) {
    const techCount = techsInGroup.length;
    const groupSum = techsInGroup.reduce((acc, t) => acc + t.adjustedRate, 0);
    const overlapCorrection = getOverlapCorrection(techCount);
    // 能耗权重只用「全院区综合系统能耗」维度（spec §5.9.1 第 4 条）
    const energyWeight = getEnergyWeight('全院区综合系统能耗', system, climateZone);
    const contribution = groupSum * overlapCorrection * energyWeight;

    groups.push({
      system,
      techs: techsInGroup.map((t) => ({
        techId: t.techId,
        techName: t.techName,
        baseRate: t.baseRate,
        adaptation: t.adaptation,
        adjustedRate: t.adjustedRate,
      })),
      groupSum,
      techCount,
      overlapCorrection,
      energyWeight,
      contribution,
    });
  }

  // Step 4: 初步综合节能率 = Σ(contribution)
  const preliminaryRate = groups.reduce((acc, g) => acc + g.contribution, 0);

  // Step 5: 医院整体修正
  const hospitalCorrection = getHospitalCorrection(hvacYear);
  const finalRate = preliminaryRate * hospitalCorrection;

  return {
    groups,
    preliminaryRate,
    hospitalCorrection,
    finalRate,
  };
}

export const TECH_COLUMNS = [
  { title: '技术名称', dataIndex: 'name', key: 'name', width: 220, fixed: 'left' as const },
  { title: '技术分类', dataIndex: 'category', key: 'category', width: 160 },
  { title: '作用系统', dataIndex: 'affectedSystems', key: 'affectedSystems', width: 200 },
  { title: '能耗种类', dataIndex: 'energyType', key: 'energyType', width: 100 },
  { title: '基准节能率', dataIndex: 'energySavingRate', key: 'energySavingRate', width: 130 },
  { title: '固定投资指标', dataIndex: 'investmentIndex', key: 'investmentIndex', width: 200 },
  { title: '年运行能耗', dataIndex: 'annualEnergy', key: 'annualEnergy', width: 180 },
  { title: '投资回收期', dataIndex: 'paybackPeriod', key: 'paybackPeriod', width: 110 },
];
