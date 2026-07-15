import { describe, it, expect } from 'vitest';
import { scoreTechBoundary } from '../techScoring';

describe('techScoring 行为 - P1-7: evalAutomationLevel 冷却水泵字段', () => {
  it('冷却水泵变频应匹配 tier 2（用 condenserPumpVfd 不是 chillerPumpVfd）', () => {
    const step1Data = {
      mep: {
        smart: {
          level: 'BAS完善',
          chillerPumpVfd: '定频',    // 冷水泵定频（bug 会导致误匹配 tier 1）
          condenserPumpVfd: '变频',  // 冷却水泵变频（应匹配 tier 2）
          coolingTowerFanVfd: '变频',
        },
      },
    };
    const result = scoreTechBoundary('冷却塔供冷技术', step1Data, '寒冷地区', { totalArea: 50000 });
    const dim = result.dimensionScores.find((d) => d.dimension === '系统自动化基础');
    expect(dim?.score).toBe(0.5);  // tier 2: 冷却水泵、冷却塔风机为变频运行
  });
});

describe('techScoring 行为 - P1-8: evalInstallCondition 蓄冷场地字段', () => {
  it('蓄冷场地不具备应匹配 tier 2（读 expansionStation 不是 mainStation）', () => {
    const step1Data = {
      mep: {
        install: {
          mainStation: '专用机房可改造',   // 有值但不该被蓄冷条件读
          expansionStation: '不具备场地',   // 蓄冷场地不具备
        },
      },
    };
    const result = scoreTechBoundary('蓄冷技术', step1Data, '寒冷地区', { totalArea: 50000 });
    const dim = result.dimensionScores.find((d) => d.dimension.includes('机电安装条件'));
    expect(dim?.score).toBe(0);  // tier 2: 不具备蓄冷场地条件
  });
});

describe('techScoring 行为 - P1-9: evalInstallCondition 机房 tier 2 关键词', () => {
  it('机房空间紧凑不可改应匹配 tier 2（不是返回 null）', () => {
    const step1Data = {
      mep: {
        install: { mainStation: '空间紧凑不可改' },
      },
    };
    const result = scoreTechBoundary('高效空调制冷机房技术', step1Data, '寒冷地区', { totalArea: 80000 });
    const dim = result.dimensionScores.find((d) => d.dimension.includes('机电安装条件'));
    expect(dim?.score).toBe(0);  // tier 2: 不具备机房条件
  });
});

describe('techScoring 行为 - P1-11: evalPriceDiff 天然气价维度', () => {
  it('北京天然气价 2.63 应匹配 tier 1（score 0.5），不是返回 null', () => {
    const step1Data = { location: ['北京市'] };
    const result = scoreTechBoundary('冷水机组冷凝热回收技术', step1Data, '寒冷地区', { totalArea: 50000 });
    const dim = result.dimensionScores.find((d) => d.dimension.includes('峰谷电价差'));
    // 北京 gasPrice=2.63, tier 1: 2.5≤gasPrice＜3.5
    expect(dim?.score).toBe(0.5);
  });
});

describe('techScoring 行为 - P1-13: evalOutdoorArea 地源热泵无场地数据', () => {
  it('地源热泵无场地数据应匹配 tier 2（不是返回 null）', () => {
    const step1Data = {
      mep: { install: {} },  // 无 geoHeatExchangerArea
    };
    const result = scoreTechBoundary('地源/空气源热泵多能源耦合供热技术', step1Data, '寒冷地区', { totalArea: 50000 });
    const dim = result.dimensionScores.find((d) => d.dimension.includes('室外场地面积'));
    expect(dim?.score).toBe(0);  // tier 2: 无室外场地
  });
});
