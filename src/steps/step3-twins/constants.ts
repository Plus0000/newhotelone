import type { TechInvestment, InvestmentRow } from '@/shared/stores/projectStore';

function createDefaultRows(): InvestmentRow[] {
  return [
    { id: crypto.randomUUID(), name: '', specification: '', quantity: 1, unit: '台', unitPrice: 0, subtotal: 0, remark: '' },
  ];
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
