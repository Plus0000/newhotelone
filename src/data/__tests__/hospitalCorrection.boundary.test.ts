import { describe, it, expect } from 'vitest';
import { getHospitalCorrection } from '@/data/hospitalCorrection';

describe('getHospitalCorrection 边界 - P2-14', () => {
  it('hvacYear=2009 返回 1.1（老旧医院 <2010）', () => {
    expect(getHospitalCorrection(2009)).toBe(1.1);
  });

  it('hvacYear=2010 返回 1.0（中年医院 2010~2020 含 2010）', () => {
    expect(getHospitalCorrection(2010)).toBe(1.0);
  });

  it('hvacYear=2019 返回 1.0', () => {
    expect(getHospitalCorrection(2019)).toBe(1.0);
  });

  it('hvacYear=2020 返回 1.0（中年医院 2010~2020 含 2020）', () => {
    // 当前 bug: maxYear=2020 使 2020 落到下一行返回 0.9
    expect(getHospitalCorrection(2020)).toBe(1.0);
  });

  it('hvacYear=2021 返回 0.9（新建医院 >2020）', () => {
    expect(getHospitalCorrection(2021)).toBe(0.9);
  });
});
