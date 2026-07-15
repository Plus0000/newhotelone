import { describe, it, expect } from 'vitest';
import { calcComprehensiveRate, calcDimensionRates } from '../constants';
import { techEntries } from '@/data/materials';
import type { TechEntry } from '@/data/materials';

// PM 文档算例：北京三级医院 10万㎡ 2009年建成，选5项技术
// 期望综合节能率 = 31.0%（adaptation 全=1.0 时代码应算出约 31.8%，差异来自智能照明 adaptation=0.85）
// 详见 docs/step2-综合节能率计算逻辑说明.md 第四节
function pickTechsByIds(ids: string[]): TechEntry[] {
  return techEntries.filter((t) => ids.includes(t.id));
}

const PM_INPUT = {
  techs: pickTechsByIds(['1', '2', '3', '4', '5']),
  climateZone: '寒冷地区',
  hvacYear: 2009,
  hospitalScale: '三级' as const,
  province: '北京市',
  totalArea: 100000,
};

describe('PM 文档算例回归 - 跨系统技术分组', () => {
  const result = calcComprehensiveRate(PM_INPUT);

  it('应该返回非 null 结果', () => {
    expect(result).not.toBeNull();
  });

  it('空调制冷系统组应包含 3 项技术（IoT + 地源 + 洁净），不是 2 项', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup).toBeDefined();
    expect(coolingGroup!.techCount).toBe(3);
    const techNames = coolingGroup!.techs.map((t) => t.techName).sort();
    expect(techNames).toContain('地源/空气源热泵多能源耦合供热技术');
    expect(techNames).toContain('IoT+数字孪生+AI前馈调节技术');
    expect(techNames).toContain('洁净区域冷热源升级技术（四管制/六管制）');
  });

  it('供暖系统组应包含 2 项技术（相变 + 地源）', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup).toBeDefined();
    expect(heatingGroup!.techCount).toBe(2);
    const techNames = heatingGroup!.techs.map((t) => t.techName).sort();
    expect(techNames).toContain('相变储热供暖技术');
    expect(techNames).toContain('地源/空气源热泵多能源耦合供热技术');
  });

  it('照明系统组应包含 1 项技术（智能照明）', () => {
    const lightingGroup = result!.groups.find((g) => g.system === '照明系统');
    expect(lightingGroup).toBeDefined();
    expect(lightingGroup!.techCount).toBe(1);
  });

  it('空调制冷系统组 groupSum 应该 = 15% + 40% + 35% = 90%（地源热泵参与计算）', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup!.groupSum).toBeCloseTo(0.90, 2);
  });

  it('供暖系统组 groupSum 应该 = 15% + 40% = 55%', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup!.groupSum).toBeCloseTo(0.55, 2);
  });

  it('空调制冷系统组贡献 = 90% × 0.70(3技术重叠) × 0.2262(寒冷地区权重) ≈ 14.25%', () => {
    const coolingGroup = result!.groups.find((g) => g.system === '空调制冷系统');
    expect(coolingGroup!.contribution).toBeCloseTo(0.1425, 2);
  });

  it('供暖系统组贡献 = 55% × 0.75(2技术重叠) × 0.22(寒冷地区权重) ≈ 9.08%', () => {
    const heatingGroup = result!.groups.find((g) => g.system === '供暖系统');
    expect(heatingGroup!.contribution).toBeCloseTo(0.0908, 2);
  });

  it('初步综合节能率 ≈ 28.9%（adaptation=1.0）', () => {
    expect(result!.preliminaryRate).toBeCloseTo(0.289, 1);
  });

  it('最终综合节能率 ≈ 31.8%（28.9% × 1.1 医院修正），接近 PM 文档期望 31.0%', () => {
    expect(result!.finalRate).toBeCloseTo(0.318, 1);
  });
});

describe('PM 文档算例回归 - 三维度节能率', () => {
  const dimRates = calcDimensionRates(PM_INPUT);

  it('制冷维度应包含地源热泵（affectedSystems 含空调制冷系统）', () => {
    const coolingTechs = dimRates!.cooling.groups[0].techs.map((t) => t.techName);
    expect(coolingTechs).toContain('地源/空气源热泵多能源耦合供热技术');
  });

  it('供暖维度应包含地源热泵（affectedSystems 含供暖系统）', () => {
    const heatingTechs = dimRates!.heating.groups[0].techs.map((t) => t.techName);
    expect(heatingTechs).toContain('地源/空气源热泵多能源耦合供热技术');
  });

  it('制冷维度 groupSum = 90%（IoT 15% + 地源 40% + 洁净 35%）', () => {
    expect(dimRates!.cooling.groups[0].groupSum).toBeCloseTo(0.90, 2);
  });

  it('供暖维度 groupSum = 55%（相变 15% + 地源 40%）', () => {
    expect(dimRates!.heating.groups[0].groupSum).toBeCloseTo(0.55, 2);
  });
});
