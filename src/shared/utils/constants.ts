/** 电力折标煤系数 (tce/万kWh) - GB/T 2589-2020 国标单一值，保留 */
export const COAL_FACTOR = 1.229;

/**
 * 电力碳排放因子回退默认值 (tCO₂/万kWh) - 全国统一均值
 * 实际计算必须用 `getElectricityCarbonFactor(province)` 查省级表
 * 见 src/data/electricityCarbonFactor.ts
 */
export const CARBON_FACTOR = 5.81;

/**
 * 天然气碳排放因子回退默认值 (tCO₂/Nm³) - 通用值
 * 实际计算必须用 `getFossilCarbonFactor('天然气')` 查表
 * 见 src/data/fossilCarbonFactor.ts
 */
export const GAS_CARBON_FACTOR = 0.00196;
