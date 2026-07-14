// Source: 模块2/医院整体修正系数表.xlsx
// 用途: Step 2 综合节能率计算 - 按冷热源投产年份修正医院整体节能潜力
// 录入: 2026-07-14

export interface HospitalCorrectionRow {
  /** 医院新旧分类 */
  category: string;
  /** 冷热源系统投产年份范围（文本，用于展示） */
  hvacYearRange: string;
  /** 投产年份上限（不含），用于比较 */
  maxYear: number;
  /** 医院整体修正系数 */
  correction: number;
  /** 机电系统特点描述 */
  description: string;
}

export const hospitalCorrections: HospitalCorrectionRow[] = [
  { category: '老旧医院', hvacYearRange: '＜2010',  maxYear: 2010,      correction: 1.1, description: '系统老化严重，节能潜力大' },
  { category: '中年医院', hvacYearRange: '2010~2020', maxYear: 2020,    correction: 1.0, description: '系统中等老化，节能潜力正常' },
  { category: '新建医院', hvacYearRange: '＞2020',  maxYear: Infinity, correction: 0.9, description: '系统较新，节能潜力较小' },
];

/**
 * 按冷热源系统投产年份查医院整体修正系数。
 * <2010 -> 1.1（老旧）/ 2010~2020 -> 1.0（中年）/ >2020 -> 0.9（新建）
 */
export function getHospitalCorrection(hvacYear: number): number {
  for (const row of hospitalCorrections) {
    if (hvacYear < row.maxYear) return row.correction;
  }
  return 1.0;
}
