// Source: 模块2/机电系统能耗权重表.xlsx
// 用途: Step 2 综合节能率计算 - 各作用系统在不同气候分区的能耗权重
// 结构: 能耗维度 × 作用系统 × 气候分区 -> 权重值
// 录入: 2026-07-14

export interface EnergyWeightRow {
  /** 能耗维度: 制冷系统能耗 | 供暖系统能耗 | 非供暖系统能耗 | 全院区综合系统能耗 */
  energyDimension: string;
  /** 作用系统: 空调制冷系统 | 供暖系统 | 照明系统 | ... */
  system: string;
  /** 各气候分区的权重值 */
  weights: Record<string, number>;
}

export const energyWeights: EnergyWeightRow[] = [
  {
    energyDimension: '制冷系统能耗',
    system: '空调制冷系统',
    weights: { 严寒地区: 1.0, 寒冷地区: 1.0, 夏热冬冷地区: 1.0, 夏热冬暖地区: 1.0, 温和地区: 1.0 },
  },
  {
    energyDimension: '供暖系统能耗',
    system: '供暖系统',
    weights: { 严寒地区: 1.0, 寒冷地区: 1.0, 夏热冬冷地区: 1.0, 夏热冬暖地区: 1.0, 温和地区: 1.0 },
  },
  // "洁净空调系统" 通过 SYSTEM_NAME_NORMALIZE 映射到 "空调制冷系统"，此处不再单独建行
  {
    energyDimension: '非供暖系统能耗',
    system: '空调制冷系统',
    weights: {
      严寒地区: 0.25,
      寒冷地区: 0.29,
      夏热冬冷地区: 0.37,
      夏热冬暖地区: 0.42,
      温和地区: 0.27,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '空调通风设备',
    weights: {
      严寒地区: 0.16,
      寒冷地区: 0.15,
      夏热冬冷地区: 0.13,
      夏热冬暖地区: 0.12,
      温和地区: 0.15,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '照明系统',
    weights: {
      严寒地区: 0.13,
      寒冷地区: 0.12,
      夏热冬冷地区: 0.11,
      夏热冬暖地区: 0.1,
      温和地区: 0.12,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '生活热水系统',
    weights: {
      严寒地区: 0.09,
      寒冷地区: 0.09,
      夏热冬冷地区: 0.08,
      夏热冬暖地区: 0.07,
      温和地区: 0.09,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '给排水系统',
    weights: {
      严寒地区: 0.03,
      寒冷地区: 0.03,
      夏热冬冷地区: 0.03,
      夏热冬暖地区: 0.03,
      温和地区: 0.03,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '电梯系统',
    weights: {
      严寒地区: 0.03,
      寒冷地区: 0.03,
      夏热冬冷地区: 0.03,
      夏热冬暖地区: 0.03,
      温和地区: 0.03,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '弱电系统',
    weights: {
      严寒地区: 0.02,
      寒冷地区: 0.02,
      夏热冬冷地区: 0.02,
      夏热冬暖地区: 0.02,
      温和地区: 0.02,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '科室用电（办公设备）',
    weights: {
      严寒地区: 0.07,
      寒冷地区: 0.06,
      夏热冬冷地区: 0.06,
      夏热冬暖地区: 0.05,
      温和地区: 0.07,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '医疗设备系统',
    weights: {
      严寒地区: 0.16,
      寒冷地区: 0.15,
      夏热冬冷地区: 0.13,
      夏热冬暖地区: 0.12,
      温和地区: 0.16,
    },
  },
  {
    energyDimension: '非供暖系统能耗',
    system: '重点机房系统',
    weights: {
      严寒地区: 0.06,
      寒冷地区: 0.06,
      夏热冬冷地区: 0.04,
      夏热冬暖地区: 0.04,
      温和地区: 0.06,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '空调制冷系统',
    weights: {
      严寒地区: 0.17,
      寒冷地区: 0.2262,
      夏热冬冷地区: 0.3182,
      夏热冬暖地区: 0.4116,
      温和地区: 0.2592,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '空调通风设备',
    weights: {
      严寒地区: 0.1088,
      寒冷地区: 0.117,
      夏热冬冷地区: 0.1118,
      夏热冬暖地区: 0.1176,
      温和地区: 0.144,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '供暖系统',
    weights: {
      严寒地区: 0.32,
      寒冷地区: 0.22,
      夏热冬冷地区: 0.14,
      夏热冬暖地区: 0.02,
      温和地区: 0.04,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '照明系统',
    weights: {
      严寒地区: 0.0884,
      寒冷地区: 0.0936,
      夏热冬冷地区: 0.0946,
      夏热冬暖地区: 0.098,
      温和地区: 0.1152,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '生活热水系统',
    weights: {
      严寒地区: 0.0612,
      寒冷地区: 0.0702,
      夏热冬冷地区: 0.0688,
      夏热冬暖地区: 0.0686,
      温和地区: 0.0864,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '给排水系统',
    weights: {
      严寒地区: 0.0204,
      寒冷地区: 0.0234,
      夏热冬冷地区: 0.0258,
      夏热冬暖地区: 0.0294,
      温和地区: 0.0288,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '电梯系统',
    weights: {
      严寒地区: 0.0204,
      寒冷地区: 0.0234,
      夏热冬冷地区: 0.0258,
      夏热冬暖地区: 0.0294,
      温和地区: 0.0288,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '弱电系统',
    weights: {
      严寒地区: 0.0136,
      寒冷地区: 0.0156,
      夏热冬冷地区: 0.0172,
      夏热冬暖地区: 0.0196,
      温和地区: 0.0192,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '科室用电（办公设备）',
    weights: {
      严寒地区: 0.0476,
      寒冷地区: 0.0468,
      夏热冬冷地区: 0.0516,
      夏热冬暖地区: 0.049,
      温和地区: 0.0672,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '医疗设备系统',
    weights: {
      严寒地区: 0.1088,
      寒冷地区: 0.117,
      夏热冬冷地区: 0.1118,
      夏热冬暖地区: 0.1176,
      温和地区: 0.1536,
    },
  },
  {
    energyDimension: '全院区综合系统能耗',
    system: '重点机房系统',
    weights: {
      严寒地区: 0.0408,
      寒冷地区: 0.0468,
      夏热冬冷地区: 0.0344,
      夏热冬暖地区: 0.0392,
      温和地区: 0.0576,
    },
  },
];

/** 查能耗权重 */
export function getEnergyWeight(
  energyDimension: string,
  system: string,
  climateZone: string,
): number {
  const row = energyWeights.find(
    (r) => r.energyDimension === energyDimension && r.system === system,
  );
  const weight = row?.weights[climateZone];
  if (weight === undefined) {
    console.warn('getEnergyWeight: no weight found', { energyDimension, system, climateZone });
    return 0;
  }
  return weight;
}
