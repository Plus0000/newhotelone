import { describe, it, expect } from 'vitest';
import { calcComprehensiveRate, calcDimensionRates } from '../constants';
import { techEntries } from '@/data/materials';
import type { TechEntry } from '@/data/materials';

// PM 原文档算例：北京三级医院 10万㎡ 2009年建成，选5项技术
// 权威来源：/Users/plus0/Desktop/技术交底-20260701/模块2：节能方案筛选/！！计算1-节能技术筛选和综合节能率估算.docx
//
// 2026-07-21 重写：IoT (tech 2) 改为附属技术，必须挂载主技术做加成
//   公式: mainTech.adjustedRate = baseRate × adaptation × (1 + Σ(dependent.baseRate × adaptation))
//   IoT 不单独出现在空调制冷组，而是加成其挂载的主技术
//
// 算例 A：IoT 挂载全部主技术（1 相变, 3 地源, 4 智能照明, 5 洁净）
//   boost = 1 + 15% × 1.0 = 1.15
//   主技术 adjustedRate = baseRate × 1.0 × 1.15
function pickTechsByIds(ids: string[]): TechEntry[] {
  return techEntries.filter((t) => ids.includes(t.id));
}

const PM_INPUT_BASE = {
  techs: pickTechsByIds(['1', '2', '3', '4', '5']),
  climateZone: '寒冷地区',
  hvacYear: 2009,
  hospitalScale: '三级' as const,
  province: '北京市',
  totalArea: 100000,
};

// IoT 挂载全部 4 个主技术
const BINDINGS_ALL = { '2': ['1', '3', '4', '5'] };

// 算例 A：IoT 挂载全部主技术（加成最大化场景，非 PM 文档算例）
// 注意：本算例不传 techAdaptationScores，所有技术适配度默认 100%，
//       且 IoT 挂全部 4 个主技术，最终 28.60%，与 PM 文档 25% 算例不同。
//       真正对齐 PM 文档的算例见文件末尾「PM 文档算例精确复现」。
describe('IoT 挂载全部主技术（加成最大化场景）', () => {
  const result = calcComprehensiveRate({ ...PM_INPUT_BASE, dependentTechBindings: BINDINGS_ALL });

  it('应该返回非 null 结果', () => {
    expect(result).not.toBeNull();
  });

  it('空调制冷系统组应只有 1 项技术（洁净），IoT 作为附属技术不单独分组', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup).toBeDefined();
    expect(coolingGroup!.techCount).toBe(1);
    const techNames = coolingGroup!.techs.map((t) => t.techName);
    expect(techNames).toContain('洁净区域冷热源升级技术（四管制/六管制）');
    expect(techNames).not.toContain('IoT+数字孪生+AI前馈调节技术');
  });

  it('空调制冷组 洁净 adjustedRate = 35% × 1.0 × 1.15(IoT加成) = 40.25%', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    const cleanTech = coolingGroup!.techs.find((t) => t.techName.includes('洁净'));
    expect(cleanTech!.adjustedRate).toBeCloseTo(0.4025, 4);
    expect(cleanTech!.boostMultiplier).toBeCloseTo(1.15, 2);
    expect(cleanTech!.boostDetails?.length).toBe(1);
    expect(cleanTech!.boostDetails?.[0].techName).toContain('IoT');
  });

  it('供暖系统组应包含 2 项技术（相变 + 地源）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup).toBeDefined();
    expect(heatingGroup!.techCount).toBe(2);
  });

  it('供暖组 相变 adjustedRate = 15% × 1.0 × 1.15 = 17.25%', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const phaseTech = heatingGroup!.techs.find((t) => t.techName.includes('相变'));
    expect(phaseTech!.adjustedRate).toBeCloseTo(0.1725, 4);
  });

  it('供暖组 地源 adjustedRate = 40% × 1.0 × 1.15 = 46%', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const geoTech = heatingGroup!.techs.find((t) => t.techName.includes('地源'));
    expect(geoTech!.adjustedRate).toBeCloseTo(0.46, 4);
  });

  it('照明组 智能照明 adjustedRate = 60% × 1.0 × 1.15 = 69%', () => {
    const lightingGroup = result!.groups.find((g) => g.system === '照明系统');
    const lightTech = lightingGroup!.techs[0];
    expect(lightTech.adjustedRate).toBeCloseTo(0.69, 4);
  });

  it('空调制冷组 groupSum = 40.25%（仅洁净，IoT 不单独分组）', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup!.groupSum).toBeCloseTo(0.4025, 4);
  });

  it('供暖组 groupSum = 17.25% + 46% = 63.25%', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup!.groupSum).toBeCloseTo(0.6325, 4);
  });

  it('照明组 groupSum = 69%', () => {
    const lightingGroup = result!.groups.find((g) => g.system === '照明系统');
    expect(lightingGroup!.groupSum).toBeCloseTo(0.69, 4);
  });

  it('最终综合节能率 ≈ 28.60%（含 IoT 加成，hospitalCorrection=1.1）', () => {
    // preliminaryRate = 40.25% × 1.0 × 0.2262 + 63.25% × 0.75 × 0.22 + 69% × 1.0 × 0.0936
    //                = 9.105% + 10.436% + 6.458% = 26.000%
    // finalRate = 26.000% × 1.1 = 28.600%
    expect(result!.finalRate).toBeCloseTo(0.286, 2);
  });
});

// 算例 B：IoT 无绑定（防御性测试，UI 应阻止此场景，但算法要稳健）
describe('PM 文档算例 - IoT 无绑定（防御性）', () => {
  const result = calcComprehensiveRate({ ...PM_INPUT_BASE, dependentTechBindings: {} });

  it('空调制冷组只有 1 项（洁净），IoT 不参与分组也不加成任何主技术', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup!.techCount).toBe(1);
  });

  it('空调制冷组 洁净 adjustedRate = 35%（无加成）', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    const cleanTech = coolingGroup!.techs.find((t) => t.techName.includes('洁净'));
    expect(cleanTech!.adjustedRate).toBeCloseTo(0.35, 4);
    expect(cleanTech!.boostMultiplier).toBeUndefined();
  });

  it('最终综合节能率 < 算例 A（无加成更低）', () => {
    const resultA = calcComprehensiveRate({ ...PM_INPUT_BASE, dependentTechBindings: BINDINGS_ALL })!;
    expect(result!.finalRate).toBeLessThan(resultA.finalRate);
  });
});

// 算例 C：IoT 仅挂载地源热泵（部分挂载）
describe('PM 文档算例 - IoT 仅挂载地源热泵', () => {
  const result = calcComprehensiveRate({
    ...PM_INPUT_BASE,
    dependentTechBindings: { '2': ['3'] },
  });

  it('地源 adjustedRate = 40% × 1.15 = 46%（仅地源有加成）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const geoTech = heatingGroup!.techs.find((t) => t.techName.includes('地源'));
    expect(geoTech!.adjustedRate).toBeCloseTo(0.46, 4);
  });

  it('相变 adjustedRate = 15%（无加成）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const phaseTech = heatingGroup!.techs.find((t) => t.techName.includes('相变'));
    expect(phaseTech!.adjustedRate).toBeCloseTo(0.15, 4);
    expect(phaseTech!.boostMultiplier).toBeUndefined();
  });

  it('洁净 adjustedRate = 35%（无加成，IoT 未挂载洁净）', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    const cleanTech = coolingGroup!.techs.find((t) => t.techName.includes('洁净'));
    expect(cleanTech!.adjustedRate).toBeCloseTo(0.35, 4);
  });
});

// 三维度综合节能率：附属技术加成应跟随主技术进入对应维度
// 注意：本算例不传 techAdaptationScores，所有技术适配度默认 100%，且 IoT 挂全部主技术，
//       与 PM 文档 25% 算例不同。PM 文档未给三维度算例，此测试仅验证三维度算法的加成跟随逻辑。
describe('三维度节能率 - IoT 挂全部主技术（加成跟随主技术进对应维度）', () => {
  const dimRates = calcDimensionRates({ ...PM_INPUT_BASE, dependentTechBindings: BINDINGS_ALL });

  it('制冷维度应包含洁净和地源（按 affectedSystems 多维度），IoT 不单独出现', () => {
    const coolingTechs = dimRates!.cooling.groups[0].techs.map((t) => t.techName);
    expect(coolingTechs).toContain('洁净区域冷热源升级技术（四管制/六管制）');
    expect(coolingTechs).toContain('地源/空气源热泵多能源耦合供热技术');
    expect(coolingTechs).not.toContain('IoT+数字孪生+AI前馈调节技术');
  });

  it('制冷维度 洁净 adjustedRate = 35% × 1.15 = 40.25%', () => {
    const cleanTech = dimRates!.cooling.groups[0].techs.find((t) => t.techName.includes('洁净'));
    expect(cleanTech!.adjustedRate).toBeCloseTo(0.4025, 4);
    expect(cleanTech!.boostMultiplier).toBeCloseTo(1.15, 2);
  });

  it('制冷维度 地源 adjustedRate = 40% × 1.15 = 46%', () => {
    const geoTech = dimRates!.cooling.groups[0].techs.find((t) => t.techName.includes('地源'));
    expect(geoTech!.adjustedRate).toBeCloseTo(0.46, 4);
  });

  it('制冷维度 groupSum = 40.25% + 46% = 86.25%（地源+洁净，都含IoT加成）', () => {
    expect(dimRates!.cooling.groups[0].groupSum).toBeCloseTo(0.8625, 4);
  });

  it('供暖维度应包含相变和地源，两个主技术都带 IoT 加成', () => {
    const heatingTechs = dimRates!.heating.groups[0].techs.map((t) => t.techName);
    expect(heatingTechs).toContain('相变储热供暖技术');
    expect(heatingTechs).toContain('地源/空气源热泵多能源耦合供热技术');
    expect(heatingTechs).not.toContain('IoT+数字孪生+AI前馈调节技术');
  });

  it('供暖维度 groupSum = 17.25% + 46% = 63.25%（两个主技术都加成）', () => {
    expect(dimRates!.heating.groups[0].groupSum).toBeCloseTo(0.6325, 4);
  });

  it('非供暖维度应包含照明，adjustedRate = 60% × 1.15 = 69%', () => {
    // 非供暖维度按 affectedSystems 分组：照明系统组
    const lightingGroup = dimRates!.nonHeating.groups.find((g) => g.system === '照明系统');
    expect(lightingGroup).toBeDefined();
    expect(lightingGroup!.techs[0].adjustedRate).toBeCloseTo(0.69, 4);
  });
});

// 算例 D：PM 文档算例精确复现（权威来源：！！计算1-附件-附属技术.docx）
//   - IoT 只挂载地源一个主技术（PM 文档步骤 3）
//   - 适配度按 PM 文档步骤 2：相变 100%、IoT 90%、地源 100%、智能照明 85%、洁净 100%
//   - 期望 finalRate ≈ 24.92%（与 PM 文档 25% 略有偏差，因实际能耗权重 22.62%/22%/9.36%
//     比 PM 文档四舍五入值 23%/22%/9% 更精确）
describe('PM 文档算例精确复现 - IoT 只挂地源，适配度按文档', () => {
  const techAdaptationScores = new Map<string, number>([
    ['1', 1.0],  // 相变 100%
    ['2', 0.9],  // IoT 90%
    ['3', 1.0],  // 地源 100%
    ['4', 0.85], // 智能照明 85%
    ['5', 1.0],  // 洁净 100%
  ]);

  const result = calcComprehensiveRate({
    ...PM_INPUT_BASE,
    techAdaptationScores,
    dependentTechBindings: { '2': ['3'] }, // IoT 只挂地源
  });

  it('地源 adjustedRate = 40% × 100% × (1 + 15% × 90%) = 45.4%（PM 文档步骤 4）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const geoTech = heatingGroup!.techs.find((t) => t.techName.includes('地源'));
    expect(geoTech!.adjustedRate).toBeCloseTo(0.454, 3);
    expect(geoTech!.boostMultiplier).toBeCloseTo(1.135, 3);
  });

  it('相变 adjustedRate = 15% × 100% = 15%（无加成，IoT 未挂相变）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    const phaseTech = heatingGroup!.techs.find((t) => t.techName.includes('相变'));
    expect(phaseTech!.adjustedRate).toBeCloseTo(0.15, 4);
    expect(phaseTech!.boostMultiplier).toBeUndefined();
  });

  it('智能照明 adjustedRate = 60% × 85% = 51%（PM 文档步骤 4，适配度 85%）', () => {
    const lightingGroup = result!.groups.find((g) => g.system === '照明系统');
    expect(lightingGroup!.techs[0].adjustedRate).toBeCloseTo(0.51, 4);
  });

  it('洁净 adjustedRate = 35% × 100% = 35%（无加成）', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    const cleanTech = coolingGroup!.techs.find((t) => t.techName.includes('洁净'));
    expect(cleanTech!.adjustedRate).toBeCloseTo(0.35, 4);
  });

  it('供暖组 groupSum = (15% + 45.4%) × 0.75 = 45.3%（PM 文档步骤 5）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup!.groupSum).toBeCloseTo(0.604, 3); // 15% + 45.4% = 60.4%
    expect(heatingGroup!.overlapCorrection).toBe(0.75);
  });

  it('最终综合节能率 ≈ 24.9%（PM 文档 25%，偏差来自能耗权重四舍五入）', () => {
    // preliminaryRate = 45.3% × 22% + 35% × 22.62% + 51% × 9.36% ≈ 22.66%
    // finalRate = 22.66% × 1.1 ≈ 24.92%
    expect(result!.finalRate).toBeCloseTo(0.249, 2);
    expect(result!.hospitalCorrection).toBe(1.1);
  });
});
