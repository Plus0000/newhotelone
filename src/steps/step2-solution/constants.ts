import type { TechEntry } from '@/data/materials';

export const CATEGORY_LABELS: Record<string, string> = {
  '能源高效利用技术': '能源高效利用技术',
  '智能控制及优化技术': '智能控制及优化技术',
  '可再生能源利用技术': '可再生能源利用技术',
};

export const CATEGORY_COLORS: Record<string, string> = {
  '能源高效利用技术': '#1677ff',
  '智能控制及优化技术': '#8b5cf6',
  '可再生能源利用技术': '#22c55e',
};

export const CATEGORY_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '能源高效利用技术', value: '能源高效利用技术' },
  { label: '智能控制及优化技术', value: '智能控制及优化技术' },
  { label: '可再生能源利用技术', value: '可再生能源利用技术' },
];

export function parseRateRange(
  rateStr: string
): { lower: number; upper: number } | null {
  const match = rateStr.match(/(\d+(?:\.\d+)?)\s*%-?\s*(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  return {
    lower: parseFloat(match[1]) / 100,
    upper: parseFloat(match[2]) / 100,
  };
}

export function calcComprehensiveRate(techs: TechEntry[]): {
  lower: number;
  upper: number;
} | null {
  const rates = techs
    .map((t) => parseRateRange(t.energySavingRate))
    .filter(Boolean) as { lower: number; upper: number }[];

  if (rates.length === 0) return null;

  const combinedLower =
    1 - rates.reduce((acc, r) => acc * (1 - r.lower), 1);
  const combinedUpper =
    1 - rates.reduce((acc, r) => acc * (1 - r.upper), 1);

  return { lower: combinedLower, upper: combinedUpper };
}

export const TECH_COLUMNS = [
  { title: '技术名称', dataIndex: 'name', key: 'name', width: 220, fixed: 'left' as const },
  { title: '技术分类', dataIndex: 'category', key: 'category', width: 160 },
  { title: '作用系统', dataIndex: 'affectedSystems', key: 'affectedSystems', width: 200 },
  { title: '能耗种类', dataIndex: 'energyType', key: 'energyType', width: 100 },
  { title: '基准节能率', dataIndex: 'energySavingRate', key: 'energySavingRate', width: 130 },
  { title: '固定投资指标', dataIndex: 'investmentIndex', key: 'investmentIndex', width: 200 },
  { title: '年运行能耗', dataIndex: 'annualEnergy', key: 'annualEnergy', width: 180 },
  { title: '投资回收期', dataIndex: 'paybackPeriod', key: 'paybackPeriod', width: 110 },
];
