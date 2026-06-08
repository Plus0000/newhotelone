import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { techDefaultInvestments } from '@/data/materials';
import { getSeedData, SEED_PROJECT_ID } from '@/data/seedProject';

// ── Data models ──────────────────────────────────────────────────────────────

export interface Step1Data {
  [key: string]: unknown;
}

export interface Step2Data {
  selectedTechs: string[];
  comprehensiveRateCompleted?: boolean;
  [key: string]: unknown;
}

export interface InvestmentRow {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  isMainEquipment?: boolean;
  powerKw?: number;
  remark?: string;
  selected?: boolean;
  /** 运维费用类型: repair=维修维保, labor=人工费（仅 maintenance tab 有效） */
  costType?: 'repair' | 'labor';
}

export interface TechInvestment {
  techId: string;
  projectId: string;
  author: string;
  fillDate: string;
  subsidyMode: '' | 'investment' | 'capacity';
  investmentRatio: number;
  subsidyIndex: number;
  subsidyIndexUnit: string;
  systemCapacity: number;
  systemCapacityUnit: string;
  equipment: InvestmentRow[];
  materials: InvestmentRow[];
  installation: InvestmentRow[];
  maintenance: InvestmentRow[];
  fixedInvestment: number;
  initialInvestment: number;
  maintenanceCost: number;
  subsidyRate: string;
  subsidyAmount: number;
  accountingStatus: 'pending' | 'completed';
  basicInfoCompleted: boolean;
}

export interface Step3Data {
  techInvestments: Record<string, TechInvestment>;
  selectedTechIds: string[];
  [key: string]: unknown;
}

export interface Step4TechData {
  techId: string;
  investmentMode: '' | 'EMC' | 'BOT' | 'other';
  custodyYears: number;
  savingEnergyRun: number;  // 节能方案运行能耗 万kWh/年
  savingCostRun: number;    // 节能方案运行费用 万元/年
  originalEnergyRun: number; // 原方案运行能耗 万kWh/年
  originalCostRun: number;   // 原方案运行费用 万元/年
  itemSavingRate: number;    // 分项节能率 %
  comprehensiveRate: number; // 综合节能率 %
}

// ── Step 4 扩展类型：能源价格 & 条件设定 ─────────────────────────────────

export interface EnergyPrices {
  peakPrice: number;
  flatPrice: number;
  valleyPrice: number;
  comprehensivePrice: number;
  gasPrice: number;
  waterPrice: number;
}

export interface TimePeriodConfig {
  startDate: string;   // "2026-05-01"
  endDate: string;     // "2026-09-30"
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  publicHolidayCoeff: number;
}

export interface ZoneConfig {
  coolingPeriod: TimePeriodConfig;
  heatingPeriod: TimePeriodConfig;
  lightingPeriod: TimePeriodConfig;
  hotWaterPeriod: TimePeriodConfig;
}

// ── Step 4 ─────────────────────────────────────────────────────────────

export interface Step4ProjectData {
  investmentMode: '' | 'EMC' | 'BOT' | 'other';
  custodyYears: number;
  techs: Record<string, Step4TechData>;
  accountingStatus: 'pending' | 'completed';
  author: string;
  fillDate: string;
  energyPrices?: EnergyPrices;
  zoneConfigs?: Record<string, ZoneConfig>;
  savingEquipments?: Record<string, SavingEquipment[]>;  // keyed by techId
  originalEquipments?: OriginalEquipment[];
  decisionData?: DecisionProjectData;
}

// ── Step 4 辅助决策 ────────────────────────────────────────────────────

export interface DecisionProjectData {
  investmentMode: '' | 'EMC' | 'BOT' | 'EMC-profit' | 'EMC-guarantee' | 'EMC-trust' | 'PPP';
  operatingPeriod: number;        // 运营期 年
  avgOperatingIncome: number;     // 年均运营收入 万元
  avgNetProfit: number;           // 运营期年均净利润 万元
  staticPaybackPeriod: number;    // 静态回收期 年
  dynamicPaybackPeriod: number;   // 动态回收期 年
  totalInvestmentReturn: number;  // 总投资收益率 %
  accountingStatus: 'pending' | 'completed' | 'reported';

  author?: string;                 // 填写人
  fillDate?: string;               // 填写日期

  // Part A — 基础投资数据（从 Step 3/4 回显 + 用户填写的托管运维收费/运营期）
  totalFixedInvestment: number;    // 总固定投资 万元
  initialInvestment: number;       // 初投资 万元
  installationCost: number;        // 安装调试 万元
  custodialOperationFee: number;   // 托管运维收费 万元/年（用户首填）
  maintenanceCost: number;         // 运营与维护 万元
  energyCost: number;              // 能源费 万元/年
  repairCost: number;              // 维保费用 万元/年
  laborCost: number;               // 运维人工费用 万元/年
  adminCost: number;               // 管理费用 万元/年
  annualEnergySaving: number;      // 年节能收益 万元/年

  // Part B — 效益测算边界条件（全部用户首填）
  constructionMonths: number;      // 建设期 月
  fundingRatio: number;            // 资金比例 %
  depreciationYears: number;       // 固定资产折旧年限 年
  residualRate: number;            // 固定资产残值率 %
  techServiceFee: number;          // 技术服务费 万元/年
  telecomFee: number;              // 通信费 万元/年
  managementFee: number;           // 管理费 万元/年
  otherTax: number;                // 其他税费 万元/年
  loanPeriod: number;              // 贷款期 年
  gracePeriod: number;             // 宽限期 年
  repaymentPeriod: number;         // 还款期 年
  loanRate: number;                // 贷款利率 %
  initialProfitShare1: number;     // 初始利润分成比例 %
  initialProfitShare2: number;     // 初始利润分成比例 %
  changeYear: number;              // 变更年份 第几年
  changeProfitShare1: number;      // 变更利润分成比例 %
  changeProfitShare2: number;      // 变更利润分成比例 %

  // 计算结果（计算后填充）
  calculationResults?: DecisionCalculationResults;
}

// ── Step 4 辅助决策 — 计算结果 ────────────────────────────────────────────

export interface CalcSummaryRow {
  seq: string;            // 序号 (e.g. "1", "1.1", "12.1")
  name: string;           // 名称
  unit: string;           // 单位
  value: number | string; // 数值
  referenceValue: string; // 参考值
  evaluation: string;     // 评价/说明
  highlighted?: boolean;  // 是否重点指标（黄底高亮）
}

export interface CalcLoanScheduleRow {
  year: number;               // 计算期年份
  periodLabel: string;        // 标签
  beginningBalance: number;   // 年初借款余额
  newLoan: number;            // 本年借款
  accruedInterest: number;    // 本期应计利息
  totalPayment: number;       // 当期还本付息
  principalRepayment: number; // 还本
  interestPayment: number;    // 付息
  endingBalance: number;      // 期末借款余额
}

export interface CalcTotalCostRow {
  year: number;
  periodLabel: string;
  energyCost: number;       // 能源费（不含税）
  maintenanceCost: number;  // 维保费用（不含税）
  laborCost: number;        // 运维人工费用
  adminCost: number;        // 管理费用
  insuranceCost: number;    // 年均保险费
  operatingCost: number;    // 经营成本
  depreciation: number;     // 折旧费
  amortization: number;     // 摊销费
  interestExpense: number;  // 利息支出
  totalCost: number;        // 总成本费用
}

export interface CalcProfitRow {
  year: number;
  periodLabel: string;
  revenue: number;          // 营业收入
  taxSurcharge: number;     // 税金及附加
  totalCost: number;        // 总成本费用
  subsidy: number;          // 补贴收入
  profitTotal: number;      // 利润总额
  incomeTax: number;        // 所得税
  netProfit: number;        // 净利润
  ebit: number;             // 息税前利润
  ebitda: number;           // 息税折旧摊销前利润
}

export interface CalcCashflowRow {
  year: number;
  periodLabel: string;
  cashInflow: number;       // 现金流入
  cashOutflow: number;      // 现金流出
  netCashflow: number;      // 净现金流
  discountedCashflow: number; // 折现现金流
  cumulativeDiscounted: number; // 累计折现现金流
}

export interface DecisionCalculationResults {
  summary: CalcSummaryRow[];
  loanSchedule: CalcLoanScheduleRow[];
  totalCost: CalcTotalCostRow[];
  profit: CalcProfitRow[];
  incomeTax: CalcCashflowRow[];
  projectCashflow: CalcCashflowRow[];
  equityCashflow: CalcCashflowRow[];

  // 关键指标
  npv: number;                 // 财务净现值（万元）
  irrPreTax: number;           // 项目投资财务内部收益率（税前）%
  irrPostTax: number;          // 项目投资财务内部收益率（税后）%
  irrEquity: number;           // 项目资本金内部收益率 %
  staticPayback: number;       // 静态回收期（含建设期）年
  dynamicPayback: number;      // 动态回收期（含建设期）年
  roi: number;                 // 总投资收益率 %
  roe: number;                 // 资本金净利润率 %
  annualAvgProfit: number;     // 运营期年均利润总额
  annualAvgNetProfit: number;  // 运营期年均净利润总额
}

// ── Step 4 节能计算 ────────────────────────────────────────────────────

export interface SavingEquipment {
  id: string;
  techId: string;
  equipmentName: string;
  systems: string[];
  ratedPower: number;         // kW，从 Step 3 powerKw 回填，只读
  quantity: number;           // 台数，从 Step 3 回填，可编辑
  serviceTargets: string[];   // 服务对象（多选）
  operatingHours: number;
  simultaneousCoeff: number;
  energyConsumption: number;  // 万kWh/年
  operatingCost: number;      // 万元/年
}

export interface OriginalEquipment {
  id: string;
  benchmarkTechId: string;    // 对标系统（关联节能技术ID）
  systemCategory: string;     // 系统大类
  deviceType: string;         // 设备类型-中类
  deviceName: string;         // 主要用能设备-小类
  ratedPower: number;         // kW
  quantity: number;
  serviceTargets: string[];
  operatingHours: number;
  simultaneousCoeff: number;
  energyConsumption: number;  // 万kWh/年
  operatingCost: number;      // 万元/年
}

export interface Step4Data {
  [key: string]: unknown;
}

export interface Project {
  id: string;
  projectName: string;
  hospitalName: string;
  location: string[];
  projectStage: string;
  buildingType: string;
  hospitalLevel: string;
  hospitalNature: string;
  hospitalScale: string;
  totalArea: number;
  author: string;
  fillDate: string;
  department: string;
  currentStep: number;
  auditStatus: 'pending' | 'completed';
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Validate an array: keep only valid string elements */
function filterStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => typeof item === 'string') as string[];
}

/** Deep-clean projectsStep2Data on first load */
function cleanStep2Data(raw: Record<string, unknown>): Record<string, string[]> {
  const cleaned: Record<string, string[]> = {};
  for (const [id, val] of Object.entries(raw)) {
    if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      cleaned[id] = val as string[];
    } else if (val && typeof val === 'object') {
      const nested = (val as Record<string, unknown>).selectedTechs;
      if (Array.isArray(nested) && nested.every((v) => typeof v === 'string')) {
        cleaned[id] = nested as string[];
      } else {
        console.warn(`[ProjectStore] Cleaning invalid data for project "${id}"`);
      }
    }
  }
  return cleaned;
}

// ── Store ────────────────────────────────────────────────────────────────────

interface ProjectState {
  currentStep: number;
  projectId: string | null;
  stepCompleted: boolean[];
  step1SubStepCompleted: boolean[];
  flatStepIndex: number;
  flatStepCompleted: boolean[];
  step1ValidateTrigger: number;
  step1ValidateDone: number;
  step3Editing: boolean;
  step4Editing: boolean;
  step5Editing: boolean;
  step5ExitTrigger: number;
  step1Data: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  step4Data: Step4Data;
  projects: Project[];

  // Per-project persistent data — keyed by project ID
  projectsStep1Data: Record<string, Step1Data>;
  projectsStep2Data: Record<string, string[]>;
  projectsStep3Data: Record<string, Record<string, TechInvestment>>;
  projectsStep4Data: Record<string, Step4ProjectData>;
  projectsStep3SelectedTechs: Record<string, string[]>;
  projectsStep2RateCompleted: Record<string, boolean>;

  setCurrentStep: (step: number) => void;
  setProjectId: (id: string) => void;
  completeStep: (step: number) => void;
  setStep1SubStepCompleted: (index: number, value: boolean) => void;
  setFlatStepIndex: (index: number) => void;
  setFlatStepCompleted: (index: number, value: boolean) => void;
  triggerStep1Validate: () => void;
  confirmStep1Validate: () => void;
  setStep3Editing: (editing: boolean) => void;
  setStep4Editing: (editing: boolean) => void;
  setStep5Editing: (editing: boolean) => void;
  triggerStep5ExitEdit: () => void;
  updateStep1Data: (data: Partial<Step1Data>) => void;
  updateStep2Data: (data: Partial<Step2Data>) => void;
  updateStep3Data: (data: Partial<Step3Data>) => void;
  updateStep4Data: (data: Partial<Step4Data>) => void;
  addProject: (project: Project) => void;
  updateProjectStep: (id: string, step: number) => void;
  deleteProject: (id: string) => void;
  loadProject: (id: string) => void;
  resetCurrentProject: () => void;

  // Per-project persistence actions
  saveProjectStep1Data: (projectId: string, data: Step1Data) => void;
  saveProjectStep2Data: (projectId: string, selectedTechs: string[]) => void;
  saveProjectStep3Data: (projectId: string, techInvestments: Record<string, TechInvestment>) => void;
  saveProjectStep3SelectedTechs: (data: Record<string, string[]>) => void;
  saveProjectStep4Data: (projectId: string, data: Step4ProjectData) => void;
  setProjectStep2RateCompleted: (projectId: string, completed: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentStep: 0,
      projectId: null,
      stepCompleted: [false, false, false, false, false],
      step1SubStepCompleted: [false, false, false, false, false],
      flatStepIndex: 0,
      flatStepCompleted: [false, false, false, false, false, false, false, false, false],
      step1ValidateTrigger: 0,
      step1ValidateDone: 0,
      step3Editing: false,
      step4Editing: false,
      step5Editing: false,
      step5ExitTrigger: 0,
      step1Data: {},
      step2Data: { selectedTechs: [] },
      step3Data: { techInvestments: {}, selectedTechIds: [] },
      step4Data: {},
      projects: [],
      projectsStep1Data: {},
      projectsStep2Data: {},
      projectsStep3Data: {},
      projectsStep4Data: {},
      projectsStep3SelectedTechs: {},
      projectsStep2RateCompleted: {},

      setCurrentStep: (step) => set({ currentStep: step }),
      setProjectId: (id) => set({ projectId: id }),
      completeStep: (step) =>
        set((state) => {
          const completed = [...state.stepCompleted];
          completed[step] = true;
          return { stepCompleted: completed };
        }),
      setStep1SubStepCompleted: (index, value) =>
        set((state) => {
          const arr = [...state.step1SubStepCompleted];
          arr[index] = value;
          return { step1SubStepCompleted: arr };
        }),
      setFlatStepIndex: (index) => set({ flatStepIndex: index }),
      setFlatStepCompleted: (index, value) =>
        set((state) => {
          const arr = [...state.flatStepCompleted];
          arr[index] = value;
          return { flatStepCompleted: arr };
        }),
      triggerStep1Validate: () =>
        set((state) => ({ step1ValidateTrigger: state.step1ValidateTrigger + 1 })),
      confirmStep1Validate: () =>
        set((state) => ({ step1ValidateDone: state.step1ValidateDone + 1 })),
      setStep3Editing: (editing) => set({ step3Editing: editing }),
      setStep4Editing: (editing) => set({ step4Editing: editing }),
      setStep5Editing: (editing) => set({ step5Editing: editing }),
      triggerStep5ExitEdit: () => set((state) => ({ step5ExitTrigger: state.step5ExitTrigger + 1 })),
      updateStep1Data: (data) =>
        set((state) => ({ step1Data: { ...state.step1Data, ...data } })),
      updateStep2Data: (data) =>
        set((state) => ({
          step2Data: {
            ...state.step2Data,
            ...data,
            ...(data.selectedTechs !== undefined ? { selectedTechs: filterStringArray(data.selectedTechs) } : {}),
          },
        })),
      updateStep3Data: (data) =>
        set((state) => ({ step3Data: { ...state.step3Data, ...data } })),
      updateStep4Data: (data) =>
        set((state) => ({ step4Data: { ...state.step4Data, ...data } })),
      addProject: (project) =>
        set((state) => {
          const idx = state.projects.findIndex((p) => p.id === project.id);
          if (idx >= 0) {
            const updated = [...state.projects];
            updated[idx] = { ...updated[idx], ...project };
            return { projects: updated };
          }
          return { projects: [...state.projects, project] };
        }),
      updateProjectStep: (id, step) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, currentStep: step } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      loadProject: (id) =>
        set((state) => {
          const project = state.projects.find((p) => p.id === id);
          if (!project) return {};
          const savedStep1 = state.projectsStep1Data[id] ?? {};
          const savedStep2 = state.projectsStep2Data[id] ?? [];
          const savedStep3 = state.projectsStep3Data[id] ?? {};
          return {
            projectId: project.id,
            currentStep: project.currentStep,
            step1Data: {
              ...savedStep1,
              projectName: project.projectName,
              hospitalName: project.hospitalName,
              location: project.location,
              projectStage: project.projectStage,
              buildingType: project.buildingType,
              hospitalLevel: project.hospitalLevel,
              hospitalNature: project.hospitalNature,
              hospitalScale: project.hospitalScale,
              totalArea: project.totalArea,
              author: project.author,
              department: project.department,
              ...(project.fillDate ? { fillDate: project.fillDate } : {}),
            },
            step2Data: { selectedTechs: savedStep2, comprehensiveRateCompleted: state.projectsStep2RateCompleted[id] ?? false },
            step3Data: { techInvestments: savedStep3, selectedTechIds: [] },
            stepCompleted: project.currentStep > 0
              ? [true, project.currentStep > 1, project.currentStep > 2, project.currentStep > 3, project.currentStep > 4]
              : [false, false, false, false, false],
            step1SubStepCompleted: project.currentStep > 0
              ? [true, true, true, true, true]
              : [false, false, false, false, false],
            flatStepCompleted: project.currentStep > 0
              ? [true, true, true, true, true, project.currentStep > 1, project.currentStep > 2, project.currentStep > 3, project.currentStep > 4]
              : [false, false, false, false, false, false, false, false, false],
          };
        }),
      resetCurrentProject: () =>
        set({
          currentStep: 0,
          stepCompleted: [false, false, false, false, false],
          step1SubStepCompleted: [false, false, false, false, false],
          flatStepIndex: 0,
          flatStepCompleted: [false, false, false, false, false, false, false, false, false],
          step1ValidateTrigger: 0,
          step1ValidateDone: 0,
          step3Editing: false,
          step4Editing: false,
          step5Editing: false,
          step1Data: {},
          step2Data: { selectedTechs: [] },
          step3Data: { techInvestments: {}, selectedTechIds: [] },
          step4Data: {},
        }),

      saveProjectStep1Data: (projectId, data) =>
        set((state) => ({
          projectsStep1Data: { ...state.projectsStep1Data, [projectId]: data },
        })),
      saveProjectStep2Data: (projectId, selectedTechs) =>
        set((state) => ({
          projectsStep2Data: {
            ...state.projectsStep2Data,
            [projectId]: filterStringArray(selectedTechs),
          },
        })),
      saveProjectStep3Data: (projectId, techInvestments) =>
        set((state) => ({
          projectsStep3Data: { ...state.projectsStep3Data, [projectId]: techInvestments },
        })),
      saveProjectStep3SelectedTechs: (data) =>
        set((state) => ({
          projectsStep3SelectedTechs: { ...state.projectsStep3SelectedTechs, ...data },
        })),
      saveProjectStep4Data: (projectId, data) =>
        set((state) => ({
          projectsStep4Data: { ...state.projectsStep4Data, [projectId]: data },
        })),
      setProjectStep2RateCompleted: (projectId, completed) =>
        set((state) => ({
          projectsStep2RateCompleted: { ...state.projectsStep2RateCompleted, [projectId]: completed },
        })),
    }),
    {
      name: 'project-storage',
      partialize: (state) => {
        const { step3Editing, step4Editing, step5Editing, step5ExitTrigger, step1ValidateTrigger, step1ValidateDone, ...persisted } = state;
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        let dirty = false;

        // Dev mode: auto-seed demo project when empty
        const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
        if (isDev && state.projects.length === 0) {
          const seed = getSeedData();
          Object.assign(state, seed);
          dirty = true;
        }

        // Reset transient UI state that shouldn't persist
        if (state.step3Editing) {
          state.step3Editing = false;
          dirty = true;
        }
        if (state.step4Editing) {
          state.step4Editing = false;
          dirty = true;
        }
        if (state.step5Editing) {
          state.step5Editing = false;
          dirty = true;
        }

        // Clean dirty data from previous buggy versions
        const cleaned = cleanStep2Data(state.projectsStep2Data);
        if (Object.keys(cleaned).length !== Object.keys(state.projectsStep2Data).length) {
          state.projectsStep2Data = cleaned;
          dirty = true;
        }

        // Migrate: backfill Step 3 data for demo project if empty (seed v4)
        if (isDev && state.projects.some((p) => p.id === 'demo-project-seed')) {
          const step3Data = state.projectsStep3Data['demo-project-seed'];
          if (!step3Data || Object.keys(step3Data).length === 0) {
            const seed = getSeedData();
            state.projectsStep3Data['demo-project-seed'] = seed.projectsStep3Data['demo-project-seed'];
            state.projectsStep3SelectedTechs['demo-project-seed'] = seed.projectsStep3SelectedTechs['demo-project-seed'];
            dirty = true;
          }
        }

        // Migrate location from string to string[] (Cascader format)
        state.projects = state.projects.map((p) => {
          if (typeof p.location === 'string') {
            dirty = true;
            return { ...p, location: p.location ? [p.location] : [] };
          }
          return p;
        });

        // Migrate old step1Extra into projectsStep1Data
        for (const p of state.projects) {
          const extra = (p as unknown as Record<string, unknown>).step1Extra;
          if (extra && typeof extra === 'object' && !state.projectsStep1Data[p.id]) {
            state.projectsStep1Data[p.id] = extra as Step1Data;
            delete (p as unknown as Record<string, unknown>).step1Extra;
            dirty = true;
          }
        }

        // Ensure projectsStep1Data exists
        if (!state.projectsStep1Data) {
          state.projectsStep1Data = {};
          dirty = true;
        }

        // Migrate InvestmentRow: backfill isMainEquipment / powerKw / remark from materials library
        const step3 = state.projectsStep3Data;
        if (step3 && typeof step3 === 'object') {
          for (const pid of Object.keys(step3)) {
            const techs = step3[pid];
            if (!techs || typeof techs !== 'object') continue;
            for (const tid of Object.keys(techs)) {
              const inv = techs[tid];
              if (!inv) continue;
              const defaults = techDefaultInvestments.find((d) => d.techId === tid);
              for (const tab of ['equipment', 'materials', 'installation', 'maintenance'] as const) {
                const rows = inv[tab];
                if (!Array.isArray(rows)) continue;
                const defaultRows = defaults?.[tab] ?? [];
                for (let i = 0; i < rows.length; i++) {
                  const matched = defaultRows.find((d) => d.name === rows[i].name && d.specification === rows[i].specification);
                  if (rows[i].isMainEquipment === undefined) {
                    rows[i].isMainEquipment = matched?.isMainEquipment ?? false;
                    dirty = true;
                  }
                  if (rows[i].powerKw === undefined) {
                    rows[i].powerKw = matched?.powerKw ?? 0;
                    dirty = true;
                  }
                  if (rows[i].remark === undefined) {
                    rows[i].remark = matched?.remark ?? '';
                    dirty = true;
                  }
                }
              }
            }
          }
        }

        // Migrate stepCompleted from 4 to 5 items (Step 5 added)
        if (state.stepCompleted && state.stepCompleted.length < 5) {
          const old = state.stepCompleted;
          state.stepCompleted = [old[0] ?? false, old[1] ?? false, old[2] ?? false, old[3] ?? false, false];
          dirty = true;
        }
        if (state.flatStepCompleted && state.flatStepCompleted.length < 9) {
          const old = state.flatStepCompleted;
          state.flatStepCompleted = [
            old[0] ?? false, old[1] ?? false, old[2] ?? false, old[3] ?? false,
            old[4] ?? false, old[5] ?? false, old[6] ?? false, old[7] ?? false, false,
          ];
          dirty = true;
        }

        // Clean stale seed comprehensive rate flag (from old localStorage data)
        if (state.projectsStep2RateCompleted[SEED_PROJECT_ID]) {
          delete state.projectsStep2RateCompleted[SEED_PROJECT_ID];
          dirty = true;
        }

        // Migrate OriginalEquipment: serviceTarget → serviceTargets
        const step4 = state.projectsStep4Data;
        if (step4 && typeof step4 === 'object') {
          for (const pid of Object.keys(step4)) {
            const data = step4[pid] as Step4ProjectData | undefined;
            if (!data) continue;
            const eqs = data.originalEquipments;
            if (!Array.isArray(eqs)) continue;
            for (let i = 0; i < eqs.length; i++) {
              const eq = eqs[i] as OriginalEquipment & Record<string, unknown>;
              if (typeof eq.serviceTarget === 'string' && !Array.isArray(eq.serviceTargets)) {
                eq.serviceTargets = eq.serviceTarget ? [eq.serviceTarget] : [];
                delete (eq as unknown as Record<string, unknown>).serviceTarget;
                dirty = true;
              }
              if (eq.simultaneousCoeff === 0 || eq.simultaneousCoeff === undefined) {
                eq.simultaneousCoeff = 0.80;
                dirty = true;
              }
            }
          }
        }

        if (dirty) {
          localStorage.setItem('project-storage', JSON.stringify({
            state: {
              ...state,
              projectsStep1Data: state.projectsStep1Data,
              projectsStep2Data: state.projectsStep2Data,
              projects: state.projects,
            },
            version: 1,
          }));
        }
      },
    }
  )
);
