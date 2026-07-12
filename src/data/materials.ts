// 系统素材库 — 预置参考数据
// 包括节能技术、设备/材料品牌、技术参数、预算报价等

export interface TechEntry {
  id: string;
  name: string;
  category: '能源高效利用技术' | '智能控制及优化技术' | '可再生能源利用技术';
  affectedSystems: string[];        // 作用系统
  energyType: string;                // 能耗种类
  mutexTech: string;                 // 技术互斥（"-" 表示无）
  energySavingRate: string;          // 基准节能率区间
  savingRates: {                     // 节能率4档取值
    v1: number;                      // 无历史数据（取大值）
    v2: number;                      // 偏差 ≤10%（取大值）
    v3: number;                      // 偏差 10%-20%（取中值）
    v4: number;                      // 偏差 >20%（取小值）
  };
  savingBasis: string;               // 节能率核心依据说明
  principle: string;                 // 技术原理
  advantage: string;                 // 解决运营痛点
  applicableHospitalTypes: string;   // 医院类型及规模（描述性字符串）
  minArea: number;                   // 最小建筑面积（㎡，0 = 无限制）
  climateZones: string[];            // 适用气候分区
  energySystemType: string;          // 能源系统类型
  applicableDepts: string[];         // 适用科室
  investmentIndex: string;           // 固定投资额指标
  annualEnergy: string;              // 年运行能耗
  paybackPeriod: string;             // 静态投资回报期
}

export interface DefaultRow {
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  isMainEquipment?: boolean;
  powerKw?: number;
  remark?: string;
  costType?: 'repair' | 'labor';
}

export interface TechDefaultInvestment {
  techId: string;
  equipment: DefaultRow[];
  materials: DefaultRow[];
  installation: DefaultRow[];
  maintenance: DefaultRow[];
}

export const techEntries: TechEntry[] = [
  {
    id: '1',
    name: '相变储热供暖技术',
    category: '能源高效利用技术',
    affectedSystems: ['供暖系统（电耗）', '供暖系统（气耗）', '供暖系统（市政）'],
    energyType: '电耗',
    mutexTech: '地源/空气源热泵多能源耦合供热技术',
    energySavingRate: '5%-15%',
    savingRates: { v1: 0.15, v2: 0.15, v3: 0.10, v4: 0.05 },
    savingBasis: '利用低谷电/余热蓄热并在峰时供热，降低供热主机低效运行和峰时能耗；适合峰谷价差大、供暖负荷稳定的医院。',
    principle: '利用相变材料在相变温度区间吸收和释放潜热，夜间或低价时段蓄热，白天或峰价时段向供暖系统放热。',
    advantage: '缓解供暖峰值负荷、电价高峰运行成本、锅炉/热泵频繁启停、低负荷效率低等问题。',
    applicableHospitalTypes: '二级及以上综合医院、专科医院；供暖负荷稳定的北方院区',
    minArea: 40000,
    climateZones: ['严寒地区', '寒冷地区', '夏热冬冷北部'],
    energySystemType: '集中供热、热泵供热或电锅炉供热系统，具备蓄热设备布置空间',
    applicableDepts: ['全院供暖区域', '门诊', '病房', '医技供暖分区'],
    investmentIndex: '800-1200元/kWh（蓄热容量）或按供热负荷折算',
    annualEnergy: '按供暖系统年耗电/耗气量实测',
    paybackPeriod: '4~6年',
  },
  {
    id: '2',
    name: 'IoT+数字孪生+AI前馈调节技术',
    category: '智能控制及优化技术',
    affectedSystems: ['全机电系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '10%-15%',
    savingRates: { v1: 0.15, v2: 0.15, v3: 0.125, v4: 0.10 },
    savingBasis: '针对医院24小时波动负荷进行预测和优化，全系统节能，实测平均约15%，最高可达22%。',
    principle: '通过物联网感知、数字孪生模型、天气/门急诊量/历史负荷预测，提前优化冷热源、输配、末端和照明等运行参数。',
    advantage: '解决人工巡检滞后、策略依赖经验、设备低负荷低效、冷热源供需错配、能耗异常发现慢等问题。',
    applicableHospitalTypes: '综合医院（三级/二级）、专科医院（三级/二级）',
    minArea: 60000,
    climateZones: ['严寒地区', '寒冷地区', '夏热冬冷地区', '夏热冬暖地区'],
    energySystemType: '集中式能源系统（冷热源、变配电、空调水系统等）',
    applicableDepts: ['全院范围'],
    investmentIndex: '150万（固）+125元/㎡（浮）',
    annualEnergy: '-',
    paybackPeriod: '6~8年',
  },
  {
    id: '3',
    name: '地源/空气源热泵多能源耦合供热技术',
    category: '可再生能源利用技术',
    affectedSystems: ['空调制冷系统（电耗）', '空调制冷系统（气耗）', '空调制冷系统（区域）', '供暖系统（电耗）', '供暖系统（气耗）', '供暖系统（市政）'],
    energyType: '电耗',
    mutexTech: '相变储热供暖技术',
    energySavingRate: '30%-40%',
    savingRates: { v1: 0.40, v2: 0.40, v3: 0.35, v4: 0.30 },
    savingBasis: '替代或削减传统燃气锅炉供热量，热泵承担基础负荷、锅炉/市政热力承担尖峰和应急，医院项目经验节能约30%-40%。',
    principle: '以地源/空气源热泵承担基础供热，锅炉、市政或电辅热承担尖峰和应急，通过控制策略按室外温度、负荷率和能效择优切换。',
    advantage: '降低燃气锅炉长期低效运行和碳排放，缓解单一热泵低温衰减与医院连续供热可靠性的矛盾。',
    applicableHospitalTypes: '二级及以上综合医院、专科医院；有集中供热或冷热源站',
    minArea: 40000,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区'],
    energySystemType: '集中式冷热源/供热系统，具备地埋管、室外机位或原锅炉耦合条件',
    applicableDepts: ['全院范围'],
    investmentIndex: '750-3000元/kW（空气源/地源及高温热泵配置差异）',
    annualEnergy: '按供暖系统年耗气量/耗电量实测',
    paybackPeriod: '4~6年',
  },
  {
    id: '4',
    name: '智能照明控制技术',
    category: '智能控制及优化技术',
    affectedSystems: ['照明系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '40%-60%',
    savingRates: { v1: 0.60, v2: 0.60, v3: 0.50, v4: 0.40 },
    savingBasis: '荧光灯升级LED灯并叠加智能控制，医院场景（含24小时运行区域）实测平均约50%。',
    principle: '通过人体感应、照度采集、时段策略和调光控制，按区域/场景自动开关、调光和远程运维。',
    advantage: '解决公共区长明灯、照度过量、夜间低人流区域无效照明、人工巡检维护滞后等问题。',
    applicableHospitalTypes: '综合医院、专科医院、妇幼保健院；新建及既有改造均适用',
    minArea: 10000,
    climateZones: ['不限'],
    energySystemType: '照明配电系统，宜具备分回路控制及手动旁路',
    applicableDepts: ['门诊大厅', '候诊区', '病房走廊', '护士站', '地下车库', '行政办公区', '景观区域', '普通病房', '术后康复区', '检验科办公区'],
    investmentIndex: '80-180元/㎡（照明改造面积，含传感器/控制模块）',
    annualEnergy: '按照明系统年电耗实测',
    paybackPeriod: '1~3年',
  },
  {
    id: '5',
    name: '洁净区域冷热源升级技术（四管制/六管制）',
    category: '能源高效利用技术',
    affectedSystems: ['洁净空调系统（电耗/气耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '25%-35%',
    savingRates: { v1: 0.35, v2: 0.35, v3: 0.30, v4: 0.25 },
    savingBasis: '解决洁净区冷热抵消和常年供冷问题，四管制/六管制风冷热泵可回收冷凝热制备热水；净化区专项改造经验节能约25%-35%。',
    principle: '以四管制或六管制风冷热泵替代传统专用冷源+燃气锅炉/电加热，通过冷、热、卫生热水多回路协同和热回收实现一体化供能。',
    advantage: '降低洁净区全年供冷、再热、卫生热水独立制备能耗，同时保障恒温恒湿、正压和连续供能。',
    applicableHospitalTypes: '二级及以上综合/专科医院；配置手术中心、ICU、DSA、PIVAS、CSSD等洁净区域',
    minArea: 800,
    climateZones: ['寒冷地区', '夏热冬冷地区', '夏热冬暖地区', '严寒地区'],
    energySystemType: '洁净区独立冷热源或可改造专用冷热源系统；风冷机组四管制或六管制均可',
    applicableDepts: ['洁净区域', '手术中心', 'ICU', 'CSSD', 'DSA', 'PIVAS'],
    investmentIndex: '1800-2800元/kW（冷热源装机，四管制低、六管制高）',
    annualEnergy: '按洁净空调年电耗/燃气耗量实测',
    paybackPeriod: '3~5年',
  },
  {
    id: '6',
    name: '高效空调制冷机房技术',
    category: '能源高效利用技术',
    affectedSystems: ['空调制冷系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '20%-30%',
    savingRates: { v1: 0.30, v2: 0.30, v3: 0.25, v4: 0.20 },
    savingBasis: '高效机房通过高效主机、输配、冷却塔和群控提升全年综合能效；全年EER≥5.0可作为高效机房判定参考，既有项目经验节能约20%-30%。',
    principle: '通过高效冷水机组、冷却塔、变频输配、水力平衡和群控优化，实现冷源系统全工况能效寻优。',
    advantage: '解决主机低效、泵耗偏高、冷却塔效率低、供回水温差小、人工控制滞后、机房长期低EER等问题。',
    applicableHospitalTypes: '二级及以上综合医院、专科医院；配置集中空调冷源系统',
    minArea: 30000,
    climateZones: ['寒冷地区', '严寒地区', '夏热冬冷地区', '夏热冬暖地区'],
    energySystemType: '集中式冷源系统（冷水机组+冷却塔+冷冻/冷却水系统）',
    applicableDepts: ['全院范围'],
    investmentIndex: '600-1200元/㎡（制冷机房服务面积折算）或1800-2600元/kW（冷量）',
    annualEnergy: '按制冷机房年电耗或kWh/㎡·a实测',
    paybackPeriod: '3~6年',
  },
  {
    id: '7',
    name: '冷水机组冷凝热回收技术',
    category: '能源高效利用技术',
    affectedSystems: ['生活热水系统（气耗）', '生活热水系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '10%-25%',
    savingRates: { v1: 0.25, v2: 0.25, v3: 0.175, v4: 0.10 },
    savingBasis: '制冷季回收冷水机组冷凝热用于生活/卫生热水预热，减少锅炉或电热制热量；热水需求与制冷负荷重合度越高收益越高。',
    principle: '在冷凝器侧设置热回收换热器或热回收主机，利用原本排至冷却塔的冷凝热制备/预热生活热水、再热水或工艺热水。',
    advantage: '解决冷却塔排热浪费、生活热水/再热单独耗能、夏季冷却塔负荷高等问题。',
    applicableHospitalTypes: '二级及以上综合医院、专科医院；有稳定生活热水或再热需求',
    minArea: 30000,
    climateZones: ['夏热冬暖地区', '夏热冬冷地区', '寒冷地区', '严寒地区'],
    energySystemType: '水冷冷水机组或热回收型冷水机组；需具备热水储存与换热条件',
    applicableDepts: ['病房热水', '手术部再热', 'ICU', 'CSSD', '厨房', '洗衣房'],
    investmentIndex: '150-350元/kW（热回收换热量）',
    annualEnergy: '按生活热水/再热年耗气量或耗电量实测',
    paybackPeriod: '2~5年',
  },
  {
    id: '8',
    name: '冷却塔供冷技术',
    category: '能源高效利用技术',
    affectedSystems: ['空调制冷系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '15%-40%',
    savingRates: { v1: 0.40, v2: 0.40, v3: 0.275, v4: 0.15 },
    savingBasis: '完全免费供冷时系统功耗约为原制冷系统40%-50%，综合节能50%-60%；部分免费供冷时制冷系统节能约15%-40%。',
    principle: '在过渡季/冬季湿球温度较低时，利用冷却塔制取低温冷却水，经板式换热器间接冷却冷冻水，替代或预冷机械制冷。',
    advantage: '降低过渡季小负荷开冷机能耗，解决内区全年供冷、冷机低负荷效率低、压缩机频繁启停等问题。',
    applicableHospitalTypes: '二级或三级医院；集中冷水系统完善，内区冷负荷占比≥20%',
    minArea: 50000,
    climateZones: ['温和地区', '寒冷地区', '严寒地区', '夏热冬冷北部'],
    energySystemType: '冷却塔+冷水机组+冷冻/冷却水系统，需板式换热和防冻措施',
    applicableDepts: ['内区房间', '全年供冷非洁净区域'],
    investmentIndex: '60-150元/㎡（可接入供冷面积）或80-180元/kW（板换能力）',
    annualEnergy: '按过渡季制冷系统年电耗实测',
    paybackPeriod: '4~7年',
  },
  {
    id: '9',
    name: '蒸汽锅炉系统冷凝水余热回收技术',
    category: '能源高效利用技术',
    affectedSystems: ['生活热水系统（气耗）', '生活热水系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '5%-15%',
    savingRates: { v1: 0.15, v2: 0.15, v3: 0.10, v4: 0.05 },
    savingBasis: '回收蒸汽凝结水显热和闪蒸汽，提升锅炉给水温度，降低补水、排污和燃料消耗；收益取决于闭式回收比例和用汽连续性。',
    principle: '将各用汽点凝结水通过闭式管网回收至凝结水箱/除氧器，并通过换热或闪蒸汽回收用于锅炉补水、生活热水或工艺预热。',
    advantage: '解决凝结水直接排放、补水温度低、软化水和燃气浪费、锅炉房热污染等问题。',
    applicableHospitalTypes: '设有集中蒸汽锅炉的综合医院、专科医院；用汽点连续且分布清晰',
    minArea: 20000,
    climateZones: ['不限'],
    energySystemType: '蒸汽锅炉房、中心供应、洗衣房、厨房、空调加湿蒸汽系统',
    applicableDepts: ['厨房', '洗衣房', '中心供应（CSSD）', '空调系统'],
    investmentIndex: '10-30万元/t蒸汽量（按回收管网距离和闭式回收配置）',
    annualEnergy: '按锅炉年耗气量/蒸汽量实测',
    paybackPeriod: '1~3年',
  },
  {
    id: '10',
    name: '蓄冷技术',
    category: '能源高效利用技术',
    affectedSystems: ['空调制冷系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '0%-10%',
    savingRates: { v1: 0.10, v2: 0.10, v3: 0.05, v4: 0 },
    savingBasis: '冰/水蓄冷利用低谷电制冷并在峰段释冷，降低峰段冷机运行和需量；典型医院冰蓄冷联合基载主机案例可实现约20%节能或费用优化。',
    principle: '低谷时段由双工况冷机或常规冷机制冰/蓄冷，日间峰段释冷削峰填谷，可与基载主机、冷却塔供冷联动。',
    advantage: '解决夏季峰值负荷高、电费峰谷差大、变压器容量紧张、冷机峰段满载运行等问题。',
    applicableHospitalTypes: '三级/二级综合医院、区域医疗中心；空调负荷稳定且峰谷电价差大',
    minArea: 50000,
    climateZones: ['夏热冬冷地区', '夏热冬暖地区', '寒冷地区'],
    energySystemType: '集中式冷水系统，具备蓄冷罐/蓄冰槽空间和自控切换条件',
    applicableDepts: ['全院范围', '门诊', '医技', '病房'],
    investmentIndex: '水蓄冷600-1000元/kWh、冰蓄冷800-1200元/kWh（蓄冷量）',
    annualEnergy: '按制冷系统年电耗和分时电价核算',
    paybackPeriod: '3~5年',
  },
  {
    id: '11',
    name: '分时分区供暖技术',
    category: '智能控制及优化技术',
    affectedSystems: ['供暖系统（气耗）', '供暖系统（热耗）', '供暖系统（电耗）'],
    energyType: '气耗/热耗/电耗',
    mutexTech: '-',
    energySavingRate: '10%-20%',
    savingRates: { v1: 0.20, v2: 0.20, v3: 0.15, v4: 0.10 },
    savingBasis: '按门诊、病房、急诊、地下车库等运行时间和温度需求分区控制；严寒/寒冷地区供暖季长、负荷差异大，节能收益明显。',
    principle: '通过分区管路、电动调节阀、温控器、热量表和BMS时段策略，按区域实际使用时段和设定温度供热。',
    advantage: '解决全院统一高温供暖、夜间低使用区域过热、门诊与病房运行规律不同、供热计量缺失等问题。',
    applicableHospitalTypes: '二级及以上综合医院、专科医院；门诊/医技/后勤与24h区域边界清晰',
    minArea: 30000,
    climateZones: ['严寒地区', '寒冷地区', '夏热冬冷地区'],
    energySystemType: '集中供暖或空调热水系统，具备可分区调节或改造阀门条件',
    applicableDepts: ['门诊', '候诊', '走廊', '办公', '地下车库', '库房'],
    investmentIndex: '20-60元/㎡（供暖面积，阀门/计量/控制改造）',
    annualEnergy: '按供暖季热耗/气耗/电耗实测',
    paybackPeriod: '2~4年',
  },
  {
    id: '12',
    name: '光储充一体化技术',
    category: '可再生能源利用技术',
    affectedSystems: ['全机电系统（电耗）'],
    energyType: '电耗',
    mutexTech: '-',
    energySavingRate: '5%-15%',
    savingRates: { v1: 0.15, v2: 0.15, v3: 0.10, v4: 0.05 },
    savingBasis: '屋顶光伏自发自用降低外购电量，储能配合充电桩和分时电价削峰填谷；收益受屋顶可用面积、负荷消纳和储能策略影响。',
    principle: '将屋顶光伏、储能电池、充电桩和能量管理系统耦合，优先消纳光伏，储能在低谷或光伏富余时充电并在峰段放电。',
    advantage: '解决医院外购电比例高、峰值需量高、充电负荷冲击、屋顶可再生能源利用不足和应急保供韧性不足等问题。',
    applicableHospitalTypes: '新建或既有综合医院、专科医院；屋顶/停车棚可布置光伏且负荷消纳能力强',
    minArea: 30000,
    climateZones: ['全国适用'],
    energySystemType: '低压/中压配电系统，需具备并网接入、储能消防和充电管理条件',
    applicableDepts: ['全院范围', '停车场', '后勤区', '门急诊公共区域'],
    investmentIndex: '光伏3.5-5元/W，储能800-1200元/kWh，充电桩按功率另计',
    annualEnergy: '按全院年购电量、光伏发电量和充电负荷核算',
    paybackPeriod: '5~8年',
  },
];

// ── 能源价格参考基准（按所在地匹配）────────────────────────────────────────────

export interface EnergyPriceReference {
  location: string;       // 省-市 格式，与 Cascader value 一致
  peakPrice: number;      // 高峰电价 元/kWh
  flatPrice: number;      // 平段电价 元/kWh
  valleyPrice: number;    // 低谷电价 元/kWh
  comprehensivePrice: number; // 综合电价 元/kWh
  gasPrice: number;       // 天然气价 元/Nm³
  waterPrice: number;     // 自来水价 元/m³
}

export const energyPriceReferences: EnergyPriceReference[] = [
  { location: '北京市-北京市', peakPrice: 1.0570, flatPrice: 0.6343, valleyPrice: 0.3114, comprehensivePrice: 0.800, gasPrice: 2.87, waterPrice: 9.50 },
  { location: '上海市-上海市', peakPrice: 1.0120, flatPrice: 0.6250, valleyPrice: 0.3020, comprehensivePrice: 0.780, gasPrice: 3.02, waterPrice: 8.75 },
  { location: '广东省-广州市', peakPrice: 0.9850, flatPrice: 0.6180, valleyPrice: 0.2950, comprehensivePrice: 0.760, gasPrice: 3.45, waterPrice: 7.80 },
  { location: '广东省-深圳市', peakPrice: 0.9720, flatPrice: 0.6100, valleyPrice: 0.2880, comprehensivePrice: 0.750, gasPrice: 3.35, waterPrice: 8.25 },
  { location: '浙江省-杭州市', peakPrice: 0.9560, flatPrice: 0.6020, valleyPrice: 0.2850, comprehensivePrice: 0.740, gasPrice: 2.92, waterPrice: 8.60 },
  { location: '浙江省-宁波市', peakPrice: 0.9480, flatPrice: 0.5980, valleyPrice: 0.2800, comprehensivePrice: 0.730, gasPrice: 2.88, waterPrice: 8.30 },
  { location: '江苏省-南京市', peakPrice: 0.9670, flatPrice: 0.6080, valleyPrice: 0.2920, comprehensivePrice: 0.750, gasPrice: 2.85, waterPrice: 8.15 },
  { location: '江苏省-苏州市', peakPrice: 0.9610, flatPrice: 0.6050, valleyPrice: 0.2880, comprehensivePrice: 0.745, gasPrice: 2.80, waterPrice: 8.00 },
  { location: '山东省-济南市', peakPrice: 0.9210, flatPrice: 0.5880, valleyPrice: 0.2760, comprehensivePrice: 0.710, gasPrice: 2.72, waterPrice: 7.20 },
  { location: '山东省-青岛市', peakPrice: 0.9350, flatPrice: 0.5950, valleyPrice: 0.2820, comprehensivePrice: 0.725, gasPrice: 2.78, waterPrice: 7.50 },
  { location: '四川省-成都市', peakPrice: 0.8920, flatPrice: 0.5750, valleyPrice: 0.2680, comprehensivePrice: 0.690, gasPrice: 2.65, waterPrice: 6.85 },
  { location: '湖北省-武汉市', peakPrice: 0.9080, flatPrice: 0.5820, valleyPrice: 0.2720, comprehensivePrice: 0.700, gasPrice: 2.70, waterPrice: 7.10 },
  { location: '湖南省-长沙市', peakPrice: 0.8980, flatPrice: 0.5780, valleyPrice: 0.2700, comprehensivePrice: 0.695, gasPrice: 2.68, waterPrice: 6.95 },
  { location: '河南省-郑州市', peakPrice: 0.8850, flatPrice: 0.5720, valleyPrice: 0.2650, comprehensivePrice: 0.685, gasPrice: 2.60, waterPrice: 6.80 },
  { location: '福建省-厦门市', peakPrice: 0.9420, flatPrice: 0.5920, valleyPrice: 0.2780, comprehensivePrice: 0.720, gasPrice: 2.95, waterPrice: 8.05 },
  { location: '福建省-福州市', peakPrice: 0.9280, flatPrice: 0.5860, valleyPrice: 0.2740, comprehensivePrice: 0.710, gasPrice: 2.90, waterPrice: 7.80 },
  { location: '辽宁省-沈阳市', peakPrice: 0.8760, flatPrice: 0.5650, valleyPrice: 0.2600, comprehensivePrice: 0.675, gasPrice: 2.55, waterPrice: 6.50 },
  { location: '辽宁省-大连市', peakPrice: 0.8880, flatPrice: 0.5700, valleyPrice: 0.2640, comprehensivePrice: 0.685, gasPrice: 2.58, waterPrice: 6.70 },
  { location: '陕西省-西安市', peakPrice: 0.8650, flatPrice: 0.5580, valleyPrice: 0.2550, comprehensivePrice: 0.665, gasPrice: 2.48, waterPrice: 6.30 },
  { location: '重庆市-重庆市', peakPrice: 0.8780, flatPrice: 0.5620, valleyPrice: 0.2580, comprehensivePrice: 0.670, gasPrice: 2.52, waterPrice: 6.60 },
];

export const techDefaultInvestments: TechDefaultInvestment[] = [
  {
    techId: '1',
    equipment: [
      { name: '相变储热单元', specification: 'PCM-500', unit: '台', quantity: 4, unitPrice: 35, isMainEquipment: true, powerKw: 120, remark: '核心储热装置' },
      { name: '智能温控系统', specification: 'TC-2000', unit: '套', quantity: 1, unitPrice: 18, isMainEquipment: true, powerKw: 5, remark: '集中控制' },
      { name: '循环水泵', specification: 'NP-80', unit: '台', quantity: 3, unitPrice: 4.5, isMainEquipment: false, powerKw: 22, remark: '变频运行' },
      { name: '蓄热水箱', specification: '10m³', unit: '台', quantity: 2, unitPrice: 12, isMainEquipment: false, powerKw: 3, remark: '常压储罐' },
      { name: '管道阀门', specification: 'DN100', unit: '套', quantity: 1, unitPrice: 6, isMainEquipment: false, powerKw: 1.5, remark: '含电动蝶阀' },
    ],
    materials: [
      { name: '相变材料', specification: 'Na₂SO₄·10H₂O', unit: '吨', quantity: 8, unitPrice: 1.2, remark: '十水硫酸钠' },
      { name: '保温材料', specification: '硅酸铝 50mm', unit: 'm³', quantity: 60, unitPrice: 0.08, remark: '耐高温' },
      { name: '无缝钢管', specification: 'DN80-DN150', unit: '米', quantity: 500, unitPrice: 0.02, remark: '20#钢' },
      { name: '阀门管件', specification: '综合', unit: '套', quantity: 1, unitPrice: 3, remark: '含闸阀截止阀' },
    ],
    installation: [
      { name: '设备安装调试', specification: '', unit: '项', quantity: 1, unitPrice: 12, remark: '含吊装就位' },
      { name: '管道施工', specification: '', unit: '项', quantity: 1, unitPrice: 8, remark: '含焊接试压' },
      { name: '保温施工', specification: '', unit: '项', quantity: 1, unitPrice: 4, remark: '外包保护层' },
      { name: '系统联调', specification: '', unit: '项', quantity: 1, unitPrice: 5, remark: '72h连续运行' },
    ],
    maintenance: [
      { name: '年度检修', specification: '', unit: '次/年', quantity: 1, unitPrice: 8, remark: '全面检查' },
      { name: '温控系统维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 1.5, remark: '参数校准' },
      { name: '水泵维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 0.8, remark: '轴承润滑' },
      { name: '管道巡检', specification: '', unit: '次/年', quantity: 4, unitPrice: 0.3, remark: '泄漏排查' },
      { name: '运维人工费', specification: '', unit: '次/年', quantity: 1, unitPrice: 3, remark: '日常巡检人工', costType: 'labor' as const },
    ],
  },
  {
    techId: '2',
    equipment: [
      { name: 'IoT温湿度传感器', specification: 'TH-100', unit: '个', quantity: 120, unitPrice: 0.05, isMainEquipment: false, powerKw: 0.005, remark: '低功耗无线' },
      { name: 'CO₂浓度传感器', specification: 'CO2-200', unit: '个', quantity: 60, unitPrice: 0.08, isMainEquipment: false, powerKw: 0.008, remark: 'NDIR原理' },
      { name: '边缘计算网关', specification: 'EC-500', unit: '台', quantity: 8, unitPrice: 3.5, isMainEquipment: true, powerKw: 0.5, remark: '数据汇聚节点' },
      { name: '数字孪生服务器', specification: 'DT-Server', unit: '台', quantity: 2, unitPrice: 15, isMainEquipment: true, powerKw: 3, remark: 'GPU推理服务器' },
      { name: 'AI前馈控制器', specification: 'AI-FC-100', unit: '台', quantity: 4, unitPrice: 8, isMainEquipment: true, powerKw: 0.3, remark: '边缘AI推理' },
    ],
    materials: [
      { name: '通信线缆', specification: 'CAT6', unit: '米', quantity: 3000, unitPrice: 0.001, remark: '屏蔽网线' },
      { name: '传感器安装支架', specification: '标准', unit: '套', quantity: 180, unitPrice: 0.01, remark: '吸顶+壁装' },
      { name: '网络交换机', specification: '24口', unit: '台', quantity: 4, unitPrice: 1.2, remark: 'PoE供电' },
    ],
    installation: [
      { name: '传感器安装', specification: '', unit: '项', quantity: 1, unitPrice: 6, remark: '含布线' },
      { name: '网络部署', specification: '', unit: '项', quantity: 1, unitPrice: 4, remark: 'VLAN划分' },
      { name: '系统集成调试', specification: '', unit: '项', quantity: 1, unitPrice: 10, remark: 'BAS对接' },
      { name: 'AI模型训练部署', specification: '', unit: '项', quantity: 1, unitPrice: 15, remark: '含数据标注' },
    ],
    maintenance: [
      { name: '传感器校准', specification: '', unit: '次/年', quantity: 2, unitPrice: 3, remark: '精度漂移修正' },
      { name: '系统升级', specification: '', unit: '次/年', quantity: 1, unitPrice: 5, remark: '固件+算法' },
      { name: '数据维护', specification: '', unit: '次/年', quantity: 4, unitPrice: 1, remark: '清洗归档' },
    ],
  },
  {
    techId: '3',
    equipment: [
      { name: '地源热泵机组', specification: 'GSHP-800', unit: '台', quantity: 2, unitPrice: 65, isMainEquipment: true, powerKw: 280, remark: '制冷+供热双效' },
      { name: '空气源热泵机组', specification: 'ASHP-500', unit: '台', quantity: 3, unitPrice: 28, isMainEquipment: true, powerKw: 180, remark: '辅助冷热源' },
      { name: '多能源耦合控制中心', specification: 'MECC-2000', unit: '套', quantity: 1, unitPrice: 22, isMainEquipment: true, powerKw: 2, remark: '能源调度核心' },
      { name: '蓄热水箱', specification: '20m³', unit: '台', quantity: 2, unitPrice: 15, isMainEquipment: false, powerKw: 5, remark: '常压储罐' },
      { name: '循环水泵', specification: 'NP-150', unit: '台', quantity: 4, unitPrice: 5.5, isMainEquipment: false, powerKw: 37, remark: '变频调速' },
    ],
    materials: [
      { name: '地埋管', specification: 'HDPE DN32', unit: '米', quantity: 8000, unitPrice: 0.005, remark: 'PE100级' },
      { name: '保温材料', specification: '橡塑 40mm', unit: 'm³', quantity: 80, unitPrice: 0.06, remark: 'B1级阻燃' },
      { name: '无缝钢管', specification: 'DN100-DN200', unit: '米', quantity: 800, unitPrice: 0.025, remark: '20#钢' },
      { name: '阀门管件', specification: '综合', unit: '套', quantity: 1, unitPrice: 8, remark: '含蝶阀闸阀' },
    ],
    installation: [
      { name: '地源井施工', specification: '', unit: '项', quantity: 1, unitPrice: 35, remark: '双U型埋管' },
      { name: '设备安装调试', specification: '', unit: '项', quantity: 1, unitPrice: 18, remark: '含减震基础' },
      { name: '管道施工', specification: '', unit: '项', quantity: 1, unitPrice: 12, remark: '含焊接试压' },
      { name: '系统联调', specification: '', unit: '项', quantity: 1, unitPrice: 8, remark: '冷热平衡调试' },
    ],
    maintenance: [
      { name: '热泵机组维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 6, remark: '压缩机检查' },
      { name: '地源井巡检', specification: '', unit: '次/年', quantity: 2, unitPrice: 2, remark: '出水温度监测' },
      { name: '控制系统维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 1.5, remark: '传感器校准' },
      { name: '水泵维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 0.8, remark: '轴承密封更换' },
      { name: '运维人工费', specification: '', unit: '次/年', quantity: 1, unitPrice: 4, remark: '日常巡检人工', costType: 'labor' as const },
    ],
  },
  {
    techId: '4',
    equipment: [
      { name: 'DALI照明控制器', specification: 'DC-64', unit: '台', quantity: 30, unitPrice: 0.35, isMainEquipment: true, powerKw: 0.05, remark: '单灯控制' },
      { name: '照度传感器', specification: 'LS-100', unit: '个', quantity: 80, unitPrice: 0.06, isMainEquipment: false, powerKw: 0.002, remark: '自然光联动' },
      { name: '占空传感器', specification: 'OS-200', unit: '个', quantity: 120, unitPrice: 0.04, isMainEquipment: false, powerKw: 0.002, remark: '人体红外检测' },
      { name: 'DALI网关', specification: 'DG-8', unit: '台', quantity: 10, unitPrice: 0.8, isMainEquipment: true, powerKw: 0.1, remark: '区域网关' },
    ],
    materials: [
      { name: 'DALI通信线缆', specification: '2×0.75', unit: '米', quantity: 5000, unitPrice: 0.0005, remark: '阻燃线缆' },
      { name: '安装支架', specification: '标准', unit: '套', quantity: 200, unitPrice: 0.008, remark: '吸顶式' },
      { name: '配电箱', specification: '8路', unit: '台', quantity: 15, unitPrice: 0.5, remark: '含断路器' },
    ],
    installation: [
      { name: '传感器安装', specification: '', unit: '项', quantity: 1, unitPrice: 4, remark: '含布线' },
      { name: '控制器安装', specification: '', unit: '项', quantity: 1, unitPrice: 3, remark: '灯具配对' },
      { name: '系统调试', specification: '', unit: '项', quantity: 1, unitPrice: 5, remark: '照度场景设定' },
      { name: 'BAS联动对接', specification: '', unit: '项', quantity: 1, unitPrice: 4, remark: 'Modbus协议' },
    ],
    maintenance: [
      { name: '传感器清洁校准', specification: '', unit: '次/年', quantity: 2, unitPrice: 2, remark: '透光率检测' },
      { name: '系统巡检', specification: '', unit: '次/年', quantity: 4, unitPrice: 0.5, remark: '灯具状态排查' },
      { name: '软件升级', specification: '', unit: '次/年', quantity: 1, unitPrice: 1.5, remark: '固件OTA' },
      { name: '运维人工费', specification: '', unit: '次/年', quantity: 1, unitPrice: 2, remark: '日常巡检人工', costType: 'labor' as const },
    ],
  },
  {
    techId: '5',
    equipment: [
      { name: '六管制冷热源机组', specification: '6P-600', unit: '台', quantity: 2, unitPrice: 55, isMainEquipment: true, powerKw: 350, remark: '六管同开冷热同供' },
      { name: 'DDC控制器', specification: 'DDC-300', unit: '台', quantity: 20, unitPrice: 2.5, isMainEquipment: true, powerKw: 0.2, remark: '区域独立控制' },
      { name: '独立再热换热器', specification: 'RH-200', unit: '台', quantity: 10, unitPrice: 3.8, isMainEquipment: false, powerKw: 15, remark: '再热盘管' },
      { name: '温湿度传感器', specification: 'TH-300', unit: '个', quantity: 40, unitPrice: 0.12, isMainEquipment: false, powerKw: 0.005, remark: '高精度型' },
    ],
    materials: [
      { name: '铜管', specification: 'DN15-DN25', unit: '米', quantity: 2000, unitPrice: 0.008, remark: 'TP2紫铜' },
      { name: '保温材料', specification: '橡塑 30mm', unit: 'm³', quantity: 30, unitPrice: 0.07, remark: 'B1级阻燃' },
      { name: '阀门管件', specification: '综合', unit: '套', quantity: 1, unitPrice: 5, remark: '含电动阀' },
      { name: '控制线缆', specification: 'RVV 4×1.0', unit: '米', quantity: 3000, unitPrice: 0.0008, remark: '屏蔽线缆' },
    ],
    installation: [
      { name: '设备安装调试', specification: '', unit: '项', quantity: 1, unitPrice: 15, remark: '含减震隔声' },
      { name: '管路改造施工', specification: '', unit: '项', quantity: 1, unitPrice: 12, remark: '六管同程布置' },
      { name: 'DDC编程调试', specification: '', unit: '项', quantity: 1, unitPrice: 10, remark: 'PID参数整定' },
      { name: '系统联调', specification: '', unit: '项', quantity: 1, unitPrice: 6, remark: '冷热同供验证' },
    ],
    maintenance: [
      { name: '机组年度检修', specification: '', unit: '次/年', quantity: 2, unitPrice: 5, remark: '压缩机润滑油' },
      { name: 'DDC系统维护', specification: '', unit: '次/年', quantity: 2, unitPrice: 2, remark: '逻辑备份更新' },
      { name: '换热器清洗', specification: '', unit: '次/年', quantity: 2, unitPrice: 1.5, remark: '化学清洗' },
      { name: '管路巡检', specification: '', unit: '次/年', quantity: 4, unitPrice: 0.3, remark: '泄漏腐蚀排查' },
      { name: '运维人工费', specification: '', unit: '次/年', quantity: 1, unitPrice: 5, remark: '日常巡检人工', costType: 'labor' as const },
    ],
  },
];
