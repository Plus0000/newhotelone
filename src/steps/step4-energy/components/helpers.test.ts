import { describe, it, expect } from 'vitest';
import { calcAnnualHours, createDefaultZoneConfig, getSimultaneousCoeff, migrateSystemName, migrateSystemNames } from './helpers';
import type { ZoneConfig } from '@/shared/stores/projectStore';

// 构造测试用 zoneConfigs：用默认配置 + 自定义 buildingArea
function buildZoneConfigs(areas: Record<string, number | undefined>): Record<string, ZoneConfig> {
  const result: Record<string, ZoneConfig> = {};
  for (const [zone, area] of Object.entries(areas)) {
    const cfg = createDefaultZoneConfig(zone);
    result[zone] = { ...cfg, buildingArea: area };
  }
  return result;
}

describe('calcAnnualHours - 面积加权验证', () => {
  const systems = ['空调制冷系统'];
  const targets = ['门诊', '急诊'];

  // 先打印单区域年小时，方便对照
  it('单区域基线：门诊和急诊各自的制冷期年小时', () => {
    const zcOnlyOutpatient = buildZoneConfigs({ 门诊: 100 });
    const tOut = calcAnnualHours(zcOnlyOutpatient, systems, ['门诊']);
    console.log('门诊单区域年小时 =', tOut);

    const zcOnlyEmergency = buildZoneConfigs({ 急诊: 100 });
    const tEmg = calcAnnualHours(zcOnlyEmergency, systems, ['急诊']);
    console.log('急诊单区域年小时 =', tEmg);

    // 急诊 24h/天 vs 门诊 10h/天，急诊必然远大于门诊
    expect(tEmg).toBeGreaterThan(tOut);
  });

  it('测试1：等权基线（门诊100, 急诊100）', () => {
    const zc = buildZoneConfigs({ 门诊: 100, 急诊: 100 });
    const t = calcAnnualHours(zc, systems, targets);
    console.log('T1（等权） =', t);
    expect(t).toBeGreaterThan(0);
  });

  it('测试2：门诊权重×3（门诊300, 急诊100）应小于 T1', () => {
    const zcEqual = buildZoneConfigs({ 门诊: 100, 急诊: 100 });
    const t1 = calcAnnualHours(zcEqual, systems, targets);

    const zcWeighted = buildZoneConfigs({ 门诊: 300, 急诊: 100 });
    const t2 = calcAnnualHours(zcWeighted, systems, targets);
    console.log('T1（等权） =', t1, ' T2（3:1） =', t2);

    // 门诊运行时间短，权重加大后整体平均值应下降
    expect(t2).toBeLessThan(t1);
    // 差值应比较显著（>200h）
    expect(t1 - t2).toBeGreaterThan(200);
  });

  it('测试3：全部未填面积应退回等权（= T1）', () => {
    const zcEmpty = buildZoneConfigs({ 门诊: undefined, 急诊: undefined });
    const t3 = calcAnnualHours(zcEmpty, systems, targets);

    const zcEqual = buildZoneConfigs({ 门诊: 100, 急诊: 100 });
    const t1 = calcAnnualHours(zcEqual, systems, targets);
    console.log('T3（空面积回退） =', t3, ' T1（等权） =', t1);

    expect(t3).toBe(t1);
  });

  it('测试4：部分填部分不填，未填区域当 0 跳过', () => {
    // 门诊填 100，急诊不填 -> 只算门诊
    const zcPartial = buildZoneConfigs({ 门诊: 100, 急诊: undefined });
    const tPartial = calcAnnualHours(zcPartial, systems, targets);

    const zcOnlyOut = buildZoneConfigs({ 门诊: 100 });
    const tOnlyOut = calcAnnualHours(zcOnlyOut, systems, ['门诊']);
    console.log('部分填 T =', tPartial, ' 仅门诊 T =', tOnlyOut);

    expect(tPartial).toBe(tOnlyOut);
  });
});

describe('getSimultaneousCoeff - 11 系统系数表', () => {
  it('单系统：照明=0.4, 生活热水=0.5, 空调制冷=0.8', () => {
    expect(getSimultaneousCoeff(['照明系统'])).toBe(0.4);
    expect(getSimultaneousCoeff(['生活热水系统'])).toBe(0.5);
    expect(getSimultaneousCoeff(['空调制冷系统'])).toBe(0.8);
  });

  it('多系统取最大值（保守）', () => {
    // 照明 0.4 + 空调制冷 0.8 -> 取 0.8
    expect(getSimultaneousCoeff(['照明系统', '空调制冷系统'])).toBe(0.8);
    // 生活热水 0.5 + 照明 0.4 -> 取 0.5
    expect(getSimultaneousCoeff(['生活热水系统', '照明系统'])).toBe(0.5);
  });

  it('空数组/未传 fallback 0.80', () => {
    expect(getSimultaneousCoeff([])).toBe(0.80);
    expect(getSimultaneousCoeff(undefined)).toBe(0.80);
  });

  it('原方案表单值场景', () => {
    expect(getSimultaneousCoeff('供暖系统')).toBe(0.8);
    expect(getSimultaneousCoeff('给排水系统')).toBe(0.8);
  });
});

describe('calcAnnualHours - 空调通风系统展开', () => {
  it('空调通风系统 = 制冷 + 供暖之和', () => {
    const zc = buildZoneConfigs({ 门诊: 100 });

    // 只选空调通风
    const tVent = calcAnnualHours(zc, ['空调通风系统'], ['门诊']);
    // 同时选空调制冷 + 供暖
    const tCoolHeat = calcAnnualHours(zc, ['空调制冷系统', '供暖系统'], ['门诊']);
    // 单独制冷
    const tCool = calcAnnualHours(zc, ['空调制冷系统'], ['门诊']);
    // 单独供暖
    const tHeat = calcAnnualHours(zc, ['供暖系统'], ['门诊']);

    console.log('通风=', tVent, ' 制冷+供暖=', tCoolHeat, ' 制冷=', tCool, ' 供暖=', tHeat);

    expect(tVent).toBe(tCoolHeat);
    expect(tVent).toBe(tCool + tHeat);
  });
});

describe('migrateSystemName - 旧数据迁移', () => {
  it('短名迁移到全名', () => {
    expect(migrateSystemName('制冷')).toBe('空调制冷系统');
    expect(migrateSystemName('空调')).toBe('空调制冷系统');
    expect(migrateSystemName('通风')).toBe('空调通风系统');
    expect(migrateSystemName('供暖')).toBe('供暖系统');
    expect(migrateSystemName('照明')).toBe('照明系统');
    expect(migrateSystemName('生活热水')).toBe('生活热水系统');
  });

  it('已是新名保持不变', () => {
    expect(migrateSystemName('空调制冷系统')).toBe('空调制冷系统');
    expect(migrateSystemName('电梯系统')).toBe('电梯系统');
  });

  it('无效旧值返回空字符串（如负压吸引）', () => {
    expect(migrateSystemName('负压吸引')).toBe('');
    expect(migrateSystemName('压缩空气')).toBe('');
    expect(migrateSystemName('制氧系统')).toBe('');
    expect(migrateSystemName(undefined)).toBe('');
  });

  it('数组迁移并过滤无效值', () => {
    expect(migrateSystemNames(['制冷', '照明', '负压吸引'])).toEqual(['空调制冷系统', '照明系统']);
  });
});
