import { create } from 'zustand';
import { message } from 'antd';
import { supabase } from '@/shared/lib/supabase';
import { getSeedData } from '@/data/seedProject';
import {
  fetchProjects as fetchProjectsApi,
  fetchAllProjectSteps as fetchAllProjectStepsApi,
  upsertProject as upsertProjectApi,
  deleteProjectById as deleteProjectApi,
  fetchProjectSteps as fetchProjectStepsApi,
  upsertProjectSteps as upsertProjectStepsApi,
} from '@/shared/services/projectService';

// ── Data models ──────────────────────────────────────────────────────────────

export interface Step1Data {
  [key: string]: unknown;
}

export interface Step2Data {
  selectedTechs: string[];
  comprehensiveRateCompleted?: boolean;
  /** 附属技术绑定：{ dependentTechId -> mainTechId[] }，附属技术必须依附主技术 */
  dependentTechBindings?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface InvestmentRow {
  id: string;
  name: string;
  category?: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  isMainEquipment?: boolean;
  powerKw?: number;
  powerUnit?: string;
  remark?: string;
  selected?: boolean;
  costType?: 'repair' | 'labor';
  maintenanceYears?: number;
  totalLifecycleCost?: number;
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
  savingEnergyRun: number;
  savingCostRun: number;
  originalEnergyRun: number;
  originalCostRun: number;
  itemSavingRate: number;
  comprehensiveRate: number;
}

export interface EnergyPrices {
  peakPrice: number;
  flatPrice: number;
  valleyPrice: number;
  comprehensivePrice: number;
  gasPrice: number;
  waterPrice: number;
}

export interface TimePeriodConfig {
  startDate: string;
  endDate: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  publicHolidayCoeff: number;
}

export interface ZoneConfig {
  enabled: boolean; // 是否参与计算（勾选状态）
  coolingPeriod: TimePeriodConfig;
  heatingPeriod: TimePeriodConfig;
  lightingPeriod: TimePeriodConfig;
  hotWaterPeriod: TimePeriodConfig;
  buildingArea?: number; // 建筑面积（㎡），用于运行时间加权计算
}

export interface Step4ProjectData {
  investmentMode: '' | 'EMC' | 'BOT' | 'other';
  custodyYears: number;
  techs: Record<string, Step4TechData>;
  accountingStatus: 'pending' | 'completed';
  author: string;
  fillDate: string;
  energyPrices?: EnergyPrices;
  zoneConfigs?: Record<string, ZoneConfig>;
  savingEquipments?: Record<string, SavingEquipment[]>;
  originalEquipments?: OriginalEquipment[];
  decisionData?: DecisionProjectData;
}

export interface DecisionProjectData {
  investmentMode: '' | 'EMC' | 'BOT' | 'EMC-profit' | 'EMC-guarantee' | 'EMC-trust' | 'PPP';
  operatingPeriod: number;
  avgOperatingIncome: number;
  avgNetProfit: number;
  staticPaybackPeriod: number;
  dynamicPaybackPeriod: number;
  totalInvestmentReturn: number;
  accountingStatus: 'pending' | 'completed' | 'reported';
  author?: string;
  fillDate?: string;
  totalFixedInvestment: number;
  initialInvestment: number;
  installationCost: number;
  custodialOperationFee: number;
  maintenanceCost: number;
  energyCost: number;
  repairCost: number;
  laborCost: number;
  adminCost: number;
  annualEnergySaving: number;
  constructionMonths: number;
  fundingRatio: number;
  depreciationYears: number;
  residualRate: number;
  techServiceFee: number;
  telecomFee: number;
  managementFee: number;
  otherTax: number;
  loanPeriod: number;
  gracePeriod: number;
  repaymentPeriod: number;
  loanRate: number;
  initialProfitShare1: number;
  initialProfitShare2: number;
  changeYear: number;
  changeProfitShare1: number;
  changeProfitShare2: number;
  calculationResults?: DecisionCalculationResults;
}

export interface CalcSummaryRow {
  seq: string;
  name: string;
  unit: string;
  value: number | string;
  referenceValue: string;
  evaluation: string;
  highlighted?: boolean;
}

export interface CalcLoanScheduleRow {
  year: number;
  periodLabel: string;
  beginningBalance: number;
  newLoan: number;
  accruedInterest: number;
  totalPayment: number;
  principalRepayment: number;
  interestPayment: number;
  endingBalance: number;
}

export interface CalcTotalCostRow {
  year: number;
  periodLabel: string;
  energyCost: number;
  maintenanceCost: number;
  laborCost: number;
  adminCost: number;
  insuranceCost: number;
  operatingCost: number;
  depreciation: number;
  amortization: number;
  interestExpense: number;
  totalCost: number;
}

export interface CalcProfitRow {
  year: number;
  periodLabel: string;
  revenue: number;
  taxSurcharge: number;
  totalCost: number;
  subsidy: number;
  profitTotal: number;
  incomeTax: number;
  netProfit: number;
  ebit: number;
  ebitda: number;
}

export interface CalcCashflowRow {
  year: number;
  periodLabel: string;
  cashInflow: number;
  cashOutflow: number;
  netCashflow: number;
  discountedCashflow: number;
  cumulativeDiscounted: number;
}

export interface DecisionCalculationResults {
  summary: CalcSummaryRow[];
  loanSchedule: CalcLoanScheduleRow[];
  totalCost: CalcTotalCostRow[];
  profit: CalcProfitRow[];
  incomeTax: CalcCashflowRow[];
  projectCashflow: CalcCashflowRow[];
  equityCashflow: CalcCashflowRow[];
  npv: number;
  irrPreTax: number;
  irrPostTax: number;
  irrEquity: number;
  staticPayback: number;
  dynamicPayback: number;
  roi: number;
  roe: number;
  annualAvgProfit: number;
  annualAvgNetProfit: number;
  comprehensiveRate: number;
}

export interface SavingEquipment {
  id: string;
  techId: string;
  equipmentName: string;
  systems: string[];
  ratedPower: number;
  quantity: number;
  serviceTargets: string[];
  operatingHours: number;
  simultaneousCoeff: number;
  energyConsumption: number;
  operatingCost: number;
}

export interface OriginalEquipment {
  id: string;
  benchmarkTechId: string;
  systemCategory: string[];
  systemLargeClass: string;
  deviceType: string;
  deviceName: string;
  equipmentName: string;
  ratedPower: number;
  quantity: number;
  serviceTargets: string[];
  operatingHours: number;
  simultaneousCoeff: number;
  energyConsumption: number;
  operatingCost: number;
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

function filterStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => typeof item === 'string') as string[];
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

function silentSync(fn: () => Promise<void>) {
  fn().catch((err) => {
    console.error('[Supabase sync error]', err);
    message.error('保存失败，请检查网络连接');
  });
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Debounced sync wrappers (read latest store data at fire time)
// Defined via function to avoid circular reference at module init
const debouncedSyncStep1 = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep1Data[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step1Data: data }));
}, 800);

const debouncedSyncStep2 = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep2Data[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step2SelectedTechs: data }));
}, 800);

const debouncedSyncStep2Bindings = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep2Bindings[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step2DependentBindings: data }));
}, 800);

const debouncedSyncStep3Data = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep3Data[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step3Data: data }));
}, 800);

const debouncedSyncStep3Techs = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep3SelectedTechs[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step3SelectedTechs: data }));
}, 800);

const debouncedSyncStep4 = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep4Data[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step4Data: data }));
}, 800);

const debouncedSyncRate = debounce((projectId: string) => {
  const data = useProjectStore.getState().projectsStep2RateCompleted[projectId];
  silentSync(() => upsertProjectStepsApi(projectId, { step2RateCompleted: data }));
}, 800);

// ── Store ────────────────────────────────────────────────────────────────────

interface ProjectState {
  currentStep: number;
  projectId: string | null;
  stepCompleted: boolean[];
  stepStaleFlags: boolean[];
  step1SubStepCompleted: boolean[];
  flatStepIndex: number;
  flatStepCompleted: boolean[];
  step1ValidateTrigger: number;
  step1ValidateDone: number;
  mepAllTabsDone: boolean;
  mepTabAdvanceTrigger: number;
  mepTabBackTrigger: number;
  step3Editing: boolean;
  step4Editing: boolean;
  step5Editing: boolean;
  step5ExitTrigger: number;
  step5SelectedIds: string[];
  step5BatchReportTrigger: number;
  step5ShowReportTrigger: number;
  step1Data: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  step4Data: Step4Data;
  projects: Project[];
  hydrated: boolean;
  hydrating: boolean;
  loadingSteps: boolean;
  seedProjectIds: string[];

  projectsStep1Data: Record<string, Step1Data>;
  projectsStep2Data: Record<string, string[]>;
  projectsStep2Bindings: Record<string, Record<string, string[]>>;
  projectsStep3Data: Record<string, Record<string, TechInvestment>>;
  projectsStep4Data: Record<string, Step4ProjectData>;
  projectsStep3SelectedTechs: Record<string, string[]>;
  projectsStep2RateCompleted: Record<string, boolean>;

  setCurrentStep: (step: number) => void;
  setProjectId: (id: string) => void;
  completeStep: (step: number) => void;
  clearStepStaleFlag: (step: number) => void;
  setStep1SubStepCompleted: (index: number, value: boolean) => void;
  setFlatStepIndex: (index: number) => void;
  setFlatStepCompleted: (index: number, value: boolean) => void;
  triggerStep1Validate: () => void;
  confirmStep1Validate: () => void;
  setMepAllTabsDone: (done: boolean) => void;
  triggerMepTabAdvance: () => void;
  triggerMepTabBack: () => void;
  setStep3Editing: (editing: boolean) => void;
  setStep4Editing: (editing: boolean) => void;
  setStep5Editing: (editing: boolean) => void;
  triggerStep5ExitEdit: () => void;
  setStep5SelectedIds: (ids: string[]) => void;
  triggerStep5BatchReport: () => void;
  triggerStep5ShowReport: () => void;
  updateStep1Data: (data: Partial<Step1Data>) => void;
  updateStep2Data: (data: Partial<Step2Data>) => void;
  updateStep3Data: (data: Partial<Step3Data>) => void;
  updateStep4Data: (data: Partial<Step4Data>) => void;
  addProject: (project: Project) => void;
  updateProjectStep: (id: string, step: number) => void;
  setProjectAuditStatus: (id: string, status: 'pending' | 'completed') => void;
  deleteProject: (id: string) => void;
  loadProject: (id: string) => void;
  resetCurrentProject: () => void;

  saveProjectStep1Data: (projectId: string, data: Step1Data) => void;
  saveProjectStep2Data: (projectId: string, selectedTechs: string[]) => void;
  saveProjectStep2Bindings: (projectId: string, bindings: Record<string, string[]>) => void;
  saveProjectStep3Data: (projectId: string, techInvestments: Record<string, TechInvestment>) => void;
  saveProjectStep3SelectedTechs: (data: Record<string, string[]>) => void;
  saveProjectStep4Data: (projectId: string, data: Step4ProjectData) => void;
  setProjectStep2RateCompleted: (projectId: string, completed: boolean) => void;

  hydrateFromServer: () => Promise<void>;
  loadProjectStepsFromServer: (projectId: string) => Promise<void>;
  persistCurrentProject: () => void;
  setLoadingSteps: (v: boolean) => void;
  clearAll: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  currentStep: 0,
  projectId: null,
  stepCompleted: [false, false, false, false, false],
  stepStaleFlags: [false, false, false, false, false],
  step1SubStepCompleted: [false, false, false, false, false],
  flatStepIndex: 0,
  flatStepCompleted: [false, false, false, false, false, false, false, false, false],
  step1ValidateTrigger: 0,
  step1ValidateDone: 0,
  mepAllTabsDone: false,
  mepTabAdvanceTrigger: 0,
  mepTabBackTrigger: 0,
  step3Editing: false,
  step4Editing: false,
  step5Editing: false,
  step5ExitTrigger: 0,
  step5SelectedIds: [],
  step5BatchReportTrigger: 0,
  step5ShowReportTrigger: 0,
  step1Data: {},
  step2Data: { selectedTechs: [], dependentTechBindings: {} },
  step3Data: { techInvestments: {}, selectedTechIds: [] },
  step4Data: {},
  projects: [],
  hydrated: false,
  hydrating: false,
  loadingSteps: false,
  projectsStep1Data: {},
  projectsStep2Data: {},
  projectsStep2Bindings: {},
  projectsStep3Data: {},
  projectsStep4Data: {},
  projectsStep3SelectedTechs: {},
  projectsStep2RateCompleted: {},
  seedProjectIds: [],

  // ── Transient UI state ───────────────────────────────────────────

  setCurrentStep: (step) => set({ currentStep: step }),
  setProjectId: (id) => set({ projectId: id }),
  completeStep: (step) =>
    set((state) => {
      // No-op when step is already completed: avoids re-marking downstream stale
      // every time the user simply passes through this step.
      if (state.stepCompleted[step]) return {};
      const completed = [...state.stepCompleted];
      completed[step] = true;
      const stale = [...state.stepStaleFlags];
      for (let i = step + 1; i < 5; i++) {
        if (state.stepCompleted[i]) stale[i] = true;
      }
      return { stepCompleted: completed, stepStaleFlags: stale };
    }),
  clearStepStaleFlag: (step) =>
    set((state) => {
      const stale = [...state.stepStaleFlags];
      stale[step] = false;
      return { stepStaleFlags: stale };
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
  setMepAllTabsDone: (done) => set({ mepAllTabsDone: done }),
  triggerMepTabAdvance: () =>
    set((state) => ({ mepTabAdvanceTrigger: state.mepTabAdvanceTrigger + 1 })),
  triggerMepTabBack: () =>
    set((state) => ({ mepTabBackTrigger: state.mepTabBackTrigger + 1 })),
  setStep3Editing: (editing) => set({ step3Editing: editing }),
  setStep4Editing: (editing) => set({ step4Editing: editing }),
  setStep5Editing: (editing) => set({ step5Editing: editing }),
  triggerStep5ExitEdit: () => set((state) => ({ step5ExitTrigger: state.step5ExitTrigger + 1 })),
  setStep5SelectedIds: (ids) => set({ step5SelectedIds: ids }),
  triggerStep5BatchReport: () => set((state) => ({ step5BatchReportTrigger: state.step5BatchReportTrigger + 1 })),
  triggerStep5ShowReport: () => set((state) => ({ step5ShowReportTrigger: state.step5ShowReportTrigger + 1 })),
  setLoadingSteps: (v) => set({ loadingSteps: v }),

  clearAll: () =>
    set({
      currentStep: 0,
      projectId: null,
      stepCompleted: [false, false, false, false, false],
      stepStaleFlags: [false, false, false, false, false],
      step1SubStepCompleted: [false, false, false, false, false],
      flatStepIndex: 0,
      flatStepCompleted: [false, false, false, false, false, false, false, false, false],
      step1ValidateTrigger: 0,
      step1ValidateDone: 0,
      mepAllTabsDone: false,
      mepTabAdvanceTrigger: 0,
      mepTabBackTrigger: 0,
      step3Editing: false,
      step4Editing: false,
      step5Editing: false,
      step5ExitTrigger: 0,
      step5SelectedIds: [],
      step5BatchReportTrigger: 0,
      step5ShowReportTrigger: 0,
      step1Data: {},
      step2Data: { selectedTechs: [], dependentTechBindings: {} },
      step3Data: { techInvestments: {}, selectedTechIds: [] },
      step4Data: {},
      projects: [],
      hydrated: false,
      hydrating: false,
      loadingSteps: false,
      seedProjectIds: [],
      projectsStep1Data: {},
      projectsStep2Data: {},
      projectsStep2Bindings: {},
      projectsStep3Data: {},
      projectsStep4Data: {},
      projectsStep3SelectedTechs: {},
      projectsStep2RateCompleted: {},
    }),

  updateStep1Data: (data) =>
    set((state) => ({ step1Data: { ...state.step1Data, ...data } })),
  updateStep2Data: (data) =>
    set((state) => {
      const nextBindings: Record<string, string[]> = data.dependentTechBindings !== undefined
        ? Object.fromEntries(
            Object.entries(data.dependentTechBindings).map(([k, v]) => [k, filterStringArray(v)])
          )
        : (state.step2Data.dependentTechBindings ?? {});
      const pid = state.projectId;
      const willUpdateBindings = data.dependentTechBindings !== undefined && !!pid;
      const result: Partial<ProjectState> = {
        step2Data: {
          ...state.step2Data,
          ...data,
          ...(data.selectedTechs !== undefined ? { selectedTechs: filterStringArray(data.selectedTechs) } : {}),
          ...(data.dependentTechBindings !== undefined ? { dependentTechBindings: nextBindings } : {}),
        },
      };
      if (willUpdateBindings && pid) {
        result.projectsStep2Bindings = {
          ...state.projectsStep2Bindings,
          [pid]: nextBindings,
        };
        debouncedSyncStep2Bindings(pid);
      }
      return result;
    }),
  updateStep3Data: (data) =>
    set((state) => ({ step3Data: { ...state.step3Data, ...data } })),
  updateStep4Data: (data) =>
    set((state) => ({ step4Data: { ...state.step4Data, ...data } })),

  // ── Project CRUD ─────────────────────────────────────────────────

  addProject: (project) => {
    set((state) => {
      const idx = state.projects.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        const updated = [...state.projects];
        updated[idx] = { ...updated[idx], ...project };
        return { projects: updated };
      }
      return { projects: [...state.projects, project] };
    });
    silentSync(async () => {
      const userId = await getUserId();
      await upsertProjectApi({ ...project, userId });
    });
  },

  updateProjectStep: (id, step) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, currentStep: step } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) {
      silentSync(async () => {
        const userId = await getUserId();
        await upsertProjectApi({ ...project, currentStep: step, userId });
      });
    }
  },

  setProjectAuditStatus: (id, status) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, auditStatus: status } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) {
      silentSync(async () => {
        const userId = await getUserId();
        await upsertProjectApi({ ...project, auditStatus: status, userId });
      });
    }
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      projectsStep1Data: { ...state.projectsStep1Data, [id]: undefined as unknown as Step1Data },
      projectsStep2Data: { ...state.projectsStep2Data, [id]: undefined as unknown as string[] },
      projectsStep2Bindings: { ...state.projectsStep2Bindings, [id]: undefined as unknown as Record<string, string[]> },
      projectsStep3Data: { ...state.projectsStep3Data, [id]: undefined as unknown as Record<string, TechInvestment> },
      projectsStep4Data: { ...state.projectsStep4Data, [id]: undefined as unknown as Step4ProjectData },
    }));
    silentSync(() => deleteProjectApi(id));
  },

  loadProject: (id) =>
    set((state) => {
      // Search visible projects first, then check if it's a hidden seed project
      let project = state.projects.find((p) => p.id === id);
      if (!project && state.seedProjectIds.includes(id)) {
        // Seed project not in visible list — fetch from server
        // For now, use a minimal fallback so the stepper can load
        project = {
          id,
          projectName: '测试医院',
          hospitalName: '某某市人民医院',
          location: ['广东省', '广州市'],
          projectStage: '',
          buildingType: '',
          hospitalLevel: '',
          hospitalNature: '',
          hospitalScale: '',
          totalArea: 85000,
          author: '张工',
          fillDate: '2026-05-15',
          department: '建筑能源事业部',
          currentStep: 4,
          auditStatus: 'pending',
          createdAt: '2026-05-01T00:00:00.000Z',
        };
      }
      if (!project) return {};
      const savedStep1 = state.projectsStep1Data[id] ?? {};
      const savedStep2 = state.projectsStep2Data[id] ?? [];
      const savedStep2Bindings = state.projectsStep2Bindings[id] ?? {};
      const savedStep3 = state.projectsStep3Data[id] ?? {};
      return {
        projectId: project.id,
        currentStep: project.currentStep,
        flatStepIndex: 0,
        step1ValidateDone: 0,
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
        step2Data: {
          selectedTechs: savedStep2,
          comprehensiveRateCompleted: state.projectsStep2RateCompleted[id] ?? false,
          dependentTechBindings: savedStep2Bindings,
        },
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
      stepStaleFlags: [false, false, false, false, false],
      step1SubStepCompleted: [false, false, false, false, false],
      flatStepIndex: 0,
      flatStepCompleted: [false, false, false, false, false, false, false, false, false],
      step1ValidateTrigger: 0,
      step1ValidateDone: 0,
      mepAllTabsDone: false,
      mepTabAdvanceTrigger: 0,
      mepTabBackTrigger: 0,
      step3Editing: false,
      step4Editing: false,
      step5Editing: false,
      step1Data: {},
      step2Data: { selectedTechs: [], dependentTechBindings: {} },
      step3Data: { techInvestments: {}, selectedTechIds: [] },
      step4Data: {},
      seedProjectIds: [],
    }),

  // ── Per-project save actions (Zustand + Supabase sync) ───────────

  saveProjectStep1Data: (projectId, data) => {
    set((state) => ({
      projectsStep1Data: { ...state.projectsStep1Data, [projectId]: data },
    }));
    debouncedSyncStep1(projectId);
  },

  saveProjectStep2Data: (projectId, selectedTechs) => {
    const cleaned = filterStringArray(selectedTechs);
    set((state) => ({
      projectsStep2Data: { ...state.projectsStep2Data, [projectId]: cleaned },
    }));
    debouncedSyncStep2(projectId);
  },

  saveProjectStep2Bindings: (projectId, bindings) => {
    const cleaned: Record<string, string[]> = {};
    for (const [depId, mainIds] of Object.entries(bindings)) {
      cleaned[depId] = filterStringArray(mainIds);
    }
    set((state) => ({
      projectsStep2Bindings: { ...state.projectsStep2Bindings, [projectId]: cleaned },
    }));
    debouncedSyncStep2Bindings(projectId);
  },

  saveProjectStep3Data: (projectId, techInvestments) => {
    set((state) => ({
      projectsStep3Data: { ...state.projectsStep3Data, [projectId]: techInvestments },
    }));
    debouncedSyncStep3Data(projectId);
  },

  saveProjectStep3SelectedTechs: (data) => {
    set((state) => ({
      projectsStep3SelectedTechs: { ...state.projectsStep3SelectedTechs, ...data },
    }));
    for (const projectId of Object.keys(data)) {
      debouncedSyncStep3Techs(projectId);
    }
  },

  saveProjectStep4Data: (projectId, data) => {
    set((state) => ({
      projectsStep4Data: { ...state.projectsStep4Data, [projectId]: data },
    }));
    debouncedSyncStep4(projectId);
  },

  setProjectStep2RateCompleted: (projectId, completed) => {
    set((state) => ({
      projectsStep2RateCompleted: { ...state.projectsStep2RateCompleted, [projectId]: completed },
    }));
    debouncedSyncRate(projectId);
  },

  // ── Supabase hydration ───────────────────────────────────────────

  hydrateFromServer: async () => {
    set({ hydrating: true });
    try {
      const projects = await fetchProjectsApi();
      const projectIds = projects.map((p) => p.id);
      const allSteps = await fetchAllProjectStepsApi(projectIds);

      const stepMaps = {
        projectsStep1Data: {} as Record<string, Step1Data>,
        projectsStep2Data: {} as Record<string, string[]>,
        projectsStep2Bindings: {} as Record<string, Record<string, string[]>>,
        projectsStep3Data: {} as Record<string, Record<string, TechInvestment>>,
        projectsStep4Data: {} as Record<string, Step4ProjectData>,
        projectsStep3SelectedTechs: {} as Record<string, string[]>,
        projectsStep2RateCompleted: {} as Record<string, boolean>,
      };

      for (const [pid, steps] of Object.entries(allSteps)) {
        stepMaps.projectsStep1Data[pid] = steps.step1Data;
        stepMaps.projectsStep2Data[pid] = steps.step2SelectedTechs;
        stepMaps.projectsStep2Bindings[pid] = steps.step2DependentBindings ?? {};
        stepMaps.projectsStep3Data[pid] = steps.step3Data;
        stepMaps.projectsStep4Data[pid] = steps.step4Data;
        stepMaps.projectsStep3SelectedTechs[pid] = steps.step3SelectedTechs;
        stepMaps.projectsStep2RateCompleted[pid] = steps.step2RateCompleted;
      }

      // First login with no projects — create seed demo (once per user)
      if (projects.length === 0) {
        const seed = getSeedData();
        const userId = await getUserId();

        // Write seed to Supabase first, then hydrate
        for (const project of seed.projects) {
          await upsertProjectApi({ ...project, userId });
        }
        for (const [pid, data] of Object.entries(seed.projectsStep1Data)) {
          await upsertProjectStepsApi(pid, { step1Data: data });
        }
        for (const [pid, techs] of Object.entries(seed.projectsStep2Data)) {
          await upsertProjectStepsApi(pid, { step2SelectedTechs: techs });
        }
        for (const [pid, data] of Object.entries(seed.projectsStep3Data)) {
          await upsertProjectStepsApi(pid, { step3Data: data });
        }
        for (const [pid, techs] of Object.entries(seed.projectsStep3SelectedTechs)) {
          await upsertProjectStepsApi(pid, { step3SelectedTechs: techs });
        }
        for (const [pid, data] of Object.entries(seed.projectsStep4Data)) {
          await upsertProjectStepsApi(pid, { step4Data: data });
        }
        for (const [pid, val] of Object.entries(seed.projectsStep2RateCompleted)) {
          await upsertProjectStepsApi(pid, { step2RateCompleted: val as boolean });
        }

        // Re-fetch from server to get canonical data (single batch)
        const freshProjects = await fetchProjectsApi();
        const freshIds = freshProjects.map((p) => p.id);
        const freshSteps = await fetchAllProjectStepsApi(freshIds);
        for (const [pid, steps] of Object.entries(freshSteps)) {
          stepMaps.projectsStep1Data[pid] = steps.step1Data;
          stepMaps.projectsStep2Data[pid] = steps.step2SelectedTechs;
          stepMaps.projectsStep2Bindings[pid] = steps.step2DependentBindings ?? {};
          stepMaps.projectsStep3Data[pid] = steps.step3Data;
          stepMaps.projectsStep4Data[pid] = steps.step4Data;
          stepMaps.projectsStep3SelectedTechs[pid] = steps.step3SelectedTechs;
          stepMaps.projectsStep2RateCompleted[pid] = steps.step2RateCompleted;
        }

        // Record seed project IDs so we can hide them from the list
        const seedIds = freshProjects.map((p) => p.id);
        const visibleProjects = freshProjects.filter((p) => !seedIds.includes(p.id));

        set({
          projects: visibleProjects,
          seedProjectIds: seedIds,
          ...stepMaps,
          hydrated: true,
          hydrating: false,
        });
      } else {
        // Filter out seed projects from visible list (still keep data for editing)
        const seedIds = projects
          .filter((p) => p.projectName === '测试医院' || p.id === 'demo-project-seed')
          .map((p) => p.id);

        set({
          projects: projects.filter((p) => !seedIds.includes(p.id)),
          seedProjectIds: seedIds,
          ...stepMaps,
          hydrated: true,
          hydrating: false,
        });
      }
    } catch (err) {
      console.error('[hydrateFromServer] failed:', err);
      set({ hydrated: true, hydrating: false });
    }
  },

  loadProjectStepsFromServer: async (projectId: string) => {
    set({ loadingSteps: true });
    try {
      const steps = await fetchProjectStepsApi(projectId);
      set((state) => ({
        projectsStep1Data: { ...state.projectsStep1Data, [projectId]: steps.step1Data },
        projectsStep2Data: { ...state.projectsStep2Data, [projectId]: steps.step2SelectedTechs },
        projectsStep2Bindings: { ...state.projectsStep2Bindings, [projectId]: steps.step2DependentBindings ?? {} },
        projectsStep3Data: { ...state.projectsStep3Data, [projectId]: steps.step3Data },
        projectsStep4Data: { ...state.projectsStep4Data, [projectId]: steps.step4Data },
        projectsStep3SelectedTechs: { ...state.projectsStep3SelectedTechs, [projectId]: steps.step3SelectedTechs },
        projectsStep2RateCompleted: { ...state.projectsStep2RateCompleted, [projectId]: steps.step2RateCompleted },
      }));
    } catch (err) {
      console.error('[loadProjectStepsFromServer] failed:', err);
      message.error('加载步骤数据失败，请刷新页面重试');
    } finally {
      set({ loadingSteps: false });
    }
  },

  persistCurrentProject: () => {
    const { projectId, step1Data, step2Data, step3Data, step4Data, projectsStep2RateCompleted, projectsStep2Bindings } = get();
    if (!projectId) return;

    const pid = projectId;
    silentSync(() => upsertProjectStepsApi(pid, {
      step1Data,
      step2SelectedTechs: step2Data.selectedTechs,
      step2RateCompleted: projectsStep2RateCompleted[pid] ?? step2Data.comprehensiveRateCompleted ?? false,
      step2DependentBindings: projectsStep2Bindings[pid] ?? step2Data.dependentTechBindings ?? {},
      step3Data: step3Data.techInvestments,
      step3SelectedTechs: step3Data.selectedTechIds,
      step4Data: step4Data as unknown as Step4ProjectData,
    }));

    const project = get().projects.find((p) => p.id === pid);
    if (project) {
      silentSync(async () => {
        const userId = await getUserId();
        await upsertProjectApi({ ...project, userId });
      });
    }
  },
}));
