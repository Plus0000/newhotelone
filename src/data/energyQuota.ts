// Source: 模块2/医院建筑能耗限额标准汇总表.xlsx
// 用途: Step 4 能耗计算 - 按省份/医院等级/能源类型查能耗限额基准值
// 说明: 仅北京/天津有完整数据，其他省份在 Excel 中标注为'无数据/未检索到'
// 录入: 2026-07-14

export interface EnergyQuotaTargets {
  constraint: number | null;
  baseline: number | null;
  guide: number | null;
}

export interface EnergyQuotaLevel {
  comprehensive: EnergyQuotaTargets;
  nonHeating: EnergyQuotaTargets;
  heating: EnergyQuotaTargets;
}

export interface EnergyQuotaRow {
  province: string;
  category: string;
  energyType: string;
  unit: string;
  level3: EnergyQuotaLevel;
  level2: EnergyQuotaLevel;
}

export interface EnergyQuotaNote {
  province: string;
  category: string;
}

// 有数据的行（6 行）
export const energyQuotas: EnergyQuotaRow[] = [
  {
    province: '北京',
    category: '医院建筑集中制冷能耗：单体建筑面积≥20000㎡',
    energyType: '电力',
    unit: 'kWh / (㎡·a)',
    level3: { comprehensive: { constraint: 52.0, baseline: 30.0, guide: 19.0 }, nonHeating: { constraint: 184.0, baseline: null, guide: 124.0 }, heating: { constraint: null, baseline: null, guide: null } },
    level2: { comprehensive: { constraint: 52.0, baseline: 30.0, guide: 19.0 }, nonHeating: { constraint: 98.0, baseline: null, guide: 63.0 }, heating: { constraint: null, baseline: null, guide: null } },
  },
  {
    province: '北京',
    category: '',
    energyType: '天然气',
    unit: 'Nm³ / (㎡·a)',
    level3: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: 2.3, baseline: null, guide: 0.9 }, heating: { constraint: null, baseline: null, guide: null } },
    level2: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: 1.4, baseline: null, guide: 0.4 }, heating: { constraint: null, baseline: null, guide: null } },
  },
  {
    province: '北京',
    category: '',
    energyType: '市政热力',
    unit: 'GJ / (㎡·a)',
    level3: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 0.26, baseline: null, guide: 0.18 } },
    level2: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 0.26, baseline: null, guide: 0.18 } },
  },
  {
    province: '天津',
    category: '非供暖；二级B类（全部采用集中空调制冷）',
    energyType: '电力',
    unit: 'kWh / (㎡·a)',
    level3: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: 216.436126932465, baseline: 186.33034987795, guide: 133.441822620016 }, heating: { constraint: null, baseline: null, guide: null } },
    level2: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: 147.274206672091, baseline: 109.845402766477, guide: 76.4849471114727 }, heating: { constraint: null, baseline: null, guide: null } },
  },
  {
    province: '天津',
    category: '供暖；集中供暖（按热计量收费）',
    energyType: '市政热力',
    unit: 'GJ / (㎡·a)',
    level3: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 0.615474794841735, baseline: 0.468933177022274, guide: 0.366354044548652 } },
    level2: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 21.0, baseline: 16.0, guide: 12.5 } },
  },
  {
    province: '天津',
    category: '供暖；燃气自供暖',
    energyType: '天然气',
    unit: 'Nm³ / (㎡·a)',
    level3: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 17.8195488721804, baseline: 13.609022556391, guide: 10.6015037593985 } },
    level2: { comprehensive: { constraint: null, baseline: null, guide: null }, nonHeating: { constraint: null, baseline: null, guide: null }, heating: { constraint: 23.7, baseline: 18.1, guide: 14.1 } },
  },
];

// 无数据的行（79 行，仅记录省份和说明）
export const energyQuotaNotes: EnergyQuotaNote[] = [
  { province: '河北', category: '未检索到医院/卫生建筑运行能耗限额' },
  { province: '山西', category: '卫生医疗机构' },
  { province: '内蒙古', category: '严寒区（二级）；三级按全区值' },
  { province: '内蒙古', category: '寒冷区A（二级）；三级按全区值' },
  { province: '内蒙古', category: '寒冷区B（二级）；三级按全区值' },
  { province: '辽宁', category: '严寒C区；非供暖不分气候区' },
  { province: '辽宁', category: '寒冷A区；非供暖不分气候区' },
  { province: '吉林', category: '严寒B区' },
  { province: '吉林', category: '严寒C区' },
  { province: '黑龙江', category: '严寒A区；综合医院（未按医院等级拆分）' },
  { province: '黑龙江', category: '严寒B区；综合医院（未按医院等级拆分）' },
  { province: '上海', category: '未能从扫描版中可靠定位医院/卫生建筑限额表' },
  { province: '江苏', category: '三级医院；建筑面积>90000㎡' },
  { province: '江苏', category: '三级医院；45001~90000㎡' },
  { province: '江苏', category: '三级医院；≤45000㎡' },
  { province: '江苏', category: '二级医院；建筑面积>25000㎡' },
  { province: '江苏', category: '二级医院；11001~25000㎡' },
  { province: '江苏', category: '二级医院；≤11000㎡' },
  { province: '浙江', category: '二级及以上医疗机构' },
  { province: '安徽', category: '三级医院；建筑面积>120000㎡' },
  { province: '安徽', category: '三级医院；40001~120000㎡' },
  { province: '安徽', category: '三级医院；≤40000㎡' },
  { province: '安徽', category: '二级医院；建筑面积>40000㎡' },
  { province: '安徽', category: '二级医院；20001~40000㎡' },
  { province: '安徽', category: '二级医院；≤20000㎡' },
  { province: '福建', category: '夏热冬暖地区' },
  { province: '福建', category: '夏热冬冷地区' },
  { province: '江西', category: '医疗机构' },
  { province: '山东', category: '综合医院；济南；空调供冷供暖' },
  { province: '山东', category: '综合医院；青岛；空调供冷供暖' },
  { province: '山东', category: '综合医院；淄博；空调供冷供暖' },
  { province: '山东', category: '综合医院；枣庄；空调供冷供暖' },
  { province: '山东', category: '综合医院；东营；空调供冷供暖' },
  { province: '山东', category: '综合医院；烟台；空调供冷供暖' },
  { province: '山东', category: '综合医院；潍坊；空调供冷供暖' },
  { province: '山东', category: '综合医院；济宁；空调供冷供暖' },
  { province: '山东', category: '综合医院；泰安；空调供冷供暖' },
  { province: '山东', category: '综合医院；威海；空调供冷供暖' },
  { province: '山东', category: '综合医院；日照；空调供冷供暖' },
  { province: '山东', category: '综合医院；莱芜；空调供冷供暖' },
  { province: '山东', category: '综合医院；临沂；空调供冷供暖' },
  { province: '山东', category: '综合医院；德州；空调供冷供暖' },
  { province: '山东', category: '综合医院；聊城；空调供冷供暖' },
  { province: '山东', category: '综合医院；滨州；空调供冷供暖' },
  { province: '山东', category: '综合医院；菏泽；空调供冷供暖' },
  { province: '河南', category: '寒冷地区' },
  { province: '河南', category: '夏热冬冷地区' },
  { province: '湖北', category: '医疗机构' },
  { province: '湖南', category: '医疗机构' },
  { province: '广东', category: '医疗卫生类公共机构；单位为kWh/(㎡·a)' },
  { province: '海南', category: '海口' },
  { province: '海南', category: '三亚' },
  { province: '海南', category: '沿海地区' },
  { province: '海南', category: '中部地区' },
  { province: '广西', category: '桂南地区' },
  { province: '广西', category: '桂北地区' },
  { province: '四川', category: '三级医院（甲等）' },
  { province: '四川', category: '三级医院（乙等及以下）' },
  { province: '四川', category: '二级医院；省、市、区' },
  { province: '四川', category: '二级医院；一类县、二类县' },
  { province: '重庆', category: '甲等医院' },
  { province: '重庆', category: '其它医院' },
  { province: '贵州', category: '文件夹标注无' },
  { province: '云南', category: '医疗卫生单位' },
  { province: '西藏', category: '文件夹标注无' },
  { province: '陕西', category: '供暖Ⅰ区' },
  { province: '陕西', category: '供暖Ⅱ区' },
  { province: '陕西', category: '非供暖区' },
  { province: '甘肃', category: '严寒地区；二级及以上医院' },
  { province: '甘肃', category: '寒冷地区；二级及以上医院' },
  { province: '甘肃', category: '夏热冬冷地区；二级及以上医院' },
  { province: '青海', category: 'A区' },
  { province: '青海', category: 'B区' },
  { province: '青海', category: 'C区' },
  { province: '宁夏', category: '综合医院；未按医院等级拆分' },
  { province: '新疆', category: '标准分列非供暖电耗/其他能源，未折标为模板口径' },
  { province: '台湾', category: '文件夹标注无' },
  { province: '香港', category: '文件夹标注无' },
  { province: '澳门', category: '文件夹标注无' },
];

/** 查能耗限额（返回 null 表示该省份无数据） */
export function getEnergyQuota(
  province: string,
  hospitalLevel: '三级' | '二级' | '一级',
  energyType: string,
  indicator: 'comprehensive' | 'nonHeating' | 'heating',
  target: 'constraint' | 'baseline' | 'guide',
): number | null {
  const level = hospitalLevel === '三级' ? 'level3' : 'level2';
  for (const r of energyQuotas) {
    if (r.province === province && r.energyType === energyType) {
      return r[level][indicator][target];
    }
  }
  return null;
}

/** 查某省份是否有能耗限额数据 */
export function hasEnergyQuota(province: string): boolean {
  return energyQuotas.some(r => r.province === province);
}
