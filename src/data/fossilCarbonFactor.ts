// 数据来源: 化石能源碳排放因子.xlsx
// 单位按能源类型不同（Nm³/L/t）

export interface FossilCarbonFactor {
  id: string;
  fuelType: string;       // 天然气/汽油/柴油/无烟煤/烟煤
  factor: number;         // tCO₂/单位
  unit: string;           // Nm³/L/t
  source: string;
}

const SOURCE = '化石能源碳排放因子.xlsx';

export const fossilCarbonFactors: FossilCarbonFactor[] = [
  { id: '1', fuelType: '天然气', factor: 0.002184, unit: 'Nm³', source: SOURCE },
  { id: '2', fuelType: '汽油',   factor: 0.002179, unit: 'L',   source: SOURCE },
  { id: '3', fuelType: '柴油',   factor: 0.002718, unit: 'L',   source: SOURCE },
  { id: '4', fuelType: '无烟煤', factor: 2.429,    unit: 't',   source: SOURCE },
  { id: '5', fuelType: '烟煤',   factor: 2.174,    unit: 't',   source: SOURCE },
];

// 天然气回退值（查不到时用，对应原 GAS_CARBON_FACTOR = 0.00196）
const DEFAULT_GAS_FACTOR = 0.00196;

/**
 * 查化石能源碳排放因子
 * @param fuelType 燃料类型（天然气/汽油/柴油/无烟煤/烟煤）
 * @returns tCO₂/单位（单位见 fossilCarbonFactors.unit）
 */
export function getFossilCarbonFactor(fuelType: string): number {
  const entry = fossilCarbonFactors.find((f) => f.fuelType === fuelType);
  if (entry) return entry.factor;
  // 向后兼容: 查不到且燃料类型含"气"，返回天然气回退值
  if (fuelType?.includes('气')) return DEFAULT_GAS_FACTOR;
  return 0;
}
