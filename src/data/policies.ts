// 政策绿融库 - 预置参考数据
// 国家/地区能源政策、能源价格（水电气）、绿色金融政策
//
// 数据来源：
// - 全国各省及直辖市主要城市能源价格表（水电气）.xlsx
// - 全国各省及直辖市主要城市能源政策.xlsx -> chatGPT（√）sheet

// ============ 接口定义 ============

export type PolicyLevel = 'national' | 'municipality' | 'province' | 'city' | 'district';
export type PolicyCategory = 'energy' | 'subsidy' | 'green_finance';

export interface PolicyEntry {
  id: string;
  /** 政策适用区域：国家层面 / 北京市 / 东城区 / 南京 / ... */
  region: string;
  /** 区域级别 */
  level: PolicyLevel;
  /** 政策大类：能源/补贴/绿色金融 */
  category: PolicyCategory;
  /** 政策细分类型：EMC/能源托管、碳达峰、新能源供热、专项债... */
  policyType: string;
  /** 政策名称 */
  name: string;
  /** 政策网址 */
  url: string;
  /** 主要内容摘要 */
  summary: string;
  /** 发布年份 */
  publishYear?: string;
  /** 有效期 */
  validPeriod?: string;
  /** 备注 */
  remark?: string;
  /** 峰谷电价差（向下兼容字段，仅旧调用使用） */
  peakValleyPriceDiff?: number;
  /** 低谷电时长（向下兼容字段） */
  valleyHours?: number;
}

export interface ElectricityPrice {
  /** 峰段电价 元/kWh */
  peak: number;
  /** 平段电价 */
  flat: number;
  /** 谷段电价 */
  valley: number;
  /** 尖峰电价（可选） */
  sharp?: number;
  /** 峰段时段 */
  peakHours: string;
  /** 平段时段 */
  flatHours: string;
  /** 谷段时段 */
  valleyHours: string;
  /** 尖峰时段（可选） */
  sharpHours?: string;
  /** 综合电价 元/kWh */
  composite: number;
  /** 低谷电时长 h */
  valleyDuration: number;
  /** 峰谷电价差 元/kWh */
  peakValleyDiff: number;
  /** 政策来源 */
  policyRef: string;
  /** 备注 */
  remark?: string;
}

export interface GasPrice {
  /** 终端销售价 元/Nm³ */
  terminalPrice: number;
  /** 政策来源 */
  policyRef: string;
  /** 备注 */
  remark?: string;
}

export interface WaterPrice {
  /** 终端综合水价 元/m³ */
  composite: number;
  /** 基本水价 */
  base: number;
  /** 污水处理费 */
  sewage: number;
  /** 政策来源 */
  policyRef: string;
  /** 备注 */
  remark?: string;
}

export interface EnergyPriceEntry {
  id: string;
  /** 省份/直辖市 */
  province: string;
  /** 城市（不带「市」字：北京/上海/广州/...） */
  city: string;
  /** 用户类别 */
  userType: string;
  /** 电价信息 */
  electricity?: ElectricityPrice;
  /** 天然气价格 */
  gas?: GasPrice;
  /** 水价 */
  water?: WaterPrice;
}

// ============ 能源价格表 ============

export const energyPrices: EnergyPriceEntry[] = [
  {
    id: 'ep001',
    province: '北京市',
    city: '北京',
    userType: '一般工商业',
    electricity: {
      peak: 1.0572,
      flat: 0.6343,
      valley: 0.3114,
      peakHours: '10:00-13:00、17:00-22:00',
      flatHours: '7:00-10:00、13:00-17:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      sharpHours: '7-8月11:00-13:00、16:00-17:00；1、12月18:00-21:00',
      composite: 0.7177,
      valleyDuration: 8,
      peakValleyDiff: 0.7458,
      policyRef: '《关于进一步完善本市分时电价机制等有关事项的通知》（京发改规〔2023〕11号）',
      remark: '尖峰电价=高峰×(1+20%)，仅特定月份执行'
    },
    gas: {
      terminalPrice: 2.63,
      policyRef: '《关于调整本市非居民用天然气销售价格的通知》（京发改规〔2024〕8 号）',
      remark: '2024.11.1 执行，为基准价，允许供需双方上下浮动 10%'
    },
    water: {
      composite: 9.5,
      base: 5.8,
      sewage: 2.13,
      policyRef: '《关于调整本市非居民用水水资源税和污水处理费有关事项的通知》（京发改规〔2023〕10 号）',
      remark: '非居民工商业用水，含 1.57 元 /m³ 水资源税'
    },
  },
  {
    id: 'ep002',
    province: '上海市',
    city: '上海',
    userType: '一般工商业',
    electricity: {
      peak: 0.943,
      flat: 0.7996,
      valley: 0.4769,
      peakHours: '8:00-11:00、13:00-15:00、18:00-21:00',
      flatHours: '6:00-8:00、11:00-13:00、15:00-18:00、21:00-22:00',
      valleyHours: '22:00-次日6:00',
      composite: 0.7853,
      valleyDuration: 8,
      peakValleyDiff: 0.4661,
      policyRef: '国网上海市电力公司2025年代理购电价格公告',
      remark: '不满1千伏单一制电价，夏季时段略有调整'
    },
    gas: {
      terminalPrice: 4.21,
      policyRef: '《关于调整本市非居民天然气基准门站价格和销售价格的通知》（沪发改价管〔2024〕17 号）',
      remark: '非居民基准价，工业大用户可协商下浮'
    },
    water: {
      composite: 7.93,
      base: 4.43,
      sewage: 2.3,
      policyRef: '《关于调整本市非居民供水价格的通知》（沪发改价管〔2024〕12 号）',
      remark: '非居民工业用水，商业用水同价'
    },
  },
  {
    id: 'ep003',
    province: '天津市',
    city: '天津',
    userType: '一般工商业',
    electricity: {
      peak: 1.0149,
      flat: 0.6343,
      valley: 0.2537,
      peakHours: '08:00-10:00、16:00-22:00（非7-8月）',
      flatHours: '06:00-08:00、10:00-12:00、14:00-16:00、22:00-24:00',
      valleyHours: '00:00-06:00、12:00-14:00',
      composite: 0.6914,
      valleyDuration: 8,
      peakValleyDiff: 0.7612,
      policyRef: '《关于进一步完善我市分时电价机制的通知》（津发改规〔2025〕11号）',
      remark: '7-8月高峰时段为15:00-23:00，峰段电价上浮60%'
    },
    gas: {
      terminalPrice: 3.95,
      policyRef: '《关于调整非居民用管道天然气销售价格的通知》（津发改价管〔2024〕328 号）',
      remark: '一般工商业基准价，最高上浮 5%'
    },
    water: {
      composite: 8.15,
      base: 4.9,
      sewage: 2,
      policyRef: '《关于调整我市非居民用水价格的通知》（津发改价管〔2024〕126 号）',
      remark: '一般工商业用水，含 1.25 元 /m³ 水资源税'
    },
  },
  {
    id: 'ep004',
    province: '重庆市',
    city: '重庆',
    userType: '一般工商业',
    electricity: {
      peak: 0.8696,
      flat: 0.5435,
      valley: 0.3308,
      peakHours: '11:00-17:00、20:00-22:00',
      flatHours: '07:00-11:00、17:00-20:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.6151,
      valleyDuration: 8,
      peakValleyDiff: 0.5388,
      policyRef: '《关于进一步完善我市分时电价机制有关事项的通知》（渝发改规范〔2021〕14号）',
      remark: '1、7、8、12月12:00-14:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 3.4,
      policyRef: '《关于调整我市非居民用气销售价格的通知》（渝发改价格〔2024〕1245 号）',
      remark: '城区工商业基准价，远郊区县略有差异'
    },
    water: {
      composite: 6.85,
      base: 3.75,
      sewage: 1.8,
      policyRef: '《关于调整主城区非居民用水价格的通知》（渝发改价格〔2024〕678 号）',
      remark: '主城区工商业用水'
    },
  },
  {
    id: 'ep005',
    province: '江苏省',
    city: '南京',
    userType: '一般工商业',
    electricity: {
      peak: 1.0358,
      flat: 0.739,
      valley: 0.4634,
      peakHours: '14:00-22:00（夏冬季）',
      flatHours: '6:00-11:00、13:00-14:00、22:00-24:00',
      valleyHours: '0:00-6:00、11:00-13:00',
      composite: 0.7878,
      valleyDuration: 8,
      peakValleyDiff: 0.5724,
      policyRef: '《关于优化工商业分时电价结构...的通知》（苏发改价格发〔2025〕426号）',
      remark: '春秋季时段略有不同，增设午间谷时段'
    },
    gas: {
      terminalPrice: 3.9,
      policyRef: '《关于调整非居民用管道天然气销售价格的通知》（宁发改价格〔2024〕372 号）',
      remark: '一般工商业基准价，大工业用户可下浮'
    },
    water: {
      composite: 6.55,
      base: 3.5,
      sewage: 1.85,
      policyRef: '《关于调整南京市非居民用水价格的通知》（宁发改价格〔2024〕163 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep006',
    province: '浙江省',
    city: '杭州',
    userType: '一般工商业',
    electricity: {
      peak: 1.0123,
      flat: 0.7592,
      valley: 0.4226,
      peakHours: '8:00-11:00、13:00-15:00、18:00-21:00',
      flatHours: '6:00-8:00、11:00-13:00、15:00-18:00、21:00-22:00',
      valleyHours: '22:00-次日6:00',
      composite: 0.7805,
      valleyDuration: 8,
      peakValleyDiff: 0.5897,
      policyRef: '国网浙江省电力有限公司2025年代理购电价格公告',
      remark: '不满1千伏单一制电价，夏季7-8月增设尖峰时段'
    },
    gas: {
      terminalPrice: 3.77,
      policyRef: '《关于调整杭州市区非居民用管道天然气销售价格的通知》（杭发改价格〔2024〕228 号）',
      remark: '市区基准价，允许浮动'
    },
    water: {
      composite: 6.7,
      base: 3.65,
      sewage: 1.8,
      policyRef: '《关于调整杭州市区非居民用水价格的通知》（杭发改价格〔2024〕97 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep007',
    province: '安徽省',
    city: '合肥',
    userType: '一般工商业',
    electricity: {
      peak: 1.0875,
      flat: 0.725,
      valley: 0.4133,
      peakHours: '16:00-24:00（夏季7-9月）',
      flatHours: '0:00-2:00、9:00-11:00、13:00-16:00',
      valleyHours: '2:00-9:00、11:00-13:00',
      composite: 0.7895,
      valleyDuration: 9,
      peakValleyDiff: 0.6742,
      policyRef: '合肥市发展和改革委员会2025年分时电价政策公告',
      remark: '冬季1月、12月高峰时段为15:00-23:00'
    },
    gas: {
      terminalPrice: 3.92,
      policyRef: '《关于调整合肥市非居民用管道天然气销售价格的通知》（合发改价格〔2024〕415 号）',
      remark: '城区最高限价'
    },
    water: {
      composite: 6.35,
      base: 3.3,
      sewage: 1.7,
      policyRef: '《关于调整合肥市非居民用水价格的通知》（合发改价格〔2024〕189 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep008',
    province: '福建省',
    city: '福州',
    userType: '一般工商业',
    electricity: {
      peak: 0.9987,
      flat: 0.735,
      valley: 0.4756,
      peakHours: '8:00-12:00、14:30-21:30',
      flatHours: '7:00-8:00、12:00-14:30、21:30-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7754,
      valleyDuration: 8,
      peakValleyDiff: 0.5231,
      policyRef: '福建省发展和改革委员会2025年分时电价政策',
      remark: '夏季7-9月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 3.97,
      policyRef: '《关于调整福州市区非居民管道天然气销售价格的通知》（榕发改价格〔2024〕137 号）',
      remark: '市区基准价'
    },
    water: {
      composite: 6.4,
      base: 3.4,
      sewage: 1.6,
      policyRef: '《关于调整福州市区非居民用水价格的通知》（榕发改价格〔2024〕65 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep009',
    province: '江西省',
    city: '南昌',
    userType: '一般工商业',
    electricity: {
      peak: 1.0215,
      flat: 0.7025,
      valley: 0.4378,
      peakHours: '10:00-12:00、14:00-22:00',
      flatHours: '7:00-10:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7612,
      valleyDuration: 8,
      peakValleyDiff: 0.5837,
      policyRef: '《关于进一步完善分时电价机制有关事项的通知》（赣发改价管〔2025〕463号）',
      remark: '3-11月增设午间深谷时段12:00-14:00'
    },
    gas: {
      terminalPrice: 4,
      policyRef: '《关于调整南昌市城区非居民用管道天然气销售价格的通知》（洪发改价字〔2024〕189 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.25,
      base: 3.25,
      sewage: 1.6,
      policyRef: '《关于调整南昌市城区非居民用水价格的通知》（洪发改价字〔2024〕78 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep010',
    province: '山东省',
    city: '济南',
    userType: '一般工商业',
    electricity: {
      peak: 1.0532,
      flat: 0.725,
      valley: 0.4314,
      peakHours: '16:00-23:00（7-8月）',
      flatHours: '7:00-16:00、23:00-24:00',
      valleyHours: '0:00-7:00',
      composite: 0.7811,
      valleyDuration: 7,
      peakValleyDiff: 0.6218,
      policyRef: '山东省发展和改革委员会2025年分时电价政策',
      remark: '3-5月高峰时段为17:00-22:00，增设午间谷时段'
    },
    gas: {
      terminalPrice: 4.28,
      policyRef: '《关于调整济南市非居民用管道天然气销售价格的通知》（济发改价格〔2024〕263 号）',
      remark: '市区基准价，上下浮动不超 10%'
    },
    water: {
      composite: 7.1,
      base: 3.95,
      sewage: 1.8,
      policyRef: '《关于调整济南市非居民用水价格的通知》（济发改价格〔2024〕117 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep011',
    province: '河南省',
    city: '郑州',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、18:00-22:00',
      flatHours: '7:00-8:00、12:00-18:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '河南省发展和改革委员会2025年分时电价政策',
      remark: '夏季7-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.8,
      policyRef: '《关于调整郑州市区非居民用管道天然气销售价格的通知》（郑发改价费〔2024〕318 号）',
      remark: '市区基准价'
    },
    water: {
      composite: 6.6,
      base: 3.55,
      sewage: 1.7,
      policyRef: '《关于调整郑州市区非居民用水价格的通知》（郑发改价费〔2024〕142 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep012',
    province: '湖北省',
    city: '武汉',
    userType: '一般工商业',
    electricity: {
      peak: 1.0325,
      flat: 0.725,
      valley: 0.4543,
      peakHours: '10:00-12:00、14:00-22:00',
      flatHours: '7:00-10:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7785,
      valleyDuration: 8,
      peakValleyDiff: 0.5782,
      policyRef: '湖北省发展和改革委员会2025年分时电价政策',
      remark: '夏季7-9月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 3.71,
      policyRef: '《关于调整武汉市非居民用管道天然气销售价格的通知》（武发改价格〔2024〕297 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.45,
      base: 3.45,
      sewage: 1.7,
      policyRef: '《关于调整武汉市非居民用水价格的通知》（武发改价格〔2024〕136 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep013',
    province: '湖南省',
    city: '长沙',
    userType: '一般工商业',
    electricity: {
      peak: 1.0458,
      flat: 0.725,
      valley: 0.4632,
      peakHours: '16:00-24:00',
      flatHours: '6:00-12:00、14:00-16:00',
      valleyHours: '0:00-6:00、12:00-14:00',
      composite: 0.7849,
      valleyDuration: 8,
      peakValleyDiff: 0.5826,
      policyRef: '湖南省发展和改革委员会2025年分时电价新政',
      remark: '1月、7月、8月、12月实施季节性尖峰电价，12:00-14:00为午间谷时段'
    },
    gas: {
      terminalPrice: 4.16,
      policyRef: '《关于调整长沙市非居民用管道天然气销售价格的通知》（长发改价费〔2024〕156 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.5,
      base: 3.5,
      sewage: 1.65,
      policyRef: '《关于调整长沙市非居民用水价格的通知》（长发改价费〔2024〕71 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep014',
    province: '广东省',
    city: '广州',
    userType: '一般工商业',
    electricity: {
      peak: 1.1627,
      flat: 0.8755,
      valley: 0.3011,
      peakHours: '9:00-11:30、14:00-16:30、19:00-21:00',
      flatHours: '7:00-9:00、16:30-19:00、21:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.8611,
      valleyDuration: 8,
      peakValleyDiff: 0.8616,
      policyRef: '广东省发展和改革委员会2025年分时电价政策',
      remark: '珠三角五市峰谷价差全国领先，夏季7-9月增设尖峰时段'
    },
    gas: {
      terminalPrice: 4.47,
      policyRef: '《关于调整广州市非居民管道天然气销售价格的通知》（穗发改价格〔2024〕179 号）',
      remark: '市区基准价，工商业同价'
    },
    water: {
      composite: 6.85,
      base: 3.65,
      sewage: 1.9,
      policyRef: '《关于调整广州市非居民用水价格的通知》（穗发改价格〔2024〕83 号）',
      remark: '市区工商业用水'
    },
  },
  {
    id: 'ep015',
    province: '广西壮族自治区',
    city: '南宁',
    userType: '一般工商业',
    electricity: {
      peak: 1.0235,
      flat: 0.725,
      valley: 0.4553,
      peakHours: '9:00-12:00、14:00-22:00',
      flatHours: '7:00-9:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7755,
      valleyDuration: 8,
      peakValleyDiff: 0.5682,
      policyRef: '广西壮族自治区发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 4.45,
      policyRef: '《关于调整南宁市非居民管道天然气销售价格的通知》（南发改价格〔2024〕211 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.3,
      base: 3.25,
      sewage: 1.65,
      policyRef: '《关于调整南宁市非居民用水价格的通知》（南发改价格〔2024〕97 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep016',
    province: '海南省',
    city: '海口',
    userType: '一般工商业',
    electricity: {
      peak: 1.0123,
      flat: 0.725,
      valley: 0.4536,
      peakHours: '10:00-12:00、14:00-22:00',
      flatHours: '7:00-10:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7713,
      valleyDuration: 8,
      peakValleyDiff: 0.5587,
      policyRef: '海南省发展和改革委员会2025年分时电价政策',
      remark: '夏季4-10月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 4.24,
      policyRef: '《关于调整海口市非居民管道天然气销售价格的通知》（海发改价格〔2024〕283 号）',
      remark: '全省最高限价水平'
    },
    water: {
      composite: 6.75,
      base: 3.6,
      sewage: 1.75,
      policyRef: '《关于调整海口市非居民用水价格的通知》（海发改价格〔2024〕126 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep017',
    province: '四川省',
    city: '成都',
    userType: '一般工商业',
    electricity: {
      peak: 1.0215,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '10:00-12:00、17:00-22:00（春秋季）',
      flatHours: '8:00-10:00、12:00-17:00',
      valleyHours: '22:00-次日8:00',
      composite: 0.7744,
      valleyDuration: 10,
      peakValleyDiff: 0.5682,
      policyRef: '《关于进一步调整我省分时电价机制的通知》（川发改价格〔2025〕185号）',
      remark: '夏季7-9月高峰时段为11:00-18:00、20:00-23:00'
    },
    gas: {
      terminalPrice: 4.23,
      policyRef: '《关于调整成都市非居民用管道天然气销售价格的通知》（成发改价格〔2024〕207 号）',
      remark: '五城区基准价'
    },
    water: {
      composite: 6.15,
      base: 3.15,
      sewage: 1.6,
      policyRef: '《关于调整成都市非居民用水价格的通知》（成发改价格〔2024〕92 号）',
      remark: '五城区工商业用水'
    },
  },
  {
    id: 'ep018',
    province: '贵州省',
    city: '贵阳',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '贵州省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 3.95,
      policyRef: '《关于调整贵阳市非居民用管道天然气销售价格的通知》（筑发改价格〔2024〕168 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.2,
      base: 3.2,
      sewage: 1.55,
      policyRef: '《关于调整贵阳市非居民用水价格的通知》（筑发改价格〔2024〕61 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep019',
    province: '云南省',
    city: '昆明',
    userType: '一般工商业',
    electricity: {
      peak: 1.0215,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '9:00-12:00、17:00-22:00',
      flatHours: '7:00-9:00、12:00-17:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7744,
      valleyDuration: 8,
      peakValleyDiff: 0.5682,
      policyRef: '《关于进一步优化调整分时电价政策的通知》（云发改价格〔2026〕51号）',
      remark: '2026年3月1日起执行，夏季5-9月10:00-12:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.45,
      policyRef: '《关于调整昆明市主城区非居民用管道天然气销售价格的通知》（昆发改价格〔2024〕129 号）',
      remark: '主城区基准价'
    },
    water: {
      composite: 6.4,
      base: 3.35,
      sewage: 1.6,
      policyRef: '《关于调整昆明市主城区非居民用水价格的通知》（昆发改价格〔2024〕58 号）',
      remark: '主城区工商业用水'
    },
  },
  {
    id: 'ep020',
    province: '西藏自治区',
    city: '拉萨',
    userType: '一般工商业',
    electricity: {
      peak: 1.0123,
      flat: 0.725,
      valley: 0.4536,
      peakHours: '10:00-12:00、14:00-22:00',
      flatHours: '7:00-10:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7713,
      valleyDuration: 8,
      peakValleyDiff: 0.5587,
      policyRef: '西藏自治区人民政府办公厅2025年电价调整通知',
      remark: '丰水期5-10月电价下调0.04元/kWh，枯水期11-4月上调0.02元/kWh'
    },
    gas: {
      terminalPrice: 3.35,
      policyRef: '《关于调整拉萨市非居民用管道天然气销售价格的通知》（拉发改价格〔2024〕76 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 5.8,
      base: 3.9,
      sewage: 1.4,
      policyRef: '《关于调整拉萨市非居民用水价格的通知》（拉发改价格〔2024〕32 号）',
      remark: '城区工商业用水，免征水资源税'
    },
  },
  {
    id: 'ep021',
    province: '陕西省',
    city: '西安',
    userType: '一般工商业',
    electricity: {
      peak: 1.0325,
      flat: 0.725,
      valley: 0.4543,
      peakHours: '16:00-23:00',
      flatHours: '6:00-11:00、14:00-16:00、23:00-24:00',
      valleyHours: '0:00-6:00、11:00-14:00',
      composite: 0.7785,
      valleyDuration: 9,
      peakValleyDiff: 0.5782,
      policyRef: '陕西省发展和改革委员会2025年分时电价新政',
      remark: '夏季7月、8月19:00-21:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.24,
      policyRef: '《关于调整西安市非居民用管道天然气销售价格的通知》（市发改价格〔2024〕182 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.9,
      base: 3.8,
      sewage: 1.75,
      policyRef: '《关于调整西安市非居民用水价格的通知》（市发改价格〔2024〕81 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep022',
    province: '甘肃省',
    city: '兰州',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '甘肃省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.45,
      policyRef: '《关于调整兰州市非居民用管道天然气销售价格的通知》（兰发改价格〔2024〕235 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.05,
      base: 3.05,
      sewage: 1.5,
      policyRef: '《关于调整兰州市非居民用水价格的通知》（兰发改价格〔2024〕103 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep023',
    province: '青海省',
    city: '西宁',
    userType: '一般工商业',
    electricity: {
      peak: 1.0123,
      flat: 0.725,
      valley: 0.4536,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7713,
      valleyDuration: 8,
      peakValleyDiff: 0.5587,
      policyRef: '青海省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%'
    },
    gas: {
      terminalPrice: 3.05,
      policyRef: '《关于调整西宁市非居民用管道天然气销售价格的通知》（宁发改价格〔2024〕143 号）',
      remark: '全省最低水平'
    },
    water: {
      composite: 5.9,
      base: 3,
      sewage: 1.45,
      policyRef: '《关于调整西宁市非居民用水价格的通知》（宁发改价格〔2024〕57 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep024',
    province: '宁夏回族自治区',
    city: '银川',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '宁夏回族自治区发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.09,
      policyRef: '《关于调整银川市非居民用管道天然气销售价格的通知》（银发改价格〔2024〕191 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.1,
      base: 3.1,
      sewage: 1.5,
      policyRef: '《关于调整银川市非居民用水价格的通知》（银发改价格〔2024〕76 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep025',
    province: '新疆维吾尔自治区',
    city: '乌鲁木齐',
    userType: '一般工商业',
    electricity: {
      peak: 1.0123,
      flat: 0.725,
      valley: 0.4536,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7713,
      valleyDuration: 8,
      peakValleyDiff: 0.5587,
      policyRef: '新疆维吾尔自治区发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 2.95,
      policyRef: '《关于调整乌鲁木齐市非居民用管道天然气销售价格的通知》（乌发改价费〔2024〕277 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 5.75,
      base: 2.9,
      sewage: 1.4,
      policyRef: '《关于调整乌鲁木齐市非居民用水价格的通知》（乌发改价费〔2024〕121 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep026',
    province: '河北省',
    city: '石家庄',
    userType: '一般工商业',
    electricity: {
      peak: 1.0325,
      flat: 0.725,
      valley: 0.4543,
      peakHours: '16:00-24:00',
      flatHours: '6:00-11:00、14:00-16:00',
      valleyHours: '0:00-6:00、11:00-14:00',
      composite: 0.7785,
      valleyDuration: 9,
      peakValleyDiff: 0.5782,
      policyRef: '河北省发展和改革委员会2025年分时电价新政',
      remark: '11月1日起执行，12:00-14:00为午间深谷时段，电价下浮20%'
    },
    gas: {
      terminalPrice: 4.13,
      policyRef: '《关于调整主城区非居民用管道天然气销售价格的通知》（石发改价格〔2024〕536 号）',
      remark: '城区工商业基准价，冬季采暖期可上浮'
    },
    water: {
      composite: 7.2,
      base: 4.07,
      sewage: 1.8,
      policyRef: '《关于调整主城区非居民用水价格的通知》（石发改价格〔2024〕112 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep027',
    province: '山西省',
    city: '太原',
    userType: '一般工商业',
    electricity: {
      peak: 1.0215,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '6:00-8:00、17:00-24:00（春季）',
      flatHours: '0:00-6:00、16:00-17:00',
      valleyHours: '8:00-16:00',
      composite: 0.7744,
      valleyDuration: 8,
      peakValleyDiff: 0.5682,
      policyRef: '山西省发展和改革委员会2025年分时电价政策征求意见稿',
      remark: '夏季6-8月高峰时段为6:00-8:00、18:00-24:00'
    },
    gas: {
      terminalPrice: 3.65,
      policyRef: '《关于调整太原市城区非居民用管道天然气销售价格的通知》（并发改价字〔2024〕218 号）',
      remark: '2024.10 执行，为最高限价'
    },
    water: {
      composite: 6.95,
      base: 3.85,
      sewage: 1.7,
      policyRef: '《关于调整太原市城区非居民用水价格的通知》（并发改价字〔2024〕89 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep028',
    province: '内蒙古自治区',
    city: '呼和浩特',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '内蒙古自治区发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.78,
      policyRef: '《关于调整呼和浩特市非居民用管道天然气销售价格的通知》（呼发改价字〔2024〕387 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.7,
      base: 3.6,
      sewage: 1.65,
      policyRef: '《关于调整呼和浩特市非居民用水价格的通知》（呼发改价字〔2024〕156 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep029',
    province: '辽宁省',
    city: '沈阳',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '辽宁省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.98,
      policyRef: '《关于调整沈阳市非居民用管道天然气销售价格的通知》（沈发改价格〔2024〕196 号）',
      remark: '工商业最高限价'
    },
    water: {
      composite: 7.05,
      base: 3.95,
      sewage: 1.7,
      policyRef: '《关于调整沈阳市非居民用水价格的通知》（沈发改价格〔2024〕72 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep030',
    province: '吉林省',
    city: '长春',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '吉林省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.75,
      policyRef: '《关于调整长春市非居民用管道天然气销售价格的通知》（长发改价格〔2024〕241 号）',
      remark: '城区基准价'
    },
    water: {
      composite: 6.8,
      base: 3.7,
      sewage: 1.65,
      policyRef: '《关于调整长春市非居民用水价格的通知》（长发改价格〔2024〕108 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep031',
    province: '黑龙江省',
    city: '哈尔滨',
    userType: '一般工商业',
    electricity: {
      peak: 1.0156,
      flat: 0.725,
      valley: 0.4533,
      peakHours: '8:00-12:00、14:00-22:00',
      flatHours: '7:00-8:00、12:00-14:00、22:00-23:00',
      valleyHours: '23:00-次日7:00',
      composite: 0.7724,
      valleyDuration: 8,
      peakValleyDiff: 0.5623,
      policyRef: '黑龙江省发展和改革委员会2025年分时电价政策',
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段'
    },
    gas: {
      terminalPrice: 3.89,
      policyRef: '《关于调整哈尔滨市非居民用管道天然气销售价格的通知》（哈发改价费〔2024〕142 号）',
      remark: '城区基准价，冬季上浮不超 0.2 元'
    },
    water: {
      composite: 6.9,
      base: 3.75,
      sewage: 1.7,
      policyRef: '《关于调整哈尔滨市非居民用水价格的通知》（哈发改价费〔2024〕63 号）',
      remark: '城区工商业用水'
    },
  },
  {
    id: 'ep032',
    province: '广东省',
    city: '深圳',
    userType: '一般工商业',
    gas: {
      terminalPrice: 4.3,
      policyRef: '《关于调整深圳市非居民管道天然气销售价格的通知》（深发改〔2024〕）',
      remark: '工商业气基准销售价格4.30元/Nm³，可在基准价上浮20%、下浮不限范围内协商，医院工商业用户适用'
    },
  },
];

// ============ 政策表 ============
export const policies: PolicyEntry[] = [
  {
    id: 'p001',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: 'EMC/能源托管',
    name: '《深入开展公共机构绿色低碳引领行动促进碳达峰实施方案》',
    url: 'https://www.gov.cn/zhengce/zhengceku/2022-07/01/content_5698808.htm',
    summary: '提出到2025年公共机构单位建筑面积能耗、人均综合能耗等持续下降，并推动约3000个公共机构采用能源费用托管服务；医院类公共机构可采用能源托管/EMC实施空调、照明、锅炉、冷热源和能耗平台改造。',
    publishYear: '2022',
    validPeriod: '2025年',
    remark: '国家层面政策，仅作全国通用依据，不再复制到各城市行。'
  },
  {
    id: 'p002',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: 'EMC/能源托管',
    name: '《公共机构采用能源费用托管服务的意见》',
    url: 'https://www.gov.cn/zhengce/zhengceku/2022-09/07/content_5708774.htm',
    summary: '明确公共机构可通过能源费用托管实施节能改造；合同能源管理服务机构负责诊断、改造、运行维护和节能收益实现，费用可从托管服务费/节能收益中安排。',
    publishYear: '2022',
    validPeriod: '现行有效',
    remark: '适用于医院等公共机构采用能源费用托管、EMC模式的合规依据。'
  },
  {
    id: 'p003',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: 'EMC税收优惠',
    name: '《关于促进节能服务产业发展增值税、营业税和企业所得税政策问题的通知》',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810765/n812156/n812479/c1186174/content.html',
    summary: '符合条件的节能服务公司实施合同能源管理项目，可享受增值税相关优惠；企业所得税自项目取得第一笔生产经营收入所属纳税年度起，第一年至第三年免征、第四年至第六年减半征收。',
    publishYear: '2010',
    validPeriod: '现行政策需结合税务口径复核',
    remark: '实操时需核对节能服务公司资质、合同格式、项目备案/核算和税务机关最新执行口径。'
  },
  {
    id: 'p004',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: '中央预算内投资',
    name: '《节能降碳中央预算内投资专项管理办法》',
    url: 'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/202510/t20251014_1400943.html',
    summary: '中央预算内投资支持节能降碳、重点用能设备更新改造、循环经济等方向；节能降碳项目一般按固定资产投资一定比例安排，单个项目支持额度和比例以当年管理办法及申报通知为准。',
    publishYear: '2025',
    validPeriod: '现行有效',
    remark: '医院项目可关注公共机构节能改造、综合能源、余热利用、高效冷热源、光伏储能等方向，需纳入项目库并满足节能量和手续要求。'
  },
  {
    id: 'p005',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: '超长期特别国债/设备更新',
    name: '《推动大规模设备更新和消费品以旧换新行动方案》及超长期特别国债资金安排',
    url: 'https://www.gov.cn/zhengce/content/202403/content_6939232.htm https://www.gov.cn/zhengce/202407/content_6964756.htm',
    summary: '超长期特别国债支持设备更新、节能降碳、安全改造等领域；医院可关注医疗卫生设备更新、用能设备更新、建筑节能降碳改造等方向，按国家和属地年度申报清单执行。',
    publishYear: '2024-2026',
    validPeriod: '以年度资金通知为准',
    remark: '适合作为医院节能改造与设备更新打包申报的资金依据之一。'
  },
  {
    id: 'p006',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: '政府专项债',
    name: '《关于优化完善地方政府专项债券管理机制的意见》',
    url: 'https://www.gov.cn/zhengce/content/202412/content_6994247.htm',
    summary: '专项债用于有一定收益的公益性项目，并优化投向领域和项目管理；医院基础设施、公共卫生、节能降碳和园区综合能源项目若具备公益属性及收益平衡，可结合专项债论证。',
    publishYear: '2024',
    validPeriod: '现行有效',
    remark: '纯运营型EMC通常不直接等同专项债项目，宜与医院基础设施改造、能源站、公共卫生能力提升等项目包统筹。'
  },
  {
    id: 'p007',
    region: '国家层面',
    level: 'national',
    category: 'green_finance',
    policyType: 'BOT/特许经营',
    name: '《关于规范实施政府和社会资本合作新机制的指导意见》《基础设施和公用事业特许经营管理办法》',
    url: 'https://www.gov.cn/zhengce/content/202311/content_6914161.htm https://www.gov.cn/gongbao/2024/issue_11406/202407/content_6968020.html',
    summary: 'PPP新机制聚焦使用者付费项目，全部采取特许经营模式；BOT、ROT、TOT等应依法开展特许经营、竞争选择社会资本，明确经营收入、运营期限、资产权属和风险分担。',
    publishYear: '2023/2024',
    validPeriod: '现行有效',
    remark: '医院能源站、供热制冷、污水/余热综合利用等有稳定付费或使用者付费场景的项目可进一步论证。'
  },
  {
    id: 'p008',
    region: '北京市',
    level: 'municipality',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《北京市碳达峰实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202211/t20221130_1343045.html',
    summary: '围绕建筑、公共机构、能源消费和绿色低碳技术推广推进碳达峰；医院可从公共建筑节能、能源托管、绿色低碳运营、设备更新等方向匹配。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p009',
    region: '北京市',
    level: 'municipality',
    category: 'subsidy',
    policyType: '公共建筑节能补贴',
    name: '《关于进一步明确民用建筑绿色发展资金奖励项目有关事项的通知》',
    url: 'https://zjw.beijing.gov.cn/bjjs/xxgk/fgwj3/gfxwj/zfcxjsglwyh/436331727/index.shtml',
    summary: '公共建筑节能绿色化改造项目按节能量给予奖励，市级奖励资金标准不超过1200元/吨标准煤；一般要求项目节能率达到相应门槛并完成节能量核定。',
    publishYear: '2024',
    validPeriod: '以年度申报为准',
    remark: '用户举例中的1200元/吨标准煤对应此类北京公共建筑节能绿色化改造奖励口径。'
  },
  {
    id: 'p010',
    region: '北京市',
    level: 'municipality',
    category: 'subsidy',
    policyType: '新能源供热/光伏补贴',
    name: '《北京市发展改革委关于公开征集市政府固定资产投资支持新能源供热项目的通知》',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/zcgk/tzgg/202403/t20240312_3590432.htm https://fgw.beijing.gov.cn/fgwzwgk/zcgk/tzgg/202503/t20250313_4028310.htm',
    summary: '新能源供热项目按装机容量占比、应用类型等给予固定资产投资支持，部分情形支持比例可达20%-30%；北京还对分布式光伏等项目设置市级投资支持口径。',
    publishYear: '2024/2025',
    validPeriod: '以年度征集通知为准',
    remark: '医院可重点关注热泵、再生水/地源/空气源供热、屋顶光伏等与院区能源系统结合的项目。'
  },
  {
    id: 'p011',
    region: '北京市',
    level: 'municipality',
    category: 'energy',
    policyType: '建筑绿色发展规划',
    name: '《北京市民用建筑节能降碳工作方案暨“十四五”时期民用建筑绿色发展规划》',
    url: 'https://zjw.beijing.gov.cn/bjjs/xxgk/fgwj3/gfxwj/zfcxjsglwyh/436331727/index.shtml',
    summary: '提出推动既有公共建筑节能绿色化改造、绿色建筑和可再生能源应用；到2025年累计推动公共建筑节能绿色化改造规模约3000万平方米。',
    publishYear: '2022',
    validPeriod: '至2025年',
    remark: '与公共建筑节能改造奖励政策衔接。'
  },
  {
    id: 'p012',
    region: '东城区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级节能奖励/EMC',
    name: '《东城区支持鼓励节约能源暂行办法》',
    url: 'https://www.beijing.gov.cn/fuwu/lqfw/ztzl/yhyshj/zccs/201906/t20190605_1863000.html',
    summary: '对节能技术改造、合同能源管理等项目设置区级奖励；部分项目按节能量、项目投资或节能效果给予资金支持，具体标准需按东城区现行申报通知和资金办法核定。',
    publishYear: '既有政策',
    validPeriod: '以现行申报为准',
    remark: '区级政策线索，建议申报前向东城区发改委复核最新有效性。'
  },
  {
    id: 'p013',
    region: '东城区',
    level: 'district',
    category: 'energy',
    policyType: '区级节能降碳行动',
    name: '《东城区进一步推进节能降碳工作实施方案（2024年-2025年）》',
    url: 'https://www.bjdch.gov.cn/zwgk/zwgkdt/tzgg/202405/t20240530_3600391.html',
    summary: '提出推进公共建筑、公共机构、重点用能单位节能降碳，推广绿色低碳技术和节能改造；适合医院项目作为区级节能降碳行动场景。',
    publishYear: '2024',
    validPeriod: '2024-2025',
    remark: '区级行动方案，偏方向性。'
  },
  {
    id: 'p014',
    region: '西城区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级绿色低碳补贴',
    name: '《西城区促进绿色低碳高质量发展若干措施》',
    url: 'https://www.bjxch.gov.cn/xxgk/xxxqzcwj/pnidpv958384.html',
    summary: '支持绿色化改造、光伏、绿电和节能技改等：如分布式光伏项目最高可按1200元/kW给予支持且单项不超过100万元；新能源供热可按市级补助给予区级配套，部分项目最高100万元；绿电应用可按0.01元/kWh给予奖励，最高50万元。',
    publishYear: '2024',
    validPeriod: '以年度申报为准',
    remark: '医院若在西城区，可重点核对光伏、新能源供热、绿电和节能改造申报条件。'
  },
  {
    id: 'p015',
    region: '朝阳区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级节能减碳专项资金',
    name: '《朝阳区节能减碳专项资金管理办法》',
    url: 'https://www.bjchy.gov.cn/affair/file/gfxfile/4028805a96fc67e701979b8a62ac6d25.html',
    summary: '支持节能改造、可再生能源、绿色建筑和能耗监测等项目；一般按项目投资、节能量或示范效果给予补助，具体比例和封顶金额以年度申报指南为准。',
    publishYear: '2025',
    validPeriod: '以年度申报为准',
    remark: '区级资金办法。'
  },
  {
    id: 'p016',
    region: '朝阳区',
    level: 'district',
    category: 'energy',
    policyType: '区级项目征集',
    name: '《2025年朝阳区公开征集节能减碳项目的通知》',
    url: 'https://www.bjchy.gov.cn/slh/gsgg/4028805a97e432bb0197f37095eb14d4.html',
    summary: '公开征集节能减碳项目，覆盖建筑节能、可再生能源、绿色建筑、能耗监测平台等方向；医院可按项目类型提交固定资产投资、节能量、能效提升和运行效果材料。',
    publishYear: '2025',
    validPeriod: '2025年度',
    remark: '年度申报通知。'
  },
  {
    id: 'p017',
    region: '海淀区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级节能专项资金',
    name: '《海淀区2025年节能专项资金项目申报指南》',
    url: 'https://zyk.bjhd.gov.cn/zwdt/xxgk/tzgg/202206/P020220617622949108578.pdf https://zyk.bjhd.gov.cn/jbdt/auto4488_51784/zdrw/202601/t20260115_4801833_hd.shtml',
    summary: '支持节能技改、光伏、绿电、认证和能源审计等；示例口径包括按项目投资比例补助、单项封顶，分布式光伏可按装机容量给予补助，绿电可按用电量给予奖励。',
    publishYear: '2025',
    validPeriod: '2025年度',
    remark: '海淀区年度申报需以当年正式指南为准；历史PDF和最新公开页面共同作为线索。'
  },
  {
    id: 'p018',
    region: '丰台区',
    level: 'district',
    category: 'energy',
    policyType: '区级碳达峰',
    name: '《丰台区碳达峰实施方案》',
    url: 'https://www.bjft.gov.cn/ftq/ftzcjd/202406/9b5f4e94e7f2438c98c8638f69c52c5f.shtml',
    summary: '推动建筑、能源、交通、公共机构等领域绿色低碳转型；医院项目可匹配公共建筑节能、新能源应用和公共机构节能管理。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '链接为政策解读页，正式申报需查区级项目通知。'
  },
  {
    id: 'p019',
    region: '通州区',
    level: 'district',
    category: 'energy',
    policyType: '区级绿色低碳/副中心示范',
    name: '《通州区生态文明建设及绿色低碳相关政策》',
    url: 'https://www.bjtzh.gov.cn/bjtz/xxfb/202403/1699314.shtml',
    summary: '围绕城市副中心绿色低碳建设、公共建筑和重点区域低碳转型推进示范；医院园区型节能改造可作为绿色低碳场景论证。',
    publishYear: '2024',
    validPeriod: '以年度任务为准',
    remark: '政策偏综合示范，补贴需看年度项目征集。'
  },
  {
    id: 'p020',
    region: '昌平区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级节能低碳资金',
    name: '《昌平区节能低碳发展资金管理办法》',
    url: 'https://www.bjchp.gov.cn/cpqzf/xxgk2671/gggs/2024052316363989408/index.html',
    summary: '支持新能源和节能低碳项目：分布式光伏、新能源供热、节能技术改造等可按投资比例或市级补助配套给予支持，部分方向单项最高100万元；医院可重点核对院区光伏、热泵和综合节能改造。',
    publishYear: '2024',
    validPeriod: '以年度申报为准',
    remark: '区级资金政策。'
  },
  {
    id: 'p021',
    region: '昌平区',
    level: 'district',
    category: 'energy',
    policyType: '区级绿色低碳项目征集',
    name: '《关于征集2025年昌平区绿色低碳项目的通知》',
    url: 'https://www.bjchp.gov.cn/cpqzf/315734/tzgg34/2025070314462489051/index.html',
    summary: '征集绿色低碳项目，方向包括节能低碳技术、可再生能源、低碳场景和示范项目；医院EMC可按节能量、投资规模和示范性组织材料。',
    publishYear: '2025',
    validPeriod: '2025年度',
    remark: '年度征集通知。'
  },
  {
    id: 'p022',
    region: '大兴区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级碳达峰/绿电奖励',
    name: '《大兴区碳达峰实施方案》及绿电应用奖励政策',
    url: 'https://www.bjdx.gov.cn/bjsdxqrmzf/zwfw/zcjd42/zcjd/2090834/index.html',
    summary: '大兴区推进建筑、公共机构和能源领域低碳转型；公开政策线索显示对企业绿电应用可按0.01元/kWh给予奖励、最高50万元，医院需核对是否符合申报主体和用电范围。',
    publishYear: '2023/2025',
    validPeriod: '以正式通知为准',
    remark: '绿电奖励口径需以大兴区最新正式申报通知复核。'
  },
  {
    id: 'p023',
    region: '房山区',
    level: 'district',
    category: 'energy',
    policyType: '区级碳达峰',
    name: '《房山区碳达峰实施方案》',
    url: 'https://www.bjfsh.gov.cn/zwgk/zcjd/2024zcjd/202406/t20240627_40703610.shtml',
    summary: '推进重点领域节能降碳、绿色建筑和公共机构低碳转型；医院项目可匹配公共建筑节能、新能源替代和用能管理。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '链接为政策解读页。'
  },
  {
    id: 'p024',
    region: '门头沟区',
    level: 'district',
    category: 'energy',
    policyType: '区级碳达峰',
    name: '《门头沟区碳达峰实施方案》',
    url: 'https://www.bjmtg.gov.cn/bjmtg/zwxx/zcjd59/543297297/index.shtml',
    summary: '推动区域绿色低碳转型和重点领域节能降碳；医院项目可关注建筑节能、清洁能源和公共机构节能方向。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '链接为政策解读页。'
  },
  {
    id: 'p025',
    region: '怀柔区',
    level: 'district',
    category: 'energy',
    policyType: '区级碳达峰',
    name: '《怀柔区碳达峰实施方案》',
    url: 'https://www.bjhr.gov.cn/zwgk/zfxxgkjg/qzfbmdh/qfgw_29517/fgwzdgkwj/202402/t20240201_3548492.html',
    summary: '推动建筑、能源和公共机构绿色低碳转型；医院可结合可再生能源、节能技改和能源托管模式申报相关项目。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '区级政策。'
  },
  {
    id: 'p026',
    region: '密云区',
    level: 'district',
    category: 'subsidy',
    policyType: '区级节能减排资金线索',
    name: '《密云区节能减排专项资金管理办法》',
    url: 'https://www.beijing.gov.cn/fuwu/lqfw/ztzl/yhyshj/zccs/201906/t20190605_1863273.html',
    summary: '密云区曾发布节能减排专项资金政策，支持节能改造、节能产品和绿色低碳项目；因政策发布时间较早，医院项目申报前需复核是否延续。',
    publishYear: '既有政策',
    validPeriod: '需复核',
    remark: '较早政策线索。'
  },
  {
    id: 'p027',
    region: '天津',
    level: 'district',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《天津市碳达峰实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202209/t20220928_1337494.html',
    summary: '推进工业、建筑、交通、公共机构等重点领域节能降碳，鼓励绿色建筑、公共机构节能改造和绿色低碳技术应用；医院可结合公共建筑节能和设备更新申报。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '未检索到稳定公开的市级医院节能补贴专项，补贴列不做全国政策占位。'
  },
  {
    id: 'p028',
    region: '上海',
    level: 'district',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《上海市碳达峰实施方案》',
    url: 'https://www.shanghai.gov.cn/nw12344/20220728/75468067a4a848139d2a2eed16ce9e11.html',
    summary: '提出建筑、公共机构、能源利用和绿色低碳技术等重点任务；医院可关注公共建筑节能改造、能源系统优化和绿色低碳运行。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p029',
    region: '上海',
    level: 'district',
    category: 'energy',
    policyType: '合同能源管理专项扶持',
    name: '《上海市工业通信业节能减排和合同能源管理专项扶持办法》',
    url: 'https://sheitc.sh.gov.cn/cyfz/20220527/b909b3fcf5ef4484b8fc20da318d3282.html',
    summary: '对工业和通信业节能减排、合同能源管理项目给予专项扶持；公开口径显示合同能源管理项目可按节能量给予约1500元/吨标准煤补助，单项最高约1000万元，最终以正式办法和申报指南为准。',
    publishYear: '2022',
    validPeriod: '以申报指南为准',
    remark: '医院项目若不属工业通信业，需核对是否可通过建筑节能或其他专项资金渠道申报。'
  },
  {
    id: 'p030',
    region: '上海',
    level: 'district',
    category: 'subsidy',
    policyType: '节能减排专项资金',
    name: '《上海市节能减排专项资金项目申报通知》',
    url: 'https://sheitc.sh.gov.cn/cyfz/20260414/1e15425f982a4811ae74ab2d27222e70.html',
    summary: '年度专项资金支持节能减排、资源综合利用、绿色低碳技术等方向；医院节能改造可关注公共建筑节能、用能设备更新、绿色低碳示范等年度方向。',
    publishYear: '2026',
    validPeriod: '以年度通知为准',
    remark: '年度申报类政策。'
  },
  {
    id: 'p031',
    region: '重庆',
    level: 'district',
    category: 'energy',
    policyType: '节能降碳/公共机构',
    name: '《重庆市工业领域碳达峰实施方案》及公共机构绿色低碳转型政策',
    url: 'https://jjxxw.cq.gov.cn/zwgk_213/zcwj/qtwj/202301/t20230129_11542161.html',
    summary: '推进重点领域节能降碳、绿色建筑、公共机构绿色低碳转型和能源管理；医院可结合公共机构节能、设备更新和能耗在线管理实施。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '市级能源方向政策；未检索到稳定公开的医院类补贴标准。'
  },
  {
    id: 'p032',
    region: '河北省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/建筑节能',
    name: '《河北省碳达峰实施方案》',
    url: 'https://www.hebei.gov.cn/columns/4a7011d7-f7bc-42d6-93e7-e362892163a8/202307/10/496fe07e-b441-4daf-99cd-f1571f337852.html',
    summary: '提出推进建筑、公共机构、重点用能设备和绿色低碳技术改造；医院可按省级政策结合石家庄属地项目库申报。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖石家庄。'
  },
  {
    id: 'p033',
    region: '石家庄',
    level: 'city',
    category: 'energy',
    policyType: '工业节能/低碳技术',
    name: '《石家庄市工业领域碳达峰实施方案》',
    url: 'https://gxj.sjz.gov.cn/columns/4a7011d7-f7bc-42d6-93e7-e362892163a8/202307/10/496fe07e-b441-4daf-99cd-f1571f337852.html',
    summary: '提出推广高效节能设备、绿色低碳技术和能源管理体系；医院若涉及园区能源站或大型用能系统，可借鉴能效提升和技术改造路径。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '工业领域政策，医院适用性需转换论证。'
  },
  {
    id: 'p034',
    region: '太原',
    level: 'city',
    category: 'energy',
    policyType: '国家碳达峰试点',
    name: '《太原市国家碳达峰试点实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202407/P020240731636293740018.pdf',
    summary: '太原作为国家碳达峰试点，提出绿色建筑、节能改造、清洁能源利用和低碳示范等任务；医院可作为公共建筑节能和综合能源示范场景。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '试点方案PDF。'
  },
  {
    id: 'p035',
    region: '辽宁省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《辽宁省碳达峰实施方案》',
    url: 'https://www.ln.gov.cn/web/zwgkx/zfwj/szfwj/2022n/2023042510154064611/index.shtml',
    summary: '推进建筑、公共机构、工业和能源等领域节能降碳，鼓励绿色低碳技术推广；医院可结合省级设备更新、公共机构节能和属地项目库申报。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖沈阳。'
  },
  {
    id: 'p036',
    region: '长春',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《长春市碳达峰实施方案》',
    url: 'https://zwgk.changchun.gov.cn/szf_3410/bgtxxgkml/202302/t20230206_3108054.html',
    summary: '提出能源、建筑、交通、公共机构等领域绿色低碳转型任务，鼓励节能技术改造和低碳示范；医院可围绕公共建筑能效、冷热源系统和能源管理平台实施。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p037',
    region: '哈尔滨',
    level: 'city',
    category: 'energy',
    policyType: '国家碳达峰试点/绿色建筑',
    name: '《哈尔滨新区国家碳达峰试点实施方案》及哈尔滨建筑节能绿色建筑政策',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/t20240822_1392544.html https://www.harbin.gov.cn/haerbin/c104535/202403/c01_975893.shtml',
    summary: '哈尔滨新区试点和市级绿色建筑政策强调建筑领域绿色低碳、节能改造和可再生能源应用；医院项目可从公共建筑节能改造和绿色建筑运营评价切入。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '新区试点不等同全市财政补贴，但可用于示范项目包装。'
  },
  {
    id: 'p038',
    region: '南京',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《南京市碳达峰实施方案》',
    url: 'https://www.nanjing.gov.cn/xxgkn/zfgb/202406/t20240627_4700879.html',
    summary: '提出城市绿色低碳转型、建筑节能、能源效率提升和公共机构示范等任务；医院可结合公共建筑节能改造、能源托管和绿色低碳运营。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p039',
    region: '杭州',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《杭州市碳达峰实施方案》',
    url: 'https://zfgb.hangzhou.gov.cn/upload/default/bigfile/2025/06/03/20250603_9127aa735d04ce7b6db7374113ee9f6d.pdf',
    summary: '部署建筑、能源、产业和公共机构等领域碳达峰行动，支持绿色低碳技术和节能改造；医院可关注公共建筑能效提升、可再生能源和能源管理系统。',
    publishYear: '2025',
    validPeriod: '至2030年前',
    remark: '市级政策PDF。'
  },
  {
    id: 'p040',
    region: '合肥',
    level: 'city',
    category: 'energy',
    policyType: '国家碳达峰试点',
    name: '《合肥市国家碳达峰试点实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/P020240822759359701195.pdf',
    summary: '合肥作为国家碳达峰试点，强调绿色建筑、公共机构低碳运行、能源系统优化和低碳示范项目；医院可按公共建筑节能和零碳场景方向包装。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '试点方案PDF。'
  },
  {
    id: 'p041',
    region: '福州',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《福州市碳达峰实施方案》',
    url: 'https://www.fuzhou.gov.cn/zgfzzt/sjxw/zzbz/zcjd_10808/bszcjd/202507/t20250708_5044470.htm',
    summary: '围绕绿色低碳发展、建筑节能、公共机构示范和能源消费优化展开；医院节能改造可结合建筑和公共机构节能方向推进。',
    publishYear: '2025',
    validPeriod: '至2030年前',
    remark: '链接为政策解读页，正式文件需复核。'
  },
  {
    id: 'p042',
    region: '南昌',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《南昌市碳达峰实施方案》',
    url: 'https://www.nc.gov.cn/ncszf/qtygwj/202303/523fa786009b4115b64ab142fbee4d81.shtml',
    summary: '提出建筑、公共机构、能源消费和绿色低碳技术应用等重点任务；医院项目可从公共建筑节能、用能设备更新和综合能源管理切入。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p043',
    region: '济南',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《济南市碳达峰工作方案》',
    url: 'https://www.jinan.gov.cn/col116027/art/2023/art_116027_4954523.html',
    summary: '围绕能源、建筑、公共机构、绿色低碳技术等领域推进碳达峰；医院可关注公共建筑节能改造、能源系统优化和绿色低碳示范。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p044',
    region: '河南省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《河南省碳达峰实施方案》',
    url: 'https://fgw.henan.gov.cn/2023/02-06/2683896.html',
    summary: '部署建筑、公共机构、节能降碳和绿色低碳技术应用；郑州医院项目可按省级政策结合郑州市项目库和专项资金申报要求执行。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖郑州。'
  },
  {
    id: 'p045',
    region: '武汉',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《武汉市碳达峰实施方案》',
    url: 'https://www.wuhan.gov.cn/zwgk/xxgk/zfwj/szfwj/202404/t20240407_2385049.shtml',
    summary: '提出能源、建筑、公共机构、绿色低碳技术和低碳示范任务；医院可关注公共建筑节能、综合能源改造、能耗监测和设备更新。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p046',
    region: '长沙',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《长沙市碳达峰实施方案》',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202306/t20230612_1029803.shtml',
    summary: '强调建筑节能、绿色低碳技术和公共机构节能示范；医院可结合绿色建筑运营、能源托管和设备更新推进。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '来源为转载，需以长沙市正式文件复核。'
  },
  {
    id: 'p047',
    region: '广州',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《广州市碳达峰实施方案》',
    url: 'https://www.gz.gov.cn/zwgk/fggw/wyzzc/content/post_8876052.html',
    summary: '支持绿色建筑、公共机构节能、低碳园区和示范项目；医院可结合公共建筑节能、综合能源和园区化项目包装。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '市级政策。'
  },
  {
    id: 'p048',
    region: '广州',
    level: 'city',
    category: 'green_finance',
    policyType: '公共机构EMC补助',
    name: '《广州市公共机构合同能源管理办法》',
    url: 'https://www.gz.gov.cn/gfxwj/szfgfxwj/gzsrmzfbgt/content/post_5444899.html',
    summary: '公共机构合同能源管理项目可按年节能量分档补助：节能量50吨标准煤以下补助5万元，50吨至200吨标准煤补助10万元，200吨标准煤及以上补助15万元；医院若属于公共机构，可关注该补助路径。',
    publishYear: '既有政策',
    validPeriod: '现行有效性需复核',
    remark: '广州市公共机构EMC明确补助档位，申报前需核对主管部门最新执行口径。'
  },
  {
    id: 'p049',
    region: '深圳',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/建筑节能',
    name: '《深圳市碳达峰实施方案》',
    url: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zcfg/content/post_11296172.html',
    summary: '提出建筑领域绿色低碳发展、既有建筑节能改造、可再生能源建筑应用和公共机构节能等任务；医院可结合既有建筑节能、光伏、冷热源和能耗平台实施。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '新增深圳市。'
  },
  {
    id: 'p050',
    region: '深圳',
    level: 'city',
    category: 'subsidy',
    policyType: '建筑绿色低碳补贴',
    name: '《深圳市支持建筑领域绿色低碳高质量发展若干措施》',
    url: 'https://zjj.sz.gov.cn/xxgk/tzgg/content/post_10972542.html',
    summary: '支持既有建筑节能改造、绿色建筑、可再生能源建筑应用等；公开政策口径显示既有建筑节能改造可按建筑面积或节能效果给予补贴，部分项目单项最高可达数百万元，最终以住建部门申报指南为准。',
    publishYear: '2023/2024',
    validPeriod: '以申报指南为准',
    remark: '用户新增城市，建议后续按深圳住建年度申报通知细化具体标准。'
  },
  {
    id: 'p051',
    region: '深圳',
    level: 'city',
    category: 'subsidy',
    policyType: '绿色低碳产业/节能资金',
    name: '《深圳市促进绿色低碳产业高质量发展的若干措施》',
    url: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zcfg/content/post_10042966.html',
    summary: '支持绿色低碳产业、节能降碳技术应用和示范项目，医院节能改造可关注低碳场景、能源管理、光伏储能和高效设备应用方向。',
    publishYear: '2022',
    validPeriod: '以配套申报为准',
    remark: '偏产业与场景政策，医院项目需匹配具体申报专题。'
  },
  {
    id: 'p052',
    region: '海口',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《海口市碳达峰实施方案》',
    url: 'https://www.chinacace.org/news/view?id=15130',
    summary: '强调绿色建筑、节能降碳、公共机构示范和清洁能源应用；医院可关注光伏、储能、空调系统节能和能耗管理。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '来源为转载，需以海口市正式文件复核。'
  },
  {
    id: 'p053',
    region: '成都',
    level: 'city',
    category: 'energy',
    policyType: '国家碳达峰试点/公共建筑',
    name: '《国家碳达峰试点（成都）实施方案》',
    url: 'https://cds.sczwfw.gov.cn/art/2025/11/13/art_15398_301066.html',
    summary: '到2030年，成都市电能占终端用能比重力争达到55%，需求侧响应能力达到9%，全市电网安全负荷达到3500万千瓦；新建公共建筑本体达到78%节能要求，绿色低碳产业和公共建筑节能是医院项目重要匹配方向。',
    publishYear: '2025',
    validPeriod: '至2030年前',
    remark: '市级试点政策。'
  },
  {
    id: 'p054',
    region: '成都',
    level: 'city',
    category: 'subsidy',
    policyType: '建筑节能降碳补贴',
    name: '《推动成都市建筑领域节能降碳若干措施》',
    url: 'https://www.ccn.ac.cn/policies-and-regulations/energy-saving-and-emission-reduction/2170.html',
    summary: '设立绿色低碳建筑发展资金：二星级及以上绿色建筑、A级及以上装配式建筑等示范项目最高补贴100万元；超低能耗建筑示范项目最高300万元；公共建筑节能改造最高100万元；企业节能技改按1000元/吨标准煤奖励，单项最高200万元。',
    publishYear: '2024',
    validPeriod: '以申报通知为准',
    remark: '来源为政策汇编转载，需以成都市住建、发改、经信等部门正式文件复核。'
  },
  {
    id: 'p055',
    region: '贵州省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《贵州省碳达峰实施方案》《贵州省公共机构绿色低碳引领行动促进碳达峰实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202211/t20221130_1343039_ext.html https://jgsw.guizhou.gov.cn/ywgzx/ggjgjn_5787382/202207/t20220701_75357286.html',
    summary: '支持建筑、公共机构和重点用能领域节能降碳；公共机构政策可为医院能源托管、能效提升和绿色低碳示范提供依据。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖贵阳。'
  },
  {
    id: 'p056',
    region: '云南省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/清洁能源',
    name: '《云南省碳达峰实施方案》',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202301/t20230105_1009689.shtml',
    summary: '推进建筑、能源、公共机构和绿色低碳技术应用；昆明医院项目可结合公共建筑节能、清洁能源替代和绿色低碳运营。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖昆明；来源为转载，需复核正式文件。'
  },
  {
    id: 'p057',
    region: '陕西省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《陕西省碳达峰实施方案》',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202303/t20230306_1018698.shtml',
    summary: '推动建筑、公共机构、能源效率提升和绿色低碳技术应用；西安医院项目可结合省级政策和西安市项目申报通知执行。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖西安；来源为转载。'
  },
  {
    id: 'p058',
    region: '西安/西咸新区',
    level: 'city',
    category: 'energy',
    policyType: '国家碳达峰试点',
    name: '《西咸新区国家碳达峰试点实施方案》',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/t20240822_1392546.html',
    summary: '强调低碳能源、绿色建筑、零碳园区和示范项目；可为西安都市圈医院园区综合能源、光伏储能和公共建筑节能项目提供包装参考。',
    publishYear: '2024',
    validPeriod: '至2030年前',
    remark: '西咸新区不等同西安全域。'
  },
  {
    id: 'p059',
    region: '甘肃省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《甘肃省碳达峰实施方案》',
    url: 'https://www.gansu.gov.cn/gsszf/c100054/202305/169842573.shtml',
    summary: '部署建筑、公共机构、能源消费和绿色低碳技术等任务；兰州医院项目可结合省级政策和兰州市项目库推进节能降碳改造。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖兰州。'
  },
  {
    id: 'p060',
    region: '青海省',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/清洁能源',
    name: '《青海省碳达峰实施方案》',
    url: 'https://www.qinghai.gov.cn/xxgk/xxgk/fd/zfwj/202212/t20221219_191524.html',
    summary: '支持绿色建筑、公共机构节能、清洁能源替代和能效提升；西宁医院项目可结合可再生能源、供热制冷优化和公共机构节能实施。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖西宁。'
  },
  {
    id: 'p061',
    region: '内蒙古自治区',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《内蒙古自治区碳达峰实施方案》',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202211/t20221119_1005393.shtml',
    summary: '推进重点领域能效提升、建筑节能、公共机构绿色低碳和清洁能源利用；呼和浩特医院项目可结合公共建筑节能和低碳能源供应论证。',
    publishYear: '2022',
    validPeriod: '至2030年前',
    remark: '自治区政策，覆盖呼和浩特；来源为转载。'
  },
  {
    id: 'p062',
    region: '南宁',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共建筑',
    name: '《南宁市碳达峰实施方案》',
    url: 'https://www.ccn.ac.cn/policies-and-regulations/cpcn/1622.html',
    summary: '强调绿色低碳转型、建筑节能和公共机构示范；医院项目可从公共建筑节能、综合能源和园区低碳改造切入。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '来源为政策汇编转载，需复核正式文件。'
  },
  {
    id: 'p063',
    region: '西藏自治区',
    level: 'province',
    category: 'energy',
    policyType: '碳达峰/清洁能源',
    name: '《西藏自治区碳达峰实施方案》',
    url: 'https://ee.xizang.gov.cn/ywgz/sqhj/202312/P020231219429464489882.pdf',
    summary: '支持清洁能源利用、建筑节能、公共机构绿色低碳和重点领域节能改造；拉萨医院项目可关注清洁供暖、光伏和用能系统优化。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '自治区政策，覆盖拉萨。'
  },
  {
    id: 'p064',
    region: '银川',
    level: 'city',
    category: 'energy',
    policyType: '碳达峰/公共机构',
    name: '《银川市碳达峰实施方案（征求意见稿）》及宁夏公共机构能源托管案例',
    url: 'https://www.yinchuan.gov.cn/zmhd/yjzj_7926/qt_72841/202308/P020230810389602176884.pdf https://ecpi.ggj.gov.cn/dfdt/202605/t20260515_49344.htm',
    summary: '银川碳达峰征求稿和宁夏公共机构实践涉及绿色建筑、公共机构节能和能源托管；医院可参考合同能源管理和节能量核算路径。',
    publishYear: '2023/2026',
    validPeriod: '以正式发布为准',
    remark: '第一项为征求意见稿，需复核正式文件。'
  },
  {
    id: 'p065',
    region: '新疆维吾尔自治区',
    level: 'province',
    category: 'energy',
    policyType: '公共机构绿色低碳',
    name: '《新疆维吾尔自治区公共机构绿色低碳引领行动促进碳达峰实施方案》',
    url: 'https://www.cj.gov.cn/u/cms/jgswglj/202309/09134147g8cz.pdf',
    summary: '支持公共机构节能改造、绿色低碳运行、可再生能源利用和合同能源管理；乌鲁木齐医院项目可按公共机构节能路径推进。',
    publishYear: '2023',
    validPeriod: '至2030年前',
    remark: '自治区公共机构政策，覆盖乌鲁木齐。'
  },
];

// ============ 查询函数 ============

const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'];

/** 去掉「市」后缀，用于 city 匹配 */
function normalizeCity(s: string): string {
  if (!s) return '';
  return s.replace(/市$/, '').trim();
}

/**
 * 查询能源价格（水电气）
 * @param locationArr e.g. ['北京市'] 或 ['北京市', '东城区'] 或 ['河北省', '石家庄市']
 */
export function getEnergyPrices(locationArr: string[]): EnergyPriceEntry | null {
  if (!locationArr || locationArr.length === 0) return null;
  const provinceRaw = locationArr[0];
  const cityRaw = locationArr[1] || provinceRaw;

  // 直辖市：locationArr[0] 是「北京市」，city 用「北京」匹配
  if (MUNICIPALITIES.includes(provinceRaw)) {
    const cityNorm = normalizeCity(provinceRaw);
    return energyPrices.find((e) => e.province === provinceRaw && e.city === cityNorm) || null;
  }

  // 普通省市：locationArr[0]=省份，locationArr[1]=市级城市
  const cityNorm = normalizeCity(cityRaw);
  return (
    energyPrices.find((e) => e.province === provinceRaw && e.city === cityNorm) ||
    energyPrices.find((e) => e.province === provinceRaw) ||
    null
  );
}

/**
 * 按城市名直接查电价信息
 * @param city e.g. '北京' / '石家庄' / '深圳'
 */
export function getEnergyPriceByCity(city: string): EnergyPriceEntry | null {
  if (!city) return null;
  const cityNorm = normalizeCity(city);
  return energyPrices.find((e) => e.city === cityNorm) || null;
}

/**
 * 旧接口向下兼容：返回峰谷电价差 + 低谷电时长
 * 内部从 energyPrices 派生
 */
export function getEnergyPriceInfo(
  locationArr: string[]
): { peakValleyPriceDiff: number; valleyHours: number } | null {
  const entry = getEnergyPrices(locationArr);
  if (!entry || !entry.electricity) return null;
  return {
    peakValleyPriceDiff: entry.electricity.peakValleyDiff,
    valleyHours: entry.electricity.valleyDuration,
  };
}

/**
 * 查询能源政策（含碳达峰、新能源供热、EMC、专项债等所有 category）
 * @param locationArr e.g. ['北京市', '东城区'] / ['河北省', '石家庄市'] / ['北京市']
 */
export function queryEnergyPolicies(locationArr: string[]): PolicyEntry[] {
  if (!locationArr || locationArr.length === 0) return [];
  const provinceRaw = locationArr[0];

  // 国家层面政策始终返回
  const results = policies.filter((p) => p.level === 'national');

  if (MUNICIPALITIES.includes(provinceRaw)) {
    // 直辖市：市级 + 区级
    const district = locationArr[1];
    results.push(...policies.filter((p) => p.level === 'municipality' && p.region === provinceRaw));
    if (district) {
      results.push(...policies.filter((p) => p.level === 'district' && p.region === district));
    }
    return results;
  }

  // 普通省市：省级 + 市级
  results.push(...policies.filter((p) => p.level === 'province' && p.region === provinceRaw));
  const cityRaw = locationArr[1];
  if (cityRaw) {
    const cityNorm = normalizeCity(cityRaw);
    results.push(
      ...policies.filter(
        (p) => p.level === 'city' && (p.region === cityRaw || p.region === cityNorm)
      )
    );
  }
  return results;
}

/**
 * 查询补贴类政策（category=subsidy）
 */
export function querySubsidyPolicies(locationArr: string[]): PolicyEntry[] {
  return queryEnergyPolicies(locationArr).filter((p) => p.category === 'subsidy');
}

/**
 * 查询绿色金融类政策（category=green_finance，含 EMC/专项债/BOT 等）
 */
export function queryGreenFinancePolicies(locationArr: string[]): PolicyEntry[] {
  return queryEnergyPolicies(locationArr).filter((p) => p.category === 'green_finance');
}

