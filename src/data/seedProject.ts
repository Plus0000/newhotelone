import type { EnergyPrices, Project, Step1Data, Step4ProjectData, TechInvestment, ZoneConfig } from '@/shared/stores/projectStore';
import { energyPriceReferences, techDefaultInvestments } from '@/data/materials';

export const SEED_PROJECT_ID = 'demo-project-seed';

function createDefaultTimePeriod() {
  return {
    startDate: '2026-05-01',
    endDate: '2026-09-30',
    startHour: 8,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    publicHolidayCoeff: 0,
  };
}

function createDefaultZoneConfig(): ZoneConfig {
  return {
    coolingPeriod: createDefaultTimePeriod(),
    heatingPeriod: createDefaultTimePeriod(),
    lightingPeriod: createDefaultTimePeriod(),
    hotWaterPeriod: createDefaultTimePeriod(),
  };
}

function getEnergyPricesByLocation(location: string[]): EnergyPrices | null {
  if (!location || location.length < 2) return null;
  const key = `${location[0]}-${location[1]}`;
  const ref = energyPriceReferences.find((r) => r.location === key);
  if (!ref) return null;
  return {
    peakPrice: ref.peakPrice,
    flatPrice: ref.flatPrice,
    valleyPrice: ref.valleyPrice,
    comprehensivePrice: ref.comprehensivePrice,
    gasPrice: ref.gasPrice,
    waterPrice: ref.waterPrice,
  };
}


function getSeedProject(): Project {
  return {
    id: SEED_PROJECT_ID,
    projectName: '测试医院',
    hospitalName: '某某市人民医院',
    location: ['广东省', '广州市'],
    projectStage: '方案设计',
    buildingType: '综合楼',
    hospitalLevel: '三级甲等',
    hospitalNature: '公立医院',
    hospitalScale: '三级医院（>=500床）',
    totalArea: 85000,
    author: '张工',
    fillDate: '2026-05-15',
    department: '建筑能源事业部',
    currentStep: 4,
    auditStatus: 'pending',
    createdAt: '2026-05-01T00:00:00.000Z',
  };
}

function getSeedStep1Data(): Step1Data {
  return {
    // SubStep1Author
    author: '张工',
    department: '建筑能源事业部',
    phone: '13800138000',
    fillDate: '2026-05-15',
    // SubStep2Client
    hospitalName: '某某市人民医院',
    unitNature: '事业单位',
    clientIdentity: '产权方/甲方',
    contactLevel: '处长（基建/总务等）',
    projectSource: '自拓',
    channelName: '无',
    channelDirect: undefined,
    // SubStep3Hospital
    projectName: '测试医院',
    location: ['广东省', '广州市'],
    projectStage: '方案设计',
    projectProperty: '改造',
    buildingType: '综合楼',
    totalArea: 85000,
    aboveGroundArea: 65000,
    cleanArea: 5000,
    hospitalType: '综合医院',
    hospitalNature: '公立医院',
    hospitalLevel: '三级甲等',
    hospitalScale: '三级医院（>=500床）',
    normalBeds: 560,
    icuBeds: 40,
    operatingRooms: 15,
    // SubStep4MEP — all under mep.* namespace
    mep: {
      coldSource: ['离心式冷水机组'],
      heatSource: ['燃气锅炉'],
      waterPartition: '已分区',
      lightingType: ['LED灯'],
      smartLighting: '已采用',
      smartLevel1: ['门诊大厅', '候诊区', '病房走廊', '行政办公区'],
      smartLevel2: ['普通病房'],
      smartLevel3: ['手术室', '重症监护室'],
      lightingMgmt: '有制度精细化管理',
      waterSupply: '有',
      drainage: '有',
      hotWater: '有',
      smartLevel: '有',
      vfd: '有',
      medGas: '有',
      vacuum: '有',
      gridExpansion: '待确认',
      outdoorSpace: '有',
      autoControl: '有',
    },
    // SubStep5Policy
    energy: {
      peakValleyDiff: 0.8,
      valleyHours: 8,
    },
    energyPolicies: [],
    renewableSubsidies: [],
  };
}

function getSeedProjectStep2Data(): string[] {
  return ['1', '3', '4'];
}

function getSeedProjectStep3Data(projectId: string): Record<string, TechInvestment> {
  const result: Record<string, TechInvestment> = {};
  const techIds = ['1', '3', '4']; // matches step2 selection

  for (const techId of techIds) {
    const defaults = techDefaultInvestments.find((d) => d.techId === techId);
    if (!defaults) continue;

    const toRows = (tab: 'equipment' | 'materials' | 'installation' | 'maintenance') =>
      defaults[tab].map((r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        specification: r.specification,
        quantity: r.quantity,
        unit: r.unit,
        unitPrice: r.unitPrice,
        subtotal: r.quantity * r.unitPrice,
        isMainEquipment: r.isMainEquipment,
        powerKw: r.powerKw,
        remark: r.remark || '',
        selected: true,
      }));

    const equipment = toRows('equipment');
    const materials = toRows('materials');
    const installation = toRows('installation');
    const maintenance = toRows('maintenance');

    const initial = equipment.reduce((s, r) => s + r.subtotal, 0) + materials.reduce((s, r) => s + r.subtotal, 0);
    const installCost = installation.reduce((s, r) => s + r.subtotal, 0);
    const maintCost = maintenance.reduce((s, r) => s + r.subtotal, 0);

    result[techId] = {
      techId,
      projectId,
      author: '张工',
      fillDate: '2026-05-15',
      subsidyMode: '' as const,
      investmentRatio: 0,
      subsidyIndex: 0,
      subsidyIndexUnit: '',
      systemCapacity: 0,
      systemCapacityUnit: '',
      equipment,
      materials,
      installation,
      maintenance,
      fixedInvestment: initial + installCost + maintCost,
      initialInvestment: initial,
      maintenanceCost: maintCost,
      subsidyRate: '',
      subsidyAmount: 0,
      accountingStatus: 'pending' as const,
      basicInfoCompleted: false,
    };
  }

  return result;
}

function getSeedProjectStep4Data(location: string[]): Step4ProjectData {
  const prices = getEnergyPricesByLocation(location) || {
    peakPrice: 0, flatPrice: 0, valleyPrice: 0, comprehensivePrice: 0, gasPrice: 0, waterPrice: 0,
  };

  const zoneConfigs: Record<string, ZoneConfig> = {
    '门诊': createDefaultZoneConfig(),
    '医技': createDefaultZoneConfig(),
    '病房': createDefaultZoneConfig(),
    '急诊': createDefaultZoneConfig(),
    '行政': createDefaultZoneConfig(),
  };

  return {
    investmentMode: 'EMC',
    custodyYears: 10,
    techs: {
      '1': {
        techId: '1',
        investmentMode: 'EMC',
        custodyYears: 10,
        savingEnergyRun: 45.2,
        savingCostRun: 36.8,
        originalEnergyRun: 120.5,
        originalCostRun: 98.3,
        itemSavingRate: 37.5,
        comprehensiveRate: 15.2,
      },
      '3': {
        techId: '3',
        investmentMode: 'EMC',
        custodyYears: 10,
        savingEnergyRun: 38.6,
        savingCostRun: 31.2,
        originalEnergyRun: 95.8,
        originalCostRun: 78.5,
        itemSavingRate: 40.3,
        comprehensiveRate: 12.8,
      },
      '4': {
        techId: '4',
        investmentMode: 'EMC',
        custodyYears: 10,
        savingEnergyRun: 12.3,
        savingCostRun: 10.1,
        originalEnergyRun: 28.6,
        originalCostRun: 23.4,
        itemSavingRate: 43.0,
        comprehensiveRate: 4.1,
      },
    },
    accountingStatus: 'pending',
    author: '张工',
    fillDate: '2026-05-15',
    energyPrices: prices,
    zoneConfigs,
    savingEquipments: {},
    originalEquipments: [],
    decisionData: {
      investmentMode: 'EMC-trust' as const,
      operatingPeriod: 10,
      avgOperatingIncome: 85.6,
      avgNetProfit: 42.3,
      staticPaybackPeriod: 5,
      dynamicPaybackPeriod: 6.2,
      totalInvestmentReturn: 18.5,
      accountingStatus: 'pending' as const,

      author: '张工',
      fillDate: '2026-05-15',

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
    },
  };
}

export function getSeedData() {
  const project = getSeedProject();
  return {
    projects: [project],
    projectsStep1Data: { [SEED_PROJECT_ID]: getSeedStep1Data() },
    projectsStep2Data: { [SEED_PROJECT_ID]: getSeedProjectStep2Data() },
    projectsStep3Data: { [SEED_PROJECT_ID]: getSeedProjectStep3Data(SEED_PROJECT_ID) },
    projectsStep4Data: { [SEED_PROJECT_ID]: getSeedProjectStep4Data(project.location) },
    projectsStep2RateCompleted: {},
    projectsStep3SelectedTechs: { [SEED_PROJECT_ID]: ['1', '3', '4'] },
  };
}