import { describe, it, expect } from 'vitest';
import {
  calcAnnualHours,
  createDefaultZoneConfig,
  getSimultaneousCoeff,
  migrateSystemName,
  migrateSystemNames,
  classifyUnitByEnergy,
  convertKwhToEnergyByType,
  aggregateEnergyByType,
  migrateTechEnergyByType,
  calcCarbonEmissionByType,
  calcCarbonSavingByType,
  calcRemainingReductionByType,
} from './helpers';
import type { ZoneConfig, EnergyByType } from '@/shared/stores/projectStore';

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

  it('测试3：全部未填面积返回 0（不再退回等权）', () => {
    const zcEmpty = buildZoneConfigs({ 门诊: undefined, 急诊: undefined });
    const t3 = calcAnnualHours(zcEmpty, systems, targets);
    console.log('T3（空面积） =', t3);

    expect(t3).toBe(0);
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
    expect(getSimultaneousCoeff([])).toBe(0.8);
    expect(getSimultaneousCoeff(undefined)).toBe(0.8);
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

describe('classifyUnitByEnergy - 设备单位分类', () => {
  it('电力单位 -> electric', () => {
    expect(classifyUnitByEnergy('kW')).toBe('electric');
    expect(classifyUnitByEnergy('kWh')).toBe('electric');
    expect(classifyUnitByEnergy('MW')).toBe('electric');
    expect(classifyUnitByEnergy('万kWh')).toBe('electric');
    expect(classifyUnitByEnergy('万kJ')).toBe('electric');
  });

  it('天然气 m³ -> gas', () => {
    expect(classifyUnitByEnergy('m³')).toBe('gas');
  });

  it('热力相关 GJ/t/kg -> heat', () => {
    expect(classifyUnitByEnergy('GJ')).toBe('heat');
    expect(classifyUnitByEnergy('t')).toBe('heat');
    expect(classifyUnitByEnergy('kg')).toBe('heat');
  });

  it('未知单位默认 electric', () => {
    expect(classifyUnitByEnergy('')).toBe('electric');
    expect(classifyUnitByEnergy('unknown')).toBe('electric');
  });
});

describe('convertKwhToEnergyByType - 万kWh 反向换算', () => {
  it('electric: 直接返回万kWh', () => {
    const r = convertKwhToEnergyByType(100, 'kW');
    expect(r.electric).toBe(100);
    expect(r.gas).toBe(0);
    expect(r.heat).toBe(0);
  });

  it('gas: 万kWh / 10.55 = 万Nm³', () => {
    const r = convertKwhToEnergyByType(10.55, 'm³');
    expect(r.gas).toBeCloseTo(1, 5);
    expect(r.electric).toBe(0);
    expect(r.heat).toBe(0);
  });

  it('heat: 万kWh × 36 = GJ', () => {
    const r = convertKwhToEnergyByType(1, 'GJ');
    expect(r.heat).toBe(36);
    expect(r.electric).toBe(0);
    expect(r.gas).toBe(0);
  });

  it('t(蒸吨) 同样映射到 heat', () => {
    const r = convertKwhToEnergyByType(1, 't');
    expect(r.heat).toBe(36);
  });

  it('kg(标煤) 同样映射到 heat', () => {
    const r = convertKwhToEnergyByType(1, 'kg');
    expect(r.heat).toBe(36);
  });

  it('逆运算往返：gas kwh -> 万Nm³ -> ×10.55 -> 原 kwh', () => {
    const original = 100;
    const byType = convertKwhToEnergyByType(original, 'm³');
    const back = byType.gas * 10.55;
    expect(back).toBeCloseTo(original, 5);
  });

  it('逆运算往返：heat kwh -> GJ -> ÷36 -> 原 kwh', () => {
    const original = 100;
    const byType = convertKwhToEnergyByType(original, 'GJ');
    const back = byType.heat / 36;
    expect(back).toBeCloseTo(original, 5);
  });
});

describe('aggregateEnergyByType - 设备列表聚合', () => {
  it('混合设备列表：1电+1气+1热，三字段独立累加', () => {
    const eqs = [
      { energyConsumption: 100, unit: 'kW' },
      { energyConsumption: 10.55, unit: 'm³' },
      { energyConsumption: 1, unit: 'GJ' },
    ];
    const r = aggregateEnergyByType(eqs);
    expect(r.electric).toBe(100);
    expect(r.gas).toBeCloseTo(1, 5);
    expect(r.heat).toBe(36);
  });

  it('空列表返回全零', () => {
    const r = aggregateEnergyByType([]);
    expect(r).toEqual({ electric: 0, gas: 0, heat: 0 });
  });

  it('energyConsumption=0 不影响结果', () => {
    const eqs = [
      { energyConsumption: 0, unit: 'kW' },
      { energyConsumption: 50, unit: 'kW' },
    ];
    const r = aggregateEnergyByType(eqs);
    expect(r.electric).toBe(50);
  });
});

describe('migrateTechEnergyByType - 旧数据迁移', () => {
  it('旧数据（无 byType）：全归 electric', () => {
    const old = {
      savingEnergyRun: 100,
      originalEnergyRun: 200,
    };
    const r = migrateTechEnergyByType(old);
    expect(r.savingEnergyByType).toEqual({ electric: 100, gas: 0, heat: 0 });
    expect(r.originalEnergyByType).toEqual({ electric: 200, gas: 0, heat: 0 });
  });

  it('新数据（有 byType）：原样返回不覆盖', () => {
    const fresh = {
      savingEnergyRun: 100,
      originalEnergyRun: 200,
      savingEnergyByType: { electric: 50, gas: 5, heat: 10 },
      originalEnergyByType: { electric: 100, gas: 10, heat: 20 },
    };
    const r = migrateTechEnergyByType(fresh);
    expect(r.savingEnergyByType).toEqual({ electric: 50, gas: 5, heat: 10 });
    expect(r.originalEnergyByType).toEqual({ electric: 100, gas: 10, heat: 20 });
  });

  it('部分迁移（只有 savingEnergyByType）：补全 originalEnergyByType', () => {
    const partial = {
      savingEnergyRun: 100,
      originalEnergyRun: 200,
      savingEnergyByType: { electric: 50, gas: 5, heat: 10 },
    };
    const r = migrateTechEnergyByType(partial);
    expect(r.savingEnergyByType).toEqual({ electric: 50, gas: 5, heat: 10 });
    expect(r.originalEnergyByType).toEqual({ electric: 200, gas: 0, heat: 0 });
  });
});

describe('calcCarbonEmissionByType - 按能源类型算碳排', () => {
  it('纯电场景：electric × 电力因子', () => {
    const energy: EnergyByType = { electric: 10, gas: 0, heat: 0 };
    const r = calcCarbonEmissionByType(energy, '北京');
    // 北京电力因子约 5.81 tCO₂/万kWh（getElectricityCarbonFactor 返回值）
    expect(r).toBeGreaterThan(0);
    // 纯电场景应与旧 calcCarbonEmission 结果一致（10 × 因子）
    // 这里不直接对比旧函数，只验证非零且为正
  });

  it('纯气场景：gas × 10000 × 天然气因子', () => {
    const energy: EnergyByType = { electric: 0, gas: 1, heat: 0 };
    const r = calcCarbonEmissionByType(energy, '北京');
    // 1 万Nm³ × 10000 × 0.002184 = 21.84 tCO₂
    expect(r).toBeCloseTo(21.84, 1);
  });

  it('纯热场景：heat × 热力因子', () => {
    const energy: EnergyByType = { electric: 0, gas: 0, heat: 100 };
    const r = calcCarbonEmissionByType(energy, '北京');
    // 100 GJ × 0.11 = 11 tCO₂
    expect(r).toBeCloseTo(11, 1);
  });

  it('混合场景：三因子求和', () => {
    const energy: EnergyByType = { electric: 10, gas: 1, heat: 100 };
    const r = calcCarbonEmissionByType(energy, '北京');
    // 10 × 电力因子 + 1 × 10000 × 0.002184 + 100 × 0.11
    const elecPart = 10 * 5.81; // 全国回退值或北京因子，大致范围
    const gasPart = 21.84;
    const heatPart = 11;
    expect(r).toBeGreaterThan(elecPart + gasPart + heatPart - 10); // 容差
    expect(r).toBeLessThan(elecPart + gasPart + heatPart + 10);
  });

  it('province 为空用全国回退值', () => {
    const energy: EnergyByType = { electric: 10, gas: 0, heat: 0 };
    const r = calcCarbonEmissionByType(energy);
    expect(r).toBeCloseTo(10 * 5.81, 1);
  });

  it('全零输入返回 0', () => {
    const energy: EnergyByType = { electric: 0, gas: 0, heat: 0 };
    expect(calcCarbonEmissionByType(energy, '北京')).toBe(0);
  });
});

describe('calcCarbonSavingByType - 年节碳量', () => {
  it('original - saving 各类型分别算后求差', () => {
    const original: EnergyByType = { electric: 100, gas: 2, heat: 200 };
    const saving: EnergyByType = { electric: 60, gas: 1, heat: 100 };
    const r = calcCarbonSavingByType(original, saving, '北京');
    const expected =
      calcCarbonEmissionByType(original, '北京') - calcCarbonEmissionByType(saving, '北京');
    expect(r).toBeCloseTo(expected, 5);
  });

  it('saving 大于 original 时返回负值（碳排增加）', () => {
    const original: EnergyByType = { electric: 10, gas: 0, heat: 0 };
    const saving: EnergyByType = { electric: 20, gas: 0, heat: 0 };
    const r = calcCarbonSavingByType(original, saving, '北京');
    expect(r).toBeLessThan(0);
  });
});

describe('calcRemainingReductionByType - 剩余减排潜力', () => {
  it('等于新方案碳排放量', () => {
    const saving: EnergyByType = { electric: 50, gas: 1, heat: 50 };
    const r = calcRemainingReductionByType(saving, '北京');
    expect(r).toBeCloseTo(calcCarbonEmissionByType(saving, '北京'), 5);
  });
});
