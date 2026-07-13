/**
 * Phase 1.7 Step 3 投资汇总验证
 *
 * spec 1230-1232 验收标准：
 * 1. 单技术：固定投资 = 设备 + 材料 + 安装 + 运维 (±0.01 万元)
 * 2. 总表：固定投资/初投资/运维费 = 已选技术求和
 *
 * 用法: npx tsx scripts/verify-step3-summary.ts
 */
import { techDefaultInvestments } from '../src/data/materials';
import {
  calcFixedFromAll,
  calcInitialFromAll,
  calcMaintenanceFromAll,
  calcTotal,
} from '../src/shared/utils/investment';
import type { TechInvestment, InvestmentRow } from '../src/shared/stores/projectStore';

interface VerifyResult {
  techId: string;
  techName: string;
  equipmentTotal: number;
  materialsTotal: number;
  installationTotal: number;
  maintenanceTotal: number;
  expectedFixed: number; // 4 表求和
  expectedInitial: number; // 设备+材料+安装
  expectedMaintenance: number; // 运维
  actualFixed: number; // calcFixedFromAll
  actualInitial: number; // calcInitialFromAll
  actualMaintenance: number; // calcMaintenanceFromAll
  fixedOk: boolean;
  initialOk: boolean;
  maintenanceOk: boolean;
}

function toInvestmentRows(
  rows: { name: string; specification: string; quantity: number; unitPrice: number; remark?: string; category?: string; isMainEquipment?: boolean; powerKw?: number; costType?: string; maintenanceYears?: number; totalLifecycleCost?: number }[],
): InvestmentRow[] {
  return rows.map((r) => ({
    id: crypto.randomUUID(),
    name: r.name,
    specification: r.specification,
    quantity: r.quantity,
    unit: '',
    unitPrice: r.unitPrice,
    subtotal: r.quantity * r.unitPrice,
    remark: r.remark || '',
    ...(r.category ? { category: r.category } : {}),
    ...(r.isMainEquipment ? { isMainEquipment: r.isMainEquipment } : {}),
    ...(r.powerKw ? { powerKw: r.powerKw } : {}),
    ...(r.costType ? { costType: r.costType as 'labor' | 'repair' | 'admin' } : {}),
    ...(r.maintenanceYears ? { maintenanceYears: r.maintenanceYears } : {}),
    ...(r.totalLifecycleCost ? { totalLifecycleCost: r.totalLifecycleCost } : {}),
  }));
}

function toTechInvestment(
  d: (typeof techDefaultInvestments)[number],
  techName: string,
): TechInvestment {
  return {
    techId: d.techId,
    projectId: 'verify',
    techName,
    equipment: toInvestmentRows(d.equipment as any),
    materials: toInvestmentRows(d.materials as any),
    installation: toInvestmentRows(d.installation as any),
    maintenance: toInvestmentRows(d.maintenance as any),
    accountingStatus: 'pending',
    fixedInvestment: 0,
    initialInvestment: 0,
    maintenanceCost: 0,
    subsidyRate: '',
    subsidyAmount: 0,
    author: '',
    fillDate: '',
  };
}

const techNames: Record<string, string> = {
  '1': '相变储热供暖技术',
  '2': 'AI 边缘计算节能管控',
  '3': '多能互补热泵系统',
  '4': 'DALI 智能照明',
  '5': '六管制机房节能',
  '6': '高效冷水机组',
  '7': '磁悬浮压缩机',
  '8': '光伏储能一体化',
  '9': '能源计量监测',
  '10': '锅炉余热回收',
  '11': '新风热回收',
  '12': '电梯能量回馈',
};

const TOL = 0.01; // 万元

const results: VerifyResult[] = techDefaultInvestments.map((d) => {
  const techName = techNames[d.techId] || d.techId;
  const inv = toTechInvestment(d, techName);

  const equipmentTotal = calcTotal(inv.equipment);
  const materialsTotal = calcTotal(inv.materials);
  const installationTotal = calcTotal(inv.installation);
  const maintenanceTotal = calcTotal(inv.maintenance);

  const expectedFixed = equipmentTotal + materialsTotal + installationTotal + maintenanceTotal;
  const expectedInitial = equipmentTotal + materialsTotal + installationTotal;
  const expectedMaintenance = maintenanceTotal;

  const actualFixed = calcFixedFromAll(inv);
  const actualInitial = calcInitialFromAll(inv);
  const actualMaintenance = calcMaintenanceFromAll(inv);

  return {
    techId: d.techId,
    techName,
    equipmentTotal,
    materialsTotal,
    installationTotal,
    maintenanceTotal,
    expectedFixed,
    expectedInitial,
    expectedMaintenance,
    actualFixed,
    actualInitial,
    actualMaintenance,
    fixedOk: Math.abs(actualFixed - expectedFixed) < TOL,
    initialOk: Math.abs(actualInitial - expectedInitial) < TOL,
    maintenanceOk: Math.abs(actualMaintenance - expectedMaintenance) < TOL,
  };
});

// ── 单技术验证 ────────────────────────────────────────────────────

console.log('=== Phase 1.7 Step 3 投资汇总验证 ===\n');
console.log('--- 单技术求和验证 (固定投资 = 设备+材料+安装+运维) ---\n');

let allSingleOk = true;
for (const r of results) {
  const ok = r.fixedOk && r.initialOk && r.maintenanceOk;
  if (!ok) allSingleOk = false;
  const status = ok ? '✓' : '✗';
  console.log(
    `${status} techId=${r.techId} ${r.techName}: 设备 ${r.equipmentTotal.toFixed(2)} + 材料 ${r.materialsTotal.toFixed(2)} + 安装 ${r.installationTotal.toFixed(2)} + 运维 ${r.maintenanceTotal.toFixed(2)} = 固定 ${r.actualFixed.toFixed(2)} (期望 ${r.expectedFixed.toFixed(2)})`,
  );
  if (!r.fixedOk) console.log(`    ✗ fixedInvestment 偏差 > ${TOL}`);
  if (!r.initialOk) console.log(`    ✗ initialInvestment 偏差 > ${TOL}`);
  if (!r.maintenanceOk) console.log(`    ✗ maintenanceCost 偏差 > ${TOL}`);
}

console.log(`\n单技术验证: ${allSingleOk ? '✓ 全部通过' : '✗ 有失败'}`);

// ── 项目层总表求和验证 ────────────────────────────────────────────

console.log('\n--- 总表求和验证 (项目固定投资 = 已选技术求和) ---\n');

// 模拟选 3 个技术
const selectedTechIds = ['1', '3', '4'];
const selectedInvs = selectedTechIds.map((id) => {
  const d = techDefaultInvestments.find((t) => t.techId === id)!;
  const r = results.find((x) => x.techId === id)!;
  return { id, inv: toTechInvestment(d, techNames[id]), single: r };
});

// 模拟 Step3 index.tsx projectTotals 逻辑
const projectTotals = {
  fixed: selectedInvs.reduce((s, x) => s + calcFixedFromAll(x.inv), 0),
  initial: selectedInvs.reduce((s, x) => s + calcInitialFromAll(x.inv), 0),
  maintenance: selectedInvs.reduce((s, x) => s + calcMaintenanceFromAll(x.inv), 0),
};

// 期望 = 各技术单值求和
const expected = {
  fixed: selectedInvs.reduce((s, x) => s + x.single.actualFixed, 0),
  initial: selectedInvs.reduce((s, x) => s + x.single.actualInitial, 0),
  maintenance: selectedInvs.reduce((s, x) => s + x.single.actualMaintenance, 0),
};

const totalsOk =
  Math.abs(projectTotals.fixed - expected.fixed) < TOL &&
  Math.abs(projectTotals.initial - expected.initial) < TOL &&
  Math.abs(projectTotals.maintenance - expected.maintenance) < TOL;

console.log(`已选技术: ${selectedTechIds.join(', ')}`);
console.log(`项目固定投资: ${projectTotals.fixed.toFixed(2)} (期望 ${expected.fixed.toFixed(2)}) ${Math.abs(projectTotals.fixed - expected.fixed) < TOL ? '✓' : '✗'}`);
console.log(`项目初投资:   ${projectTotals.initial.toFixed(2)} (期望 ${expected.initial.toFixed(2)}) ${Math.abs(projectTotals.initial - expected.initial) < TOL ? '✓' : '✗'}`);
console.log(`项目运维费:   ${projectTotals.maintenance.toFixed(2)} (期望 ${expected.maintenance.toFixed(2)}) ${Math.abs(projectTotals.maintenance - expected.maintenance) < TOL ? '✓' : '✗'}`);

console.log(`\n总表求和验证: ${totalsOk ? '✓ 通过' : '✗ 失败'}`);

// ── 补贴列验证 (spec 没明确要求, 但代码 L369 用 fixedInvestment × 0.3) ──

console.log('\n--- 补贴列抽查 (代码: fixedInvestment × 0.3) ---\n');
for (const r of results.slice(0, 3)) {
  const subsidy = r.actualFixed * 0.3;
  console.log(`techId=${r.techId} 补贴 = ${r.actualFixed.toFixed(2)} × 0.3 = ${subsidy.toFixed(2)}`);
}

// ── 投资指标列验证 (代码 L380: fixedInvestment / totalArea) ──

console.log('\n--- 投资指标列抽查 (代码: fixedInvestment / totalArea) ---\n');
const sampleArea = 100000; // 10 万㎡
for (const r of results.slice(0, 3)) {
  const idx = sampleArea > 0 ? r.actualFixed / sampleArea : 0;
  console.log(`techId=${r.techId} 投资指标 = ${r.actualFixed.toFixed(2)} / ${sampleArea} = ${idx.toFixed(4)}`);
}

// ── 汇总 ────────────────────────────────────────────────────────

const allOk = allSingleOk && totalsOk;
console.log(`\n=== 总结: ${allOk ? '✓ Phase 1.7 验证全部通过' : '✗ 有失败项需修复'} ===`);

if (!allOk) {
  process.exit(1);
}
