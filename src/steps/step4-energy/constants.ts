import type { Step4TechData } from '@/shared/stores/projectStore';

export const INVESTMENT_MODE_OPTIONS = [
  { label: 'EMC（合同能源管理）', value: 'EMC' },
  { label: 'BOT（建设-运营-移交）', value: 'BOT' },
  { label: '其他', value: 'other' },
];

export const INVESTMENT_MODE_LABEL: Record<string, string> = {
  EMC: 'EMC',
  BOT: 'BOT',
  other: '其他',
};

export const ACCOUNTING_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '已核算', value: 'completed' },
  { label: '待核算', value: 'pending' },
];

export const CUSTODY_YEAR_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '5年', value: 5 },
  { label: '8年', value: 8 },
  { label: '10年', value: 10 },
  { label: '15年', value: 15 },
  { label: '20年', value: 20 },
];

// ── 辅助决策 ────────────────────────────────────────────────────────────

export const DECISION_INVESTMENT_MODE_OPTIONS = [
  { label: 'EMC-节能效益分享型', value: 'EMC-profit' },
  { label: 'EMC-节能量保证型', value: 'EMC-guarantee' },
  { label: 'EMC-能源费用托管型', value: 'EMC-trust' },
  { label: 'BOT', value: 'BOT' },
  { label: 'PPP', value: 'PPP' },
];

export const DECISION_INVESTMENT_MODE_LABEL: Record<string, string> = {
  'EMC': 'EMC',
  'EMC-profit': 'EMC-节能效益分享型',
  'EMC-guarantee': 'EMC-节能量保证型',
  'EMC-trust': 'EMC-能源费用托管型',
  'BOT': 'BOT',
  'PPP': 'PPP',
};

export const DECISION_ACCOUNTING_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '已核算', value: 'completed' },
  { label: '待核算', value: 'pending' },
  { label: '已出报告', value: 'reported' },
];

export const DECISION_ACCOUNTING_LABEL: Record<string, string> = {
  completed: '已核算',
  pending: '待核算',
  reported: '已出报告',
};

export const OPERATING_PERIOD_OPTIONS = Array.from({ length: 18 }, (_, i) => ({
  label: `${i + 3}年`,
  value: i + 3,
}));

export const STATIC_PAYBACK_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  label: `${i + 1}年`,
  value: i + 1,
}));

export function createDefaultDecisionData() {
  return {
    investmentMode: '' as const,
    operatingPeriod: 0,
    avgOperatingIncome: 0,
    avgNetProfit: 0,
    staticPaybackPeriod: 0,
    dynamicPaybackPeriod: 0,
    totalInvestmentReturn: 0,
    accountingStatus: 'pending' as const,

    author: '',
    fillDate: '',

    totalFixedInvestment: 0,
    initialInvestment: 0,
    installationCost: 0,
    custodialOperationFee: 0,
    maintenanceCost: 0,
    energyCost: 0,
    repairCost: 0,
    laborCost: 0,
    adminCost: 0,
    annualEnergySaving: 0,

    constructionMonths: 0,
    fundingRatio: 0,
    depreciationYears: 0,
    residualRate: 0,
    techServiceFee: 0,
    telecomFee: 0,
    managementFee: 0,
    otherTax: 0,
    loanPeriod: 0,
    gracePeriod: 0,
    repaymentPeriod: 0,
    loanRate: 0,
    initialProfitShare1: 0,
    initialProfitShare2: 0,
    changeYear: 0,
    changeProfitShare1: 0,
    changeProfitShare2: 0,
  };
}

export function createDefaultTechData(techId: string): Step4TechData {
  return {
    techId,
    investmentMode: '',
    custodyYears: 0,
    savingEnergyRun: 0,
    savingCostRun: 0,
    originalEnergyRun: 0,
    originalCostRun: 0,
    itemSavingRate: 0,
    comprehensiveRate: 0,
  };
}
