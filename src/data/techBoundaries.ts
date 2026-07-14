// Source: 模块2/节能技术卡片-适用边界条件梳理表.xlsx
// 用途: Step 2 技术筛选打分 - 12 项技术的适用边界条件 + 一票否决项
// 结构: 每个技术 -> 多个维度 -> 每个维度有多个评分档(1/0.75/0.5/0) + 一票否决标记
// 录入: 2026-07-14

export interface BoundaryCondition {
  condition: string;
  score: number;
  isVeto: boolean;
}

export interface BoundaryDimension {
  dimension: string;
  weight: number;
  conditions: BoundaryCondition[];
}

export interface TechBoundary {
  techName: string;
  dimensions: BoundaryDimension[];
}

export const techBoundaries: TechBoundary[] = [
  {
    techName: '高效空调制冷机房技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥80000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜80000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.15,
        conditions: [
          { condition: '夏热冬暖地区、夏热冬冷地区、寒冷地区', score: 1, isVeto: false },
          { condition: '严寒地区', score: 0.5, isVeto: false },
          { condition: '温和地区', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.15,
        conditions: [
          { condition: '综合电价≥0.8元/kWh', score: 1, isVeto: false },
          { condition: '0.6元/kWh≤综合电价＜0.8元/kWh', score: 0.5, isVeto: false },
          { condition: '综合电价＜0.6元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.05,
        conditions: [
          { condition: '拥有独立、符合消防安全要求的专用设备机房，且空间充足', score: 1, isVeto: false },
          { condition: '满足机房面积、层高、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备机房条件', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '管理水平（包括：冷热源系统管理水平、照明系统管理水平）',
        weight: 0.1,
        conditions: [
          { condition: '仅配备基础的运维管理人员，仅具备基础的机房群控系统', score: 1, isVeto: false },
          { condition: '仅配备基础的运维管理人员，无法独立支撑智能群控系统的日常调试与管理', score: 0.5, isVeto: false },
          { condition: '配备专职暖通运维人员或专业运维团队，可支撑智能群控系统的日常调试与管理', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.1,
        conditions: [
          { condition: '有集中式冷水系统，冷源主机投产年份距今≥15年', score: 1, isVeto: false },
          { condition: '有集中式冷水系统，冷源主机投产年份距今5~15年', score: 0.5, isVeto: false },
          { condition: '无集中式冷水系统，或冷源主机投产年份距今＜5年', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '系统自动化基础',
        weight: 0.15,
        conditions: [
          { condition: '无数据采集条件且无法改造，无自控系统，靠人工就地操作', score: 1, isVeto: false },
          { condition: '仅具备基础数据采集与网络基础，仅具备基础的机房群控系统', score: 0.5, isVeto: false },
          { condition: '具备数据采集与网络基础，已具备完善的楼宇自控系统（BAS）', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.1,
        conditions: [
          { condition: '空调水系统已按医疗区域分区设置（门诊、医技、病房、洁净、行政后勤、内区等）（解释：空调水系统已按医疗区域分区设置，洁净区（手术部、ICU/DSA、静脉配液等）已与舒适性空调区（门诊、医技、病房、行政后勤等）分开独立设置）', score: 1, isVeto: false },
          { condition: '空调水系统有分区，但洁净区未独立设置', score: 0.75, isVeto: false },
          { condition: '空调水系统未按医疗区域分区设置', score: 0.5, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '冷水机组冷凝热回收技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥80000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜80000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '夏热冬暖地区', score: 1, isVeto: false },
          { condition: '夏热冬冷地区、寒冷地区', score: 0.5, isVeto: false },
          { condition: '严寒地区、温和地区', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.2,
        conditions: [
          { condition: '天然气价≥3.5元/m³', score: 1, isVeto: false },
          { condition: '2.5元/m³≤天然气价＜3.5元/m³', score: 0.5, isVeto: false },
          { condition: '天然气价＜2.5元/m³', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '拥有独立、符合消防安全要求的专用设备机房，且空间充足', score: 1, isVeto: false },
          { condition: '满足机房面积、层高、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备机房条件', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.3,
        conditions: [
          { condition: '有集中式冷水系统，冷源主机投产年份距今＞15年，无冷凝热回收', score: 1, isVeto: false },
          { condition: '有集中式冷水系统，冷源主机投产年份距今≤15年，无冷凝热回收', score: 0.5, isVeto: false },
          { condition: '无集中式冷水系统', score: 0, isVeto: true },
        ],
      },
    ],
  },
  {
    techName: '冷却塔供冷技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥100000㎡', score: 1, isVeto: false },
          { condition: '50000㎡≤建筑面积＜100000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜50000㎡', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '寒冷地区、温和地区', score: 1, isVeto: false },
          { condition: '夏热冬冷地区、严寒地区', score: 0.5, isVeto: false },
          { condition: '夏热冬暖地区', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.15,
        conditions: [
          { condition: '综合电价≥0.8元/kWh', score: 1, isVeto: false },
          { condition: '0.6元/kWh≤综合电价＜0.8元/kWh', score: 0.5, isVeto: false },
          { condition: '综合电价＜0.6元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.05,
        conditions: [
          { condition: '拥有独立、符合消防安全要求的专用设备机房，且空间充足', score: 1, isVeto: false },
          { condition: '满足机房面积、层高、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备机房条件', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.2,
        conditions: [
          { condition: '有集中式冷水系统，有冷却塔（如冷机+风盘），且无冷却塔供冷', score: 1, isVeto: false },
          { condition: '有集中式冷水系统，无冷却塔（如热泵+风盘）（注意：此条针对集中式冷源中，地源热泵、空气源热泵、风冷热泵这三个没有冷却塔的情况,当集中式冷源仅选择这三个时，此技术不适用)', score: 0, isVeto: true },
          { condition: '无集中式冷水系统，或有冷却塔供冷', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '系统自动化基础',
        weight: 0.1,
        conditions: [
          { condition: '冷却水泵、冷却塔风机为定频运行', score: 1, isVeto: false },
          { condition: '冷却水泵定频、冷却塔风机变频运行', score: 0.75, isVeto: false },
          { condition: '冷却水泵、冷却塔风机为变频运行', score: 0.5, isVeto: false },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.1,
        conditions: [
          { condition: '空调水系统已按医疗区域分区设置（门诊、医技、病房、洁净、行政后勤、内区等）（解释：空调水系统已按医疗区域分区设置，洁净区（手术部、ICU/DSA、静脉配液等）已与舒适性空调区分开独立设置），且有独立的内区环路', score: 1, isVeto: false },
          { condition: '空调水系统有分区，且洁净区已独立设置，但建筑内区未独立设置', score: 0.5, isVeto: false },
          { condition: '空调水系统未按医疗区域分区设置', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '蒸汽锅炉系统冷凝水余热回收技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥50000㎡', score: 1, isVeto: false },
          { condition: '20000㎡≤建筑面积＜50000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜20000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.2,
        conditions: [
          { condition: '天然气价≥3.5元/m³', score: 1, isVeto: false },
          { condition: '2.5元/m³≤天然气价＜3.5元/m³', score: 0.5, isVeto: false },
          { condition: '天然气价＜2.5元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '拥有独立、符合消防安全要求的专用设备机房，且空间充足', score: 1, isVeto: false },
          { condition: '满足机房面积、层高、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备机房条件', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.3,
        conditions: [
          { condition: '集中式蒸汽系统完善，已设置完整冷凝水管路', score: 1, isVeto: false },
          { condition: '集中式蒸汽系统基本完善，已设置冷凝水干管，需局部新增收集支管', score: 0.5, isVeto: false },
          { condition: '无集中式蒸汽系统', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.2,
        conditions: [
          { condition: '污染冷凝水与优质冷凝水已分质收集', score: 1, isVeto: false },
          { condition: '污染冷凝水与优质冷凝水可通过简单改造实现分质收集', score: 0.5, isVeto: false },
          { condition: '污染冷凝水与优质冷凝水无法分质收集', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '蓄冷技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥50000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜60000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '夏热冬暖地区、夏热冬冷地区、寒冷地区', score: 1, isVeto: false },
          { condition: '严寒地区', score: 0.5, isVeto: false },
          { condition: '温和地区', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.2,
        conditions: [
          { condition: '峰谷电价差≥0.7元/kWh、低谷电时长≥8h', score: 1, isVeto: false },
          { condition: '0.5元/kWh≤峰谷电价差＜0.7元/kWh、低谷电时长≥8h', score: 0.5, isVeto: false },
          { condition: '峰谷电价差＜0.5元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '电网增容',
        weight: 0.05,
        conditions: [
          { condition: '变压器容量富余，无需增容', score: 1, isVeto: false },
          { condition: '变压器有过载风险，但电网可增容', score: 0.5, isVeto: false },
          { condition: '变压器有过载风险且无法增容', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '项目可提供充足的蓄冷场地', score: 1, isVeto: false },
          { condition: '满足蓄冷场地空间、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备蓄冷场地条件', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '当地能源政策',
        weight: 0.05,
        conditions: [
          { condition: '有需求侧响应政策和财政专项补贴', score: 1, isVeto: false },
          { condition: '有需求侧响应政策，暂无财政专项补贴', score: 0.5, isVeto: false },
          { condition: '无节能/可再生能源利用等能源相关政策', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.2,
        conditions: [
          { condition: '有集中式冷水系统，但非蓄冷系统', score: 1, isVeto: false },
          { condition: '有集中式冷水系统，且有蓄冷系统。或无集中式空调系统', score: 0, isVeto: true },
        ],
      },
    ],
  },
  {
    techName: '洁净区域冷热源升级技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '洁净区域总建筑面积≥1500㎡，且洁净手术室≥10间', score: 1, isVeto: false },
          { condition: '洁净区域总建筑面积800~1500㎡，且洁净手术室4~10间', score: 0.5, isVeto: false },
          { condition: '洁净区域总建筑面积＜800㎡', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '医院类型',
        weight: 0.2,
        conditions: [
          { condition: '综合医院、专科医院、中医/中西医结合医院、民族医院（集门诊、医技、住院于一体）', score: 1, isVeto: false },
          { condition: '康复医院、疗养院、老年病医院（以住院康养为主）、综合门诊部、医学检验实验室、急救中心', score: 0.5, isVeto: false },
          { condition: '社区卫生服务中心', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '夏热冬暖地区（几乎无自然冷却，有稳定的冷凝热）', score: 1, isVeto: false },
          { condition: '寒冷地区、夏热冬冷地区（部分自然冷却）', score: 0.5, isVeto: false },
          { condition: '严寒地区（自然冷却，冷凝热回收少）', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.3,
        conditions: [
          { condition: '洁净区域有独立的冷热源机组，但无热回收功能，使用年限≥10年', score: 1, isVeto: false },
          { condition: '洁净区域有独立的冷热源机组，但无热回收功能，使用年限＜10年', score: 0.5, isVeto: false },
          { condition: '洁净区域有独立的冷热源机组，且带热回收功能', score: 0, isVeto: true },
        ],
      },
    ],
  },
  {
    techName: '相变储热供暖技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥60000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜60000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '严寒地区、寒冷地区', score: 1, isVeto: false },
          { condition: '夏热冬冷地区', score: 0.5, isVeto: false },
          { condition: '夏热冬暖地区、温和地区', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.2,
        conditions: [
          { condition: '峰谷电价差≥0.6元/kWh、低谷电时长≥8h', score: 1, isVeto: false },
          { condition: '0.5元/kWh≤峰谷电价差＜0.6元/kWh、低谷电时长≥8h', score: 0.5, isVeto: false },
          { condition: '峰谷电价差＜0.5元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '电网增容',
        weight: 0.2,
        conditions: [
          { condition: '变压器容量富余，无需增容', score: 1, isVeto: false },
          { condition: '变压器有过载风险，但电网可增容', score: 0.5, isVeto: false },
          { condition: '变压器有过载风险且无法增容', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '项目可提供机房场地条件，供储能设备安装', score: 1, isVeto: false },
          { condition: '满足储能场地空间、荷载需求有一定难度，但可操作', score: 0.5, isVeto: false },
          { condition: '不具备机房场地场地条件', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '当地能源政策',
        weight: 0.1,
        conditions: [
          { condition: '有需求侧响应政策和财政专项补贴', score: 1, isVeto: false },
          { condition: '有需求侧响应政策，暂无财政专项补贴', score: 0.5, isVeto: false },
          { condition: '无节能/可再生能源利用等能源相关政策', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: 'IoT+数字孪生+AI前馈调节',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥60000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜60000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '医院类型',
        weight: 0.2,
        conditions: [
          { condition: '综合医院、专科医院、中医/中西医结合医院、民族医院（集门诊、医技、住院于一体）', score: 1, isVeto: false },
          { condition: '康复医院、疗养院、老年病医院（以住院康养为主）', score: 0.5, isVeto: false },
          { condition: '急救中心、综合门诊部、医学检验实验室、社区卫生服务中心', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.1,
        conditions: [
          { condition: '寒冷地区、夏热冬冷地区', score: 1, isVeto: false },
          { condition: '严寒地区、夏热冬暖地区', score: 0.5, isVeto: false },
          { condition: '温和地区', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '满足有线控制方案的安装条件', score: 1, isVeto: false },
          { condition: '安装条件有限，需采用有线和无线结合的控制方案', score: 0.5, isVeto: false },
          { condition: '有线和无线均无安装条件（老旧管线混乱、回路复杂）', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '系统自动化基础',
        weight: 0.2,
        conditions: [
          { condition: '具备数据采集与网络基础，已具备完善的楼宇自控系统（BAS）', score: 1, isVeto: false },
          { condition: '仅具备基础数据采集与网络基础，仅具备基础的机房群控系统', score: 0.5, isVeto: false },
          { condition: '无数据采集条件且无法改造，无自控系统，靠人工就地操作', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.2,
        conditions: [
          { condition: '空调水系统已按医疗区域分区设置（门诊、医技、病房、洁净、行政后勤、内区等）（解释：空调水系统已按医疗区域分区设置，洁净区（手术部、ICU/DSA、静脉配液等）已与舒适性空调区（门诊、医技、病房、行政后勤等）分开独立设置）', score: 1, isVeto: false },
          { condition: '空调水系统有分区，但洁净区未独立设置', score: 0.5, isVeto: false },
          { condition: '空调水系统未按医疗区域分区设置', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '地源热泵多能源耦合供热',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.3,
        conditions: [
          { condition: '建筑面积≥40000㎡', score: 1, isVeto: false },
          { condition: '20000㎡≤建筑面积＜40000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜20000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '寒冷地区、夏热冬冷地区（地源+空气源+锅炉+太阳能等，能效高）', score: 1, isVeto: false },
          { condition: '夏热冬暖地区、温和地区（空气源+太阳能等，不做地源，能效中等）', score: 0.5, isVeto: false },
          { condition: '严寒地区（空气源结霜严重，地源+锅炉+太阳能，能效稍低）', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '当地能源政策',
        weight: 0.3,
        conditions: [
          { condition: '有节能/可再生能源利用等能源相关政策，且有财政专项补贴', score: 1, isVeto: false },
          { condition: '有节能/可再生能源利用等能源相关政策，暂无财政专项补贴', score: 0.5, isVeto: false },
          { condition: '无节能/可再生能源利用等能源相关政策', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '室外场地面积条件',
        weight: 0.2,
        conditions: [
          { condition: '有室外场地条件用于地源换热井，面积≥18%院区地上建筑面积', score: 1, isVeto: false },
          { condition: '有室外场地条件用于地源换热井，8%≤面积＜18%院区地上建筑面积', score: 0.75, isVeto: false },
          { condition: '有室外场地条件用于地源换热井，面积＜8%院区地上建筑面积；或无室外场地条件用于地源换热井', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '智能照明控制技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.1,
        conditions: [
          { condition: '建筑面积≥50000㎡', score: 1, isVeto: false },
          { condition: '20000㎡≤建筑面积＜50000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜20000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '项目属性',
        weight: 0.2,
        conditions: [
          { condition: '节能灯具，且未采用智能照明', score: 1, isVeto: false },
          { condition: '非节能灯具，且未采用智能照明', score: 0.75, isVeto: false },
          { condition: '节能灯具，但未采用智能照明', score: 0.5, isVeto: false },
          { condition: '节能灯具，且已实现智能照明', score: 0.25, isVeto: false },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '满足有线控制方案的安装条件', score: 1, isVeto: false },
          { condition: '安装条件有限，需采用有线和无线结合的控制方案', score: 0.5, isVeto: false },
          { condition: '有线和无线均无安装条件（老旧管线混乱、回路复杂）', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '管理水平（包括：冷热源系统管理水平、照明系统管理水平）',
        weight: 0.2,
        conditions: [
          { condition: '无照明管理制度', score: 1, isVeto: false },
          { condition: '有照明管理制度，但执行不足', score: 0.5, isVeto: false },
          { condition: '有照明管理制度，且有高效的精细化管控能力', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '可实施医疗区域范围',
        weight: 0.2,
        conditions: [
          { condition: '一级适配区（门诊大厅、候诊区、病房走廊、护士站、地下车库、行政办公区、景观区域）、二级适配区（普通病房、术后康复区、治疗/换药、科室办公室）均未实现智能照明', score: 1, isVeto: false },
          { condition: '一级适配区和二级适配区小于一半区域已实现智能照明（＜6/11）', score: 0.5, isVeto: false },
          { condition: '一级适配区和二级适配区超过一半区域已实现智能照明（≥6/11）', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.2,
        conditions: [
          { condition: '集中式照明回路完善，具备分区域、分回路控制的物理基础', score: 1, isVeto: false },
          { condition: '有基本的分回路照明系统', score: 0.5, isVeto: false },
          { condition: '无集中分回路照明基础', score: 0, isVeto: true },
        ],
      },
    ],
  },
  {
    techName: '分时分区供暖技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.2,
        conditions: [
          { condition: '建筑面积≥80000㎡', score: 1, isVeto: false },
          { condition: '30000㎡≤建筑面积＜80000㎡', score: 0.5, isVeto: false },
          { condition: '建筑面积＜30000㎡', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '医院类型',
        weight: 0.2,
        conditions: [
          { condition: '综合医院、专科医院、中医/中西医结合医院、民族医院（集门诊、医技、住院于一体）', score: 1, isVeto: false },
          { condition: '康复医院、疗养院、老年病医院（以住院康养为主）、综合门诊部、医学检验实验室、急救中心', score: 0.5, isVeto: false },
          { condition: '社区卫生服务中心', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.4,
        conditions: [
          { condition: '严寒地区、寒冷地区', score: 1, isVeto: false },
          { condition: '夏热冬冷地区', score: 0.5, isVeto: false },
          { condition: '夏热冬暖地区、温和地区', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电管路系统分区（包括：空调水管路分区情况、蒸汽冷凝水管路分区情况、照明系统分区情况）',
        weight: 0.2,
        conditions: [
          { condition: '空调水系统已按医疗区域分区设置（门诊、医技、病房、洁净、行政后勤、内区等）（解释：空调水系统已按医疗区域分区设置，洁净区（手术部、ICU/DSA、静脉配液等）已与舒适性空调区（门诊、医技、病房、行政后勤等）分开独立设置）', score: 1, isVeto: false },
          { condition: '空调水系统有分区，但洁净区未独立设置', score: 0.5, isVeto: false },
          { condition: '空调水系统未按医疗区域分区设置', score: 0, isVeto: false },
        ],
      },
    ],
  },
  {
    techName: '光储充一体化技术',
    dimensions: [
      {
        dimension: '医疗/建筑规模',
        weight: 0.15,
        conditions: [
          { condition: '三级医院，年用电量≥1000万kWh（或面积≥80000㎡）', score: 1, isVeto: false },
          { condition: '二级/三级医院，年用电量300~1000万kWh', score: 0.5, isVeto: false },
          { condition: '一级医院', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '气候分区',
        weight: 0.2,
        conditions: [
          { condition: '光伏年等效利用小时数≥1200小时', score: 1, isVeto: false },
          { condition: '光伏年等效利用小时数1000~1200小时', score: 0.5, isVeto: false },
          { condition: '光伏年等效利用小时数＜1000小时', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '峰谷电价差（或综合电价/气价/水价）',
        weight: 0.1,
        conditions: [
          { condition: '峰谷电价差≥0.7元/kWh', score: 1, isVeto: false },
          { condition: '0.5元/kWh≤峰谷电价差＜0.7元/kWh', score: 0.5, isVeto: false },
          { condition: '峰谷电价差＜0.5元/kWh', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '电网增容',
        weight: 0.1,
        conditions: [
          { condition: '变压器负荷率≤70%，无过载风险，无需增容', score: 1, isVeto: false },
          { condition: '变压器负荷率70%~85%，有一定过载风险，但可增容', score: 0.5, isVeto: false },
          { condition: '变压器负荷率＞90%，且无法增容', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '机电安装条件（包括：机电站房安装条件、自控系统安装条件）',
        weight: 0.1,
        conditions: [
          { condition: '建筑（屋顶）结构承重满足要求，无需加固', score: 1, isVeto: false },
          { condition: '建筑（屋顶）结构承重不满足要求，但可加固', score: 0.5, isVeto: false },
          { condition: '建筑（屋顶）结构承重不满足要求，且无法加固', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '当地能源政策',
        weight: 0.1,
        conditions: [
          { condition: '有节能/可再生能源利用等能源相关政策，且有财政专项补贴', score: 1, isVeto: false },
          { condition: '有节能/可再生能源利用等能源相关政策，暂无财政专项补贴', score: 0.5, isVeto: false },
          { condition: '无节能/可再生能源利用等能源相关政策', score: 0, isVeto: false },
        ],
      },
      {
        dimension: '室外场地面积条件',
        weight: 0.1,
        conditions: [
          { condition: '有独立室外场地，储能舱与医疗建筑≥50m', score: 1, isVeto: false },
          { condition: '储能舱与医疗建筑25~50m，需设防火墙', score: 0.5, isVeto: false },
          { condition: '场地有限，无法满足储能设施安全距离要求', score: 0, isVeto: true },
        ],
      },
      {
        dimension: '能源站系统类型（包括：冷源系统类型、热源系统类型）',
        weight: 0.15,
        conditions: [
          { condition: '可安装光伏面积占总建筑面积比例≥10%', score: 1, isVeto: false },
          { condition: '可安装光伏面积占总建筑面积为5%~10%', score: 0.5, isVeto: false },
          { condition: '可安装光伏面积占总建筑面积比例＜5%', score: 0, isVeto: false },
        ],
      },
    ],
  },
];

export function getTechBoundary(techName: string): TechBoundary | undefined {
  return techBoundaries.find(t => t.techName === techName);
}

export function getVetoConditions(techName: string): BoundaryCondition[] {
  const tb = getTechBoundary(techName);
  if (!tb) return [];
  return tb.dimensions.flatMap(d => d.conditions.filter(c => c.isVeto));
}
