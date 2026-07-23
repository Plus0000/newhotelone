// Source: 模块2/能源折算系数.xlsx
// 用途: Step 4 能耗/碳排放计算 - 不同能源单位换算为 kWh
// 录入: 2026-07-14

export interface EnergyConversionRow {
  /** 能源名称 */
  name: string;
  /** 原始单位 */
  unit: string;
  /** 折算系数 EF (kWh per unit) */
  factor: number;
}

export const energyConversions: EnergyConversionRow[] = [
  { name: '天然气', unit: 'kWh/Nm³', factor: 5 },
  { name: '电力', unit: 'kWh/kWh', factor: 1 },
  { name: '集中制冷量', unit: 'kWh/MJ', factor: 0.06 },
  { name: '市政热力', unit: 'kWh/GJ', factor: 65.45 },
];

/**
 * 按能源名称查折算系数（kWh per unit）。
 * 未匹配返回 1（即默认按 kWh 直接使用）。
 */
export function getEnergyConversion(name: string): number {
  const row = energyConversions.find((r) => r.name === name);
  return row?.factor ?? 1;
}
