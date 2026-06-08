import type { TechEntry } from '@/data/materials';

export const CATEGORY_LABELS: Record<string, string> = {
  efficiency: '能源高效利用',
  intelligent: '智能控制及优化',
  renewable: '可再生能源利用',
};

export const CATEGORY_COLORS: Record<string, string> = {
  efficiency: '#1677ff',
  intelligent: '#8b5cf6',
  renewable: '#22c55e',
};

export const RATING_LABELS: Record<number, string> = {
  3: '★★★ 强烈推荐',
  2: '★★ 一般推荐',
  1: '★ 谨慎推荐',
};

export const RATING_STARS: Record<number, string> = {
  3: '★★★',
  2: '★★',
  1: '★',
};

export const CATEGORY_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '能源高效利用', value: 'efficiency' },
  { label: '智能控制及优化', value: 'intelligent' },
  { label: '可再生能源利用', value: 'renewable' },
];

export const RATING_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '★★★', value: 3 },
  { label: '★★', value: 2 },
  { label: '★', value: 1 },
];

export function parseRateRange(
  rateStr: string
): { lower: number; upper: number } | null {
  const match = rateStr.match(/(\d+(?:\.\d+)?)\s*%\s*~\s*(\d+(?:\.\d+)?)\s*%/);
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
  { title: '技术名称', dataIndex: 'name', key: 'name', width: 180, fixed: 'left' as const },
  { title: '技术分类', dataIndex: 'category', key: 'category', width: 130 },
  { title: '适配度得分', dataIndex: 'score', key: 'score', width: 120 },
  { title: '推荐等级', dataIndex: 'rating', key: 'rating', width: 130 },
  { title: '基准节能率', dataIndex: 'energySavingRate', key: 'energySavingRate', width: 120 },
  { title: '固定投资指标', dataIndex: 'investmentIndex', key: 'investmentIndex', width: 160 },
  { title: '年运行能耗', dataIndex: 'annualEnergy', key: 'annualEnergy', width: 150 },
  { title: '投资回收期', dataIndex: 'paybackPeriod', key: 'paybackPeriod', width: 110 },
];