import { describe, it, expect } from 'vitest';
import { energyWeights } from '@/data/energyWeight';
import { techEntries } from '@/data/materials';
import { SYSTEM_NAME_NORMALIZE } from '@/steps/step2-solution/constants';

const CLIMATE_ZONES = ['严寒地区', '寒冷地区', '夏热冬冷地区', '夏热冬暖地区', '温和地区'];

const normalizedPrimarySystems = new Set(
  techEntries.map((t) => SYSTEM_NAME_NORMALIZE[t.primarySystem] ?? t.primarySystem)
);

function systemsIn(dimension: string): Set<string> {
  return new Set(
    energyWeights.filter((r) => r.energyDimension === dimension).map((r) => r.system)
  );
}

describe('energyWeight 完整性', () => {
  describe('权重和校验', () => {
    it('非供暖系统能耗: 每个气候分区权重和 = 1.0', () => {
      for (const zone of CLIMATE_ZONES) {
        const sum = energyWeights
          .filter((r) => r.energyDimension === '非供暖系统能耗')
          .reduce((s, r) => s + (r.weights[zone] ?? 0), 0);
        expect(sum, `非供暖系统能耗/${zone} 权重和=${sum}`).toBeCloseTo(1.0, 4);
      }
    });

    it('全院区综合系统能耗: 每个气候分区权重和 = 1.0', () => {
      for (const zone of CLIMATE_ZONES) {
        const sum = energyWeights
          .filter((r) => r.energyDimension === '全院区综合系统能耗')
          .reduce((s, r) => s + (r.weights[zone] ?? 0), 0);
        expect(sum, `全院区综合系统能耗/${zone} 权重和=${sum}`).toBeCloseTo(1.0, 4);
      }
    });

    it('制冷系统能耗: 每个系统权重 = 1.0（制冷能耗占自身 100%）', () => {
      const rows = energyWeights.filter((r) => r.energyDimension === '制冷系统能耗');
      for (const row of rows) {
        for (const zone of CLIMATE_ZONES) {
          expect(row.weights[zone], `制冷系统能耗/${row.system}/${zone}`).toBeCloseTo(1.0, 4);
        }
      }
    });

    it('供暖系统能耗: 供暖系统权重 = 1.0', () => {
      const rows = energyWeights.filter((r) => r.energyDimension === '供暖系统能耗');
      for (const row of rows) {
        for (const zone of CLIMATE_ZONES) {
          expect(row.weights[zone], `供暖系统能耗/${row.system}/${zone}`).toBeCloseTo(1.0, 4);
        }
      }
    });
  });

  describe('系统覆盖校验', () => {
    it('全院区综合系统能耗必须覆盖所有 primarySystem（归一化后）', () => {
      const systems = systemsIn('全院区综合系统能耗');
      const missing = [...normalizedPrimarySystems].filter((s) => !systems.has(s));
      expect(missing, `全院区综合系统能耗 缺少系统: ${missing.join(', ')}`).toEqual([]);
    });

    it('非供暖系统能耗必须包含空调制冷系统（洁净空调系统通过归一化映射）', () => {
      const systems = systemsIn('非供暖系统能耗');
      expect(systems.has('空调制冷系统')).toBe(true);
    });

    it('制冷系统能耗必须包含空调制冷系统（洁净空调系统通过归一化映射）', () => {
      const systems = systemsIn('制冷系统能耗');
      expect(systems.has('空调制冷系统')).toBe(true);
    });
  });
});
