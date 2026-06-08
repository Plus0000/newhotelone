// 系统素材库 — 预置参考数据
// 包括节能技术、设备/材料品牌、技术参数、预算报价等

export interface TechEntry {
  id: string;
  name: string;
  category: 'efficiency' | 'intelligent' | 'renewable';
  score: number;
  rating: 1 | 2 | 3;
  energySavingRate: string;
  investmentIndex: string;
  annualEnergy: string;
  paybackPeriod: string;
  advantage: string;
  principle: string;
  citationCount: number;
  dataAccessCount: number;
  applicableHospitalTypes: string[];
  minArea: number;
  climateZones: string[];
  energySystemType: string;
  applicableScenes: string[];
  applicableDepts: string[];
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
    category: 'efficiency',
    score: 100,
    rating: 3,
    energySavingRate: '35%~45%',
    investmentIndex: '90元/㎡',
    annualEnergy: '23 t Ce/(万㎡·a)',
    paybackPeriod: '2~3年',
    advantage: '高效储热，峰谷电价差套利',
    principle: '利用相变材料（PCM）在固-液相变过程中吸收/释放大量潜热的特性，将夜间谷电时段低价电能转化为热能储存于相变储热单元中，在日间峰电时段释放热能供医院供暖及生活热水使用。系统通过智能温控策略实现充放热自动切换，配合峰谷电价差实现运行成本优化。',
    citationCount: 47,
    dataAccessCount: 312,
    applicableHospitalTypes: ['综合医院', '专科医院'],
    minArea: 30000,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区'],
    energySystemType: '集中式能源系统',
    applicableScenes: ['全院机电系统'],
    applicableDepts: [],
  },
  {
    id: '2',
    name: 'IoT+数字孪生+AI 前馈调节',
    category: 'intelligent',
    score: 85,
    rating: 2,
    energySavingRate: '10%~15%',
    investmentIndex: '150万(固)+125元/㎡（浮）',
    annualEnergy: '-',
    paybackPeriod: '6~8年',
    advantage: 'AI精准控制，系统级节能优化',
    principle: '通过IoT传感器网络实时采集医院各区域温湿度、CO₂浓度、人流量等环境参数，结合数字孪生模型构建建筑能耗虚拟镜像。AI前馈调节算法基于天气预报、科室排班、历史用能模式等多源数据，提前预测冷热负荷需求并动态调节冷热源、水泵、末端设备的运行参数，实现从"被动响应"到"主动前馈"的节能控制升级。',
    citationCount: 38,
    dataAccessCount: 256,
    applicableHospitalTypes: ['综合医院', '专科医院'],
    minArea: 30000,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区'],
    energySystemType: '集中式能源系统',
    applicableScenes: ['全院机电系统'],
    applicableDepts: [],
  },
  {
    id: '3',
    name: '地源/空气源热泵多能源耦合供热',
    category: 'renewable',
    score: 90,
    rating: 3,
    energySavingRate: '30%~40%',
    investmentIndex: '310元/㎡',
    annualEnergy: '27.7 t Ce/(万㎡·a)',
    paybackPeriod: '5~7年',
    advantage: '多能互补，可再生能源最大化利用',
    principle: '以地源热泵和空气源热泵为双热源基础，通过多能源耦合控制中心根据室外温度、地温、电价时段等因素自动切换热源组合模式。在温和天气优先使用空气源热泵降低地源侧冷热不平衡风险；极端天气启动地源热泵保障供热稳定性；峰电时段配合蓄热水箱进行负荷转移。系统通过多能互补策略最大化可再生能源贡献率。',
    citationCount: 52,
    dataAccessCount: 398,
    applicableHospitalTypes: ['综合医院', '专科医院'],
    minArea: 30000,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区'],
    energySystemType: '集中式能源系统',
    applicableScenes: ['全院机电系统'],
    applicableDepts: [],
  },
  {
    id: '4',
    name: '智能照明控制技术',
    category: 'intelligent',
    score: 80,
    rating: 2,
    energySavingRate: '40%~60%',
    investmentIndex: '38元/㎡',
    annualEnergy: '4.1 t Ce/(万㎡·a)',
    paybackPeriod: '1~2年',
    advantage: '低成本快速部署，照明系统独立改造',
    principle: '采用DALI数字可寻址照明接口协议，通过照度传感器和占空传感器实现按需照明。系统支持分区、分时、分组控制策略，可对不同功能区域（诊室、病房、走廊、停车场）设置独立的照明模式。与楼宇自控系统（BAS）联动后，可进一步结合自然采光补偿和科室排班信息进行智能调光，避免过度照明和无效照明。',
    citationCount: 61,
    dataAccessCount: 445,
    applicableHospitalTypes: ['综合医院', '专科医院'],
    minArea: 0,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区', '温和地区'],
    energySystemType: '集中式能源系统',
    applicableScenes: ['全院机电系统', '公共区域'],
    applicableDepts: [],
  },
  {
    id: '5',
    name: '洁净区域冷热源升级（六管制）',
    category: 'efficiency',
    score: 95,
    rating: 3,
    energySavingRate: '25%~35%',
    investmentIndex: '170元/㎡',
    annualEnergy: '3.1 t Ce/(万㎡·a)',
    paybackPeriod: '4~6年',
    advantage: '洁净区域单独控制升级，避免冷热抵消',
    principle: '在传统四管制空调基础上增加独立再热管路（共计六管），使洁净区域（手术室、ICU、中心供应室）的每个末端可同时获得冷冻水、冷却水和独立再热热水。通过DDC控制器对各区域温湿度独立调节，避免传统系统通过冷热抵消实现除湿+再热的高能耗问题，实现温湿度解耦控制，大幅降低洁净区域空调系统能耗。',
    citationCount: 29,
    dataAccessCount: 187,
    applicableHospitalTypes: ['综合医院', '专科医院'],
    minArea: 60000,
    climateZones: ['寒冷地区', '夏热冬冷地区', '严寒地区'],
    energySystemType: '集中式能源系统',
    applicableScenes: ['全院机电系统'],
    applicableDepts: [],
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
