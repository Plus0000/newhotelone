import { describe, it, expect } from 'vitest';
import { calcOriginalEnergyByDimension, type DimensionRatesResult } from '../constants';

function mockRates(cooling: number, heating: number, nonHeating: number): DimensionRatesResult {
  return {
    cooling: { dimension: '制冷系统', groups: [], rate: cooling },
    heating: { dimension: '供暖系统', groups: [], rate: heating },
    nonHeating: { dimension: '非供暖系统', groups: [], rate: nonHeating },
  };
}

describe('calcOriginalEnergyByDimension 行为 - P0-3: 非供暖维度 savingElectricity/savingGas', () => {
  const rates = mockRates(0.15, 0.10, 0.12);
  const result = calcOriginalEnergyByDimension('北京市', '三级', 80000, rates);
  const nh = result.find((d) => d.dimension === '非供暖系统')!;

  it('非供暖 hasData 时 originalElectricity 应该 > 0（确保测试数据有效）', () => {
    expect(nh.hasData).toBe(true);
    expect(nh.originalElectricity).toBeGreaterThan(0);
  });

  it('savingElectricity 应该 = originalElectricity × (1-rate)，不是合并 savingEnergy', () => {
    expect(nh.savingElectricity).toBeCloseTo(nh.originalElectricity * (1 - nh.rate), 4);
  });

  it('savingGas 应该 = originalGas × (1-rate)，不是合并 savingEnergy', () => {
    expect(nh.savingGas).toBeCloseTo(nh.originalGas * (1 - nh.rate), 4);
  });

  it('savingElectricity 不应该等于 savingGas（单位不同：万kWh vs 万Nm³）', () => {
    // 如果两者相等，说明被赋了同一个合并值（P0-3 bug）
    expect(nh.savingElectricity).not.toBe(nh.savingGas);
  });
});

describe('calcOriginalEnergyByDimension 行为 - P1-12: rate=0 时 savingEnergy 语义', () => {
  const rates = mockRates(0, 0, 0);
  const result = calcOriginalEnergyByDimension('北京市', '三级', 80000, rates);

  it('rate=0 时 savingEnergy 应该 = originalEnergy（节能方案能耗=原方案能耗）', () => {
    for (const d of result) {
      if (d.hasData && d.originalEnergy !== null) {
        expect(d.savingEnergy, `${d.dimension}: rate=0 时 savingEnergy 应该 = originalEnergy`).toBeCloseTo(d.originalEnergy, 4);
      }
    }
  });

  it('rate=0 时 savingElectricity 应该 = originalElectricity', () => {
    for (const d of result) {
      if (d.hasData && d.originalElectricity > 0) {
        expect(d.savingElectricity, `${d.dimension}`).toBeCloseTo(d.originalElectricity, 4);
      }
    }
  });
});

describe('calcOriginalEnergyByDimension 行为 - 正常 rate 下的 cooling/heating', () => {
  const rates = mockRates(0.15, 0.10, 0.12);
  const result = calcOriginalEnergyByDimension('北京市', '三级', 80000, rates);
  const cooling = result.find((d) => d.dimension === '制冷系统')!;
  const heating = result.find((d) => d.dimension === '供暖系统')!;

  it('cooling savingElectricity 应该 = originalElectricity × (1-rate)', () => {
    if (cooling.hasData) {
      expect(cooling.savingElectricity).toBeCloseTo(cooling.originalElectricity * (1 - cooling.rate), 4);
    }
  });

  it('heating savingGas 应该 = originalGas × (1-rate)', () => {
    if (heating.hasData && heating.originalGas > 0) {
      expect(heating.savingGas).toBeCloseTo(heating.originalGas * (1 - heating.rate), 4);
    }
  });
});
