// 政策绿融库 — 预置参考数据
// 国家/地区能源政策、可再生能源补贴政策、绿色金融政策

export interface PolicyEntry {
  id: string;
  region: string;
  category: 'energy' | 'subsidy' | 'green_finance';
  name: string;
  url: string;
  summary: string;
  peakValleyPriceDiff?: number;
  valleyHours?: number;
}

export interface SubsidyEntry {
  id: string;
  region: string;
  level: 'municipality' | 'province' | 'city';
  name: string;
  policyRef: string;
  subsidyMode: 'investment' | 'capacity';
  investmentRatio?: number;
  subsidyIndex?: number;
  subsidyIndexUnit?: string;
}

export const policies: PolicyEntry[] = [
  {
    id: '1',
    region: '北京市',
    category: 'energy',
    name: '北京市全面推进新能源供热高质量发展实施意见',
    url: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/202311/t20231110_3299506.html',
    summary:
      '坚持新能源供热优先原则，推动供热系统绿色低碳转型替代。禁止新建和扩建燃气独立供暖系统，新建供热项目新能源供热装机占比原则上不低于60%。到2025年，力争全市新能源供热面积累计达到1.45亿平方米。',
    peakValleyPriceDiff: 0.7456,
    valleyHours: 8,
  },
  {
    id: '2',
    region: '北京市',
    category: 'subsidy',
    name: '北京市政府固定资产投资支持新能源供热、光伏发电项目',
    url: 'https://fgw.beijing.gov.cn/fgwzwgk/2024zcwj/bwqtwj/202507/t20250708_4144351.htm',
    summary:
      '新能源供热装机占比60%及以上：给予新能源建设投资30%的资金支持；装机占比30%~60%：给予20%资金支持。',
  },
  {
    id: '3',
    region: '上海市',
    category: 'energy',
    name: '上海市绿色低碳转型行动方案',
    url: '',
    summary: '推动建筑领域节能改造，鼓励采用高效热泵、蓄能等技术。新建公共建筑可再生能源应用比例不低于10%。',
  },
  {
    id: '4',
    region: '天津市',
    category: 'energy',
    name: '天津市可再生能源发展"十四五"规划',
    url: '',
    summary: '推进可再生能源与建筑一体化应用，支持地源热泵、空气源热泵等清洁供暖技术。',
  },
  {
    id: '5',
    region: '重庆市',
    category: 'energy',
    name: '重庆市绿色建筑创建行动实施方案',
    url: '',
    summary: '新建建筑全面执行绿色建筑标准，鼓励采用可再生能源和高效节能设备。',
  },
  {
    id: '6',
    region: '河北省',
    category: 'energy',
    name: '河北省冬季清洁取暖实施方案',
    url: '',
    summary: '因地制宜推进清洁取暖，支持地源热泵、空气源热泵等清洁供暖方式。鼓励公共建筑节能改造。',
  },
  {
    id: '7',
    region: '山东省',
    category: 'energy',
    name: '山东省绿色建筑与建筑节能发展条例',
    url: '',
    summary: '推动既有建筑节能改造，鼓励医院等公共建筑采用高效节能技术和可再生能源系统。',
  },
];

export const subsidies: SubsidyEntry[] = [
  // 直辖市
  {
    id: 's1',
    region: '北京市',
    level: 'municipality',
    name: '新能源供热投资补贴',
    policyRef: '京发改〔2024〕号',
    subsidyMode: 'investment',
    investmentRatio: 30,
  },
  {
    id: 's2',
    region: '北京市',
    level: 'municipality',
    name: '地源热泵系统容量补贴',
    policyRef: '京发改〔2024〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 100,
    subsidyIndexUnit: '元/kW',
  },
  {
    id: 's3',
    region: '上海市',
    level: 'municipality',
    name: '可再生能源建筑应用补贴',
    policyRef: '沪发改能源〔2023〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 50,
    subsidyIndexUnit: '元/kW',
  },
  {
    id: 's4',
    region: '天津市',
    level: 'municipality',
    name: '清洁供暖投资补贴',
    policyRef: '津发改〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 25,
  },
  {
    id: 's5',
    region: '重庆市',
    level: 'municipality',
    name: '绿色建筑节能改造补贴',
    policyRef: '渝建发〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 20,
  },
  // 省级
  {
    id: 's6',
    region: '河北省',
    level: 'province',
    name: '清洁取暖省级补贴',
    policyRef: '冀发改能源〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 15,
  },
  {
    id: 's7',
    region: '山东省',
    level: 'province',
    name: '建筑节能改造省级补贴',
    policyRef: '鲁建节科〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 20,
  },
  {
    id: 's8',
    region: '江苏省',
    level: 'province',
    name: '绿色建筑省级补贴',
    policyRef: '苏建科〔2023〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 60,
    subsidyIndexUnit: '元/kW',
  },
  {
    id: 's9',
    region: '浙江省',
    level: 'province',
    name: '可再生能源应用省级补贴',
    policyRef: '浙发改能源〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 18,
  },
  {
    id: 's10',
    region: '广东省',
    level: 'province',
    name: '绿色建筑省级补贴',
    policyRef: '粤建科〔2023〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 80,
    subsidyIndexUnit: '元/kW',
  },
  // 市级
  {
    id: 's11',
    region: '石家庄市',
    level: 'city',
    name: '清洁取暖市级补贴',
    policyRef: '石发改〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 10,
  },
  {
    id: 's12',
    region: '济南市',
    level: 'city',
    name: '建筑节能改造市级补贴',
    policyRef: '济建节科〔2023〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 30,
    subsidyIndexUnit: '元/kW',
  },
  {
    id: 's13',
    region: '南京市',
    level: 'city',
    name: '绿色建筑市级配套补贴',
    policyRef: '宁建科〔2023〕号',
    subsidyMode: 'investment',
    investmentRatio: 8,
  },
  {
    id: 's14',
    region: '杭州市',
    level: 'city',
    name: '可再生能源市级补贴',
    policyRef: '杭发改〔2023〕号',
    subsidyMode: 'capacity',
    subsidyIndex: 40,
    subsidyIndexUnit: '元/kW',
  },
];

const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'];

export function querySubsidies(location: string): SubsidyEntry[] {
  if (!location) return [];

  const isMunicipal = MUNICIPALITIES.some((m) => location.startsWith(m));

  if (isMunicipal) {
    const city = MUNICIPALITIES.find((m) => location.startsWith(m));
    return subsidies.filter((s) => s.region === city && s.level === 'municipality');
  }

  const results: SubsidyEntry[] = [];

  // 省级补贴 — location 格式可能是 "河北省 石家庄市"
  const provincePart = location.split(' ')[0] || location;
  const provinceSubsidies = subsidies.filter(
    (s) => (s.region === provincePart || provincePart.startsWith(s.region.replace(/省$/, ''))) && s.level === 'province'
  );
  results.push(...provinceSubsidies);

  // 市级补贴
  const cityPart = location.split(' ')[1] || '';
  if (cityPart) {
    const citySubsidies = subsidies.filter((s) => s.region === cityPart && s.level === 'city');
    results.push(...citySubsidies);
  }

  return results;
}
