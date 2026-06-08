import type { InvestmentRow, TechInvestment } from '@/shared/stores/projectStore';

export const INVESTMENT_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '<1000', value: 'lt1000' },
  { label: '1000~2000', value: '1000-2000' },
  { label: '2000~5000', value: '2000-5000' },
  { label: '≥5000', value: 'gte5000' },
];

export function filterByInvestmentRange(val: number, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'lt1000') return val < 1000;
  if (filter === '1000-2000') return val >= 1000 && val < 2000;
  if (filter === '2000-5000') return val >= 2000 && val < 5000;
  if (filter === 'gte5000') return val >= 5000;
  return true;
}

export function createDefaultRows(): InvestmentRow[] {
  return [
    { id: crypto.randomUUID(), name: '', specification: '', quantity: 1, unit: '台', unitPrice: 0, subtotal: 0, remark: '' },
  ];
}

export function calcRowSubtotal(row: InvestmentRow): number {
  return row.quantity * row.unitPrice;
}

export function calcTotal(rows: InvestmentRow[]): number {
  return rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
}

export function createDefaultInvestment(techId: string, projectId: string): TechInvestment {
  return {
    techId,
    projectId,
    author: '',
    fillDate: '',
    subsidyMode: '',
    investmentRatio: 0,
    subsidyIndex: 0,
    subsidyIndexUnit: '',
    systemCapacity: 0,
    systemCapacityUnit: '',
    equipment: createDefaultRows(),
    materials: createDefaultRows(),
    installation: createDefaultRows(),
    maintenance: createDefaultRows(),
    fixedInvestment: 0,
    initialInvestment: 0,
    maintenanceCost: 0,
    subsidyRate: '',
    subsidyAmount: 0,
    accountingStatus: 'pending',
    basicInfoCompleted: false,
  };
}

export interface InvestmentTableRow {
  techId: string;
  techName: string;
  fixedInvestment: number;
  subsidyRate: string;
  subsidyAmount: number;
  accountingStatus: 'pending' | 'completed';
  basicInfoCompleted: boolean;
}
