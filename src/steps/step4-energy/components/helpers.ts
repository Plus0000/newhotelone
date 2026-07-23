import dayjs from 'dayjs';
import type { EnergyByType, EnergyPrices, TimePeriodConfig, ZoneConfig } from '@/shared/stores/projectStore';
import { energyPriceReferences } from '@/data/materials';
import { COAL_FACTOR, CARBON_FACTOR } from '@/shared/utils/constants';
import { getElectricityCarbonFactor } from '@/data/electricityCarbonFactor';
import { getFossilCarbonFactor } from '@/data/fossilCarbonFactor';
import { PAYBACK_THRESHOLDS, MAINTENANCE_THRESHOLDS } from '@/data/classifyThresholds';

const year = dayjs().year();

type PeriodKey = 'coolingPeriod' | 'heatingPeriod' | 'lightingPeriod' | 'hotWaterPeriod';

interface RawDefaults {
  startDate: string;
  endDate: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  publicHolidayCoeff: number;
}

// 贴近真实医院运行情况的默认值（7个医疗区域，与"各区域运行时间表.xlsx"一致）
const ZONE_DEFAULTS: Record<string, Partial<Record<PeriodKey, RawDefaults>>> = {
  门诊: {
    coolingPeriod: {
      startDate: `${year}-06-01`,
      endDate: `${year}-09-30`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    heatingPeriod: {
      startDate: `${year}-11-15`,
      endDate: `${year + 1}-03-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.15,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 6,
      startMinute: 0,
      endHour: 19,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
  },
  医技: {
    coolingPeriod: {
      startDate: `${year}-06-01`,
      endDate: `${year}-09-30`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    heatingPeriod: {
      startDate: `${year}-11-15`,
      endDate: `${year + 1}-03-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.15,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 6,
      startMinute: 0,
      endHour: 19,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
  },
  病房和感染: {
    coolingPeriod: {
      startDate: `${year}-05-15`,
      endDate: `${year}-10-15`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.3,
    },
    heatingPeriod: {
      startDate: `${year}-11-01`,
      endDate: `${year + 1}-03-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.3,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.4,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.3,
    },
  },
  急诊: {
    coolingPeriod: {
      startDate: `${year}-05-15`,
      endDate: `${year}-10-15`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.5,
    },
    heatingPeriod: {
      startDate: `${year}-11-01`,
      endDate: `${year + 1}-03-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.5,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.5,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 0,
      startMinute: 0,
      endHour: 24,
      endMinute: 0,
      publicHolidayCoeff: 0.4,
    },
  },
  行政后勤: {
    coolingPeriod: {
      startDate: `${year}-06-15`,
      endDate: `${year}-09-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.15,
    },
    heatingPeriod: {
      startDate: `${year}-11-15`,
      endDate: `${year + 1}-03-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.15,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.1,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 7,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      publicHolidayCoeff: 0.15,
    },
  },
  教学科研: {
    coolingPeriod: {
      startDate: `${year}-06-01`,
      endDate: `${year}-09-30`,
      startHour: 8,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
      publicHolidayCoeff: 0.1,
    },
    heatingPeriod: {
      startDate: `${year}-11-15`,
      endDate: `${year + 1}-03-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
      publicHolidayCoeff: 0.1,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 22,
      endMinute: 0,
      publicHolidayCoeff: 0.1,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 6,
      startMinute: 0,
      endHour: 19,
      endMinute: 0,
      publicHolidayCoeff: 0.1,
    },
  },
  健康管理: {
    coolingPeriod: {
      startDate: `${year}-05-15`,
      endDate: `${year}-10-15`,
      startHour: 8,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    heatingPeriod: {
      startDate: `${year}-11-01`,
      endDate: `${year + 1}-03-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    lightingPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 8,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
    hotWaterPeriod: {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      startHour: 6,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      publicHolidayCoeff: 0.2,
    },
  },
};

export function createDefaultTimePeriod(): TimePeriodConfig {
  return {
    startDate: `${year}-05-01`,
    endDate: `${year}-09-30`,
    startHour: 8,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    publicHolidayCoeff: 0.15,
  };
}

export function createDefaultZoneConfig(zoneName?: string): ZoneConfig {
  const periods: PeriodKey[] = [
    'coolingPeriod',
    'heatingPeriod',
    'lightingPeriod',
    'hotWaterPeriod',
  ];

  if (zoneName && ZONE_DEFAULTS[zoneName]) {
    const zone = ZONE_DEFAULTS[zoneName]!;
    const result: ZoneConfig = { enabled: true } as ZoneConfig;
    for (const key of periods) {
      const d = zone[key];
      (result as any)[key] = d ? { ...d } : createDefaultTimePeriod();
    }
    return result;
  }

  return {
    enabled: true,
    coolingPeriod: createDefaultTimePeriod(),
    heatingPeriod: createDefaultTimePeriod(),
    lightingPeriod: createDefaultTimePeriod(),
    hotWaterPeriod: createDefaultTimePeriod(),
  };
}

const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'];

/** 全国均价（不在参考列表的城市使用此默认值） */
export const DEFAULT_PRICES = {
  peakPrice: 0.93,
  flatPrice: 0.59,
  valleyPrice: 0.28,
  comprehensivePrice: 0.72,
  gasPrice: 2.76,
  waterPrice: 7.53,
};

export function getEnergyPricesByLocation(location: string[]): EnergyPrices | null {
  if (!location || location.length < 2) return null;
  // 直辖市：location 为 ['北京市', '东城区']，参考数据 key 为 '北京市-北京市'
  const province = location[0];
  const city = MUNICIPALITIES.includes(province) ? province : location[1];
  const key = `${province}-${city}`;
  const ref = energyPriceReferences.find((r) => r.location === key);
  if (ref) {
    return {
      peakPrice: ref.peakPrice,
      flatPrice: ref.flatPrice,
      valleyPrice: ref.valleyPrice,
      comprehensivePrice: ref.comprehensivePrice,
      gasPrice: ref.gasPrice,
      waterPrice: ref.waterPrice,
    };
  }
  // 不在参考列表的城市，返回全国均价
  return { ...DEFAULT_PRICES };
}

// 公休系数计算 — 模拟/placeholder，后续可集成真实节假日库
export function calcPublicHolidayCoeff(startDate: string, endDate: string): number {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  if (!s.isValid() || !e.isValid()) return 0.15;
  const totalDays = Math.max(0, e.diff(s, 'day') + 1);
  let weekendDays = 0;
  let cur = s;
  while (cur.isBefore(e) || cur.isSame(e, 'day')) {
    if (cur.day() === 0 || cur.day() === 6) weekendDays++;
    cur = cur.add(1, 'day');
  }
  if (totalDays === 0) return 0;
  // 公休系数 = 周末占比 × 0.5（假设周末值班约一半时间）
  return Math.round((weekendDays / totalDays) * 0.5 * 100) / 100;
}

// ── 同时使用系数 ──────────────────────────────────────────────────

// 按 Excel 表"机电系统能耗权重表"的 11 个系统及系数
const SYSTEM_K: Record<string, number> = {
  空调制冷系统: 0.8,
  空调通风系统: 0.8,
  供暖系统: 0.8,
  照明系统: 0.4,
  生活热水系统: 0.5,
  给排水系统: 0.8,
  电梯系统: 0.8,
  弱电系统: 0.8,
  '科室用电（办公设备）': 0.8,
  医疗设备系统: 0.8,
  重点机房系统: 0.8,
};

// 多系统取最大系数（保守估计）；空数组 fallback 0.80
export function getSimultaneousCoeff(systems: string[] | string | undefined): number {
  if (!systems) return 0.8;
  const arr = Array.isArray(systems) ? systems : [systems];
  if (arr.length === 0) return 0.8;
  const coeffs = arr.map((s) => SYSTEM_K[s]).filter((c) => c !== undefined);
  return coeffs.length > 0 ? Math.max(...coeffs) : 0.8;
}

// ── 维度计算函数（按 docx「节能项目数据分析指标计算说明」口径） ─────
// 统一约定：无法计算的指标返回 null，前端显示"-"或"无回收期"，不用 0/-1/999 替代
// 金额单位：万元；能耗单位：万kWh；碳排放单位：tCO₂/年；面积单位：㎡

// ── 一、统一基础口径 ──

/** 年度毛收益（万元）= 基准年度能源费用 - 项目年度能源费用
 *  注：docx 公式含「+ 其他年度收益」，本期 MVP 不支持其他收益，砍掉 */
export function calcGrossIncome(originalCostRun: number, savingCostRun: number): number {
  return originalCostRun - savingCostRun;
}

/** 年度净收益（万元）= 年度毛收益 - 年度运行维护费用 */
export function calcNetIncome(grossIncome: number, maintenanceCost: number): number {
  return grossIncome - maintenanceCost;
}

// ── 二、节能效率维度 ──

/** 年节约标煤量 (tce/年) = (基准能耗 - 项目能耗) × 折标煤系数
 *  能耗单位：万kWh；COAL_FACTOR = 1.229 tce/万kWh */
export function calcCoalSaving(originalEnergy: number, savingEnergy: number): number {
  return (originalEnergy - savingEnergy) * COAL_FACTOR;
}

/** 万元投资节能量 (tce/万元) = 年度综合节能量 ÷ 固定资产投资
 *  固定资产投资 <= 0 返回 null */
export function calcInvestCoalEfficiency(
  coalSaving: number,
  fixedInvestment: number,
): number | null {
  if (fixedInvestment <= 0) return null;
  return coalSaving / fixedInvestment;
}

/** 单位面积节能收益 (元/㎡/年) = 年度净收益 × 10000 ÷ 服务面积
 *  口径：年度净收益（已扣运维），非毛收益
 *  面积 <= 0 或净收益为空 返回 null */
export function calcAreaBenefit(netIncome: number | null, totalArea: number): number | null {
  if (netIncome === null || totalArea <= 0) return null;
  return (netIncome * 10000) / totalArea;
}

/** 指标平均线 = 所有有效方案指标值的算术平均
 *  空值（null）不参与；零值、负值必须参与 */
export function calcAverageLine(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

// ── 三、经济性回报维度 ──

/** 静态投资回收期（年）= 固定资产投资 ÷ 年度净收益
 *  口径：分子用 fixedInvestment（非 initialInvestment）；分母用净收益（非毛收益）
 *  年度净收益 <= 0 返回 null（无回收期） */
export function calcPaybackPeriod(
  fixedInvestment: number,
  netIncome: number | null,
): number | null {
  if (netIncome === null || netIncome <= 0) return null;
  return fixedInvestment / netIncome;
}

/** 年均净收益率（%）= 年度净收益 ÷ 固定资产投资 × 100
 *  口径：分母用 fixedInvestment（非 initialInvestment）
 *  固定资产投资 <= 0 返回 null */
export function calcNetReturnRate(
  netIncome: number | null,
  fixedInvestment: number,
): number | null {
  if (netIncome === null || fixedInvestment <= 0) return null;
  return (netIncome / fixedInvestment) * 100;
}

/** 运维成本占比（%）= 年度运维费用 ÷ 年度毛收益 × 100
 *  口径：分母用年度毛收益（非总运行成本）
 *  年度毛收益 <= 0 返回 null（失去比较意义） */
export function calcMaintenanceRatio(maintenanceCost: number, grossIncome: number): number | null {
  if (grossIncome <= 0) return null;
  return (maintenanceCost / grossIncome) * 100;
}

// ── 四、能源价格敏感性分析 ──

/** 情景节省收益（万元）= (基准运行费用 - 项目运行费用) × (1 + 浮动率)
 *  纯电项目简化口径：电价浮动率等比例传导至运行费用
 *  基准节省收益 <= 0 时不计算相对优势变化率（返回 null） */
export function calcScenarioSaving(
  originalCostRun: number,
  savingCostRun: number,
  rate: number,
): number {
  return (originalCostRun - savingCostRun) * (1 + rate);
}

/** 相对优势变化率（%）= (情景节省收益 - 基准节省收益) ÷ |基准节省收益| × 100
 *  基准节省收益为 0 或 NaN 时返回 null（无法计算） */
export function calcRelativeAdvantageRate(
  scenarioSaving: number,
  baselineSaving: number,
): number | null {
  if (!baselineSaving || Number.isNaN(baselineSaving)) return null;
  return ((scenarioSaving - baselineSaving) / Math.abs(baselineSaving)) * 100;
}

// ── 五、碳资产潜力维度 ──

/** 年度碳排放量（tCO₂/年）= 用电量(万kWh) × 省级电网排放因子(tCO₂/万kWh)
 *  province 为空用全国回退值 5.81 tCO₂/万kWh
 *  @deprecated 只算电力碳排放，天然气/热力/其他能源碳排算错。改用 calcCarbonEmissionByType 支持多能源类型 */
export function calcCarbonEmission(energyRun: number, province?: string): number {
  const factor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  return energyRun * factor;
}

/** 年节碳量（tCO₂/年）= 原方案碳排放 - 新方案碳排放
 *  兼容旧调用：直接用能耗差 × 因子
 *  @deprecated 改用 calcCarbonSavingByType 支持多能源类型 */
export function calcCarbonSaving(
  originalEnergy: number,
  savingEnergy: number,
  province?: string,
): number {
  const factor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  return (originalEnergy - savingEnergy) * factor;
}

/** 剩余减排潜力（tCO₂/年）= 新方案年度碳排放量
 *  口径：不设目标排放量，直接显示项目改造后仍在排放的碳
 *  @deprecated 改用 calcRemainingReductionByType 支持多能源类型 */
export function calcRemainingReduction(savingEnergy: number, province?: string): number {
  const factor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  return savingEnergy * factor;
}

/** 年度碳收益（元）= max(年度节碳量, 0) × 碳价
 *  碳排放增加（节碳量为负）不产生负补贴 */
export function calcCarbonRevenue(carbonSaving: number, carbonPrice: number): number {
  return Math.max(carbonSaving, 0) * carbonPrice;
}

// ── 五.2、碳资产潜力维度（按能源类型分发） ──

export type EnergyKind = 'electric' | 'gas' | 'heat';

/** 按能源类型分组的能耗（类型定义在 projectStore.ts EnergyByType）
 *  electric: 万kWh（电力）
 *  gas: 万Nm³（天然气）
 *  heat: GJ（市政热力/蒸汽/标煤等价）*/

/** 设备单位 -> 能源类型
 *  kW/kWh/MW/万kWh/万kJ -> electric
 *  m³ -> gas（天然气）
 *  GJ/t(蒸吨)/kg(标煤) -> heat */
export function classifyUnitByEnergy(unit: string): EnergyKind {
  switch (unit) {
    case 'm³':
      return 'gas';
    case 'GJ':
    case 't':
    case 'kg':
      return 'heat';
    default:
      return 'electric';
  }
}

/** 万kWh -> 原单位（按能源类型反向换算）
 *  electric: 直接返回万kWh
 *  gas: 万kWh ÷ 10.55 = 万Nm³（1 m³ = 10.55 kWh）
 *  heat: 万kWh × 36 = GJ（1 GJ = 277.778 kWh，1 万kWh = 36 GJ）
 *  与 UNIT_TO_KWH 的逆运算，无精度损失 */
export function convertKwhToEnergyByType(kwh: number, unit: string): EnergyByType {
  const kind = classifyUnitByEnergy(unit);
  const value = Number(kwh) || 0;
  switch (kind) {
    case 'gas':
      return { electric: 0, gas: value / 10.55, heat: 0 };
    case 'heat':
      return { electric: 0, gas: 0, heat: value * 36 };
    case 'electric':
    default:
      return { electric: value, gas: 0, heat: 0 };
  }
}

/** 设备列表聚合到 byType（按各自 unit 分发后累加）
 *  energyConsumption 是万kWh 口径（UNIT_TO_KWH 换算后），按 unit 反向换算回原单位 */
export function aggregateEnergyByType(
  equipments: { energyConsumption: number; unit: string }[],
): EnergyByType {
  const result: EnergyByType = { electric: 0, gas: 0, heat: 0 };
  for (const eq of equipments) {
    const byType = convertKwhToEnergyByType(eq.energyConsumption || 0, eq.unit);
    result.electric += byType.electric;
    result.gas += byType.gas;
    result.heat += byType.heat;
  }
  return result;
}

/** 旧数据迁移：run 单值 -> byType（全归 electric，保持碳排结果不变）
 *  新数据（已有 byType）原样返回，不覆盖
 *  泛型约束避免循环依赖 Step4TechData */
export function migrateTechEnergyByType<
  T extends {
    savingEnergyRun: number;
    originalEnergyRun: number;
    savingEnergyByType?: EnergyByType;
    originalEnergyByType?: EnergyByType;
  },
>(td: T): T & { savingEnergyByType: EnergyByType; originalEnergyByType: EnergyByType } {
  return {
    ...td,
    savingEnergyByType:
      td.savingEnergyByType ?? {
        electric: td.savingEnergyRun ?? 0,
        gas: 0,
        heat: 0,
      },
    originalEnergyByType:
      td.originalEnergyByType ?? {
        electric: td.originalEnergyRun ?? 0,
        gas: 0,
        heat: 0,
      },
  };
}

/** 按能源类型分别计算碳排放，再求和（tCO₂/年）
 *  electric × 电力因子(tCO₂/万kWh) + gas × 10000 × 天然气因子(tCO₂/Nm³) + heat × 热力因子(tCO₂/GJ)
 *  province 为空时电力用全国回退值 5.81 tCO₂/万kWh */
export function calcCarbonEmissionByType(energy: EnergyByType, province?: string): number {
  const elecFactor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  const gasFactor = getFossilCarbonFactor('天然气'); // tCO₂/Nm³
  const heatFactor = getFossilCarbonFactor('市政热力'); // tCO₂/GJ
  return (
    (energy.electric || 0) * elecFactor +
    (energy.gas || 0) * 10000 * gasFactor + // 万Nm³ -> Nm³
    (energy.heat || 0) * heatFactor
  );
}

/** 年节碳量（tCO₂/年）= 原方案碳排放 - 新方案碳排放，按能源类型分别算后求差 */
export function calcCarbonSavingByType(
  original: EnergyByType,
  saving: EnergyByType,
  province?: string,
): number {
  return (
    calcCarbonEmissionByType(original, province) - calcCarbonEmissionByType(saving, province)
  );
}

/** 剩余减排潜力（tCO₂/年）= 新方案年度碳排放量，按能源类型分别算后求和 */
export function calcRemainingReductionByType(saving: EnergyByType, province?: string): number {
  return calcCarbonEmissionByType(saving, province);
}

// ── 分类（用于 UI 标签） ──

/** 回收期分类：null 视为无回收期，归 long（最差档）
 *  阈值来自 PAYBACK_THRESHOLDS，可在 src/data/classifyThresholds.ts 调整 */
export function classifyPayback(years: number | null): 'short' | 'mid' | 'long' {
  if (years === null) return 'long';
  if (years <= PAYBACK_THRESHOLDS.shortMax) return 'short';
  if (years <= PAYBACK_THRESHOLDS.midMax) return 'mid';
  return 'long';
}

/** 运维占比分类：null 视为无法评估，归 unknown
 *  阈值来自 MAINTENANCE_THRESHOLDS，可在 src/data/classifyThresholds.ts 调整 */
export function classifyMaintenance(ratio: number | null): 'good' | 'normal' | 'drag' | 'unknown' {
  if (ratio === null) return 'unknown';
  if (ratio <= MAINTENANCE_THRESHOLDS.goodMax) return 'good';
  if (ratio <= MAINTENANCE_THRESHOLDS.normalMax) return 'normal';
  return 'drag';
}

// ── 运行时间计算 ──

export const SYSTEM_PERIOD_MAP: Record<
  string,
  'coolingPeriod' | 'heatingPeriod' | 'lightingPeriod' | 'hotWaterPeriod'
> = {
  空调制冷系统: 'coolingPeriod',
  供暖系统: 'heatingPeriod',
  照明系统: 'lightingPeriod',
  生活热水系统: 'hotWaterPeriod',
};

// 空调通风系统 = 制冷 + 供暖之和（文档要求）
const VENTILATION_EXPANSION = ['空调制冷系统', '供暖系统'];

export function getDaysInRange(startDate: string, endDate: string): number {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  if (!s.isValid() || !e.isValid()) return 0;
  return Math.max(0, e.diff(s, 'day') + 1);
}

export function countWeekendDays(startDate: string, endDate: string): number {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid()) return 0;
  let count = 0;
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    if (cur.day() === 0 || cur.day() === 6) count++;
    cur = cur.add(1, 'day');
  }
  return count;
}

export function calcAnnualHours(
  zoneConfigs: Record<string, ZoneConfig> | undefined,
  systems: string[],
  serviceTargets: string[],
): number {
  if (!zoneConfigs || systems.length === 0 || serviceTargets.length === 0) return 0;

  // 展开空调通风系统 = 制冷 + 供暖
  const expandedSystems = new Set<string>();
  for (const sys of systems) {
    if (sys === '空调通风系统') {
      VENTILATION_EXPANSION.forEach((s) => expandedSystems.add(s));
    } else {
      expandedSystems.add(sys);
    }
  }

  let totalHours = 0;
  let totalWeight = 0;

  for (const target of serviceTargets) {
    const zoneConfig = zoneConfigs[target];
    if (!zoneConfig) continue;
    if (zoneConfig.enabled === false) continue;

    const area = zoneConfig.buildingArea;
    // 没填面积的区域不算运行时间，直接跳过
    if (!area || area <= 0) continue;

    const weight = area;
    let zoneTotalHours = 0;

    for (const sys of expandedSystems) {
      const periodKey = SYSTEM_PERIOD_MAP[sys];
      if (!periodKey) continue;

      const period = zoneConfig[periodKey];
      if (!period) continue;

      const allDays = getDaysInRange(period.startDate, period.endDate);
      const weekendDays = countWeekendDays(period.startDate, period.endDate);
      const workDays = allDays - weekendDays;
      let dailyHours =
        period.endHour - period.startHour + (period.endMinute - period.startMinute) / 60;
      if (dailyHours < 0) dailyHours += 24; // 跨夜运行（end < start）

      zoneTotalHours +=
        workDays * dailyHours + weekendDays * dailyHours * period.publicHolidayCoeff;
    }

    totalHours += zoneTotalHours * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(totalHours / totalWeight) : 0;
}

// ── 旧系统名迁移 ──────────────────────────────────────────────────

export const VALID_SYSTEM_NAMES = [
  '空调制冷系统',
  '空调通风系统',
  '供暖系统',
  '照明系统',
  '生活热水系统',
  '给排水系统',
  '电梯系统',
  '弱电系统',
  '科室用电（办公设备）',
  '医疗设备系统',
  '重点机房系统',
];

const SYSTEM_NAME_MIGRATION: Record<string, string> = {
  制冷: '空调制冷系统',
  空调: '空调制冷系统',
  通风: '空调通风系统',
  供暖: '供暖系统',
  照明: '照明系统',
  生活热水: '生活热水系统',
};

export function migrateSystemName(name: string | undefined): string {
  if (!name) return '';
  if (VALID_SYSTEM_NAMES.includes(name)) return name;
  return SYSTEM_NAME_MIGRATION[name] ?? '';
}

export function migrateSystemNames(names: string[] | undefined): string[] {
  if (!names) return [];
  return names.map(migrateSystemName).filter((n) => n !== '');
}
