// 政策绿融库 - 预置参考数据
// 国家/地区能源政策、能源价格（水电气）、绿色金融政策
//
// 数据来源：
// - 全国各省及直辖市主要城市能源价格表（水电气）.xlsx
// - 全国各省及直辖市主要城市能源政策.xlsx -> chatGPT（√）sheet

// ============ 接口定义 ============

export interface PolicyEntry {
  id: string;
  /** 省份（"国家层面"/"北京市"/"江苏省"） */
  province: string;
  /** 城市（"全国适用"/"全市区域"/"南京"） */
  city: string;
  /** 能源政策（细分类型，如"碳达峰/公共建筑"/"EMC税收优惠"） */
  energyPolicy: string;
  /** 政策类型（"补贴"/"政策"） */
  policyCategory: string;
  /** 发布年份 */
  publishYear: string;
  /** 发布机构 */
  publishOrg: string;
  /** 政策名称（完整名） */
  policyName: string;
  /** 主要内容摘要 */
  summary: string;
  /** 政策网址 */
  url: string;
  /** 有效期 */
  validPeriod?: string;
  /** 备注 */
  remark?: string;
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
      remark: '尖峰电价=高峰×(1+20%)，仅特定月份执行',
    },
    gas: {
      terminalPrice: 2.63,
      policyRef: '《关于调整本市非居民用天然气销售价格的通知》（京发改规〔2024〕8 号）',
      remark: '2024.11.1 执行，为基准价，允许供需双方上下浮动 10%',
    },
    water: {
      composite: 9.5,
      base: 5.8,
      sewage: 2.13,
      policyRef:
        '《关于调整本市非居民用水水资源税和污水处理费有关事项的通知》（京发改规〔2023〕10 号）',
      remark: '非居民工商业用水，含 1.57 元 /m³ 水资源税',
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
      remark: '不满1千伏单一制电价，夏季时段略有调整',
    },
    gas: {
      terminalPrice: 4.21,
      policyRef:
        '《关于调整本市非居民天然气基准门站价格和销售价格的通知》（沪发改价管〔2024〕17 号）',
      remark: '非居民基准价，工业大用户可协商下浮',
    },
    water: {
      composite: 7.93,
      base: 4.43,
      sewage: 2.3,
      policyRef: '《关于调整本市非居民供水价格的通知》（沪发改价管〔2024〕12 号）',
      remark: '非居民工业用水，商业用水同价',
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
      remark: '7-8月高峰时段为15:00-23:00，峰段电价上浮60%',
    },
    gas: {
      terminalPrice: 3.95,
      policyRef: '《关于调整非居民用管道天然气销售价格的通知》（津发改价管〔2024〕328 号）',
      remark: '一般工商业基准价，最高上浮 5%',
    },
    water: {
      composite: 8.15,
      base: 4.9,
      sewage: 2,
      policyRef: '《关于调整我市非居民用水价格的通知》（津发改价管〔2024〕126 号）',
      remark: '一般工商业用水，含 1.25 元 /m³ 水资源税',
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
      remark: '1、7、8、12月12:00-14:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 3.4,
      policyRef: '《关于调整我市非居民用气销售价格的通知》（渝发改价格〔2024〕1245 号）',
      remark: '城区工商业基准价，远郊区县略有差异',
    },
    water: {
      composite: 6.85,
      base: 3.75,
      sewage: 1.8,
      policyRef: '《关于调整主城区非居民用水价格的通知》（渝发改价格〔2024〕678 号）',
      remark: '主城区工商业用水',
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
      remark: '春秋季时段略有不同，增设午间谷时段',
    },
    gas: {
      terminalPrice: 3.9,
      policyRef: '《关于调整非居民用管道天然气销售价格的通知》（宁发改价格〔2024〕372 号）',
      remark: '一般工商业基准价，大工业用户可下浮',
    },
    water: {
      composite: 6.55,
      base: 3.5,
      sewage: 1.85,
      policyRef: '《关于调整南京市非居民用水价格的通知》（宁发改价格〔2024〕163 号）',
      remark: '市区工商业用水',
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
      remark: '不满1千伏单一制电价，夏季7-8月增设尖峰时段',
    },
    gas: {
      terminalPrice: 3.77,
      policyRef: '《关于调整杭州市区非居民用管道天然气销售价格的通知》（杭发改价格〔2024〕228 号）',
      remark: '市区基准价，允许浮动',
    },
    water: {
      composite: 6.7,
      base: 3.65,
      sewage: 1.8,
      policyRef: '《关于调整杭州市区非居民用水价格的通知》（杭发改价格〔2024〕97 号）',
      remark: '市区工商业用水',
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
      remark: '冬季1月、12月高峰时段为15:00-23:00',
    },
    gas: {
      terminalPrice: 3.92,
      policyRef: '《关于调整合肥市非居民用管道天然气销售价格的通知》（合发改价格〔2024〕415 号）',
      remark: '城区最高限价',
    },
    water: {
      composite: 6.35,
      base: 3.3,
      sewage: 1.7,
      policyRef: '《关于调整合肥市非居民用水价格的通知》（合发改价格〔2024〕189 号）',
      remark: '城区工商业用水',
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
      remark: '夏季7-9月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 3.97,
      policyRef: '《关于调整福州市区非居民管道天然气销售价格的通知》（榕发改价格〔2024〕137 号）',
      remark: '市区基准价',
    },
    water: {
      composite: 6.4,
      base: 3.4,
      sewage: 1.6,
      policyRef: '《关于调整福州市区非居民用水价格的通知》（榕发改价格〔2024〕65 号）',
      remark: '市区工商业用水',
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
      remark: '3-11月增设午间深谷时段12:00-14:00',
    },
    gas: {
      terminalPrice: 4,
      policyRef:
        '《关于调整南昌市城区非居民用管道天然气销售价格的通知》（洪发改价字〔2024〕189 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.25,
      base: 3.25,
      sewage: 1.6,
      policyRef: '《关于调整南昌市城区非居民用水价格的通知》（洪发改价字〔2024〕78 号）',
      remark: '城区工商业用水',
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
      remark: '3-5月高峰时段为17:00-22:00，增设午间谷时段',
    },
    gas: {
      terminalPrice: 4.28,
      policyRef: '《关于调整济南市非居民用管道天然气销售价格的通知》（济发改价格〔2024〕263 号）',
      remark: '市区基准价，上下浮动不超 10%',
    },
    water: {
      composite: 7.1,
      base: 3.95,
      sewage: 1.8,
      policyRef: '《关于调整济南市非居民用水价格的通知》（济发改价格〔2024〕117 号）',
      remark: '市区工商业用水',
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
      remark: '夏季7-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.8,
      policyRef: '《关于调整郑州市区非居民用管道天然气销售价格的通知》（郑发改价费〔2024〕318 号）',
      remark: '市区基准价',
    },
    water: {
      composite: 6.6,
      base: 3.55,
      sewage: 1.7,
      policyRef: '《关于调整郑州市区非居民用水价格的通知》（郑发改价费〔2024〕142 号）',
      remark: '市区工商业用水',
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
      remark: '夏季7-9月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 3.71,
      policyRef: '《关于调整武汉市非居民用管道天然气销售价格的通知》（武发改价格〔2024〕297 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.45,
      base: 3.45,
      sewage: 1.7,
      policyRef: '《关于调整武汉市非居民用水价格的通知》（武发改价格〔2024〕136 号）',
      remark: '城区工商业用水',
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
      remark: '1月、7月、8月、12月实施季节性尖峰电价，12:00-14:00为午间谷时段',
    },
    gas: {
      terminalPrice: 4.16,
      policyRef: '《关于调整长沙市非居民用管道天然气销售价格的通知》（长发改价费〔2024〕156 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.5,
      base: 3.5,
      sewage: 1.65,
      policyRef: '《关于调整长沙市非居民用水价格的通知》（长发改价费〔2024〕71 号）',
      remark: '城区工商业用水',
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
      remark: '珠三角五市峰谷价差全国领先，夏季7-9月增设尖峰时段',
    },
    gas: {
      terminalPrice: 4.47,
      policyRef: '《关于调整广州市非居民管道天然气销售价格的通知》（穗发改价格〔2024〕179 号）',
      remark: '市区基准价，工商业同价',
    },
    water: {
      composite: 6.85,
      base: 3.65,
      sewage: 1.9,
      policyRef: '《关于调整广州市非居民用水价格的通知》（穗发改价格〔2024〕83 号）',
      remark: '市区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 4.45,
      policyRef: '《关于调整南宁市非居民管道天然气销售价格的通知》（南发改价格〔2024〕211 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.3,
      base: 3.25,
      sewage: 1.65,
      policyRef: '《关于调整南宁市非居民用水价格的通知》（南发改价格〔2024〕97 号）',
      remark: '城区工商业用水',
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
      remark: '夏季4-10月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 4.24,
      policyRef: '《关于调整海口市非居民管道天然气销售价格的通知》（海发改价格〔2024〕283 号）',
      remark: '全省最高限价水平',
    },
    water: {
      composite: 6.75,
      base: 3.6,
      sewage: 1.75,
      policyRef: '《关于调整海口市非居民用水价格的通知》（海发改价格〔2024〕126 号）',
      remark: '城区工商业用水',
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
      remark: '夏季7-9月高峰时段为11:00-18:00、20:00-23:00',
    },
    gas: {
      terminalPrice: 4.23,
      policyRef: '《关于调整成都市非居民用管道天然气销售价格的通知》（成发改价格〔2024〕207 号）',
      remark: '五城区基准价',
    },
    water: {
      composite: 6.15,
      base: 3.15,
      sewage: 1.6,
      policyRef: '《关于调整成都市非居民用水价格的通知》（成发改价格〔2024〕92 号）',
      remark: '五城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 3.95,
      policyRef: '《关于调整贵阳市非居民用管道天然气销售价格的通知》（筑发改价格〔2024〕168 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.2,
      base: 3.2,
      sewage: 1.55,
      policyRef: '《关于调整贵阳市非居民用水价格的通知》（筑发改价格〔2024〕61 号）',
      remark: '城区工商业用水',
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
      remark: '2026年3月1日起执行，夏季5-9月10:00-12:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.45,
      policyRef:
        '《关于调整昆明市主城区非居民用管道天然气销售价格的通知》（昆发改价格〔2024〕129 号）',
      remark: '主城区基准价',
    },
    water: {
      composite: 6.4,
      base: 3.35,
      sewage: 1.6,
      policyRef: '《关于调整昆明市主城区非居民用水价格的通知》（昆发改价格〔2024〕58 号）',
      remark: '主城区工商业用水',
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
      remark: '丰水期5-10月电价下调0.04元/kWh，枯水期11-4月上调0.02元/kWh',
    },
    gas: {
      terminalPrice: 3.35,
      policyRef: '《关于调整拉萨市非居民用管道天然气销售价格的通知》（拉发改价格〔2024〕76 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 5.8,
      base: 3.9,
      sewage: 1.4,
      policyRef: '《关于调整拉萨市非居民用水价格的通知》（拉发改价格〔2024〕32 号）',
      remark: '城区工商业用水，免征水资源税',
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
      remark: '夏季7月、8月19:00-21:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.24,
      policyRef: '《关于调整西安市非居民用管道天然气销售价格的通知》（市发改价格〔2024〕182 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.9,
      base: 3.8,
      sewage: 1.75,
      policyRef: '《关于调整西安市非居民用水价格的通知》（市发改价格〔2024〕81 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.45,
      policyRef: '《关于调整兰州市非居民用管道天然气销售价格的通知》（兰发改价格〔2024〕235 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.05,
      base: 3.05,
      sewage: 1.5,
      policyRef: '《关于调整兰州市非居民用水价格的通知》（兰发改价格〔2024〕103 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，电价上浮20%',
    },
    gas: {
      terminalPrice: 3.05,
      policyRef: '《关于调整西宁市非居民用管道天然气销售价格的通知》（宁发改价格〔2024〕143 号）',
      remark: '全省最低水平',
    },
    water: {
      composite: 5.9,
      base: 3,
      sewage: 1.45,
      policyRef: '《关于调整西宁市非居民用水价格的通知》（宁发改价格〔2024〕57 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.09,
      policyRef: '《关于调整银川市非居民用管道天然气销售价格的通知》（银发改价格〔2024〕191 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.1,
      base: 3.1,
      sewage: 1.5,
      policyRef: '《关于调整银川市非居民用水价格的通知》（银发改价格〔2024〕76 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 2.95,
      policyRef:
        '《关于调整乌鲁木齐市非居民用管道天然气销售价格的通知》（乌发改价费〔2024〕277 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 5.75,
      base: 2.9,
      sewage: 1.4,
      policyRef: '《关于调整乌鲁木齐市非居民用水价格的通知》（乌发改价费〔2024〕121 号）',
      remark: '城区工商业用水',
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
      remark: '11月1日起执行，12:00-14:00为午间深谷时段，电价下浮20%',
    },
    gas: {
      terminalPrice: 4.13,
      policyRef: '《关于调整主城区非居民用管道天然气销售价格的通知》（石发改价格〔2024〕536 号）',
      remark: '城区工商业基准价，冬季采暖期可上浮',
    },
    water: {
      composite: 7.2,
      base: 4.07,
      sewage: 1.8,
      policyRef: '《关于调整主城区非居民用水价格的通知》（石发改价格〔2024〕112 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月高峰时段为6:00-8:00、18:00-24:00',
    },
    gas: {
      terminalPrice: 3.65,
      policyRef:
        '《关于调整太原市城区非居民用管道天然气销售价格的通知》（并发改价字〔2024〕218 号）',
      remark: '2024.10 执行，为最高限价',
    },
    water: {
      composite: 6.95,
      base: 3.85,
      sewage: 1.7,
      policyRef: '《关于调整太原市城区非居民用水价格的通知》（并发改价字〔2024〕89 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.78,
      policyRef:
        '《关于调整呼和浩特市非居民用管道天然气销售价格的通知》（呼发改价字〔2024〕387 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.7,
      base: 3.6,
      sewage: 1.65,
      policyRef: '《关于调整呼和浩特市非居民用水价格的通知》（呼发改价字〔2024〕156 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.98,
      policyRef: '《关于调整沈阳市非居民用管道天然气销售价格的通知》（沈发改价格〔2024〕196 号）',
      remark: '工商业最高限价',
    },
    water: {
      composite: 7.05,
      base: 3.95,
      sewage: 1.7,
      policyRef: '《关于调整沈阳市非居民用水价格的通知》（沈发改价格〔2024〕72 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.75,
      policyRef: '《关于调整长春市非居民用管道天然气销售价格的通知》（长发改价格〔2024〕241 号）',
      remark: '城区基准价',
    },
    water: {
      composite: 6.8,
      base: 3.7,
      sewage: 1.65,
      policyRef: '《关于调整长春市非居民用水价格的通知》（长发改价格〔2024〕108 号）',
      remark: '城区工商业用水',
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
      remark: '夏季6-8月10:00-12:00为尖峰时段，冬季1月、12月18:00-20:00为尖峰时段',
    },
    gas: {
      terminalPrice: 3.89,
      policyRef: '《关于调整哈尔滨市非居民用管道天然气销售价格的通知》（哈发改价费〔2024〕142 号）',
      remark: '城区基准价，冬季上浮不超 0.2 元',
    },
    water: {
      composite: 6.9,
      base: 3.75,
      sewage: 1.7,
      policyRef: '《关于调整哈尔滨市非居民用水价格的通知》（哈发改价费〔2024〕63 号）',
      remark: '城区工商业用水',
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
      remark:
        '工商业气基准销售价格4.30元/Nm³，可在基准价上浮20%、下浮不限范围内协商，医院工商业用户适用',
    },
  },
];

// ============ 政策表 ============
// 数据来源：全国各省及直辖市主要城市能源政策-20260723.xlsx -> 政策补贴 sheet
// 字段：省份/城市/能源政策/政策类型/发布年份/发布机构（主展示6项）
//      政策名称/主要内容摘要/有效期/网址/备注（点击展开显示）
export const policies: PolicyEntry[] = [
  {
    id: 'p001',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'EMC税收优惠',
    policyCategory: '补贴',
    publishYear: '2010',
    publishOrg: '财政部、国家税务总局',
    policyName: '《关于促进节能服务产业发展增值税、营业税和企业所得税政策问题的通知》',
    summary:
      '符合条件的节能服务公司实施合同能源管理项目，可享受增值税相关优惠；企业所得税自项目取得第一笔生产经营收入所属纳税年度起，第一年至第三年免征、第四年至第六年减半征收。',
    url: 'https://www.mof.gov.cn/gkml/caizhengwengao/2011caizhengwengao/wengao2011diyiqi/201103/t20110331_523918.htm',
    validPeriod: '现行政策需结合税务口径复核',
    remark: '财政部政策正文链接；实操时仍需结合税务机关最新执行口径。',
  },
  {
    id: 'p002',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '中央预算内投资',
    policyCategory: '补贴',
    publishYear: '2025',
    publishOrg: '国家发展改革委',
    policyName: '《节能降碳中央预算内投资专项管理办法》',
    summary:
      '中央预算内投资支持节能降碳、重点用能设备更新改造、循环经济等方向；节能降碳项目一般按固定资产投资一定比例安排，单个项目支持额度和比例以当年管理办法及申报通知为准。',
    url: 'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/202510/t20251014_1400943.html',
    validPeriod: '现行有效',
    remark:
      '医院项目可关注公共机构节能改造、综合能源、余热利用、高效冷热源、光伏储能等方向，需纳入项目库并满足节能量和手续要求。',
  },
  {
    id: 'p003',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '超长期特别国债/设备更新',
    policyCategory: '补贴',
    publishYear: '2024-2026',
    publishOrg: '国务院',
    policyName: '《推动大规模设备更新和消费品以旧换新行动方案》',
    summary:
      '超长期特别国债支持设备更新、节能降碳、安全改造等领域；医院可关注医疗卫生设备更新、用能设备更新、建筑节能降碳改造等方向，按国家和属地年度申报清单执行。',
    url: 'https://www.gov.cn/zhengce/content/202403/content_6939232.htm',
    validPeriod: '以年度资金通知为准',
    remark:
      '删除原表中已404的2024年资金安排链接，保留国务院行动方案正文；年度资金安排需以当年财政部/发改委申报通知为准。',
  },
  {
    id: 'p004',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '政府专项债',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg: '国务院办公厅',
    policyName: '《关于优化完善地方政府专项债券管理机制的意见》',
    summary:
      '专项债用于有一定收益的公益性项目，并优化投向领域和项目管理；医院基础设施、公共卫生、节能降碳和园区综合能源项目若具备公益属性及收益平衡，可结合专项债论证。',
    url: 'https://zwgls.mof.gov.cn/zcgz/202511/t20251102_3975537.htm',
    validPeriod: '现行有效',
    remark: '财政部政府债务研究和评估中心转载国务院办公厅政策全文，直达正文。',
  },
  {
    id: 'p005',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'CCER方法学/公共建筑',
    policyCategory: '政策',
    publishYear: '2025/2026',
    publishOrg: '生态环境部',
    policyName:
      '《温室气体自愿减排项目方法学 既有公共建筑围护结构与供暖通风空调系统能效提升（CCER—06—001—V01）》',
    summary:
      '鼓励符合条件的既有公共建筑围护结构与暖通空调系统能效提升项目参与全国温室气体自愿减排交易市场并获得减排量收益；适合医院既有建筑围护结构、冷热源、空调通风系统改造项目开展CCER可行性评估。',
    url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk06/202512/t20251223_1138457.html',
    validPeriod: '现行有效',
    remark: '生态环境部方法学发布通知正文；方法学平台显示2026年1月登记。',
  },
  {
    id: 'p006',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'CCER/碳资产',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '生态环境部、市场监管总局',
    policyName: '《温室气体自愿减排交易管理办法（试行）》',
    summary:
      '规范全国温室气体自愿减排交易及相关活动，明确项目登记、减排量登记、交易、审定核查和监督管理要求；为医院公共建筑节能减碳项目形成可交易碳资产提供制度基础。',
    url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk02/202310/t20231020_1043694.html',
    validPeriod: '现行有效',
    remark: '生态环境部、市场监管总局令第31号正文。',
  },
  {
    id: 'p007',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '全国碳市场/碳资产',
    policyCategory: '政策',
    publishYear: '2025',
    publishOrg: '中共中央办公厅、国务院办公厅',
    policyName: '《关于推进绿色低碳转型加强全国碳市场建设的意见》',
    summary:
      '提出完善全国碳排放权交易市场和全国温室气体自愿减排交易市场，发挥市场机制促进低成本减排；医院节能改造的碳资产转化可关注CCER、自愿减排交易、绿电绿证和碳排放核算衔接。',
    url: 'https://www.gov.cn/gongbao/2025/issue_12266/202509/content_7039599.html',
    validPeriod: '现行有效',
    remark: '人民网刊载政策全文，可直达阅读；后续如中国政府网发布正文可再替换。',
  },
  {
    id: 'p008',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '节能审查/碳评价',
    policyCategory: '政策',
    publishYear: '2025',
    publishOrg: '国家发展改革委',
    policyName: '《固定资产投资项目节能审查和碳排放评价办法》',
    summary:
      '建立能耗双控向碳排放双控全面转型机制，将固定资产投资项目能源消费和碳排放纳入审查评价；医院新建、改扩建、能源站和大型用能设备更新项目需关注节能审查、碳排放评价和事中事后监管要求。',
    url: 'https://www.gov.cn/gongbao/2025/issue_12246/202508/content_7038015.html',
    validPeriod: '2025-09-01起施行',
    remark: '国家发展改革委令第31号PDF正文。',
  },
  {
    id: 'p009',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '建筑节能降碳',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '国务院办公厅',
    policyName: '《加快推动建筑领域节能降碳工作方案》',
    summary:
      '到2027年既有建筑节能改造进一步推进，建筑用能结构更加优化；重点推进既有建筑节能改造、建筑用能电气化和可再生能源建筑应用。医院公共建筑可用于论证围护结构、冷热源、空调通风和能源管理系统节能改造。',
    url: 'https://www.mee.gov.cn/zcwj/gwywj/202403/t20240318_1068599.shtml',
    validPeriod: '至2027年',
    remark: '生态环境部转载国务院部门文件正文，可直接阅读。',
  },
  {
    id: 'p010',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '能源节能降碳',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '国家能源局',
    policyName: '《能源领域节能降碳行动计划（2026—2028年）》',
    summary:
      '提出电力、煤炭、油气、能源消费侧等领域节能降碳任务，强调绿色能源消费、绿证绿电交易、节能降碳技术装备、数字化智能化赋能；医院综合能源、绿电、储能、热泵等项目可作为能源消费侧节能降碳场景。',
    url: 'https://www.nea.gov.cn/20260710/4acf5873e20149cdbc52c709b16b30ff/c.html',
    validPeriod: '2026-2028',
    remark: '近半年新增国家能源局政策。',
  },
  {
    id: 'p011',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: '十五五碳达峰/建筑节能/公共机构',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '国务院',
    policyName: '《“十五五”碳达峰行动方案》',
    summary:
      '部署2026-2030年碳达峰重点任务，明确推进建筑领域和公共机构节能降碳，加强既有建筑节能降碳改造、建筑运行节能降碳管理、低碳零碳供热制冷和绿色照明；“十五五”期间单位建筑面积直接碳排放降低3%。',
    url: 'https://www.mee.gov.cn/zcwj/gwywj/202607/t20260714_1161655.shtml',
    validPeriod: '2026-2030',
    remark: '2026年7月发布，替代十四五阶段性政策作为新周期顶层依据。',
  },
  {
    id: 'p012',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'EMC/能源托管',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '国家机关事务管理局、国家发展改革委、财政部',
    policyName: '《关于鼓励和支持公共机构采用能源费用托管服务的意见》',
    summary:
      '明确公共机构可通过能源费用托管实施节能改造；合同能源管理服务机构负责诊断、改造、运行维护和节能收益实现，费用可从托管服务费/节能收益中安排。',
    url: 'https://www.gov.cn/zhengce/zhengceku/2022-09/23/content_5711348.htm',
    validPeriod: '现行有效',
    remark: '国家卫生健康委转发附件PDF，可直接阅读政策文本；适用于医院等公共机构能源费用托管/EMC。',
  },
  {
    id: 'p013',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'BOT/特许经营',
    policyCategory: '政策',
    publishYear: '2023/2024',
    publishOrg: '国务院办公厅',
    policyName: '《关于规范实施政府和社会资本合作新机制的指导意见》',
    summary:
      'PPP新机制聚焦使用者付费项目，全部采取特许经营模式；BOT、ROT、TOT等应依法开展特许经营、竞争选择社会资本，明确经营收入、运营期限、资产权属和风险分担。',
    url: 'https://www.gov.cn/zhengce/content/202311/content_6914161.htm',
    validPeriod: '现行有效',
    remark: '第一项为PPP新机制，第二项为特许经营管理办法；均为政策正文页。',
  },
  {
    id: 'p014',
    province: '国家层面',
    city: '全国适用',
    energyPolicy: 'BOT/特许经营',
    policyCategory: '政策',
    publishYear: '2023/2024',
    publishOrg: '国家发展改革委、财政部、住房城乡建设部、交通运输部、水利部、中国人民银行',
    policyName:
      '《关于规范实施政府和社会资本合作新机制的指导意见》《基础设施和公用事业特许经营管理办法》',
    summary:
      'PPP新机制聚焦使用者付费项目，全部采取特许经营模式；BOT、ROT、TOT等应依法开展特许经营、竞争选择社会资本，明确经营收入、运营期限、资产权属和风险分担。',
    url: 'https://www.ndrc.gov.cn/xxgk/zcfb/fzggwl/202404/t20240409_1365563.html',
    validPeriod: '现行有效',
    remark: '第一项为PPP新机制，第二项为特许经营管理办法；均为政策正文页。',
  },
  {
    id: 'p015',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '节能技术改造奖励',
    policyCategory: '补贴',
    publishYear: '2024/2026',
    publishOrg: '北京市发展和改革委员会',
    policyName: '《节能技术改造项目管理办法》及2026年项目公示',
    summary:
      '北京市交通、市政、农业农村等领域节能技术改造项目按节能量奖励，2026年第一批公示仍按《节能技术改造项目管理办法》（京发改规〔2024〕6号）执行，按1200元/吨标准煤给予节能量奖励；医院能源站、供热系统、供配电、能量系统优化等需核对所属领域和申报条件。',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/2024zcwj/bwqtwj/202604/t20260430_4630846.htm',
    validPeriod: '现行有效/以批次公示为准',
    remark: '补充北京市2026年最新项目公示链接，便于核对奖励执行口径。',
  },
  {
    id: 'p016',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '公共建筑节能补贴',
    policyCategory: '补贴',
    publishYear: '2023/2024',
    publishOrg: '北京市住房和城乡建设委员会',
    policyName: '《北京市建筑绿色发展奖励资金示范项目管理实施细则（试行）》及补充政策',
    summary:
      '北京市对建筑绿色发展示范项目给予奖励：高星级绿色建筑按实施面积最高60元/平方米、单个项目最高600万元；公共建筑节能绿色化改造、超低能耗建筑、装配式建筑等按实施细则和后续补充通知执行。医院公共建筑可结合节能绿色化改造和绿色建筑运营标识申报。',
    url: 'https://zjw.beijing.gov.cn/bjjs/xxgk/zcwj2024/qtzcwj/xxyx13/436473244/index.shtml',
    validPeriod: '现行有效',
    remark: '链接为住建委政策发布页和北京市政务服务办理依据页，均可直接阅读政策要点。',
  },
  {
    id: 'p017',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '新能源供热/光伏补贴',
    policyCategory: '补贴',
    publishYear: '2026',
    publishOrg: '北京市发展和改革委员会',
    policyName: '《北京市发展和改革委员会关于公开征集市政府固定资产投资支持新能源供热项目的通知》',
    summary:
      '2026年第一批市政府固定资产投资支持新能源供热项目：新能源供热装机占比60%及以上的新建及改扩建项目，给予新能源建设投资30%支持；装机占比30%-60%的给予20%支持；新技术应用、多能耦合综合能源站且新能源供热装机占比30%及以上的给予30%支持。',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/2024zcwj/bwqtwj/202603/t20260309_4552994.htm',
    validPeriod: '2026年度申报',
    remark: '已替换为2026年最新征集通知正文。',
  },
  {
    id: 'p018',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '新能源供热/融资补贴',
    policyCategory: '补贴',
    publishYear: '2023',
    publishOrg: '北京市发展和改革委员会等十部门',
    policyName: '《关于全面推进新能源供热高质量发展的实施意见》',
    summary:
      '明确支持办公楼宇、学校、医院、文化体育场馆等公共建筑开展新能源供热应用，推动存量燃气锅炉供热设施替代；提出企业投资新能源供热项目由属地核准、市发展改革委审批资金申请报告，并支持符合条件的新能源供热企业/项目申请贷款贴息和优惠利率融资支持、参与绿色金融创新试点，鼓励采用合同能源管理、特许经营等市场化方式。',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/2024zcwj/bwqtwj/202311/t20231108_3727652.htm',
    validPeriod: '现行有效',
    remark: '用户点名需补充；该文件是北京新能源供热固定资产投资支持政策的上位依据。',
  },
  {
    id: 'p019',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '新能源供热/光伏补贴',
    policyCategory: '补贴',
    publishYear: '2025',
    publishOrg: '北京市发展和改革委员会',
    policyName:
      '《北京市发展和改革委员会关于公开征集市政府固定资产投资支持新能源供热、光伏发电项目的通知》',
    summary:
      '2025年第二批征集：新能源供热装机占比60%及以上的新建及改扩建项目，给予新能源建设投资30%市政府固定资产投资支持；装机占比30%-60%的给予20%；新能源供热装机占比30%及以上的新技术应用、多能耦合综合能源站给予30%。光伏发电项目中，建筑光伏一体化/综合能源服务/虚拟电厂等新技术新模式项目、产业园区/公共机构/重点工程等整体光伏项目、生态修复等光伏项目分别给予光伏系统建设投资不高于30%、20%、10%的支持。',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/2024zcwj/bwqtwj/202507/t20250708_4144351.htm',
    validPeriod: '2025年度申报/现行公开文本',
    remark: '用户点名需补充；医院屋顶光伏、能源站、热泵及综合能源项目可重点核对支持范围。',
  },
  {
    id: 'p020',
    province: '北京市',
    city: '全市区域',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '北京市人民政府',
    policyName: '《北京市碳达峰实施方案》',
    summary:
      '围绕建筑、公共机构、能源消费和绿色低碳技术推广推进碳达峰；医院可从公共建筑节能、能源托管、绿色低碳运营、设备更新等方向匹配。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202211/t20221130_1343045.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p021',
    province: '北京市',
    city: '东城区',
    energyPolicy: '区级碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '北京市东城区人民政府',
    policyName: '《东城区碳达峰实施方案》',
    summary:
      '提出聚焦重点领域、重点用能单位和主要用能环节，实施节能重点工程，持续提升能源利用效率；医院类公共建筑可作为节能降碳、能源管理和绿色低碳运行场景。',
    url: 'https://www.bjdch.gov.cn/zwgk/zcwj2024/202407/t20240704_3737884.html',
    validPeriod: '至2030年前',
    remark: '原暂行办法链接已撤稿，替换为东城区现行碳达峰实施方案正文。',
  },
  {
    id: 'p022',
    province: '北京市',
    city: '东城区',
    energyPolicy: '区级节能降碳行动',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '北京市东城区人民政府',
    policyName: '《美丽东城建设2026年行动计划》',
    summary:
      '明确推进大型公共建筑能效分级，鼓励普通公共建筑参与能效分级，结合城市更新持续推进公共建筑节能绿色化改造；开展建筑用能电力替代、建筑光伏一体化，推动供热系统绿色低碳转型。',
    url: 'https://www.bjdch.gov.cn/zwgk/zcwj2024/202604/t20260401_4571962.html',
    validPeriod: '2026年度',
    remark: '原2024-2025行动方案已过期，替换为2026年度行动计划正文。',
  },
  {
    id: 'p023',
    province: '北京市',
    city: '西城区',
    energyPolicy: '区级绿色低碳补贴',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg: '北京市西城区发展和改革委员会',
    policyName: '《西城区促进绿色低碳高质量发展若干措施》',
    summary:
      '支持绿色化改造、光伏、绿电和节能技改等：如分布式光伏项目最高可按1200元/kW给予支持且单项不超过100万元；新能源供热可按市级补助给予区级配套，部分项目最高100万元；绿电应用可按0.01元/kWh给予奖励，最高50万元。',
    url: 'https://www.bjxch.gov.cn/xxgk/xxxqzcwj/pnidpv958384.html',
    validPeriod: '以年度申报为准',
    remark: '医院若在西城区，可重点核对光伏、新能源供热、绿电和节能改造申报条件。',
  },
  {
    id: 'p024',
    province: '北京市',
    city: '朝阳区',
    energyPolicy: '区级节能减碳专项资金',
    policyCategory: '补贴',
    publishYear: '2025',
    publishOrg: '北京市朝阳区发展和改革委员会',
    policyName: '《朝阳区节能减碳专项资金管理办法》',
    summary:
      '支持节能改造、可再生能源、绿色建筑和能耗监测等项目；一般按项目投资、节能量或示范效果给予补助，具体比例和封顶金额以年度申报指南为准。',
    url: 'http://www.bjchy.gov.cn/affair/file/gfxfile/4028805a96fc67e701979b8a62ac6d25.html',
    validPeriod: '以年度申报为准',
    remark: '区级资金办法。',
  },
  {
    id: 'p025',
    province: '北京市',
    city: '朝阳区',
    energyPolicy: '区级项目征集',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '北京市朝阳区发展和改革委员会',
    policyName: '《2026年朝阳区公开征集节能减碳项目的通知》',
    summary:
      '公开征集节能减碳项目，覆盖建筑节能、可再生能源、绿色建筑、能耗监测平台等方向；医院可按项目类型提交固定资产投资、节能量、能效提升和运行效果材料。',
    url: 'http://www.bjchy.gov.cn/affair/file/otherfile/4028805a9c5c915f019cad6337f223c1.html',
    validPeriod: '2026年度',
    remark: '年度申报通知。',
  },
  {
    id: 'p026',
    province: '北京市',
    city: '海淀区',
    energyPolicy: '区级节能专项资金',
    policyCategory: '补贴',
    publishYear: '2025',
    publishOrg: '北京市海淀区发展和改革委员会',
    policyName: '《海淀区2025年节能专项资金项目申报指南》',
    summary:
      '支持节能技改、光伏、绿电、认证和能源审计等；示例口径包括按项目投资比例补助、单项封顶，分布式光伏可按装机容量给予补助，绿电可按用电量给予奖励。',
    url: 'https://zyk.bjhd.gov.cn/jbdt/auto4488_51784/auto4488_52160/auto4488/auto4488/202506/t20250623_4774924.shtml',
    validPeriod: '2025年度',
    remark: '海淀区年度申报需以当年正式指南为准；历史PDF和最新公开页面共同作为线索。',
  },
  {
    id: 'p027',
    province: '北京市',
    city: '丰台区',
    energyPolicy: '区级节能发展专项资金',
    policyCategory: '补贴',
    publishYear: '2019',
    publishOrg: '北京市丰台区发展和改革委员会',
    policyName: '《丰台区节能发展专项资金管理办法（修订版）》及简明问答',
    summary:
      '丰台区节能发展专项资金支持节能低碳技术应用、能源效率提升、可再生能源利用等方向；医院公共建筑节能改造、光伏、新能源供热和能源管理平台项目可按资金办法及年度申报指南核对条件。',
    url: 'https://www.bjft.gov.cn/ftq/ftbmwj/201909/e64a483448e643269527d3c6e26aec45.shtml',
    validPeriod: '以年度申报为准',
    remark: '链接为丰台区政府政策解读页，页面可直接阅读专项资金管理办法要点。',
  },
  {
    id: 'p028',
    province: '北京市',
    city: '昌平区',
    energyPolicy: '区级节能低碳资金',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg:
      '北京市昌平区发展和改革委员会、北京市昌平区住房和城乡建设委员会、北京市昌平区生态环境局、北京市昌平区财政局',
    policyName: '《昌平区节能低碳发展资金管理办法（试行）》',
    summary:
      '区级节能低碳资金支持节能降碳改造、新能源和可再生能源利用、建筑绿色化等方向；可与北京市新能源供热、光伏发电等市级固定资产投资支持政策衔接，作为昌平区医院类公共建筑节能改造、光伏/新能源供热、综合能源站等项目申报区级配套或专项资金的重要依据。具体支持比例、上限和申报材料以年度项目征集通知及资金审核结果为准。',
    url: 'https://www.bjchp.gov.cn/cpqzf/xxgk2671/zcwj/2024062409373949862/',
    validPeriod: '以年度申报为准',
    remark: '区级资金政策正文可读链接；项目申报前建议同步核对昌平区发改委年度征集通知。',
  },
  {
    id: 'p029',
    province: '北京市',
    city: '昌平区',
    energyPolicy: '区级绿色低碳项目征集',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg: '北京市昌平区发展和改革委员会',
    policyName: '《关于开展〈昌平区节能低碳发展资金管理办法（试行）〉项目征集的通知》',
    summary:
      '围绕昌平区节能低碳发展资金管理办法开展项目征集，支持节能低碳技术改造、可再生能源利用、绿色低碳示范等方向；医院EMC/能源站项目可按节能量、投资额、示范性组织材料。',
    url: 'https://www.bjchp.gov.cn/cpqzf/315734/tzgg27/2024093010124561654/index.html',
    validPeriod: '以年度征集为准',
    remark: '替换为可打开的昌平区项目征集正文页。',
  },
  {
    id: 'p030',
    province: '天津市',
    city: '天津',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '天津市人民政府',
    policyName: '《天津市碳达峰实施方案》',
    summary:
      '推进工业、建筑、交通、公共机构等重点领域节能降碳，鼓励绿色建筑、公共机构节能改造和绿色低碳技术应用；医院可结合公共建筑节能和设备更新申报。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202209/t20220928_1337494.html',
    validPeriod: '至2030年前',
    remark: '未检索到稳定公开的市级医院节能补贴专项，补贴列不做全国政策占位。',
  },
  {
    id: 'p031',
    province: '河北省',
    city: '全省适用',
    energyPolicy: '碳达峰/建筑节能',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '河北省发展和改革委员会，河北省科学技术厅',
    policyName: '《河北省科技支撑碳达峰碳中和实施方案(2023-2030年)》',
    summary:
      '提出推进建筑、公共机构、重点用能设备和绿色低碳技术改造；医院可按省级政策结合石家庄属地项目库申报。',
    url: 'https://gxt.hebei.gov.cn/main/policy/zxzcdetail?id=9a1ffa53-65d4-41cc-ac6a-523ca380001f',
    validPeriod: '至2030年前',
    remark:
      '原河北省政府链接已404，替换为可直接阅读的政策PDF；项目申报时建议再以河北省政府/发改委最新公开口径复核。',
  },
  {
    id: 'p032',
    province: '河北省',
    city: '石家庄',
    energyPolicy: '工业节能/低碳技术',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '石家庄市生态环境局',
    policyName: '《石家庄市工业领域碳达峰实施方案》',
    summary:
      '提出推广高效节能设备、绿色低碳技术和能源管理体系；医院若涉及园区能源站或大型用能系统，可借鉴能效提升和技术改造路径。',
    url: 'https://gxj.sjz.gov.cn/columns/4a7011d7-f7bc-42d6-93e7-e362892163a8/202307/10/496fe07e-b441-4daf-99cd-f1571f337852.html',
    validPeriod: '至2030年前',
    remark: '工业领域政策，医院适用性需转换论证。',
  },
  {
    id: 'p033',
    province: '山西省',
    city: '太原',
    energyPolicy: '国家碳达峰试点',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '太原市人民政府',
    policyName: '《太原市国家碳达峰试点实施方案》',
    summary:
      '太原作为国家碳达峰试点，提出绿色建筑、节能改造、清洁能源利用和低碳示范等任务；医院可作为公共建筑节能和综合能源示范场景。',
    url: 'https://www.taiyuan.gov.cn/fgfxwj/20240710/30144469.html',
    validPeriod: '至2030年前',
    remark: '试点方案PDF。',
  },
  {
    id: 'p034',
    province: '内蒙古自治区',
    city: '全区适用',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '内蒙古自治区人民政府',
    policyName: '《内蒙古自治区碳达峰实施方案》',
    summary:
      '推进重点领域能效提升、建筑节能、公共机构绿色低碳和清洁能源利用；呼和浩特医院项目可结合公共建筑节能和低碳能源供应论证。',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202211/t20221119_1005393.shtml',
    validPeriod: '至2030年前',
    remark: '自治区政策，覆盖呼和浩特；来源为转载。',
  },
  {
    id: 'p035',
    province: '辽宁省',
    city: '全省适用',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '辽宁省人民政府',
    policyName: '《辽宁省碳达峰实施方案》',
    summary:
      '推进建筑、公共机构、工业和能源等领域节能降碳，鼓励绿色低碳技术推广；医院可结合省级设备更新、公共机构节能和属地项目库申报。',
    url: 'https://www.ln.gov.cn/web/zwgkx/zfwj/szfwj/2022n/2023042510154064611/index.shtml',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖沈阳。',
  },
  {
    id: 'p036',
    province: '吉林省',
    city: '长春',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '长春市工业和信息化局，长春市科学技术局',
    policyName: '《长春市工业领域碳达峰行动方案》、《长春市碳达峰碳中和科技创新行动方案》',
    summary:
      '提出能源、建筑、交通、公共机构等领域绿色低碳转型任务，鼓励节能技术改造和低碳示范；医院可围绕公共建筑能效、冷热源系统和能源管理平台实施。',
    url: 'http://gxj.changchun.gov.cn/twdt/tzgg/202410/t20241028_3354067.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p037',
    province: '黑龙江省',
    city: '哈尔滨',
    energyPolicy: '国家碳达峰试点/绿色建筑',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '哈尔滨市人民政府',
    policyName:
      '《哈尔滨新区国家碳达峰试点实施方案》、《哈尔滨市提高建筑节能质效推动城市建设高质量发展工作方案》',
    summary:
      '哈尔滨新区试点和市级绿色建筑政策强调建筑领域绿色低碳、节能改造和可再生能源应用；医院项目可从公共建筑节能改造和绿色建筑运营评价切入。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/t20240822_1392544.html',
    validPeriod: '至2030年前',
    remark: '新区试点不等同全市财政补贴，但可用于示范项目包装。',
  },
  {
    id: 'p038',
    province: '上海市',
    city: '上海',
    energyPolicy: '节能降碳专项资金/建筑节能',
    policyCategory: '补贴',
    publishYear: '2026',
    publishOrg: '上海市发展和改革委员会，上海市财政局',
    policyName: '《上海市节能降碳减排专项资金管理办法》',
    summary:
      '专项资金由市级财政预算安排，重点支持能源、工业、交通、建筑等领域节能降碳，建筑领域包括高标准节能降碳新建建筑、既有建筑节能降碳改造和运营、绿色施工等；主要采用补贴、以奖代补方式，同一项目原则上只能享受一个领域市级补贴。',
    url: 'https://fgw.sh.gov.cn/fgw_gfxwj/20260703/8f141209dfd04eb4af1c8eb6c43e0d20.html',
    validPeriod: '2026-07-01至2030-12-31',
    remark: '替换原404链接；此为上海市发改委官方规范性文件正文。',
  },
  {
    id: 'p039',
    province: '上海市',
    city: '上海',
    energyPolicy: '节能减排专项资金',
    policyCategory: '补贴',
    publishYear: '2026',
    publishOrg: '上海市经济和信息化委员会',
    policyName:
      '《关于开展2026年度上海市工业通信业节能减排和合同能源管理专项资金项目申报工作的通知》',
    summary:
      '年度专项资金支持节能减排、资源综合利用、绿色低碳技术等方向；医院节能改造可关注公共建筑节能、用能设备更新、绿色低碳示范等年度方向。',
    url: 'https://sheitc.sh.gov.cn/cyfz/20260414/1e15425f982a4811ae74ab2d27222e70.html',
    validPeriod: '以年度通知为准',
    remark: '年度申报类政策。',
  },
  {
    id: 'p040',
    province: '上海市',
    city: '上海',
    energyPolicy: '建筑节能和绿色建筑专项扶持',
    policyCategory: '补贴',
    publishYear: '2020',
    publishOrg: '上海市住房和城乡建设管理委员会、上海市发展和改革委员会、上海市财政局',
    policyName: '《上海市建筑节能和绿色建筑示范项目专项扶持办法》',
    summary:
      '市级财政专项扶持建筑节能和绿色建筑示范项目，支持绿色建筑示范、装配式建筑、超低能耗建筑、既有建筑节能改造、可再生能源与建筑一体化等方向；同一项目原则上只能选择一个支持范围，不得重复享受市级财政资金。医院既有建筑节能改造、绿色建筑运行标识和可再生能源建筑应用可据此开展补贴路径核对。',
    url: 'https://zjw.sh.gov.cn/wjhb/20210701/0649fb56c3bf40349afe9342d0bb2aaa.html',
    validPeriod: '以年度申报指南为准',
    remark: '上海建筑领域专项扶持政策，和2026年节能降碳减排专项资金管理办法可配套参考。',
  },
  {
    id: 'p041',
    province: '上海市',
    city: '上海',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '上海市人民政府',
    policyName: '《上海市碳达峰实施方案》',
    summary:
      '提出建筑、公共机构、能源利用和绿色低碳技术等重点任务；医院可关注公共建筑节能改造、能源系统优化和绿色低碳运行。',
    url: 'https://www.shanghai.gov.cn/nw12344/20220728/75468067a4a848139d2a2eed16ce9e11.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p042',
    province: '江苏省',
    city: '全省适用',
    energyPolicy: '公共建筑能耗/碳排放限额',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '江苏省住房和城乡建设厅',
    policyName: '《江苏省公共建筑用能和碳排放限额指南（试行）》',
    summary:
      '面向公共建筑运行阶段能耗与碳排放计算和管理，推动公共建筑用能与碳排放限额约束；南京及江苏省内医院可据此开展能耗对标、碳排放核算、节能改造优先级筛选和绩效评价。',
    url: 'https://jsszfhcxjst.jiangsu.gov.cn/art/2026/4/27/art_49384_11763265.html',
    validPeriod: '试行',
    remark:
      '暂未检索到省住建厅可直达正文页，使用可阅读全文转载；申报/审查时需以省住建厅正式附件为准。',
  },
  {
    id: 'p043',
    province: '江苏省',
    city: '南京',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '南京市人民政府',
    policyName: '《南京市碳达峰实施方案》',
    summary:
      '提出城市绿色低碳转型、建筑节能、能源效率提升和公共机构示范等任务；医院可结合公共建筑节能改造、能源托管和绿色低碳运营。',
    url: 'https://www.nanjing.gov.cn/xxgkn/zfgb/202406/t20240627_4700879.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p044',
    province: '浙江省',
    city: '杭州',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '杭州市人民政府',
    policyName: '《杭州市碳达峰实施方案》',
    summary:
      '部署建筑、能源、产业和公共机构等领域碳达峰行动，支持绿色低碳技术和节能改造；医院可关注公共建筑能效提升、可再生能源和能源管理系统。',
    url: 'https://zfgb.hangzhou.gov.cn/upload/default/bigfile/2025/06/03/20250603_9127aa735d04ce7b6db7374113ee9f6d.pdf',
    validPeriod: '至2030年前',
    remark: '市级政策PDF。',
  },
  {
    id: 'p045',
    province: '浙江省',
    city: '杭州',
    energyPolicy: '公共机构既有建筑节能改造',
    policyCategory: '政策',
    publishYear: '2026',
    publishOrg: '杭州市城乡建设委员会、杭州市发展和改革委员会、杭州市机关事务管理局',
    policyName:
      '《杭州市城乡建设委员会 杭州市发展和改革委员会 杭州市机关事务管理局关于推进公共机构既有建筑节能降碳改造的通知》',
    summary:
      '2026年发布，面向本市公共机构既有建筑，覆盖医院等事业单位；要求将节能降碳改造纳入年度既有建筑改造计划，按规范计算改造费用并纳入项目总投资，与主体工程同步设计、同步施工、同步验收；装饰装修类工程应从技术目录中选择不少于2类改造类别、3种及以上具体技术措施，设备优化类工程包括通风空调、照明及加装光伏等。',
    url: 'https://zfgb.hangzhou.gov.cn/11/103220263/t120220263034/530278.shtml',
    validPeriod: '现行有效',
    remark:
      '不是直接补贴办法，但明确医院等公共机构既有建筑改造费用纳入项目总投资，适合与财政预算、EMC和设备更新资金统筹。',
  },
  {
    id: 'p046',
    province: '安徽省',
    city: '合肥',
    energyPolicy: '国家碳达峰试点',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '合肥市人民政府',
    policyName: '《合肥市国家碳达峰试点实施方案》',
    summary:
      '合肥作为国家碳达峰试点，强调绿色建筑、公共机构低碳运行、能源系统优化和低碳示范项目；医院可按公共建筑节能和零碳场景方向包装。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/P020240822759359701195.pdf',
    validPeriod: '至2030年前',
    remark: '试点方案PDF。',
  },
  {
    id: 'p047',
    province: '福建省',
    city: '福州',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2025',
    publishOrg: '福州市工业和信息化局',
    policyName: '《福州市碳达峰实施方案》',
    summary:
      '围绕绿色低碳发展、建筑节能、公共机构示范和能源消费优化展开；医院节能改造可结合建筑和公共机构节能方向推进。',
    url: 'https://www.fuzhou.gov.cn/zgfzzt/sjxw/fzjx/tzgg/202503/t20250304_4983932.htm',
    validPeriod: '至2030年前',
    remark: '链接为政策解读页，正式文件需复核。',
  },
  {
    id: 'p048',
    province: '江西省',
    city: '南昌',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '南昌市人民政府',
    policyName: '《南昌市碳达峰实施方案》',
    summary:
      '提出建筑、公共机构、能源消费和绿色低碳技术应用等重点任务；医院项目可从公共建筑节能、用能设备更新和综合能源管理切入。',
    url: 'https://www.nc.gov.cn/ncszf/qtygwj/202303/523fa786009b4115b64ab142fbee4d81.shtml',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p049',
    province: '山东省',
    city: '济南',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '济南市人民政府',
    policyName: '《济南市碳达峰工作方案》',
    summary:
      '围绕能源、建筑、公共机构、绿色低碳技术等领域推进碳达峰；医院可关注公共建筑节能改造、能源系统优化和绿色低碳示范。',
    url: 'https://www.jinan.gov.cn/col116027/art/2023/art_116027_4954523.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p050',
    province: '河南省',
    city: '全省适用',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '补贴',
    publishYear: '2023',
    publishOrg: '河南省人民政府',
    policyName: '《河南省碳达峰实施方案》',
    summary:
      '部署建筑、公共机构、节能降碳和绿色低碳技术应用；郑州医院项目可按省级政策结合郑州市项目库和专项资金申报要求执行。',
    url: 'https://fgw.henan.gov.cn/2023/02-06/2683896.html',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖郑州。',
  },
  {
    id: 'p051',
    province: '湖北省',
    city: '武汉',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '武汉市人民政府',
    policyName: '《武汉市碳达峰实施方案》',
    summary:
      '提出能源、建筑、公共机构、绿色低碳技术和低碳示范任务；医院可关注公共建筑节能、综合能源改造、能耗监测和设备更新。',
    url: 'https://www.wuhan.gov.cn/zwgk/xxgk/zfwj/szfwj/202404/t20240407_2385049.shtml',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p052',
    province: '湖南省',
    city: '长沙',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '长沙市人民政府',
    policyName: '《长沙市碳达峰实施方案》',
    summary:
      '强调建筑节能、绿色低碳技术和公共机构节能示范；医院可结合绿色建筑运营、能源托管和设备更新推进。',
    url: 'https://www.changsha.gov.cn/szf/zfgb/2023n/2023n2y28r/202303/t20230328_11042629.html',
    validPeriod: '至2030年前',
    remark: '来源为转载，需以长沙市正式文件复核。',
  },
  {
    id: 'p053',
    province: '广东省',
    city: '全省适用',
    energyPolicy: '碳普惠/碳资产',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '广东省生态环境厅',
    policyName: '《广东省碳普惠交易管理办法》',
    summary:
      '规范广东省碳普惠方法学、碳普惠项目及碳普惠核证减排量管理和交易；碳普惠核证减排量可作为补充抵消机制进入广东碳市场。广州、深圳医院的分布式光伏、节能改造、低碳运营项目可关注碳普惠方法学和PHCER路径。',
    url: 'https://sthjj.gz.gov.cn/zwgk/fgybz/qtxgzcwj/content/post_8202429.html',
    validPeriod: '2027-05-05 00:00:00',
    remark:
      '第一条为广州生态环境局介绍页并指向广东省生态环境厅原文，第二条为广东省生态环境厅政策正文。',
  },
  {
    id: 'p054',
    province: '广东省',
    city: '广州',
    energyPolicy: '公共机构EMC补助',
    policyCategory: '补贴',
    publishYear: '2026',
    publishOrg: '广东省能源局',
    policyName: '《广东省公共机构合同能源管理办法（试行）》',
    summary:
      '规范广东省公共机构采用合同能源管理开展节能改造的适用情形、项目实施、费用支付、资产管理、节能量核定等机制；年能源消费量达500吨标准煤以上或年用电量200万kWh以上、单位建筑面积能耗/水耗超限额基准值、空调锅炉照明变压器等主要用能设备能效未达2级、中央空调机房年均运行能效比低于4.0等情形，宜优先采用合同能源管理。',
    url: 'https://www.gd.gov.cn/zwgk/gongbao/2026/13/content/post_4908798.html',
    validPeriod: '2029',
    remark: '广州市公共机构EMC明确补助档位，申报前需核对主管部门最新执行口径。',
  },
  {
    id: 'p055',
    province: '广东省',
    city: '广州',
    energyPolicy: '省级节能降耗专项资金',
    policyCategory: '补贴',
    publishYear: '2026',
    publishOrg: '广州市发展和改革委员会',
    policyName:
      '《广州市发展和改革委员会转发广东省能源局关于开展2027年省级节能降耗专项资金储备项目征集工作的通知》',
    summary:
      '面向节能降碳技术改造和用能设备更新、先进节能技术应用示范、高效节能装备制造产业化、公共机构节能示范等方向征集储备项目；支持电机、锅炉、变压器、空压机、泵、风机、制冷、供热、照明、换热站等用能设备更新，以及数字化智能化能源运行管理平台。公共机构节能示范明确支持医院等公共机构既有建筑围护结构、制冷、照明、电梯等综合型用能系统和设施设备节能改造。',
    url: 'https://fgw.gz.gov.cn/tzgg/content/post_10846119.html',
    validPeriod: '2027年省级资金储备/以申报通知为准',
    remark: '当前可申报线索，适合广州医院设备更新、综合能源和公共机构节能示范项目。',
  },
  {
    id: 'p056',
    province: '广东省',
    city: '广州',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '广州市人民政府',
    policyName: '《广州市碳达峰实施方案》',
    summary:
      '支持绿色建筑、公共机构节能、低碳园区和示范项目；医院可结合公共建筑节能、综合能源和园区化项目包装。',
    url: 'https://www.gz.gov.cn/zwgk/fggw/wyzzc/content/post_8876052.html',
    validPeriod: '至2030年前',
    remark: '市级政策。',
  },
  {
    id: 'p057',
    province: '广东省',
    city: '深圳',
    energyPolicy: '工程建设绿色创新专项资金',
    policyCategory: '补贴',
    publishYear: '2021',
    publishOrg: '深圳市住房和建设局、深圳市财政局',
    policyName: '《深圳市工程建设领域绿色创新发展专项资金管理办法》',
    summary:
      '市级财政预算安排专项资金，支持深圳工程建设领域绿色创新事业发展；采取专家评审、社会公示、绩效管理和总额控制方式管理，可用于工程建设领域绿色低碳、绿色建筑、建筑节能、装配式建筑等示范和推广方向。医院新改扩建、既有建筑绿色低碳改造或绿色建筑示范可据此核对年度申报指南。',
    url: 'https://zjj.sz.gov.cn/xxgk/zcfgs/zcfg/content/post_9728365.html',
    validPeriod: '现行有效性需结合年度指南复核',
    remark: '深圳建筑领域财政专项资金制度依据；建议结合住建局年度专项资金申报通知使用。',
  },
  {
    id: 'p058',
    province: '广东省',
    city: '深圳',
    energyPolicy: '安全节能环保产业/建筑节能/综合能源',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg: '深圳市发展和改革委员会',
    policyName: '《深圳市促进安全节能环保产业集群高质量发展的若干措施》',
    summary:
      '支持高效节能装备、建筑节能、园区综合能源服务、公共建筑能源费用托管、集中空调合同能源管理等方向；对经认定的节能降碳示范或基础设施类项目，可按核定总投资的一定比例给予支持，其中部分项目支持比例可达30%、最高1000万元。医院项目可重点匹配中央空调节能改造、综合能源站、储能及能耗监测平台等场景。',
    url: 'https://fgw.sz.gov.cn/gkmlpt/content/11/11292/post_11292195.html',
    validPeriod: '现行有效/以配套申报通知为准',
    remark:
      '用于替换已到期的《深圳市促进绿色低碳产业高质量发展的若干措施》；具体补贴以年度申报和资金审核为准。',
  },
  {
    id: 'p059',
    province: '广东省',
    city: '深圳',
    energyPolicy: '碳达峰/建筑节能',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '深圳市人民政府',
    policyName: '《深圳市碳达峰实施方案》',
    summary:
      '提出建筑领域绿色低碳发展、既有建筑节能改造、可再生能源建筑应用和公共机构节能等任务；医院可结合既有建筑节能、光伏、冷热源和能耗平台实施。',
    url: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zcfg/content/post_11296172.html',
    validPeriod: '至2030年前',
    remark: '新增深圳市。',
  },
  {
    id: 'p060',
    province: '广东省',
    city: '龙岗区',
    energyPolicy: '绿色低碳/节能环保/新能源补贴',
    policyCategory: '补贴',
    publishYear: '2025',
    publishOrg: '深圳市福田区人民政府',
    policyName: '《《龙岗区发展和改革专项资金关于支持新能源产业高质量发展实施细则（试行）》》',
    summary:
      '围绕节能环保、新能源、绿色低碳服务等方向给予区级支持，包含设备更新、示范应用、产业化和绿色低碳服务能力建设等补贴口径；适合医院节能改造项目中光伏、储能、综合能源、节能服务和低碳技术应用场景前期匹配。政策注明有效期至2029年1月5日。',
    url: 'https://www.sz.gov.cn/cn/zjsz/fwts_1_3/tzfw/yhzc_1/content/post_12577656.html',
    validPeriod: '至2029-1-5',
    remark: '区级补贴政策；项目需满足福田区申报主体、落地场景和年度指南条件。',
  },
  {
    id: 'p061',
    province: '广东省',
    city: '龙华区',
    energyPolicy: '新能源/储能/虚拟电厂补贴',
    policyCategory: '补贴',
    publishYear: '2024',
    publishOrg: '深圳市龙华区人民政府办公室',
    policyName: '《深圳市龙华区促进新能源产业高质量发展若干措施》',
    summary:
      '支持新型储能、虚拟电厂和新能源应用场景：纳入国家新型储能试点的项目一次性给予500万元奖励；获得市级资助的新型储能示范应用项目按市级资助金额50%给予最高500万元配套；已并网投运且实际投入500万元以上、储能配置时长不低于2小时的电化学储能项目，按投资额20%给予最高300万元奖励；虚拟电厂资源聚合平台或调度示范项目按投资额20%给予最高100万元资助。',
    url: 'https://sf.sz.gov.cn/gfxwjcx/qjgfxwj/lh/qzfgfxwj/qzfbgs/content/post_11549402.html',
    validPeriod: '以政策有效期和申报指南为准',
    remark:
      '适合深圳医院院区储能、虚拟电厂、需求响应和综合能源场景论证，需核对项目主体与属地区域。',
  },
  {
    id: 'p062',
    province: '广西壮族自治区',
    city: '南宁',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '南宁市住房和城乡建设局、南宁市发展和改革委员会',
    policyName: '《南宁市城乡建设领域碳达峰实施方案》',
    summary:
      '围绕南宁市城乡建设领域碳达峰，推进绿色低碳城市建设、提高新建建筑节能降碳水平、推动既有建筑节能改造和可再生能源建筑应用、推广绿色建材和装配式/智能建造；医院项目可从公共建筑节能改造、光伏应用、冷热源系统优化和绿色低碳运行管理等方向匹配。',
    url: 'https://zjj.nanning.gov.cn/xxgk/fdzdgknr/zcwjcx/t5904910.html',
    validPeriod: '至2030年前',
    remark: '来源为政策汇编转载，需复核正式文件。',
  },
  {
    id: 'p063',
    province: '海南省',
    city: '海口',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '海口市人民政府',
    policyName: '《海口市碳达峰实施方案》',
    summary:
      '强调绿色建筑、节能降碳、公共机构示范和清洁能源应用；医院可关注光伏、储能、空调系统节能和能耗管理。',
    url: 'https://drc.haikou.gov.cn/xxxgk/gsgg/202309/t1311371.shtml',
    validPeriod: '至2030年前',
    remark: '来源为转载，需以海口市正式文件复核。',
  },
  {
    id: 'p064',
    province: '重庆市',
    city: '重庆',
    energyPolicy: '节能降碳/公共机构',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '重庆市生态环境局',
    policyName: '《重庆市工业领域碳达峰实施方案》及公共机构绿色低碳转型政策',
    summary:
      '推进重点领域节能降碳、绿色建筑、公共机构绿色低碳转型和能源管理；医院可结合公共机构节能、设备更新和能耗在线管理实施。',
    url: 'https://jjxxw.cq.gov.cn/zwgk_213/zcwj/qtwj/202301/t20230129_11542161.html',
    validPeriod: '至2030年前',
    remark: '市级能源方向政策；未检索到稳定公开的医院类补贴标准。',
  },
  {
    id: 'p065',
    province: '四川省',
    city: '成都',
    energyPolicy: '建筑节能降碳补贴',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '成都市住房和城乡建设局等部门',
    policyName: '《推动成都市建筑领域节能降碳若干措施》',
    summary:
      '设立绿色低碳建筑发展资金：二星级及以上绿色建筑、A级及以上装配式建筑等示范项目最高补贴100万元；超低能耗建筑示范项目最高300万元；公共建筑节能改造最高100万元；企业节能技改按1000元/吨标准煤奖励，单项最高200万元。',
    url: 'https://www.sc.gov.cn/10462/10464/10465/10595/2024/6/19/bcaa2dac8f614b45b542688ffbbb621f.shtml',
    validPeriod: '以申报通知为准',
    remark: '来源为政策汇编转载，需以成都市住建、发改、经信等部门正式文件复核。',
  },
  {
    id: 'p066',
    province: '四川省',
    city: '成都',
    energyPolicy: '国家碳达峰试点/公共建筑',
    policyCategory: '政策',
    publishYear: '2025',
    publishOrg: '成都市人民政府',
    policyName: '《国家碳达峰试点（成都）实施方案》',
    summary:
      '到2030年，成都市电能占终端用能比重力争达到55%，需求侧响应能力达到9%，全市电网安全负荷达到3500万千瓦；新建公共建筑本体达到78%节能要求，绿色低碳产业和公共建筑节能是医院项目重要匹配方向。',
    url: 'https://cds.sczwfw.gov.cn/art/2025/11/13/art_15398_301066.html',
    validPeriod: '至2030年前',
    remark: '市级试点政策。',
  },
  {
    id: 'p067',
    province: '贵州省',
    city: '全省适用',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '贵州省人民政府， 省机关事务局',
    policyName: '《贵州省碳达峰实施方案》《贵州省公共机构绿色低碳引领行动促进碳达峰实施方案》',
    summary:
      '支持建筑、公共机构和重点用能领域节能降碳；公共机构政策可为医院能源托管、能效提升和绿色低碳示范提供依据。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202211/t20221130_1343039_ext.html',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖贵阳。',
  },
  {
    id: 'p068',
    province: '云南省',
    city: '全省适用',
    energyPolicy: '碳达峰/清洁能源',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '云南省人民政府',
    policyName: '《云南省碳达峰实施方案》',
    summary:
      '推进建筑、能源、公共机构和绿色低碳技术应用；昆明医院项目可结合公共建筑节能、清洁能源替代和绿色低碳运营。',
    url: 'http://ynjn.yn.gov.cn/cnPc/zcwjej/5946.html',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖昆明；来源为转载，需复核正式文件。',
  },
  {
    id: 'p069',
    province: '西藏自治区',
    city: '全区适用',
    energyPolicy: '碳达峰/清洁能源',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '西藏自治区住房和城乡建设厅',
    policyName: '《西藏自治区“数字住建”建设实施方案》',
    summary:
      '推进西藏住建领域数字化平台、数据资源体系和行业应用建设，提升建筑市场、工程质量安全、市政设施和城市运行管理数字化水平；医院类公共建筑节能改造可借助建筑运行数据、设备管理和能耗碳排放数据治理作为数字化支撑，但该文件本身偏数字住建基础能力建设。',
    url: 'https://zjt.xizang.gov.cn/xxgk/zcfg/202412/t20241218_452611.html',
    validPeriod: '至2030年前',
    remark: '自治区政策，覆盖拉萨。',
  },
  {
    id: 'p070',
    province: '陕西省',
    city: '全省适用',
    energyPolicy: '碳达峰/公共建筑',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '陕西省人民政府',
    policyName: '《陕西省碳达峰实施方案》',
    summary:
      '推动建筑、公共机构、能源效率提升和绿色低碳技术应用；西安医院项目可结合省级政策和西安市项目申报通知执行。',
    url: 'https://www.ncsc.org.cn/xwdt/gnxw/202303/t20230306_1018698.shtml',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖西安；来源为转载。',
  },
  {
    id: 'p071',
    province: '陕西省',
    city: '西安/西咸新区',
    energyPolicy: '国家碳达峰试点',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '西安市人民政府',
    policyName: '《西咸新区国家碳达峰试点实施方案》',
    summary:
      '强调低碳能源、绿色建筑、零碳园区和示范项目；可为西安都市圈医院园区综合能源、光伏储能和公共建筑节能项目提供包装参考。',
    url: 'https://www.ndrc.gov.cn/fggz/hjyzy/tdftzh/202408/t20240822_1392546.html',
    validPeriod: '至2030年前',
    remark: '西咸新区不等同西安全域。',
  },
  {
    id: 'p072',
    province: '甘肃省',
    city: '全省适用',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2022',
    publishOrg: '甘肃省人民政府',
    policyName: '《甘肃省碳达峰实施方案》',
    summary:
      '部署建筑、公共机构、能源消费和绿色低碳技术等任务；兰州医院项目可结合省级政策和兰州市项目库推进节能降碳改造。',
    url: 'https://www.gansu.gov.cn/gsszf/c100054/202305/169842573.shtml',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖兰州。',
  },
  {
    id: 'p073',
    province: '青海省',
    city: '全省适用',
    energyPolicy: '碳达峰/清洁能源',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '青海省住房和城乡建设厅',
    policyName: '《青海省碳达峰实施方案》',
    summary:
      '支持绿色建筑、公共机构节能、清洁能源替代和能效提升；西宁医院项目可结合可再生能源、供热制冷优化和公共机构节能实施。',
    url: 'http://zjt.qinghai.gov.cn/html/8/53875.html',
    validPeriod: '至2030年前',
    remark: '省级政策，覆盖西宁。',
  },
  {
    id: 'p074',
    province: '宁夏回族自治区',
    city: '全区适用',
    energyPolicy: '国家碳达峰试点/低碳示范',
    policyCategory: '政策',
    publishYear: '2024',
    publishOrg: '宁夏回族自治区发展改革委',
    policyName: '《宁夏碳达峰试点建设方案》',
    summary:
      '围绕宁夏碳达峰试点建设，支持城市、园区、社区、公共机构、企业等主体探索绿色低碳转型路径，推动能源结构优化、节能降碳改造、可再生能源利用和低碳示范场景建设；银川医院项目可结合公共机构低碳示范、综合能源、光伏储能和节能改造进行项目包装。',
    url: 'https://www.yinchuan.gov.cn/xxgk/bmxxgkml/jjkfqgwh/xxgkml/zcfg_1793/202404/t20240416_4512859.html',
    validPeriod: '现行有效/以试点建设周期为准',
    remark:
      '自治区层面碳达峰试点建设政策，覆盖银川；可用于医院公共机构低碳示范、综合能源和节能改造项目包装。',
  },
  {
    id: 'p075',
    province: '宁夏回族自治区',
    city: '银川',
    energyPolicy: '碳达峰/公共机构',
    policyCategory: '政策',
    publishYear: '2023/2026',
    publishOrg: '银川市发展和改革委员会',
    policyName: '《银川市碳达峰实施方案（征求意见稿）》',
    summary:
      '银川碳达峰征求稿和宁夏公共机构实践涉及绿色建筑、公共机构节能和能源托管；医院可参考合同能源管理和节能量核算路径。',
    url: 'https://www.yinchuan.gov.cn/zmhd/yjzjfk/202309/t20230911_4259068.html',
    validPeriod: '以正式发布为准',
    remark: '第一项为征求意见稿，需复核正式文件。',
  },
  {
    id: 'p076',
    province: '新疆维吾尔自治区',
    city: '全区适用',
    energyPolicy: '公共机构绿色低碳',
    policyCategory: '政策',
    publishYear: '2023',
    publishOrg: '新疆维吾尔自治区工业和信息化厅、发展改革委、生态环境厅',
    policyName: '《新疆维吾尔自治区工业领域碳达峰实施方案》',
    summary:
      '推动新疆工业领域绿色低碳转型，实施重点行业节能降碳改造、绿色制造体系建设、低碳技术推广和园区绿色化改造；医院项目不属于工业领域，但院区综合能源、高效设备更新、光伏储能和绿色低碳技术应用可借鉴其节能降碳技术路径。',
    url: 'https://gxt.xinjiang.gov.cn/gxt/tzgg/202308/d914db965ea74beaa7a3598830557953.shtml',
    validPeriod: '至2030年前',
    remark: '自治区公共机构政策，覆盖乌鲁木齐。',
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
  locationArr: string[],
): { peakValleyPriceDiff: number; valleyHours: number } | null {
  const entry = getEnergyPrices(locationArr);
  if (!entry || !entry.electricity) return null;
  return {
    peakValleyPriceDiff: entry.electricity.peakValleyDiff,
    valleyHours: entry.electricity.valleyDuration,
  };
}

/**
 * 查询能源政策（国家层面 + 所在地匹配）
 * @param locationArr e.g. ['北京市', '东城区'] / ['河北省', '石家庄市'] / ['北京市']
 */
export function queryEnergyPolicies(locationArr: string[]): PolicyEntry[] {
  if (!locationArr || locationArr.length === 0) return [];
  const provinceRaw = locationArr[0];

  // 国家层面政策始终返回
  const results = policies.filter((p) => p.province === '国家层面');

  if (MUNICIPALITIES.includes(provinceRaw)) {
    // 直辖市：匹配 province = 直辖市名，city 为「全市区域」或区名
    const district = locationArr[1];
    results.push(
      ...policies.filter(
        (p) =>
          p.province === provinceRaw &&
          (p.city === '全市区域' || (district ? p.city === district : false)),
      ),
    );
    return results;
  }

  // 普通省市：匹配 province = 省名
  results.push(...policies.filter((p) => p.province === provinceRaw));
  // 额外匹配城市名（跨省同名城很少，但保留）
  const cityRaw = locationArr[1];
  if (cityRaw) {
    results.push(
      ...policies.filter(
        (p) => p.province !== '国家层面' && p.province !== provinceRaw && p.city === cityRaw,
      ),
    );
  }
  return results;
}

/**
 * 查询补贴类政策（policyCategory === '补贴'）
 */
export function querySubsidyPolicies(locationArr: string[]): PolicyEntry[] {
  return queryEnergyPolicies(locationArr).filter((p) => p.policyCategory === '补贴');
}
