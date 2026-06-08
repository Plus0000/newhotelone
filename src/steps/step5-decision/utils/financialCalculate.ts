/**
 * Step 5 财务计算引擎
 *
 * 纯函数模块，输入 DecisionProjectData 参数，输出七张财务测算表
 * 计算逻辑参照 投资决策表.xlsx
 */

import type {
  DecisionProjectData,
  DecisionCalculationResults,
  CalcSummaryRow,
  CalcLoanScheduleRow,
  CalcTotalCostRow,
  CalcProfitRow,
  CalcCashflowRow,
} from '@/shared/stores/projectStore';

// ── 常量 ──────────────────────────────────────────────────────────────

const VAT_RATE_SERVICE = 0.06;   // 运维服务销项税率
const VAT_RATE_EQUIP = 0.13;     // 设备购置增值税率
const VAT_RATE_CONSTRUCTION = 0.03; // 工程费增值税率
const VAT_RATE_ENERGY = 0.09;    // 能源费增值税率
const VAT_RATE_MAINTENANCE = 0.03; // 维保增值税率
const SURCHARGE_RATE = 0.12;     // 城建税+教育费附加
const INCOME_TAX_RATE = 0.15;    // 所得税率
const BENCHMARK_IRR = 0.12;      // 财务基准内部收益率（税前）
// const BENCHMARK_IRR_POSTTAX = 0.10; // 财务基准内部收益率（税后）
const EQUITY_BENCHMARK = 0.06;   // 资本金基准收益率

// ── 工具函数 ──────────────────────────────────────────────────────────

/** 格式化数字到 N 位小数 */
function round(v: number, d = 4): number {
  return Math.round(v * 10 ** d) / 10 ** d;
}

/** 等额本金还款计算 */
function calcLoanSchedule(
  loanAmount: number,
  annualRate: number,
  constructionYears: number,
  repaymentPeriod: number,
): CalcLoanScheduleRow[] {
  const rows: CalcLoanScheduleRow[] = [];
  const rate = annualRate;

  // 建设期利息
  const constructionInterest = loanAmount * rate * constructionYears;
  const totalLoan = loanAmount + constructionInterest; // 第1年年初余额

  // 建设期（第0年）
  rows.push({
    year: 0,
    periodLabel: '建设期',
    beginningBalance: 0,
    newLoan: loanAmount,
    accruedInterest: round(constructionInterest),
    totalPayment: 0,
    principalRepayment: 0,
    interestPayment: 0,
    endingBalance: round(totalLoan),
  });

  const annualPrincipal = round(totalLoan / repaymentPeriod, 6);

  for (let y = 1; y <= repaymentPeriod; y++) {
    const balanceBOY = rows[y - 1].endingBalance;
    const interest = balanceBOY * rate;
    const principal = y === repaymentPeriod ? balanceBOY : (balanceBOY >= annualPrincipal ? annualPrincipal : balanceBOY);
    const payment = principal + interest;
    const balanceEOY = balanceBOY - principal;

    rows.push({
      year: y,
      periodLabel: `第${y}年`,
      beginningBalance: round(balanceBOY),
      newLoan: 0,
      accruedInterest: round(interest),
      totalPayment: round(payment),
      principalRepayment: round(principal),
      interestPayment: round(interest),
      endingBalance: round(Math.max(0, balanceEOY)),
    });
  }

  return rows;
}

/** 生成总成本费用表 */
function calcTotalCost(
  energyCost: number,       // 原能源费（含税）
  repairCost: number,       // 维保费用（含税）
  laborCost: number,        // 运维人工费用
  adminCost: number,        // 管理费用
  insuranceCost: number,    // 年均保险费
  depreciation: number,     // 年折旧费
  loanSchedule: CalcLoanScheduleRow[],
  operatingPeriod: number,
): CalcTotalCostRow[] {
  const rows: CalcTotalCostRow[] = [];

  // 不含税成本
  const energyCostExTax = energyCost / (1 + VAT_RATE_ENERGY);
  const repairCostExTax = repairCost / (1 + VAT_RATE_MAINTENANCE);

  for (let y = 1; y <= operatingPeriod; y++) {
    const ls = loanSchedule.find((r) => r.year === y);
    const interestExpense = ls ? ls.interestPayment : 0;

    const operatingCost = energyCostExTax + repairCostExTax + laborCost + adminCost + insuranceCost;

    rows.push({
      year: y,
      periodLabel: `第${y}年`,
      energyCost: round(energyCostExTax),
      maintenanceCost: round(repairCostExTax),
      laborCost: round(laborCost),
      adminCost: round(adminCost),
      insuranceCost: round(insuranceCost),
      operatingCost: round(operatingCost),
      depreciation: round(depreciation),
      amortization: 0,
      interestExpense: round(interestExpense),
      totalCost: round(operatingCost + depreciation + interestExpense),
    });
  }

  return rows;
}

/** 生成利润及利润分配表 */
function calcProfit(
  revenueExTax: number,          // 不含税运维收入
  totalCostRows: CalcTotalCostRow[],
  subsidy: number,
  inputTaxAmount: number,        // 总可抵扣进项税额
): CalcProfitRow[] {
  const rows: CalcProfitRow[] = [];

  for (let y = 1; y <= totalCostRows.length; y++) {
    const tc = totalCostRows[y - 1];
    const revenue = revenueExTax;

    // 销项税
    const outputTax = revenue * VAT_RATE_SERVICE;
    // 进项税（运营期每年分摊：能源费进项 + 维保进项）
    const inputTaxOperating = tc.energyCost * VAT_RATE_ENERGY + tc.maintenanceCost * VAT_RATE_MAINTENANCE;
    // 固定资产进项按运营期分摊
    const inputTaxFixed = inputTaxAmount / totalCostRows.length;
    const inputTax = inputTaxOperating + inputTaxFixed;

    const vatPayable = Math.max(0, outputTax - inputTax);
    const taxSurcharge = vatPayable * SURCHARGE_RATE;
    const totalCost = tc.totalCost;
    const profitTotal = revenue - taxSurcharge - totalCost + subsidy;
    const incomeTax = profitTotal > 0 ? profitTotal * INCOME_TAX_RATE : 0;
    const netProfit = profitTotal - incomeTax;
    // EBIT = 利润总额 + 利息支出
    const ebit = profitTotal + tc.interestExpense;
    // EBITDA = EBIT + 折旧 + 摊销
    const ebitda = ebit + tc.depreciation + 0; // 摊销为0

    rows.push({
      year: y,
      periodLabel: `第${y}年`,
      revenue: round(revenue),
      taxSurcharge: round(taxSurcharge),
      totalCost: round(totalCost),
      subsidy: round(subsidy),
      profitTotal: round(profitTotal),
      incomeTax: round(incomeTax),
      netProfit: round(netProfit),
      ebit: round(ebit),
      ebitda: round(ebitda),
    });
  }

  return rows;
}

/** 生成项目投资现金流量表 */
function calcProjectCashflow(
  investment: number,              // 建设投资
  profitRows: CalcProfitRow[],
  totalCostRows: CalcTotalCostRow[],
  constructionYears: number,
  benchmarkRate: number,
): CalcCashflowRow[] {
  const rows: CalcCashflowRow[] = [];
  const operatingPeriod = profitRows.length;

  // 建设期
  rows.push({
    year: 0,
    periodLabel: '建设期',
    cashInflow: 0,
    cashOutflow: round(investment),
    netCashflow: round(-investment),
    discountedCashflow: round(-investment / Math.pow(1 + benchmarkRate, 0 + constructionYears / 2)),
    cumulativeDiscounted: round(-investment / Math.pow(1 + benchmarkRate, 0 + constructionYears / 2)),
  });

  for (let y = 1; y <= operatingPeriod; y++) {
    const profit = profitRows[y - 1];
    const tc = totalCostRows[y - 1];

    // 现金流入 = 收入（含税）+ 销项税
    const inflow = profit.revenue + profit.revenue * VAT_RATE_SERVICE + profit.subsidy;
    // 现金流出 = 含税经营成本 + 增值税净额 + 税金及附加 + 所得税
    const energyInputVAT = tc.energyCost * VAT_RATE_ENERGY;
    const repairInputVAT = tc.maintenanceCost * VAT_RATE_MAINTENANCE;
    // profit.taxSurcharge = vatPayable × 12%，反推 vatPayable
    const netVATPayable = profit.taxSurcharge > 0 ? profit.taxSurcharge / SURCHARGE_RATE : 0;
    const outflow = tc.operatingCost + energyInputVAT + repairInputVAT + netVATPayable + profit.taxSurcharge + profit.incomeTax;

    const netCF = inflow - outflow;

    // 折现：建设期 0.5年的偏移
    const discountYear = y + constructionYears / 2;
    const discountedCF = netCF / Math.pow(1 + benchmarkRate, discountYear);

    const prevCum = rows[rows.length - 1].cumulativeDiscounted;
    const cumulative = prevCum + discountedCF;

    rows.push({
      year: y,
      periodLabel: `第${y}年`,
      cashInflow: round(inflow),
      cashOutflow: round(outflow),
      netCashflow: round(netCF),
      discountedCashflow: round(discountedCF),
      cumulativeDiscounted: round(cumulative),
    });
  }

  return rows;
}

/** 生成项目资本金现金流量表 */
function calcEquityCashflow(
  equityInvestment: number,
  profitRows: CalcProfitRow[],
  totalCostRows: CalcTotalCostRow[],
  loanSchedule: CalcLoanScheduleRow[],
  constructionYears: number,
  benchmarkRate: number,
): CalcCashflowRow[] {
  const rows: CalcCashflowRow[] = [];

  // 建设期
  rows.push({
    year: 0,
    periodLabel: '建设期',
    cashInflow: 0,
    cashOutflow: round(equityInvestment),
    netCashflow: round(-equityInvestment),
    discountedCashflow: round(-equityInvestment / Math.pow(1 + benchmarkRate, constructionYears / 2)),
    cumulativeDiscounted: round(-equityInvestment / Math.pow(1 + benchmarkRate, constructionYears / 2)),
  });

  for (let y = 1; y <= profitRows.length; y++) {
    const profit = profitRows[y - 1];
    const tc = totalCostRows[y - 1];
    const ls = loanSchedule.find((r) => r.year === y);

    // 资本金现金流入
    const inflow = profit.revenue + profit.revenue * VAT_RATE_SERVICE + profit.subsidy;
    // 现金流出 = 含税经营成本 + 还本 + 付息 + 增值税净额 + 税金及附加 + 所得税
    const principal = ls ? ls.principalRepayment : 0;
    const interest = ls ? ls.interestPayment : 0;
    const energyInputVAT = tc.energyCost * VAT_RATE_ENERGY;
    const repairInputVAT = tc.maintenanceCost * VAT_RATE_MAINTENANCE;
    const netVATPayable = profit.taxSurcharge > 0 ? profit.taxSurcharge / SURCHARGE_RATE : 0;
    const outflow = tc.operatingCost + energyInputVAT + repairInputVAT + netVATPayable + principal + interest + profit.taxSurcharge + profit.incomeTax;

    const netCF = inflow - outflow;
    const discountYear = y + constructionYears / 2;
    const discountedCF = netCF / Math.pow(1 + benchmarkRate, discountYear);
    const prevCum = rows[rows.length - 1].cumulativeDiscounted;
    const cumulative = prevCum + discountedCF;

    rows.push({
      year: y,
      periodLabel: `第${y}年`,
      cashInflow: round(inflow),
      cashOutflow: round(outflow),
      netCashflow: round(netCF),
      discountedCashflow: round(discountedCF),
      cumulativeDiscounted: round(cumulative),
    });
  }

  return rows;
}

/** 计算 IRR（牛顿迭代法） */
function calcIRR(cashflows: number[], years: number[], guess = 0.1): number {
  const MAX_ITER = 1000;
  const TOLERANCE = 1e-7;

  let rate = guess;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let i = 0; i < cashflows.length; i++) {
      const t = years[i];
      npv += cashflows[i] / Math.pow(1 + rate, t);
      dnpv += -t * cashflows[i] / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < TOLERANCE) return round(newRate, 6);
    rate = newRate;
  }
  return round(rate, 6);
}

/** 计算静态回收期 */
function calcStaticPayback(cashflows: number[], constructionYears: number): number {
  let cumulative = 0;
  for (let i = 0; i < cashflows.length; i++) {
    cumulative += cashflows[i];
    if (cumulative >= 0) {
      const prevCum = cumulative - cashflows[i];
      const fraction = prevCum < 0 ? Math.abs(prevCum) / cashflows[i] : 0;
      // i-1: cashflows[0] 为建设期（负投资），i=1 起才是运营期第1年
      return round(i - 1 + fraction + constructionYears, 4);
    }
  }
  return 999;
}

/** 计算动态回收期 */
function calcDynamicPayback(
  netCashflows: number[],
  years: number[],
  rate: number,
  constructionYears: number,
): number {
  let cumulativeDiscounted = 0;
  for (let i = 0; i < netCashflows.length; i++) {
    const discounted = netCashflows[i] / Math.pow(1 + rate, years[i]);
    cumulativeDiscounted += discounted;
    if (cumulativeDiscounted >= 0) {
      const prevDiscounted = cumulativeDiscounted - discounted;
      const fraction = prevDiscounted < 0 ? Math.abs(prevDiscounted) / discounted : 0;
      return round(i + fraction + constructionYears, 4);
    }
  }
  return 999;
}

/** 计算总投资收益率 ROI = 年均净利润 / 总投资 */
function calcROI(annualAvgNetProfit: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return round((annualAvgNetProfit / totalInvestment) * 100, 4);
}

// ── 主计算入口 ────────────────────────────────────────────────────────

export function financialCalculate(data: DecisionProjectData): DecisionCalculationResults {
  // 1. 基础参数
  const investment = data.totalFixedInvestment > 0 ? data.totalFixedInvestment
    : data.initialInvestment + data.installationCost; // 建设投资

  const constructionYears = (data.constructionMonths || 6) / 12;
  const annualRate = data.loanRate > 0 ? data.loanRate / 100 : 0.069; // 转换成小数
  const depreciationYears = data.depreciationYears || data.operatingPeriod || 8;
  const residualRate = (data.residualRate || 0) / 100;
  const operatingPeriod = data.operatingPeriod || 8;
  const repaymentPeriod = data.repaymentPeriod || operatingPeriod;
  const custodialFee = data.custodialOperationFee;
  const energyCost = data.energyCost;
  const repairCost = data.repairCost;
  const laborCost = data.laborCost;
  const adminCost = data.adminCost;

  // 不含税运维收入
  const revenueExTax = custodialFee / (1 + VAT_RATE_SERVICE);

  // 2. 借款还本付息
  const loanAmount = investment * (1 - (data.fundingRatio || 0) / 100); // 扣除自有资金后实际贷款
  const loanSchedule = calcLoanSchedule(loanAmount, annualRate, constructionYears, repaymentPeriod);

  // 3. 折旧
  // 固定资产原值 = 设备购置费(不含税) + 安装调试(不含税) + 建设期利息
  const equipExTax = (data.initialInvestment || 0) / (1 + VAT_RATE_EQUIP);
  const installExTax = (data.installationCost || 0) / (1 + VAT_RATE_CONSTRUCTION);
  const constructInterest = loanSchedule[0]?.accruedInterest || 0;
  const fixedAssetBase = equipExTax + installExTax + constructInterest;
  const annualDepreciation = fixedAssetBase > 0
    ? fixedAssetBase * (1 - residualRate) / depreciationYears
    : 0;

  // 可抵扣设备进项税
  const inputTaxEquip = (data.initialInvestment || 0) / (1 + VAT_RATE_EQUIP) * VAT_RATE_EQUIP;

  // 4. 总成本费用表
  const insuranceCost = 0; // 简化处理
  const totalCost = calcTotalCost(
    energyCost, repairCost, laborCost, adminCost,
    insuranceCost, annualDepreciation, loanSchedule, operatingPeriod,
  );

  // 5. 利润及利润分配表
  const profit = calcProfit(
    revenueExTax, totalCost,
    0, inputTaxEquip,
  );

  // 6. 项目投资现金流量表
  const projectCF = calcProjectCashflow(
    investment, profit, totalCost, constructionYears, BENCHMARK_IRR,
  );

  // 7. 项目资本金现金流量表
  const equityInvestment = investment * (data.fundingRatio || 0) / 100;
  const equityCF = calcEquityCashflow(
    equityInvestment, profit, totalCost, loanSchedule,
    constructionYears, EQUITY_BENCHMARK,
  );

  // 8. 关键指标计算
  // 税后净现金流序列（用于IRR/回收期）
  const postTaxCashflows: number[] = [];
  const cfYears: number[] = [];
  const postTaxNetCashflows: number[] = [];

  // 建设期
  postTaxCashflows.push(-investment);
  cfYears.push(constructionYears / 2);
  postTaxNetCashflows.push(-investment);

  // 税前现金流
  const preTaxCashflows: number[] = [-investment];
  const preTaxYears: number[] = [constructionYears / 2];

  for (let y = 1; y <= operatingPeriod; y++) {
    const p = profit[y - 1];
    const tc = totalCost[y - 1];

    // 税前净现金流 = 现金流入 - 现金流出（不含所得税）
    const preInflow = p.revenue + p.revenue * VAT_RATE_SERVICE + p.subsidy;
    const preOutflow = tc.operatingCost + p.taxSurcharge;
    const preCF = preInflow - preOutflow;
    preTaxCashflows.push(preCF);
    preTaxYears.push(y + constructionYears / 2);

    // 税后净现金流
    const postOutflow = preOutflow + p.incomeTax;
    const postCF = preInflow - postOutflow;
    postTaxCashflows.push(postCF);
    postTaxNetCashflows.push(postCF);
    cfYears.push(y + constructionYears / 2);
  }

  // IRR
  const irrPreTax = calcIRR(preTaxCashflows, preTaxYears) * 100;
  const irrPostTax = calcIRR(postTaxCashflows, cfYears) * 100;

  // 资本金IRR
  const equityCFValues = equityCF.map((r) => r.netCashflow);
  const equityYears = equityCF.map((r => {
    if (r.year === 0) return constructionYears / 2;
    return r.year + constructionYears / 2;
  }));
  const irrEquity = calcIRR(equityCFValues, equityYears) * 100;

  // 回收期
  const staticPayback = calcStaticPayback(postTaxCashflows, constructionYears);
  const dynamicPayback = calcDynamicPayback(postTaxNetCashflows, cfYears.slice(1), BENCHMARK_IRR, constructionYears);

  // NPV (税后，折现率=基准收益率)
  let npv = 0;
  for (let i = 0; i < postTaxCashflows.length; i++) {
    npv += postTaxCashflows[i] / Math.pow(1 + BENCHMARK_IRR, cfYears[i]);
  }
  npv = round(npv, 4);

  // 年均净利润
  const totalNetProfit = profit.reduce((s, r) => s + r.netProfit, 0);
  const annualAvgNetProfit = operatingPeriod > 0 ? totalNetProfit / operatingPeriod : 0;
  const totalProfit = profit.reduce((s, r) => s + r.profitTotal, 0);
  const annualAvgProfit = operatingPeriod > 0 ? totalProfit / operatingPeriod : 0;

  // ROI
  const totalInvestment = investment + constructInterest;
  const roi = calcROI(annualAvgNetProfit, totalInvestment);

  // ROE (资本金净利润率)
  const roe = equityInvestment > 0
    ? round((annualAvgNetProfit / equityInvestment) * 100, 4)
    : 0;

  // 9. 经济指标汇总表
  const summary: CalcSummaryRow[] = [
    { seq: '1', name: '项目总投资', unit: '万元', value: round(totalInvestment, 4), referenceValue: '-', evaluation: '-' },
    { seq: '1.1', name: '建设投资', unit: '万元', value: round(investment, 2), referenceValue: '-', evaluation: '-' },
    { seq: '1.2', name: '建设期利息', unit: '万元', value: round(constructInterest, 4), referenceValue: '-', evaluation: '-' },
    { seq: '2', name: '建设期', unit: '年', value: round(constructionYears, 2), referenceValue: '-', evaluation: '-' },
    { seq: '3', name: '项目运营期', unit: '年', value: operatingPeriod, referenceValue: '-', evaluation: '-' },
    { seq: '4', name: '折旧年限', unit: '年', value: depreciationYears, referenceValue: '-', evaluation: '-' },
    { seq: '5', name: '贷款年利率', unit: '%', value: round(annualRate * 100, 2), referenceValue: '-', evaluation: '-' },
    { seq: '6', name: '贷款偿还期', unit: '年', value: repaymentPeriod, referenceValue: '-', evaluation: '-' },
    { seq: '7', name: '年均运营收入', unit: '万元', value: round(revenueExTax, 4), referenceValue: '-', evaluation: '-' },
    { seq: '8', name: '年均总成本费用', unit: '万元', value: round(totalCost.reduce((s, r) => s + r.totalCost, 0) / operatingPeriod, 4), referenceValue: '-', evaluation: '-' },
    { seq: '9', name: '运营期年均利润总额', unit: '万元', value: round(annualAvgProfit, 4), referenceValue: '10%-20%', evaluation: annualAvgProfit / revenueExTax >= 0.10 && annualAvgProfit / revenueExTax <= 0.20 ? '达标' : '需关注' },
    { seq: '10', name: '运营期年均所得税', unit: '万元', value: round(profit.reduce((s, r) => s + r.incomeTax, 0) / operatingPeriod, 4), referenceValue: '-', evaluation: '-' },
    { seq: '11', name: '运营期年均净利润总额', unit: '万元', value: round(annualAvgNetProfit, 4), referenceValue: '5%-10%', evaluation: annualAvgNetProfit / revenueExTax >= 0.05 && annualAvgNetProfit / revenueExTax <= 0.10 ? '达标' : '需关注' },
    { seq: '12', name: '盈利指标', unit: '', value: '', referenceValue: '', evaluation: '' },
    { seq: '12.1', name: '静态回收期（含建设期）', unit: '年', value: round(staticPayback, 2), referenceValue: '≤5年', evaluation: staticPayback <= 5 ? '达标' : '超出', highlighted: true },
    { seq: '12.2', name: '动态回收期（含建设期）', unit: '年', value: round(dynamicPayback, 2), referenceValue: '≤8年', evaluation: dynamicPayback <= 8 ? '达标' : '超出', highlighted: true },
    { seq: '12.3', name: '财务净现值', unit: '万元', value: round(npv, 4), referenceValue: '≥0', evaluation: npv >= 0 ? '达标' : '不达标', highlighted: true },
    { seq: '12.4', name: 'IRR（税前）', unit: '%', value: round(irrPreTax, 2), referenceValue: '≥12%', evaluation: irrPreTax >= 12 ? '达标' : '不达标', highlighted: true },
    { seq: '12.5', name: 'IRR（税后）', unit: '%', value: round(irrPostTax, 2), referenceValue: '≥10%', evaluation: irrPostTax >= 10 ? '达标' : '不达标', highlighted: true },
    { seq: '12.6', name: '资本金IRR', unit: '%', value: round(irrEquity, 2), referenceValue: '-', evaluation: '-' },
    { seq: '12.7', name: '总投资收益率', unit: '%', value: round(roi, 2), referenceValue: '≥15%', evaluation: roi >= 15 ? '达标' : '需关注', highlighted: true },
    { seq: '12.8', name: '资本金净利润率', unit: '%', value: round(roe, 2), referenceValue: '-', evaluation: '-' },
  ];

  return {
    summary,
    loanSchedule,
    totalCost,
    profit,
    incomeTax: [],
    projectCashflow: projectCF,
    equityCashflow: equityCF,
    npv,
    irrPreTax,
    irrPostTax,
    irrEquity,
    staticPayback,
    dynamicPayback,
    roi,
    roe,
    annualAvgProfit,
    annualAvgNetProfit,
  };
}

// ── 投资评分计算 ──────────────────────────────────────────────────────

export interface ScoreResult {
  dimensions: {
    name: string;
    label: string;
    score: number;
    weight: number;
    weightedScore: number;
    status: 'good' | 'warning' | 'danger';
  }[];
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  gradeColor: string;
  suggestion: string;
}

export function calcInvestmentScore(results: DecisionCalculationResults): ScoreResult {
  const { roi, staticPayback, npv, irrPostTax } = results;

  // 5 维度评分
  const dims: { name: string; label: string; score: number; weight: number }[] = [];

  // 1. 盈利能力（ROI）
  let roiScore = 0;
  if (roi >= 15) roiScore = 100;
  else if (roi >= 12) roiScore = 80;
  else if (roi >= 8) roiScore = 60;
  else if (roi >= 5) roiScore = 40;
  else roiScore = 20;
  dims.push({ name: 'profitability', label: '盈利能力(ROI)', score: roiScore, weight: 0.25 });

  // 2. 偿债能力（静态回收期）
  let paybackScore = 0;
  if (staticPayback <= 4) paybackScore = 100;
  else if (staticPayback <= 5) paybackScore = 80;
  else if (staticPayback <= 7) paybackScore = 60;
  else if (staticPayback <= 10) paybackScore = 40;
  else paybackScore = 20;
  dims.push({ name: 'payback', label: '偿债能力(回收期)', score: paybackScore, weight: 0.20 });

  // 3. 现金流效率（NPV）
  let npvScore = 0;
  if (npv > 100) npvScore = 100;
  else if (npv > 50) npvScore = 80;
  else if (npv > 0) npvScore = 60;
  else if (npv > -50) npvScore = 40;
  else npvScore = 20;
  dims.push({ name: 'cashflow', label: '现金流效率(NPV)', score: npvScore, weight: 0.20 });

  // 4. 收益质量（IRR税后）
  let irrScore = 0;
  if (irrPostTax >= 15) irrScore = 100;
  else if (irrPostTax >= 12) irrScore = 80;
  else if (irrPostTax >= 8) irrScore = 60;
  else if (irrPostTax >= 5) irrScore = 40;
  else irrScore = 20;
  dims.push({ name: 'irrQuality', label: '收益质量(IRR)', score: irrScore, weight: 0.20 });

  // 5. 财务稳健度
  const safetyScore = Math.round((roiScore + paybackScore + npvScore + irrScore) / 4 * 0.85 + 15);
  dims.push({ name: 'safety', label: '财务稳健度', score: Math.min(100, safetyScore), weight: 0.15 });

  // 加权总分
  let totalScore = 0;
  const dimensions = dims.map((d) => {
    const weightedScore = d.score * d.weight;
    totalScore += weightedScore;
    const status: 'good' | 'warning' | 'danger' = d.score >= 80 ? 'good' : d.score >= 55 ? 'warning' : 'danger';
    return { ...d, weightedScore: Math.round(weightedScore), status };
  });

  totalScore = Math.round(totalScore);

  // 等级
  let grade: 'A' | 'B' | 'C' | 'D';
  let gradeLabel: string;
  let gradeColor: string;
  let suggestion: string;

  if (totalScore >= 85) {
    grade = 'A';
    gradeLabel = '推荐投资';
    gradeColor = '#52c41a';
    suggestion = '该项目各项财务指标表现优异，盈利能力、偿债能力和现金流效率均处于良好水平。建议积极推进投资，重点关注合同条款和风险控制细节。';
  } else if (totalScore >= 70) {
    grade = 'B';
    gradeLabel = '建议投资';
    gradeColor = '#1677ff';
    suggestion = '该项目整体财务状况稳健，大部分指标达标。建议在投资前进一步优化融资结构或运营方案，提升项目经济性。';
  } else if (totalScore >= 55) {
    grade = 'C';
    gradeLabel = '谨慎投资';
    gradeColor = '#fa8c16';
    suggestion = '该项目部分指标未达基准值，存在一定财务风险。建议审慎评估，可考虑调整投资模式、延长运营期或优化技术方案后重新测算。';
  } else {
    grade = 'D';
    gradeLabel = '不建议投资';
    gradeColor = '#ff4d4f';
    suggestion = '该项目多项核心指标未达基准要求，财务可行性偏低。建议暂缓投资决策，重新审视项目方案或寻找优化空间后再行评估。';
  }

  return { dimensions, totalScore, grade, gradeLabel, gradeColor, suggestion };
}