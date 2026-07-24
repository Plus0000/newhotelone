import type { InvestmentRow, TechInvestment } from '@/shared/stores/projectStore';

/** 单行小计 */
export function calcRowSubtotal(row: InvestmentRow): number {
  return row.quantity * row.unitPrice;
}

/** 行数组总计 */
export function calcTotal(rows: InvestmentRow[]): number {
  return rows.reduce((s, r) => s + r.subtotal, 0);
}

/** 初投资 = 设备 + 材料 + 安装（全部行，不受 selected 过滤） */
export function calcInitialFromAll(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed') return inv.initialInvestment ?? 0;
  return (
    inv.equipment.reduce((s, r) => s + r.subtotal, 0) +
    inv.materials.reduce((s, r) => s + r.subtotal, 0) +
    inv.installation.reduce((s, r) => s + r.subtotal, 0)
  );
}

/** 运维费（全部行） */
export function calcMaintenanceFromAll(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed') return inv.maintenanceCost ?? 0;
  return inv.maintenance.reduce((s, r) => s + r.subtotal, 0);
}

/** 固定投资 = 初投资 + 运维费（全部行） */
export function calcFixedFromAll(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.fixedInvestment > 0) return inv.fixedInvestment;
  return calcInitialFromAll(inv) + calcMaintenanceFromAll(inv);
}

/** 初投资 = 设备 + 材料（仅选中行） */
export function calcInitialFromSelected(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.initialInvestment != null) {
    // initialInvestment = 设备+材料+安装，减去安装费得到纯设备+材料
    const install = inv.installation.filter((r) => r.selected).reduce((s, r) => s + r.subtotal, 0);
    return inv.initialInvestment - install;
  }
  return (
    inv.equipment.filter((r) => r.selected).reduce((s, r) => s + r.subtotal, 0) +
    inv.materials.filter((r) => r.selected).reduce((s, r) => s + r.subtotal, 0)
  );
}

/** 安装调试（仅选中行） */
export function calcInstallationFromSelected(inv: TechInvestment): number {
  return inv.installation.filter((r) => r.selected).reduce((s, r) => s + r.subtotal, 0);
}

/** 运维费（仅选中行） */
export function calcMaintenanceFromSelected(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.maintenanceCost != null)
    return inv.maintenanceCost;
  return inv.maintenance.filter((r) => r.selected).reduce((s, r) => s + r.subtotal, 0);
}

/** 固定投资 = 初投资 + 安装 + 运维费（仅选中行） */
export function calcFixedFromSelected(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.fixedInvestment > 0) return inv.fixedInvestment;
  return (
    calcInitialFromSelected(inv) +
    calcInstallationFromSelected(inv) +
    calcMaintenanceFromSelected(inv)
  );
}

/**
 * 容量补贴：把 systemCapacity 换算到与 subsidyIndexUnit 相同的单位
 * 单位组合：kW/MW（功率）、kWh/MWh（储能）、t/h（吨/时）、㎡（面积）
 * 1 MW = 1000 kW, 1 MWh = 1000 kWh；其他单位不换算
 */
export function normalizeCapacityForSubsidy(
  capacity: number,
  capUnit: string,
  idxUnit: string,
): number {
  if (!capUnit || !idxUnit || capUnit === idxUnit) return capacity;
  if (capUnit === 'kW' && idxUnit === 'MW') return capacity / 1000;
  if (capUnit === 'MW' && idxUnit === 'kW') return capacity * 1000;
  if (capUnit === 'kWh' && idxUnit === 'MWh') return capacity / 1000;
  if (capUnit === 'MWh' && idxUnit === 'kWh') return capacity * 1000;
  return capacity;
}
