// 数据年份: 2023 年省级电网碳排放因子（生态环境部）
// 单位: tCO₂/万kWh（由 Excel 的 tCO₂/MWh × 10 换算）

export interface ElectricityCarbonFactor {
  id: string;
  province: string; // 简称（北京/上海/广东/...），与 step1Data.location[0] 规范化后匹配
  factor: number; // tCO₂/万kWh
  year: number; // 因子年份（电网因子每年更新）
  source: string; // 数据来源
}

// 数据来源: 电力平均碳排放因子（省级电网）.xlsx
const SOURCE = '生态环境部 2023 年省级电网碳排放因子';
const YEAR = 2023;

export const electricityCarbonFactors: ElectricityCarbonFactor[] = [
  { id: '1', province: '北京', factor: 5.554, year: YEAR, source: SOURCE },
  { id: '2', province: '天津', factor: 6.796, year: YEAR, source: SOURCE },
  { id: '3', province: '河北', factor: 6.516, year: YEAR, source: SOURCE },
  { id: '4', province: '山西', factor: 6.634, year: YEAR, source: SOURCE },
  { id: '5', province: '内蒙古', factor: 6.479, year: YEAR, source: SOURCE },
  { id: '6', province: '辽宁', factor: 4.878, year: YEAR, source: SOURCE },
  { id: '7', province: '吉林', factor: 4.671, year: YEAR, source: SOURCE },
  { id: '8', province: '黑龙江', factor: 5.229, year: YEAR, source: SOURCE },
  { id: '9', province: '上海', factor: 5.737, year: YEAR, source: SOURCE },
  { id: '10', province: '江苏', factor: 5.827, year: YEAR, source: SOURCE },
  { id: '11', province: '浙江', factor: 4.974, year: YEAR, source: SOURCE },
  { id: '12', province: '安徽', factor: 6.553, year: YEAR, source: SOURCE },
  { id: '13', province: '福建', factor: 4.211, year: YEAR, source: SOURCE },
  { id: '14', province: '江西', factor: 5.836, year: YEAR, source: SOURCE },
  { id: '15', province: '山东', factor: 6.191, year: YEAR, source: SOURCE },
  { id: '16', province: '河南', factor: 5.897, year: YEAR, source: SOURCE },
  { id: '17', province: '湖北', factor: 4.044, year: YEAR, source: SOURCE },
  { id: '18', province: '湖南', factor: 4.976, year: YEAR, source: SOURCE },
  { id: '19', province: '广东', factor: 4.419, year: YEAR, source: SOURCE },
  { id: '20', province: '广西', factor: 4.476, year: YEAR, source: SOURCE },
  { id: '21', province: '海南', factor: 3.648, year: YEAR, source: SOURCE },
  { id: '22', province: '重庆', factor: 5.581, year: YEAR, source: SOURCE },
  { id: '23', province: '四川', factor: 1.564, year: YEAR, source: SOURCE },
  { id: '24', province: '贵州', factor: 5.683, year: YEAR, source: SOURCE },
  { id: '25', province: '云南', factor: 1.333, year: YEAR, source: SOURCE },
  { id: '26', province: '西藏', factor: 2.472, year: YEAR, source: SOURCE },
  { id: '27', province: '陕西', factor: 6.335, year: YEAR, source: SOURCE },
  { id: '28', province: '甘肃', factor: 4.471, year: YEAR, source: SOURCE },
  { id: '29', province: '青海', factor: 1.796, year: YEAR, source: SOURCE },
  { id: '30', province: '宁夏', factor: 6.187, year: YEAR, source: SOURCE },
  { id: '31', province: '新疆', factor: 6.021, year: YEAR, source: SOURCE },
  { id: '32', province: '新疆生产建设兵团', factor: 6.021, year: YEAR, source: SOURCE },
];

// 全国统一回退值（查不到省份时用，对应原 CARBON_FACTOR = 5.81）
const DEFAULT_FACTOR = 5.81;

// 自治区/特别行政区 -> 简称 映射
const SPECIAL_PROVINCE_MAP: Record<string, string> = {
  内蒙古自治区: '内蒙古',
  广西壮族自治区: '广西',
  西藏自治区: '西藏',
  宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆',
  香港特别行政区: '香港',
  澳门特别行政区: '澳门',
};

/** 把 step1Data.location[0]（"北京市"/"广东省"/"内蒙古自治区"）规范化为 Excel 简称（"北京"/"广东"/"内蒙古"） */
export function normalizeProvince(province: string): string {
  if (!province) return '';
  if (SPECIAL_PROVINCE_MAP[province]) return SPECIAL_PROVINCE_MAP[province];
  return province.replace(/省$|市$|自治区$/, '');
}

/**
 * 查电力碳排放因子
 * @param province 省份名（可带"省"/"市"/"自治区"后缀，会自动规范化）
 * @param year 可选年份，不传则返回最新年份
 * @returns tCO₂/万kWh
 */
export function getElectricityCarbonFactor(province: string, year?: number): number {
  if (!province) return DEFAULT_FACTOR;
  const normalized = normalizeProvince(province);
  const candidates = electricityCarbonFactors.filter((f) => f.province === normalized);
  if (candidates.length === 0) return DEFAULT_FACTOR;
  if (year) {
    const match = candidates.find((f) => f.year === year);
    if (match) return match.factor;
  }
  // 无 year 或 year 未命中：取最新年份
  const latest = candidates.reduce((a, b) => (a.year > b.year ? a : b));
  return latest.factor;
}
