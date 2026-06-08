import dayjs from 'dayjs';
import type { EnergyPrices, TimePeriodConfig, ZoneConfig } from '@/shared/stores/projectStore';
import { energyPriceReferences } from '@/data/materials';

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

// 贴近真实医院运行情况的默认值
const ZONE_DEFAULTS: Record<string, Partial<Record<PeriodKey, RawDefaults>>> = {
  '门诊': {
    coolingPeriod:  { startDate: `${year}-06-01`, endDate: `${year}-09-30`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.2 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.2 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 19, endMinute: 0, publicHolidayCoeff: 0.2 },
  },
  '医技': {
    coolingPeriod:  { startDate: `${year}-06-01`, endDate: `${year}-09-30`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.2 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.2 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 6, startMinute: 0, endHour: 19, endMinute: 0, publicHolidayCoeff: 0.2 },
  },
  '病房': {
    coolingPeriod:  { startDate: `${year}-05-15`, endDate: `${year}-10-15`, startHour: 7, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.3 },
    heatingPeriod:  { startDate: `${year}-11-01`, endDate: `${year+1}-03-31`, startHour: 7, startMinute: 0, endHour: 20, endMinute: 0, publicHolidayCoeff: 0.3 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.4 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 5, startMinute: 0, endHour: 22, endMinute: 0, publicHolidayCoeff: 0.3 },
  },
  '急诊': {
    coolingPeriod:  { startDate: `${year}-05-15`, endDate: `${year}-10-15`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    heatingPeriod:  { startDate: `${year}-11-01`, endDate: `${year+1}-03-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.5 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 0, startMinute: 0, endHour: 24, endMinute: 0, publicHolidayCoeff: 0.4 },
  },
  '行政': {
    coolingPeriod:  { startDate: `${year}-06-15`, endDate: `${year}-09-15`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.15 },
    heatingPeriod:  { startDate: `${year}-11-15`, endDate: `${year+1}-03-15`, startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, publicHolidayCoeff: 0.15 },
    lightingPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.1 },
    hotWaterPeriod: { startDate: `${year}-01-01`, endDate: `${year}-12-31`, startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, publicHolidayCoeff: 0.15 },
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
    const result: Record<string, TimePeriodConfig> = {};
    for (const key of periods) {
      const d = zone[key];
      result[key] = d
        ? { ...d }
        : createDefaultTimePeriod();
    }
    return result as unknown as ZoneConfig;
  }

  return {
    coolingPeriod: createDefaultTimePeriod(),
    heatingPeriod: createDefaultTimePeriod(),
    lightingPeriod: createDefaultTimePeriod(),
    hotWaterPeriod: createDefaultTimePeriod(),
  };
}

export function getEnergyPricesByLocation(location: string[]): EnergyPrices | null {
  if (!location || location.length < 2) return null;
  const key = `${location[0]}-${location[1]}`;
  const ref = energyPriceReferences.find((r) => r.location === key);
  if (!ref) return null;
  return {
    peakPrice: ref.peakPrice,
    flatPrice: ref.flatPrice,
    valleyPrice: ref.valleyPrice,
    comprehensivePrice: ref.comprehensivePrice,
    gasPrice: ref.gasPrice,
    waterPrice: ref.waterPrice,
  };
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

// 按 techId + 设备名称的预设同时使用系数
const DEFAULT_COEFF: Record<string, Record<string, number>> = {
  '1': { '相变储热单元': 0.85, '智能温控系统': 0.90, '循环水泵': 0.75, '蓄热水箱': 0.60, '管道阀门': 0.70 },
  '2': { '边缘计算网关': 0.95, '数字孪生服务器': 0.98, 'AI前馈控制器': 0.92, 'IoT温湿度传感器': 0.85, 'CO₂浓度传感器': 0.80 },
  '3': { '地源热泵机组': 0.88, '空气源热泵机组': 0.82, '多能源耦合控制中心': 0.95, '蓄热水箱': 0.65, '循环水泵': 0.78 },
  '4': { 'DALI照明控制器': 0.90, 'DALI网关': 0.92, '照度传感器': 0.70, '占空传感器': 0.75 },
  '5': { '六管制冷热源机组': 0.85, 'DDC控制器': 0.93, '独立再热换热器': 0.80, '温湿度传感器': 0.75 },
};

export function getSimultaneousCoeff(techId: string, equipName: string): number {
  const v = DEFAULT_COEFF[techId]?.[equipName];
  return v !== undefined ? v : 0.80;
}

// ── 能耗折算常量 ────────────────────────────────────────────────────

/** 电力折标煤系数 (tce/万kWh) — GB/T 2589-2020 */
export const COAL_FACTOR = 1.229;

/** 电网碳排放因子 (tCO₂/万kWh) — 生态环境部 2023 */
export const CARBON_FACTOR = 5.81;

/** 天然气碳排放因子 (tCO₂/Nm³) — 通用值 */
export const GAS_CARBON_FACTOR = 0.00196;

// ── 维度计算函数 ────────────────────────────────────────────────────

/** 年节约标煤量 (tce/年) */
export function calcCoalSaving(originalEnergy: number, savingEnergy: number): number {
  return (originalEnergy - savingEnergy) * COAL_FACTOR;
}

/** 年节碳量 (tCO₂/年) */
export function calcCarbonSaving(originalEnergy: number, savingEnergy: number): number {
  return (originalEnergy - savingEnergy) * CARBON_FACTOR;
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
export function calcRemainingCarbon(savingEnergy: number): number {
  return savingEnergy * CARBON_FACTOR;
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
