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
  return inv.equipment.reduce((s, r) => s + r.subtotal, 0)
    + inv.materials.reduce((s, r) => s + r.subtotal, 0)
    + inv.installation.reduce((s, r) => s + r.subtotal, 0);
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
  return inv.equipment.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0)
    + inv.materials.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

/** 安装调试（仅选中行） */
export function calcInstallationFromSelected(inv: TechInvestment): number {
  return inv.installation.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

/** 运维费（仅选中行） */
export function calcMaintenanceFromSelected(inv: TechInvestment): number {
  return inv.maintenance.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

/** 固定投资 = 初投资 + 安装 + 运维费（仅选中行） */
export function calcFixedFromSelected(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.fixedInvestment > 0) return inv.fixedInvestment;
  return calcInitialFromSelected(inv) + calcInstallationFromSelected(inv) + calcMaintenanceFromSelected(inv);
}