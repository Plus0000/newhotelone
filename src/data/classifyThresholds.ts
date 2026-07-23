// 分类阈值常量 - 按 docx「节能项目数据分析指标计算说明」第七节要求：
// "投资回收期上限、最低净收益率、最大投资额和运维成本占比等条件设置为可配置参数，
//  避免把阈值直接写死在程序中"
//
// 修改阈值时只改本文件，无需改 helpers.ts 逻辑

// 静态投资回收期阈值（年）
// ≤ shortMax: 优先落地
// ≤ midMax:   EMC分成
// > midMax:   智慧配套
export const PAYBACK_THRESHOLDS = {
  shortMax: 3,
  midMax: 6,
} as const;

// 运维成本占比阈值（%）
// ≤ goodMax:    优秀
// ≤ normalMax:  正常
// > normalMax:  拖累
export const MAINTENANCE_THRESHOLDS = {
  goodMax: 10,
  normalMax: 20,
} as const;
