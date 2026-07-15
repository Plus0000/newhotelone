import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getEnergyPriceInfo } from '@/data/policies';

const TECH_SCORING_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '../techScoring.ts'),
  'utf-8'
);

describe('字段名契约: techScoring <-> policies/step1Data', () => {
  describe('policies.getEnergyPriceInfo 返回字段', () => {
    it('必须返回 peakValleyPriceDiff（不是 peakValleyDiff）', () => {
      const result = getEnergyPriceInfo(['北京市']);
      expect(result).not.toBeNull();
      if (result) {
        expect(result).toHaveProperty('peakValleyPriceDiff');
        expect(result).not.toHaveProperty('peakValleyDiff');
      }
    });

    it('必须返回 valleyHours', () => {
      const result = getEnergyPriceInfo(['北京市']);
      expect(result).not.toBeNull();
      if (result) {
        expect(result).toHaveProperty('valleyHours');
      }
    });
  });

  describe('techScoring.ts 源码字段名校验', () => {
    it('不得访问 step1Data.energyPeakValley（电价数据应从 policies 查）', () => {
      const hasEnergyPeakValley = /energyPeakValley/.test(TECH_SCORING_SOURCE);
      expect(hasEnergyPeakValley, 'techScoring.ts 仍从 step1Data.energyPeakValley 读电价，应改用 policies.getEnergyPriceInfo').toBe(false);
    });

    it('必须从 policies 查电价，不得从 step1Data.energyPeakValley 读 peakValleyDiff', () => {
      // 旧 bug: const epv = safeGet(step1Data, ['energyPeakValley']); const diff = epv?.peakValleyDiff
      // 这个模式永远读不到值
      const hasWrongPattern = /energyPeakValley/.test(TECH_SCORING_SOURCE);
      expect(hasWrongPattern, 'techScoring.ts 仍从 step1Data.energyPeakValley 读电价').toBe(false);
    });
  });

  describe('ComprehensiveRateInput.hospitalScale 类型', () => {
    const CONSTANTS_SOURCE = fs.readFileSync(
      path.resolve(__dirname, '../constants.ts'),
      'utf-8'
    );

    it('hospitalScale 类型必须包含 一级（光储充一体化 veto 条件依赖）', () => {
      // 匹配 hospitalScale: '三级' | '二级' | '一级' 或类似
      const typeMatch = CONSTANTS_SOURCE.match(/hospitalScale:\s*([^;]+)/);
      expect(typeMatch).not.toBeNull();
      if (typeMatch) {
        const typeDef = typeMatch[1];
        expect(typeDef, `当前 hospitalScale 类型: ${typeDef}`).toContain("'一级'");
      }
    });
  });
});
