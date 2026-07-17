import dayjs from 'dayjs';
import type { EnergyPrices, TimePeriodConfig, ZoneConfig } from '@/shared/stores/projectStore';
import { energyPriceReferences } from '@/data/materials';
import { COAL_FACTOR, CARBON_FACTOR } from '@/shared/utils/constants';
import { getElectricityCarbonFactor } from '@/data/electricityCarbonFactor';

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
  '门诊': {
    coolingPeriod:  { startDate: `${year}-06-01`, endDate: `${year}-09-30`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.2 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.2 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 19, endMinute: 0, publicHolidayCoeff: 0.2 },
  },
  '医技': {
    coolingPeriod:  { startDate: `${year}-06-01`, endDate: `${year}-09-30`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.2 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.2 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 19, endMinute: 0, publicHolidayCoeff: 0.2 },
  },
  '病房和感染': {
    coolingPeriod:  { startDate: `${year}-05-15`, endDate: `${year}-10-15`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.3 },
    heatingPeriod:  { startDate: `${year}-11-01`, endDate: `${year+1}-03-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.3 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.4 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.3 },
  },
  '急诊': {
    coolingPeriod:  { startDate: `${year}-05-15`, endDate: `${year}-10-15`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    heatingPeriod:  { startDate: `${year}-11-01`, endDate: `${year+1}-03-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.4 },
  },
  '行政后勤': {
    coolingPeriod:  { startDate: `${year}-06-15`, endDate: `${year}-09-15`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.1 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
  },
  '教学科研': {
    coolingPeriod:  { startDate: `${year}-06-01`, endDate: `${year}-09-30`, startHour: 8, startMinute: 0, endHour: 22, endMinute: 0, publicHolidayCoeff: 0.1 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 22, endMinute: 0, publicHolidayCoeff: 0.1 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 8, startMinute: 0, endHour: 22, endMinute: 0, publicHolidayCoeff: 0.1 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 19, endMinute: 0, publicHolidayCoeff: 0.1 },
  },
  '健康管理': {
    coolingPeriod:  { startDate: `${year}-05-15`, endDate: `${year}-10-15`, startHour: 8, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.2 },
    heatingPeriod:  { startDate: `${year}-11-01`, endDate: `${year+1}-03-31`, startHour: 8, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.2 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 8, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.2 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.2 },
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
  const periods: PeriodKey[] = ['coolingPeriod', 'heatingPeriod', 'lightingPeriod', 'hotWaterPeriod'];

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
const DEFAULT_PRICES = {
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
  '空调制冷系统': 0.8,
  '空调通风系统': 0.8,
  '供暖系统': 0.8,
  '照明系统': 0.4,
  '生活热水系统': 0.5,
  '给排水系统': 0.8,
  '电梯系统': 0.8,
  '弱电系统': 0.8,
  '科室用电（办公设备）': 0.8,
  '医疗设备系统': 0.8,
  '重点机房系统': 0.8,
};

// 多系统取最大系数（保守估计）；空数组 fallback 0.80
export function getSimultaneousCoeff(systems: string[] | string | undefined): number {
  if (!systems) return 0.80;
  const arr = Array.isArray(systems) ? systems : [systems];
  if (arr.length === 0) return 0.80;
  const coeffs = arr.map((s) => SYSTEM_K[s]).filter((c) => c !== undefined);
  return coeffs.length > 0 ? Math.max(...coeffs) : 0.80;
}

// ── 维度计算函数 ────────────────────────────────────────────────────

/** 年节约标煤量 (tce/年) */
export function calcCoalSaving(originalEnergy: number, savingEnergy: number): number {
  return (originalEnergy - savingEnergy) * COAL_FACTOR;
}

/**
 * 年节碳量 (tCO₂/年)
 * @param province 省份（step1Data.location[0]），不传则用全国回退值
 */
export function calcCarbonSaving(
  originalEnergy: number,
  savingEnergy: number,
  province?: string,
): number {
  const factor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  return (originalEnergy - savingEnergy) * factor;
}

/** 万元投资节能量 (tce/万元) */
export function calcInvestCoalEfficiency(coalSaving: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return coalSaving / totalInvestment;
}

/** 单位面积节能收益 (元/㎡/年)，按10万㎡基准折算 */
export function calcAreaBenefit(annualSaving: number /* 万元 */, totalArea: number): number {
  if (totalArea <= 0) return 0;
  return (annualSaving * 10000) / totalArea; // 转为元/㎡
}

/** 静态投资回收期 (年) */
export function calcPaybackPeriod(initialInvestment: number, annualSaving: number): number {
  if (annualSaving <= 0) return 999;
  return initialInvestment / annualSaving;
}

/** 年均净收益率 = (年节能收益 - 年运维费) / 总初投资 */
export function calcNetReturnRate(annualSaving: number, annualMaintenance: number, initialInvestment: number): number {
  if (initialInvestment <= 0) return 0;
  return ((annualSaving - annualMaintenance) / initialInvestment) * 100;
}

/** 运维成本占比 = 年均运维费 / 年均节能收益 */
export function calcMaintenanceRatio(annualMaintenance: number, annualSaving: number): number {
  if (annualSaving <= 0) return 0;
  return (annualMaintenance / annualSaving) * 100;
}

/** 碳减排剩余空间 (tCO₂/年) — 改造后仍在排放的碳 */
export function calcRemainingCarbon(savingEnergy: number, province?: string): number {
  const factor = province ? getElectricityCarbonFactor(province) : CARBON_FACTOR;
  return savingEnergy * factor;
}

/** 回收期分类 */
export function classifyPayback(years: number): 'short' | 'mid' | 'long' {
  if (years <= 3) return 'short';
  if (years <= 6) return 'mid';
  return 'long';
}

/** 运维占比分类 */
export function classifyMaintenance(ratio: number): 'good' | 'normal' | 'drag' {
  if (ratio <= 10) return 'good';
  if (ratio <= 20) return 'normal';
  return 'drag';
}

// ── 运行时间计算 ──

export const SYSTEM_PERIOD_MAP: Record<string, 'coolingPeriod' | 'heatingPeriod' | 'lightingPeriod' | 'hotWaterPeriod'> = {
  '空调制冷系统': 'coolingPeriod',
  '供暖系统': 'heatingPeriod',
  '照明系统': 'lightingPeriod',
  '生活热水系统': 'hotWaterPeriod',
};

// 空调通风系统 = 制冷 + 供暖之和（文档要求）
const VENTILATION_EXPANSION = ['空调制冷系统', '供暖系统'];

// 面积权重：优先读 zoneConfigs[zone].buildingArea，全部未填时退回等权 1
export const FALLBACK_ZONE_WEIGHT = 1;

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

  const hasAnyArea = serviceTargets.some((t) => (zoneConfigs[t]?.buildingArea ?? 0) > 0);

  let totalHours = 0;
  let totalWeight = 0;

  for (const target of serviceTargets) {
    const zoneConfig = zoneConfigs[target];
    if (!zoneConfig) continue;

    const weight = hasAnyArea ? (zoneConfig.buildingArea ?? 0) : FALLBACK_ZONE_WEIGHT;
    if (weight <= 0) continue;
    let zoneTotalHours = 0;

    for (const sys of expandedSystems) {
      const periodKey = SYSTEM_PERIOD_MAP[sys];
      if (!periodKey) continue;

      const period = zoneConfig[periodKey];
      if (!period) continue;

      const allDays = getDaysInRange(period.startDate, period.endDate);
      const weekendDays = countWeekendDays(period.startDate, period.endDate);
      const workDays = allDays - weekendDays;
      const dailyHours = period.endHour - period.startHour + (period.endMinute - period.startMinute) / 60;

      zoneTotalHours += workDays * dailyHours + weekendDays * dailyHours * period.publicHolidayCoeff;
    }

    totalHours += zoneTotalHours * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(totalHours / totalWeight) : 0;
}

// ── 旧系统名迁移 ──────────────────────────────────────────────────

export const VALID_SYSTEM_NAMES = [
  '空调制冷系统', '空调通风系统', '供暖系统', '照明系统', '生活热水系统',
  '给排水系统', '电梯系统', '弱电系统', '科室用电（办公设备）', '医疗设备系统', '重点机房系统',
];

const SYSTEM_NAME_MIGRATION: Record<string, string> = {
  '制冷': '空调制冷系统',
  '空调': '空调制冷系统',
  '通风': '空调通风系统',
  '供暖': '供暖系统',
  '照明': '照明系统',
  '生活热水': '生活热水系统',
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
