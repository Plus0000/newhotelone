import type { TechEntry } from '@/data/materials';
import { getOverlapCorrection } from '@/data/overlapCorrection';
import { getHospitalCorrection } from '@/data/hospitalCorrection';
import { getEnergyWeight } from '@/data/energyWeight';
import { getEnergyQuota } from '@/data/energyQuota';
import { getEnergyConversion } from '@/data/energyConversion';
import { getElectricityCarbonFactor, normalizeProvince } from '@/data/electricityCarbonFactor';
import { getFossilCarbonFactor } from '@/data/fossilCarbonFactor';
import { COAL_FACTOR } from '@/shared/utils/constants';

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
  if (!rateStr || typeof rateStr !== 'string') {
    console.warn('parseRateRange: invalid input', { rateStr });
    return null;
  }
  const match = rateStr.match(/(\d+(?:\.\d+)?)\s*%-?\s*(\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    console.warn('parseRateRange: no match', { rateStr });
    return null;
  }
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
  hospitalScale: '三级' | '二级';
  province: string;
  totalArea: number;
  /** techId -> adaptation score (0~1), from techBoundaries scoring */
  techAdaptationScores?: Map<string, number>;
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

interface TechDataItem {
  techId: string;
  techName: string;
  baseRate: number;
  adaptation: number;
  adjustedRate: number;
  primarySystem: string;
}

function buildTechDataList(input: ComprehensiveRateInput): TechDataItem[] {
  return input.techs.map((t) => {
    const range = parseRateRange(t.energySavingRate);
    const baseRate = range ? range.upper : 0;
    const adaptation = input.techAdaptationScores?.get(t.id) ?? 1.0;
    const primarySystem = SYSTEM_NAME_NORMALIZE[t.primarySystem] || t.primarySystem;
    return {
      techId: t.id,
      techName: t.name,
      baseRate,
      adaptation,
      adjustedRate: baseRate * adaptation,
      primarySystem,
    };
  });
}

/**
 * 全院综合节能率计算（加法公式，PM 文档步骤 3-6）
 *
 * 公式:
 *   综合节能率 =
 *     Σ_s [ (Σ_{i∈s} 修正后节能率_i) × 重叠修正系数(|s|) × 系统能耗权重(s, 气候区) ]
 *     × 医院整体修正系数(投产年份)
 *
 * 其中:
 *   修正后节能率_i = 基准节能率 × 适配度%
 *   基准节能率 = energySavingRate 区间上限（"5%-15%" 取 15%）
 *   适配度% = 暂时硬编 1.0，TODO Phase 1.7 接 techBoundaries 打分
 *
 * 分组规则（PM 文档步骤 4）:
 *   按 techEntry.primarySystem 分组（不是 affectedSystems 多组）。
 *   跨系统技术（如地源热泵同时作用于空调制冷+供暖）只归 primarySystem 一个组，
 *   与 PM 文档算例步骤 4 一致（地源热泵归供暖系统组，不在空调制冷系统组）。
 *
 *   系统名映射见 SYSTEM_NAME_NORMALIZE 常量。"全机电系统" 当前简化映射到空调制冷系统，
 *   TODO Phase 1.7 改为按各子系统权重分摊。
 *
 *   三维度综合节能率（制冷/供暖/非供暖）见 calcDimensionRates，本函数只算全院综合。
 *
 * @returns null 当 techs 为空
 */
export function calcComprehensiveRate(
  input: ComprehensiveRateInput
): ComprehensiveRateResult | null {
  const { techs, climateZone, hvacYear } = input;

  if (!techs || techs.length === 0) return null;

  const techDataList = buildTechDataList(input);

  // Step 2: 按 primarySystem 分组（全院综合节能率用）
  // 跨系统技术（如地源热泵）只归 primarySystem 一个组，与 PM 文档算例步骤 4 一致
  const systemGroups = new Map<string, typeof techDataList>();
  for (const td of techDataList) {
    const sys = td.primarySystem;
    if (!systemGroups.has(sys)) systemGroups.set(sys, []);
    systemGroups.get(sys)!.push(td);
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
  const rawFinalRate = preliminaryRate * hospitalCorrection;
  // 限制在 [0, 1] - 物理上节能率不能超过 100%
  const finalRate = Math.max(0, Math.min(1, rawFinalRate));

  return {
    groups,
    preliminaryRate,
    hospitalCorrection,
    finalRate,
  };
}

// ── 三维度综合节能率（PM 文档第 41-47 段）────────────────────────────────────

export interface DimensionRate {
  dimension: '制冷系统' | '供暖系统' | '非供暖系统';
  groups: SystemGroupContribution[];
  rate: number;
}

export interface DimensionRatesResult {
  cooling: DimensionRate;
  heating: DimensionRate;
  nonHeating: DimensionRate;
}


/**
 * 三维度综合节能率计算（PM 文档第 41-47 段）
 *
 * 按 primarySystem 分组（与全院综合节能率一致），而非 affectedSystems。
 * 跨系统技术只归 primarySystem 一个维度，避免重复计算。
 *
 * 制冷维度：primarySystem = "空调制冷系统" 的技术
 *   rate = Σ(adjustedRate) × overlap × energyWeight('制冷系统能耗', '空调制冷系统', 气候区)
 *   权重=1.0（所有气候区）
 *
 * 供暖维度：primarySystem = "供暖系统" 的技术
 *   rate = Σ(adjustedRate) × overlap × energyWeight('供暖系统能耗', '供暖系统', 气候区)
 *   权重=1.0
 *
 * 非供暖维度：按 primarySystem 分组，排除供暖系统
 *   rate = Σ_s[(Σ_{i∈s} adjustedRate) × overlap × energyWeight('非供暖系统能耗', s, 气候区)]
 */
export function calcDimensionRates(
  input: ComprehensiveRateInput
): DimensionRatesResult | null {
  const { techs, climateZone } = input;
  if (!techs || techs.length === 0) return null;

  const techDataList = buildTechDataList(input);

  const buildGroup = (
    sys: string,
    techsInGroup: TechDataItem[],
    energyDimension: string
  ): SystemGroupContribution => {
    const groupSum = techsInGroup.reduce((acc, t) => acc + t.adjustedRate, 0);
    const overlapCorrection = getOverlapCorrection(techsInGroup.length);
    const energyWeight = getEnergyWeight(energyDimension, sys, climateZone);
    const contribution = groupSum * overlapCorrection * energyWeight;
    return {
      system: sys,
      techs: techsInGroup.map((t) => ({
        techId: t.techId,
        techName: t.techName,
        baseRate: t.baseRate,
        adaptation: t.adaptation,
        adjustedRate: t.adjustedRate,
      })),
      groupSum,
      techCount: techsInGroup.length,
      overlapCorrection,
      energyWeight,
      contribution,
    };
  };

  // 制冷维度：primarySystem = "空调制冷系统" 的技术（PM 文档第 43-44 段）
  const coolingTechs = techDataList.filter((td) => td.primarySystem === '空调制冷系统');
  const coolingGroup = buildGroup('空调制冷系统', coolingTechs, '制冷系统能耗');
  const coolingRate = coolingGroup.contribution;

  // 供暖维度：primarySystem = "供暖系统" 的技术（PM 文档第 46 段）
  const heatingTechs = techDataList.filter((td) => td.primarySystem === '供暖系统');
  const heatingGroup = buildGroup('供暖系统', heatingTechs, '供暖系统能耗');
  const heatingRate = heatingGroup.contribution;

  // 非供暖维度：按 primarySystem 分组，排除供暖系统（PM 文档第 47 段）
  const nonHeatingGroups: SystemGroupContribution[] = [];
  const nonHeatingSystemGroups = new Map<string, typeof techDataList>();
  for (const td of techDataList) {
    if (td.primarySystem === '供暖系统') continue;
    const sys = td.primarySystem;
    if (!nonHeatingSystemGroups.has(sys)) nonHeatingSystemGroups.set(sys, []);
    nonHeatingSystemGroups.get(sys)!.push(td);
  }
  for (const [sys, techsInGroup] of nonHeatingSystemGroups) {
    nonHeatingGroups.push(buildGroup(sys, techsInGroup, '非供暖系统能耗'));
  }
  const nonHeatingRate = nonHeatingGroups.reduce((acc, g) => acc + g.contribution, 0);

  return {
    cooling: { dimension: '制冷系统', groups: [coolingGroup], rate: coolingRate },
    heating: { dimension: '供暖系统', groups: [heatingGroup], rate: heatingRate },
    nonHeating: { dimension: '非供暖系统', groups: nonHeatingGroups, rate: nonHeatingRate },
  };
}

// ── 按维度算原方案能耗（PM 文档第 42 段）──────────────────────────────────────

export interface DimensionEnergy {
  dimension: '制冷系统' | '供暖系统' | '非供暖系统';
  originalEnergy: number | null;  // 万kWh/年（合并展示，含市政热力折kWh）
  savingEnergy: number | null;    // 万kWh/年（合并展示）
  rate: number;                   // 该维度综合节能率
  originalElectricity: number;    // 万kWh/年（仅电力，用于 carbon）
  originalGas: number;            // 万Nm³/年（仅天然气，用于 carbon）
  savingElectricity: number;      // 万kWh/年
  savingGas: number;              // 万Nm³/年
  hasData: boolean;               // 是否有能耗限额数据
}

/**
 * 按维度算原方案能耗（PM 文档第 42 段）
 *
 * 制冷维度：电力 comprehensive 约束值 × 面积 / 10000 = 万kWh/年
 * 供暖维度：(市政热力 heating 约束值 × 65.45 + 天然气 heating 约束值 × 5) × 面积 / 10000
 * 非供暖维度：(电力 nonHeating 约束值 + 天然气 nonHeating 约束值 × 5) × 面积 / 10000
 *
 * 某维度无能耗限额数据时 originalEnergy/savingEnergy 为 null，UI 显示空。
 */
export function calcOriginalEnergyByDimension(
  province: string,
  hospitalScale: '三级' | '二级',
  totalArea: number,
  dimensionRates: DimensionRatesResult
): DimensionEnergy[] {
  const normalizedProvince = normalizeProvince(province);

  // 制冷维度：电力 comprehensive 指标
  const coolingElecQuota = getEnergyQuota(normalizedProvince, hospitalScale, '电力', 'comprehensive', 'constraint');
  const coolingHasData = coolingElecQuota !== null;
  const coolingElec = coolingElecQuota !== null ? (coolingElecQuota * totalArea) / 10000 : 0;
  const coolingRate = dimensionRates.cooling.rate;
  const coolingOriginal = coolingHasData ? coolingElec : null;
  const coolingSaving = coolingHasData ? coolingElec * (1 - coolingRate) : null;

  // 供暖维度：市政热力优先，天然气为备选（两者是互斥的供暖方式，非叠加）
  const heatingHeatQuota = getEnergyQuota(normalizedProvince, hospitalScale, '市政热力', 'heating', 'constraint');
  const heatingGasQuota =
    heatingHeatQuota !== null
      ? null
      : getEnergyQuota(normalizedProvince, hospitalScale, '天然气', 'heating', 'constraint');
  const heatingHasData = heatingHeatQuota !== null || heatingGasQuota !== null;
  const heatingHeatKwh =
    heatingHeatQuota !== null
      ? (heatingHeatQuota * totalArea * getEnergyConversion('市政热力')) / 10000
      : 0;
  const heatingGasNm3 = heatingGasQuota !== null ? (heatingGasQuota * totalArea) / 10000 : 0;
  const heatingGasKwh = heatingGasNm3 * getEnergyConversion('天然气');
  const heatingRate = dimensionRates.heating.rate;
  const heatingOriginal = heatingHasData ? heatingHeatKwh + heatingGasKwh : null;
  const heatingSaving = heatingHasData ? (heatingOriginal ?? 0) * (1 - heatingRate) : null;

  // 非供暖维度：电力 + 天然气（nonHeating 指标）
  const nonHeatingElecQuota = getEnergyQuota(normalizedProvince, hospitalScale, '电力', 'nonHeating', 'constraint');
  const nonHeatingGasQuota = getEnergyQuota(normalizedProvince, hospitalScale, '天然气', 'nonHeating', 'constraint');
  const nonHeatingHasData = nonHeatingElecQuota !== null || nonHeatingGasQuota !== null;
  const nonHeatingElec =
    nonHeatingElecQuota !== null ? (nonHeatingElecQuota * totalArea) / 10000 : 0;
  const nonHeatingGasNm3 = nonHeatingGasQuota !== null ? (nonHeatingGasQuota * totalArea) / 10000 : 0;
  const nonHeatingGasKwh = nonHeatingGasNm3 * getEnergyConversion('天然气');
  const nonHeatingRate = dimensionRates.nonHeating.rate;
  const nonHeatingOriginal = nonHeatingHasData ? nonHeatingElec + nonHeatingGasKwh : null;
  const nonHeatingSaving = nonHeatingHasData ? (nonHeatingOriginal ?? 0) * (1 - nonHeatingRate) : null;

  return [
    {
      dimension: '制冷系统',
      originalEnergy: coolingOriginal,
      savingEnergy: coolingSaving,
      rate: coolingRate,
      originalElectricity: coolingElec,
      originalGas: 0,
      savingElectricity: coolingSaving ?? 0,
      savingGas: 0,
      hasData: coolingHasData,
    },
    {
      dimension: '供暖系统',
      originalEnergy: heatingOriginal,
      savingEnergy: heatingSaving,
      rate: heatingRate,
      originalElectricity: 0, // 市政热力不算电力（carbon 避免重复计算）
      originalGas: heatingGasNm3,
      savingElectricity: 0,
      savingGas: heatingGasNm3 * (1 - heatingRate),
      hasData: heatingHasData,
    },
    {
      dimension: '非供暖系统',
      originalEnergy: nonHeatingOriginal,
      savingEnergy: nonHeatingSaving,
      rate: nonHeatingRate,
      originalElectricity: nonHeatingElec,
      originalGas: nonHeatingGasNm3,
      savingElectricity: nonHeatingElec * (1 - nonHeatingRate),
      savingGas: nonHeatingGasNm3 * (1 - nonHeatingRate),
      hasData: nonHeatingHasData,
    },
  ];
}

// ── 标煤和碳排折算（从电力+天然气折算）──────────────────────────────────────

export interface CoalCarbonResult {
  originalCoal: number;    // tce/年
  savingCoal: number;      // tce/年
  originalCarbon: number;  // tCO₂/年
  savingCarbon: number;    // tCO₂/年
}

/**
 * 标煤和碳排折算（PM 文档第 54 段，从电力+天然气折算）
 *
 * coal = Σ(originalEnergy) × COAL_FACTOR  （含市政热力折kWh，标煤统算）
 * carbon = Σ(originalElectricity) × 电力因子 + Σ(originalGas) × 10000 × 天然气因子
 *        （市政热力不计碳排，避免与发电端重复）
 */
export function calcCoalCarbon(
  dimensionEnergies: DimensionEnergy[],
  province: string
): CoalCarbonResult {
  const electricityFactor = getElectricityCarbonFactor(province);  // tCO₂/万kWh
  const gasFactor = getFossilCarbonFactor('天然气');  // tCO₂/Nm³

  let originalTotalKwh = 0;
  let savingTotalKwh = 0;
  let originalElectricity = 0;
  let savingElectricity = 0;
  let originalGas = 0;
  let savingGas = 0;

  for (const de of dimensionEnergies) {
    // hasData == false implies originalEnergy === null, so the second check is technically redundant.
    // Keeping both for clarity and defensive programming.
    if (!de.hasData || de.originalEnergy === null) continue;
    originalTotalKwh += de.originalEnergy;
    savingTotalKwh += de.savingEnergy ?? 0;
    originalElectricity += de.originalElectricity;
    savingElectricity += de.savingElectricity;
    originalGas += de.originalGas;
    savingGas += de.savingGas;
  }

  const originalCoal = originalTotalKwh * COAL_FACTOR;
  const savingCoal = savingTotalKwh * COAL_FACTOR;
  const originalCarbon = originalElectricity * electricityFactor + originalGas * 10000 * gasFactor;
  const savingCarbon = savingElectricity * electricityFactor + savingGas * 10000 * gasFactor;

  return { originalCoal, savingCoal, originalCarbon, savingCarbon };
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
