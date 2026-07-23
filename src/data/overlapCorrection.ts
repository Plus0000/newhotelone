// Source: 模块2/技术组合重叠修正系数表.xlsx
// 用途: Step 2 综合节能率计算 - 同一作用系统内多项技术重叠打折
// 录入: 2026-07-14

export interface OverlapCorrectionRow {
  /** 同一作用系统内的技术数量 */
  techCount: number;
  /** 重叠修正系数 (0~1) */
  correction: number;
}

export const overlapCorrections: OverlapCorrectionRow[] = [
  { techCount: 1, correction: 1.0 },
  { techCount: 2, correction: 0.75 },
  { techCount: 3, correction: 0.7 },
  { techCount: 4, correction: 0.65 },
];

/**
 * 按同一作用系统内的技术数量查重叠修正系数。
 * 4 个及以上统一返回 0.65。
 */
export function getOverlapCorrection(techCount: number): number {
  if (techCount <= 1) return 1.0;
  if (techCount > 4) {
    console.warn('getOverlapCorrection: techCount exceeds max (4), using 0.65', { techCount });
    return 0.65;
  }
  const row = overlapCorrections.find((r) => r.techCount === techCount);
  return row?.correction ?? 0.65;
}
