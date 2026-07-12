import { useState, type ReactNode } from 'react';
import { Form, Select, Checkbox, Radio, Tabs, InputNumber, Input, Table, type TableProps } from 'antd';

const COLD_SOURCE_CENTRALIZED = [
  '传统电制冷冷水机组',
  '地源热泵',
  '空气源热泵',
  '风冷热泵',
  '能源塔',
  '溴化锂吸收式冷水机组',
  '冰蓄冷',
  '水蓄冷',
  '直燃机',
  '三联供',
];

const COLD_SOURCE_DECENTRALIZED = ['分体空调', 'VRV空调', '恒温恒湿空调'];

const COLD_SOURCE_REGIONAL = ['DCS区域制冷站'];

const HEAT_SOURCE_CENTRALIZED = [
  '燃气热水锅炉',
  '燃油热水锅炉',
  '电热水锅炉',
  '地源热泵',
  '空气源热泵',
  '能源塔',
  '相变储热',
  '直燃机',
  '三联供',
];

const HEAT_SOURCE_DECENTRALIZED = ['分体空调', 'VRV空调', '恒温恒湿空调', '风冷热泵'];

const HEAT_SOURCE_REGIONAL = ['市政热力'];

const STEAM_CENTRALIZED = ['燃气蒸汽锅炉', '燃油蒸汽锅炉', '电蒸汽锅炉'];

const STEAM_DECENTRALIZED = ['电蒸汽发生器', '燃气蒸汽发生器'];

const STEAM_REGIONAL = ['市政蒸汽'];

const STEAM_RANGE_OPTIONS = ['洗衣房', '厨房', '中心供应', '空调加湿', '中医药/制剂室'];

const WATER_PARTITION_OPTIONS = [
  { label: '系统已按医疗区域分区设置（门诊、医技、病房、洁净、行政后勤、内区等）', value: '已按医疗区域分区' },
  { label: '系统有分区，但洁净区未独立设置', value: '有分区洁净区未独立' },
  { label: '系统有分区，洁净区已独立但建筑内区未独立设置', value: '有分区内区未独立' },
  { label: '系统未按医疗区域分区设置', value: '未分区' },
];

const STEAM_CONDENSATE_PARTITION_OPTIONS = [
  { label: '污染冷凝水与优质冷凝水已分质收集', value: '已分质' },
  { label: '可通过简单改造实现分质收集', value: '可改造实现' },
  { label: '无法分质收集', value: '无法分质' },
];

const HVAC_MGMT_LEVEL_OPTIONS = [
  { label: '仅配备基础的运维管理人员，仅具备基础的机房群控系统', value: '基础群控' },
  { label: '仅配备基础的运维管理人员，无法独立支撑智能群控系统的日常调试与管理', value: '无法支撑智能群控' },
  { label: '配备专职暖通运维人员或专业运维团队，可支撑智能群控系统的日常调试与管理', value: '专职团队可支撑智能群控' },
];

/** 集中式冷源中不需要"冷却塔供冷"的项 */
const NO_COOLING_TOWER = new Set(['地源热泵', '空气源热泵', '风冷热泵']);

const YES_NO_RADIO = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
];
const HAS_NO_RADIO = [
  { label: '有', value: '有' },
  { label: '无', value: '无' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1996 + 1 }, (_, i) => {
  const y = 1996 + i;
  return { label: `${y}年`, value: y };
});

// ---- 电气系统 ----

const LIGHTING_NON_ENERGY_SAVING = ['白炽灯', '普通荧光灯'];
const LIGHTING_ENERGY_SAVING = ['节能型荧光灯(带电子镇流器的三基色荧光灯、CFL紧凑型荧光灯)', 'LED灯'];

const SMART_LIGHTING_LEVEL1_OPTIONS = [
  '门诊大厅',
  '候诊区',
  '病房走廊',
  '护士站',
  '行政办公区',
  '地下车库',
  '景观区域',
];

const SMART_LIGHTING_LEVEL2_OPTIONS = [
  '普通病房',
  '术后康复区',
  '治疗换药区',
  '科室办公区',
];

const SMART_LIGHTING_LEVEL3_OPTIONS = [
  '手术室',
  '重症监护室',
  '检验科样本检测区',
  '阅片区（病理科切片、影像科）',
  '影像科',
  '核医学功能房间',
  '内镜中心诊疗区',
];

const LIGHTING_MGMT_OPTIONS = [
  { label: '无照明管理制度', value: '无制度' },
  { label: '有照明管理制度但执行不足', value: '有制度执行不足' },
  { label: '有照明管理制度且有高效的精细化管理管控能力', value: '有制度精细化管理' },
];

const LIGHTING_PARTITION_OPTIONS = [
  { label: '集中式照明回路完善，具备分区域、分回路控制的物理基础', value: '分区回路完善' },
  { label: '有基本的分回路照明系统', value: '基本分回路' },
  { label: '无集中分回路照明基础', value: '无分回路' },
];

const ANNUAL_POWER_OPTIONS = [
  { label: '年用电量≥1000万kWh', value: '≥1000万' },
  { label: '年用电量300~1000万kWh', value: '300~1000万' },
  { label: '年用电量＜300万kWh', value: '<300万' },
];

// ---- 给排水系统 ----

// 排水体制（多选）
const DRAINAGE_SYSTEM_OPTIONS = ['雨污分流', '雨污合流', '污废分流', '医疗污水单独收集'];

// 生活热水 - 热源形式（多选，含"其他"）
const HOT_WATER_HEAT_SOURCE_OPTIONS = [
  '燃气锅炉',
  '蒸汽换热',
  '电加热',
  '空气源热泵',
  '太阳能',
  '冷凝热/余热回收',
  '市政热水',
  '其他',
];

// 生活热水 - 供水范围（多选，含"其他"）
const HOT_WATER_SUPPLY_SCOPE_OPTIONS = ['病房', '手术部', 'ICU', 'CSSD', '洗衣房', '厨房', '其他'];

// 生活热水 - 系统形式（单选）
const HOT_WATER_SYSTEM_TYPE_OPTIONS = [
  { label: '集中循环', value: '集中循环' },
  { label: '分区循环', value: '分区循环' },
  { label: '局部制备', value: '局部制备' },
];

// 生活热水 - 循环泵（单选）
const HOT_WATER_CIRC_PUMP_OPTIONS = [
  { label: '变频', value: '变频' },
  { label: '定频', value: '定频' },
];

// 生活热水 - 循环控制（多选）
const HOT_WATER_CIRC_CONTROL_OPTIONS = ['定时', '温差', '变流量', '全天运行'];

// 雨水收集（单选）
const RAIN_COLLECTION_OPTIONS = [
  { label: '无', value: '无' },
  { label: '屋面雨水', value: '屋面雨水' },
  { label: '道路/广场雨水', value: '道路/广场雨水' },
];

// 海绵设施（单选）
const SPONGE_FACILITY_OPTIONS = [
  { label: '下凹绿地', value: '下凹绿地' },
  { label: '透水铺装', value: '透水铺装' },
  { label: '调蓄池', value: '调蓄池' },
  { label: '弃流/过滤处理', value: '弃流/过滤处理' },
  { label: '无', value: '无' },
];

// 计量层级（单选）
const METER_LEVEL_OPTIONS = [
  { label: '仅总表', value: '仅总表' },
  { label: '楼栋/功能区二级计量', value: '楼栋/功能区二级计量' },
  { label: '病房、医技、厨房、生活热水等重点用水三级计量', value: '三级计量' },
];

// 重点分项（单选）
const METER_KEY_ITEM_OPTIONS = [
  '生活冷水',
  '生活热水',
  '中水/雨水',
  '冷却塔补水',
  '锅炉补水',
  '洗衣房',
  '厨房',
  '中心供应',
];

// 监测管理（单选）
const METER_MONITORING_OPTIONS = [
  '远传水表',
  '漏损监测/报警',
  '夜间最小流量分析',
  '水平衡分析',
  '泵组能效监测',
];

// 管网状况（单选）
const PIPE_CONDITION_OPTIONS = [
  { label: '无明显漏损', value: '无明显漏损' },
  { label: '存在局部漏损可改造', value: '存在局部漏损可改造' },
  { label: '漏损严重/管网老化', value: '漏损严重/管网老化' },
];

// 节水器具（单选）
const WATER_SAVING_OPTIONS = [
  { label: '全面采用', value: '全面采用' },
  { label: '部分采用', value: '部分采用' },
  { label: '未采用', value: '未采用' },
];

// ---- 智能化系统 ----

const SMART_LEVEL_OPTIONS = [
  {
    label: '具备数据采集与网络基础，已具备完善的楼宇自控系统（BAS），可实现建筑设备集成与智能运维（启停/调节/计量/联动）',
    value: 'BAS完善',
  },
  {
    label: '仅具备基础数据采集与网络基础，仅具备基础的机房群控系统（仅启停和计量，调节和联动处于瘫痪状态）',
    value: 'BAS基础',
  },
  {
    label: '无数据采集条件且无法改造，无自控系统，靠人工就地操作',
    value: '无自控',
  },
];

const VFD_RADIO_OPTIONS = [
  { label: '变频', value: '变频' },
  { label: '定频', value: '定频' },
];

// ---- 医疗动力系统 ----

// 气体种类（单选，含"其他"）
const MED_GAS_TYPE_OPTIONS = [
  '医用氧气',
  '医疗空气',
  '器械空气',
  '医用真空',
  '氧化亚氮',
  '二氧化碳',
  '氮气',
  '氩气',
  '麻醉废气排放(WAGD)',
  '其他',
];

// 供应形式（单选）
const MED_GAS_SUPPLY_FORM_OPTIONS = [
  { label: '集中站房+管网', value: '集中站房+管网' },
  { label: '区域汇流排', value: '区域汇流排' },
  { label: '瓶装分散供气', value: '瓶装分散供气' },
];

// 服务区域（单选）
const MED_GAS_SERVICE_AREA_OPTIONS = ['手术部', 'ICU/CCU', '急诊', '病房', '内镜', '影像/介入'];

// 计量层级（单选）
const MED_GAS_METER_LEVEL_OPTIONS = [
  { label: '仅站房总计量', value: '仅站房总计量' },
  { label: '按气体种类计量', value: '按气体种类计量' },
  { label: '按楼栋/科室计量', value: '按楼栋/科室计量' },
  { label: '重点设备单独计量', value: '重点设备单独计量' },
];

// 氧气主气源（单选）
const OXYGEN_MAIN_SOURCE_OPTIONS = [
  { label: '液氧储罐+汽化器', value: '液氧储罐+汽化器' },
  { label: 'PSA制氧机', value: 'PSA制氧机' },
  { label: '氧气瓶汇流排', value: '氧气瓶汇流排' },
  { label: '组合气源', value: '组合气源' },
];

// 备用气源（单选）
const OXYGEN_BACKUP_SOURCE_OPTIONS = [
  { label: '独立备用源', value: '独立备用源' },
  { label: '汇流排备用', value: '汇流排备用' },
  { label: '无', value: '无' },
];

// 分科室计量（单选）
const YES_NO_STRING_OPTIONS = [
  { label: '是', value: '是' },
  { label: '否', value: '否' },
];

// 压缩空气用途（多选）
const COMPRESSED_AIR_PURPOSE_OPTIONS = ['医疗空气', '器械空气'];

// 压缩机形式（单选，含"其他"）
const COMPRESSOR_TYPE_OPTIONS = ['无油涡旋', '无油螺杆', '活塞式', '其他'];

// 压缩空气控制方式（单选）
const COMPRESSED_AIR_CONTROL_OPTIONS = [
  { label: '变频恒压', value: '变频恒压' },
  { label: '定频启停', value: '定频启停' },
  { label: '多机联控', value: '多机联控' },
  { label: '人工控制', value: '人工控制' },
];

// 真空泵形式（单选，含"其他"）
const VACUUM_PUMP_TYPE_OPTIONS = ['干式爪泵', '水环式', '油润滑旋片式', '其他'];

// 真空控制方式（单选）
const VACUUM_CONTROL_OPTIONS = [
  { label: '变频恒真空', value: '变频恒真空' },
  { label: '定频启停', value: '定频启停' },
  { label: '多机联控', value: '多机联控' },
  { label: '人工控制', value: '人工控制' },
];

// ---- 机电安装系统 ----

// 电网增容 - 蓄冷/相变储热场景（4 选 1）
const GRID_EXPANSION_STORAGE_OPTIONS = [
  { label: '变压器容量富余，无需增容', value: '容量富余无需增容' },
  { label: '变压器有过载风险，但电网可增容', value: '过载风险可增容' },
  { label: '变压器有过载风险，且电网无法增容', value: '过载风险无法增容' },
  { label: '不明确', value: '不明确' },
];

// 电网增容 - 光储充一体化场景（3 选 1）
const GRID_EXPANSION_PV_OPTIONS = [
  { label: '变压器负荷率≤70%，无过载风险，无需增容', value: '负荷率≤70%无需增容' },
  { label: '变压器负荷率70%~85%，有一定过载风险，但可增容', value: '负荷率70%~85%可增容' },
  { label: '变压器负荷率＞90%，且无法增容', value: '负荷率＞90%无法增容' },
];

// 改造主站房（3 选 1）
const MAIN_STATION_OPTIONS = [
  { label: '拥有独立、符合消防安全要求的专用设备机房，且具备一定的改造空间（如增加一套板式换热器与配套水泵）', value: '专用机房可改造' },
  { label: '满足机房面积、层高、荷载等需求有一定难度，但可操作', value: '条件有限可操作' },
  { label: '机房空间紧凑，不具备设备增加、机房改造条件', value: '空间紧凑不可改' },
];

// 扩建站房（3 选 1）
const EXPANSION_STATION_OPTIONS = [
  { label: '项目可提供机房场地条件，供储能设备安装（冰蓄冷机房面积35㎡/万㎡建筑面积，地面荷载≥12kN/㎡，机房净高≥4m；相变储热机房面积50㎡/万㎡建筑面积，地面荷载≥7kN/㎡，机房净高≥3.5m）', value: '可提供场地' },
  { label: '满足储能场地空间、荷载需求有一定难度，但可操作', value: '条件有限可操作' },
  { label: '不具备任何机房场地条件', value: '不具备场地' },
];

// 地源热泵换热井（有/无）
const GEO_HEAT_EXCHANGER_OPTIONS = [
  { label: '有室外场地条件用于地源换热井', value: '有' },
  { label: '无室外场地条件用于地源换热井', value: '无' },
];

// 室外储能舱（3 选 1）
const OUTDOOR_STORAGE_CABIN_OPTIONS = [
  { label: '有独立室外场地，储能舱与医疗建筑≥50m', value: '≥50m' },
  { label: '储能舱与医疗建筑25~50m，需设防火墙', value: '25~50m需防火墙' },
  { label: '场地有限，无法满足储能设施安全距离要求', value: '无法满足安全距离' },
];

// 屋顶可供安装光伏面积（3 选 1）
const ROOFTOP_PV_AREA_OPTIONS = [
  { label: '可安装光伏面积占总建筑面积比例≥10%', value: '≥10%' },
  { label: '可安装光伏面积占总建筑面积为5%~10%', value: '5%~10%' },
  { label: '可安装光伏面积占总建筑面积比例＜5%', value: '＜5%' },
];

// 屋顶承重（3 选 1）
const ROOFTOP_LOAD_BEARING_OPTIONS = [
  { label: '建筑（屋顶）结构承重满足要求，无需加固', value: '满足无需加固' },
  { label: '建筑（屋顶）结构承重不满足要求，但可加固', value: '不满足可加固' },
  { label: '建筑（屋顶）结构承重不满足要求，且无法加固', value: '不满足无法加固' },
];

// 自控系统安装条件（3 选 1）
const AUTO_CONTROL_OPTIONS = [
  { label: '满足有线控制方案的安装条件', value: '满足有线控制方案' },
  { label: '安装条件有限，需采用有线和无线（如蓝牙）结合的控制方案', value: '有线无线结合' },
  { label: '有线和无线均无安装条件（老旧管线混乱、回路复杂）', value: '有线无线均无' },
];

// ---- 暖通动力系统内容 ----

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/** 大类标题：左圆角蓝条 + 大号加粗 */
function CategoryTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 15,
      fontWeight: 700,
      color: '#1a1a2e',
      marginBottom: 12,
      paddingLeft: 10,
      position: 'relative',
      lineHeight: '28px',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: 14,
        borderRadius: 2,
        background: '#1677ff',
      }} />
      {children}
    </div>
  );
}

function HvacContent() {
  const form = Form.useFormInstance();
  const coldCentral = Form.useWatch(['mep', 'hvac', 'coldSourceCentralized']);
  const steamCentral = Form.useWatch(['mep', 'hvac', 'steamCentralizedTypes']);
  const cleanZoneType = Form.useWatch(['mep', 'hvac', 'cleanZoneType']);

  // 冷源全选 / 全不选
  const coldAllSelected = coldCentral?.length === COLD_SOURCE_CENTRALIZED.length;
  const coldIndeterminate = coldCentral && coldCentral.length > 0 && coldCentral.length < COLD_SOURCE_CENTRALIZED.length;

  // 渲染集中式冷源表格行
  const renderColdCentralRows = () => {
    const columns: TableProps['columns'] = [
      {
        title: (
          <Checkbox
            checked={coldAllSelected}
            indeterminate={coldIndeterminate}
            onChange={(e) => {
              if (e.target.checked) {
                form.setFieldValue(['mep', 'hvac', 'coldSourceCentralized'], [...COLD_SOURCE_CENTRALIZED]);
              } else {
                form.setFieldValue(['mep', 'hvac', 'coldSourceCentralized'], []);
              }
            }}
          />
        ),
        key: 'checkbox',
        width: 56,
        align: 'center',
        render: (_, record) => (
          <Checkbox
            checked={coldCentral?.includes(record.name)}
            onChange={(e) => {
              const current = form.getFieldValue(['mep', 'hvac', 'coldSourceCentralized']) || [];
              if (e.target.checked) {
                form.setFieldValue(['mep', 'hvac', 'coldSourceCentralized'], [...current, record.name]);
              } else {
                form.setFieldValue(['mep', 'hvac', 'coldSourceCentralized'], current.filter((n: string) => n !== record.name));
              }
            }}
          />
        ),
      },
      {
        title: '设备类型',
        dataIndex: 'name',
        key: 'name',
        width: 160,
        align: 'left',
      },
      {
        title: '投产年份',
        key: 'year',
        width: 120,
        align: 'center',
        onCell: () => ({ className: 'year-cell' }),
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
            <Form.Item name={['mep', 'hvac', 'coldSourceMeta', record.name, 'year']} initialValue={CURRENT_YEAR} noStyle>
              <Select size="middle" placeholder="-" allowClear options={YEAR_OPTIONS} style={{ width: '100%' }} disabled={!coldCentral?.includes(record.name)} />
            </Form.Item>
          </div>
        ),
      },
      {
        title: '变频',
        key: 'vfd',
        width: 80,
        align: 'center',
        render: (_, record) => (
          <Form.Item name={['mep', 'hvac', 'coldSourceMeta', record.name, 'vfd']} style={{ marginBottom: 0 }}>
            <Radio.Group options={YES_NO_RADIO} optionType="button" buttonStyle="outline" size="small" disabled={!coldCentral?.includes(record.name)} />
          </Form.Item>
        ),
      },
      {
        title: '冷凝热回收',
        key: 'heatRecovery',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <Form.Item name={['mep', 'hvac', 'coldSourceMeta', record.name, 'heatRecovery']} style={{ marginBottom: 0 }}>
            <Radio.Group options={HAS_NO_RADIO} optionType="button" buttonStyle="outline" size="small" disabled={!coldCentral?.includes(record.name)} />
          </Form.Item>
        ),
      },
      {
        title: '冷却塔供冷',
        key: 'coolingTower',
        width: 100,
        align: 'center',
        render: (_, record) => {
          const hasCoolingTower = !NO_COOLING_TOWER.has(record.name);
          if (!hasCoolingTower) return <span style={{ color: '#bbb' }}>--</span>;
          return (
            <Form.Item name={['mep', 'hvac', 'coldSourceMeta', record.name, 'coolingTower']} style={{ marginBottom: 0 }}>
              <Radio.Group options={HAS_NO_RADIO} optionType="button" buttonStyle="outline" size="small" disabled={!coldCentral?.includes(record.name)} />
            </Form.Item>
          );
        },
      },
    ];

    return (
      <Table
        dataSource={COLD_SOURCE_CENTRALIZED.map((name) => ({ key: name, name } as any))}
        columns={columns}
        size="small"
        bordered
        pagination={false}
        showHeader
        rowClassName={() => 'cold-source-row'}
        locale={{ emptyText: '' }}
        className="cold-source-table"
      />
    );
  };

  return (
    <>
      {/* 1. 冷源系统类型 */}
      <CategoryTitle>冷源系统类型</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}><SectionTitle>集中式冷源</SectionTitle></div>

        <Form.Item name={['mep', 'hvac', 'coldSourceCentralized']} style={{ marginBottom: 16 }}>
          {renderColdCentralRows()}
        </Form.Item>
        <SectionTitle>分散式冷源</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'coldSourceDecentralized']} style={{ marginBottom: 16 }}>
          <Checkbox.Group options={COLD_SOURCE_DECENTRALIZED.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
        <SectionTitle>区域性冷源</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'coldSourceRegional']} style={{ marginBottom: 0 }}>
          <Checkbox.Group options={COLD_SOURCE_REGIONAL.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
      </div>

      {/* 2. 热源系统类型 */}
      <CategoryTitle>热源系统类型</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>集中式热源</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'heatSourceCentralized']} style={{ marginBottom: 16 }}>
          <Checkbox.Group>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {HEAT_SOURCE_CENTRALIZED.map((o) => (
                <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#fff', borderRadius: 4, border: '1px solid #f0f0f0', minHeight: 32 }}>
                  <Checkbox value={o} />
                  <span style={{ fontSize: 13, whiteSpace: 'nowrap', width: 88, display: 'inline-block', flexShrink: 0 }}>{o}</span>
                  <Form.Item name={['mep', 'hvac', 'heatSourceMeta', o, 'year']} initialValue={CURRENT_YEAR} noStyle>
                    <Select size="middle" placeholder="-" allowClear options={YEAR_OPTIONS} style={{ width: '100%', minWidth: 0 }} />
                  </Form.Item>
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </Form.Item>
        <SectionTitle>分散式热源</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'heatSourceDecentralized']} style={{ marginBottom: 16 }}>
          <Checkbox.Group options={HEAT_SOURCE_DECENTRALIZED.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
        <SectionTitle>区域性热源</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'heatSourceRegional']} style={{ marginBottom: 0 }}>
          <Checkbox.Group options={HEAT_SOURCE_REGIONAL.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
      </div>

      {/* 3. 蒸汽系统类型 */}
      <CategoryTitle>蒸汽系统类型</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>集中式蒸汽</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'steamCentralizedTypes']} style={{ marginBottom: 16 }}>
          <Table
            dataSource={STEAM_CENTRALIZED.map((name) => ({ key: name, name } as any))}
            columns={[
              {
                title: (
                  <Checkbox
                    checked={steamCentral?.length === STEAM_CENTRALIZED.length}
                    indeterminate={steamCentral && steamCentral.length > 0 && steamCentral.length < STEAM_CENTRALIZED.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        form.setFieldValue(['mep', 'hvac', 'steamCentralizedTypes'], [...STEAM_CENTRALIZED]);
                      } else {
                        form.setFieldValue(['mep', 'hvac', 'steamCentralizedTypes'], []);
                      }
                    }}
                  />
                ),
                key: 'checkbox',
                width: 56,
                align: 'center',
                render: (_, record) => (
                  <Checkbox
                    checked={steamCentral?.includes(record.name)}
                    onChange={(e) => {
                      const current = form.getFieldValue(['mep', 'hvac', 'steamCentralizedTypes']) || [];
                      if (e.target.checked) {
                        form.setFieldValue(['mep', 'hvac', 'steamCentralizedTypes'], [...current, record.name]);
                      } else {
                        form.setFieldValue(['mep', 'hvac', 'steamCentralizedTypes'], current.filter((n: string) => n !== record.name));
                      }
                    }}
                  />
                ),
              },
              {
                title: '设备类型',
                dataIndex: 'name',
                key: 'name',
                width: 110,
                align: 'left',
              },
              {
                title: '投产年份',
                key: 'year',
                width: 120,
                align: 'center',
                onCell: () => ({ className: 'year-cell' }),
                render: (_, record) => (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                    <Form.Item name={['mep', 'hvac', 'steamCentralizedMeta', record.name, 'year']} initialValue={CURRENT_YEAR} noStyle>
                      <Select size="middle" placeholder="-" allowClear options={YEAR_OPTIONS} style={{ width: '100%' }} disabled={!steamCentral?.includes(record.name)} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                title: '供汽范围',
                key: 'supplyRange',
                width: 340,
                align: 'left',
                render: (_, record) => (
                  <Form.Item name={['mep', 'hvac', 'steamCentralizedMeta', record.name, 'supplyRange']} style={{ marginBottom: 0 }}>
                    <Checkbox.Group options={STEAM_RANGE_OPTIONS.map((o) => ({ label: o, value: o }))} disabled={!steamCentral?.includes(record.name)} />
                  </Form.Item>
                ),
              },
              {
                title: '冷凝水回收',
                key: 'condensateRange',
                width: 340,
                align: 'left',
                render: (_, record) => (
                  <Form.Item name={['mep', 'hvac', 'steamCentralizedMeta', record.name, 'condensateRange']} style={{ marginBottom: 0 }}>
                    <Checkbox.Group options={STEAM_RANGE_OPTIONS.map((o) => ({ label: o, value: o }))} disabled={!steamCentral?.includes(record.name)} />
                  </Form.Item>
                ),
              },
            ]}
            size="small"
            bordered
            pagination={false}
            showHeader
            rowClassName={() => 'cold-source-row'}
            locale={{ emptyText: '' }}
            className="cold-source-table"
          />
        </Form.Item>
        <SectionTitle>分散式蒸汽</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'steamDecentralized']} style={{ marginBottom: 16 }}>
          <Checkbox.Group>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STEAM_DECENTRALIZED.map((o) => (
                <Checkbox key={o} value={o}>{o}</Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </Form.Item>
        <SectionTitle>区域性蒸汽</SectionTitle>
        <Form.Item name={['mep', 'hvac', 'steamRegional']} style={{ marginBottom: 0 }}>
          <Checkbox.Group>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STEAM_REGIONAL.map((o) => (
                <Checkbox key={o} value={o}>{o}</Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </Form.Item>
      </div>

      {/* 4. 洁净区冷热源系统 */}
      <CategoryTitle>洁净区冷热源系统</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Form.Item
          name={['mep', 'hvac', 'cleanZoneType']}
          rules={[{ required: true, message: '请选择洁净区冷热源系统' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group>
            <Radio value="shared" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              与整个院区共用一套冷热源
            </Radio>
            <Radio value="independent" style={{ display: 'flex', alignItems: 'center' }}>
              有独立的冷热源机组
            </Radio>
          </Radio.Group>
        </Form.Item>
        {cleanZoneType === 'independent' && (
          <div style={{ display: 'flex', gap: 24, padding: '10px 0', marginTop: 4, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>投产年份</span>
              <Form.Item name={['mep', 'hvac', 'cleanZoneYear']} initialValue={CURRENT_YEAR} noStyle>
                <Select size="middle" placeholder="-" allowClear options={YEAR_OPTIONS} style={{ width: 120 }} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>变频</span>
              <Form.Item name={['mep', 'hvac', 'cleanZoneVfd']} style={{ marginBottom: 0 }}>
                <Radio.Group options={YES_NO_RADIO} optionType="button" buttonStyle="outline" size="small" />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>冷凝热回收</span>
              <Form.Item name={['mep', 'hvac', 'cleanZoneHeatRecovery']} style={{ marginBottom: 0 }}>
                <Radio.Group options={HAS_NO_RADIO} optionType="button" buttonStyle="outline" size="small" />
              </Form.Item>
            </div>
          </div>
        )}
      </div>

      {/* 5. 空调水管路分区情况 */}
      <CategoryTitle>空调水管路分区情况</CategoryTitle>
      <Form.Item
        name={['mep', 'hvac', 'waterPartition']}
        rules={[{ required: true, message: '请选择空调水管路分区情况' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group>
          {WATER_PARTITION_OPTIONS.map((o) => (
            <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {o.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      {/* 6. 蒸汽冷凝水管路分区情况 */}
      <CategoryTitle>蒸汽冷凝水管路分区情况</CategoryTitle>
      <Form.Item
        name={['mep', 'hvac', 'steamCondensatePartition']}
        rules={[{ required: true, message: '请选择蒸汽冷凝水管路分区情况' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group>
          {STEAM_CONDENSATE_PARTITION_OPTIONS.map((o) => (
            <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {o.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      {/* 7. 冷热源系统管理水平 */}
      <CategoryTitle>冷热源系统管理水平</CategoryTitle>
      <Form.Item
        name={['mep', 'hvac', 'hvacMgmtLevel']}
        rules={[{ required: true, message: '请选择冷热源系统管理水平' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group>
          {HVAC_MGMT_LEVEL_OPTIONS.map((o) => (
            <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {o.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    </>
  );
}

// ---- 电气系统内容 ----

function ElectricalContent() {
  const smartLighting = Form.useWatch(['mep', 'smartLighting'], { preserve: true });

  return (
    <>
      <CategoryTitle>照明灯具类型</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>非节能灯具</SectionTitle>
        <Form.Item name={['mep', 'lightingNonEnergy']} style={{ marginBottom: 16 }}>
          <Checkbox.Group options={LIGHTING_NON_ENERGY_SAVING.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
        <SectionTitle>节能灯具</SectionTitle>
        <Form.Item name={['mep', 'lightingEnergy']} style={{ marginBottom: 0 }}>
          <Checkbox.Group options={LIGHTING_ENERGY_SAVING.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
      </div>

      <CategoryTitle>智能照明</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Form.Item
          name={['mep', 'smartLighting']}
          rules={[{ required: true, message: '请选择智能照明' }]}
          style={{ marginBottom: smartLighting === '已采用' ? 16 : 0 }}
        >
          <Radio.Group
            options={[
              { label: '未采用智能照明', value: '未采用' },
              { label: '已采用智能照明', value: '已采用' },
            ]}
          />
        </Form.Item>
        {smartLighting === '已采用' && (
          <>
            <SectionTitle>一级适配区</SectionTitle>
            <Form.Item name={['mep', 'smartLevel1']} style={{ marginBottom: 16 }}>
              <Checkbox.Group options={SMART_LIGHTING_LEVEL1_OPTIONS.map((o) => ({ label: o, value: o }))} />
            </Form.Item>

            <SectionTitle>二级适配区</SectionTitle>
            <Form.Item name={['mep', 'smartLevel2']} style={{ marginBottom: 16 }}>
              <Checkbox.Group options={SMART_LIGHTING_LEVEL2_OPTIONS.map((o) => ({ label: o, value: o }))} />
            </Form.Item>

            <SectionTitle>三级适配区</SectionTitle>
            <Form.Item name={['mep', 'smartLevel3']} style={{ marginBottom: 0 }}>
              <Checkbox.Group options={SMART_LIGHTING_LEVEL3_OPTIONS.map((o) => ({ label: o, value: o }))} />
            </Form.Item>
          </>
        )}
      </div>

      <CategoryTitle>照明管理水平</CategoryTitle>
      <Form.Item
        name={['mep', 'lightingMgmt']}
        rules={[{ required: true, message: '请选择照明管理水平' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group options={LIGHTING_MGMT_OPTIONS} />
      </Form.Item>

      <CategoryTitle>照明系统分区情况</CategoryTitle>
      <Form.Item
        name={['mep', 'lightingPartition']}
        rules={[{ required: true, message: '请选择照明系统分区情况' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group options={LIGHTING_PARTITION_OPTIONS} />
      </Form.Item>

      <CategoryTitle>年用电量</CategoryTitle>
      <Form.Item
        name={['mep', 'annualPower']}
        rules={[{ required: true, message: '请选择年用电量' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group options={ANNUAL_POWER_OPTIONS} />
      </Form.Item>
    </>
  );
}

// ---- 给排水系统内容 ----

function PlumbingContent() {
  const sewageHas = Form.useWatch(['mep', 'plumbing', 'sewage', 'has'], { preserve: true }) as string | undefined;
  const heatSource = Form.useWatch(['mep', 'plumbing', 'hotWater', 'heatSource'], { preserve: true }) as string[] | undefined;
  const supplyScope = Form.useWatch(['mep', 'plumbing', 'hotWater', 'supplyScope'], { preserve: true }) as string[] | undefined;
  const rainCollection = Form.useWatch(['mep', 'plumbing', 'rainwater', 'collection'], { preserve: true }) as string | undefined;

  const showHeatSourceOther = heatSource?.includes('其他');
  const showSupplyScopeOther = supplyScope?.includes('其他');
  const showRainStorage = !!rainCollection && rainCollection !== '无';

  return (
    <>
      {/* 1. 给水与排水系统基本情况 */}
      <CategoryTitle>给水与排水系统基本情况</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>生活给水泵</SectionTitle>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>投产年份</span>
            <Form.Item name={['mep', 'plumbing', 'waterPump', 'year']} initialValue={CURRENT_YEAR} noStyle>
              <Select size="middle" placeholder="-" allowClear options={YEAR_OPTIONS} style={{ width: 120 }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#666' }}>是否变频</span>
            <Form.Item name={['mep', 'plumbing', 'waterPump', 'vfd']} style={{ marginBottom: 0 }}>
              <Radio.Group options={YES_NO_RADIO} optionType="button" buttonStyle="outline" size="small" />
            </Form.Item>
          </div>
        </div>

        <SectionTitle>排水体制</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'drainageSystem']}
          rules={[{ required: true, message: '请选择排水体制' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {DRAINAGE_SYSTEM_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>污水处理站</SectionTitle>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <Form.Item
            name={['mep', 'plumbing', 'sewage', 'has']}
            rules={[{ required: true, message: '请选择是否有污水处理站' }]}
            style={{ marginBottom: 0 }}
          >
            <Radio.Group options={HAS_NO_RADIO} optionType="button" buttonStyle="outline" size="small" />
          </Form.Item>
          {sewageHas === '有' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>年用水量</span>
              <Form.Item
                name={['mep', 'plumbing', 'sewage', 'annualWater']}
                rules={[{ required: true, message: '请输入年用水量' }]}
                noStyle
              >
                <InputNumber size="middle" min={0} placeholder="请输入" addonAfter="m³/a" style={{ width: 180 }} />
              </Form.Item>
            </div>
          )}
        </div>
      </div>

      {/* 2. 生活热水系统 */}
      <CategoryTitle>生活热水系统</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>热源形式</SectionTitle>
        <Form.Item name={['mep', 'plumbing', 'hotWater', 'heatSource']} style={{ marginBottom: 8 }}>
          <Checkbox.Group options={HOT_WATER_HEAT_SOURCE_OPTIONS.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
        {showHeatSourceOther && (
          <Form.Item name={['mep', 'plumbing', 'hotWater', 'heatSourceOther']} style={{ marginBottom: 16 }}>
            <Input placeholder="请输入其他热源形式" style={{ width: 280 }} />
          </Form.Item>
        )}

        <SectionTitle>供水范围</SectionTitle>
        <Form.Item name={['mep', 'plumbing', 'hotWater', 'supplyScope']} style={{ marginBottom: 8 }}>
          <Checkbox.Group options={HOT_WATER_SUPPLY_SCOPE_OPTIONS.map((o) => ({ label: o, value: o }))} />
        </Form.Item>
        {showSupplyScopeOther && (
          <Form.Item name={['mep', 'plumbing', 'hotWater', 'supplyScopeOther']} style={{ marginBottom: 16 }}>
            <Input placeholder="请输入其他供水范围" style={{ width: 280 }} />
          </Form.Item>
        )}

        <SectionTitle>系统形式</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'hotWater', 'systemType']}
          rules={[{ required: true, message: '请选择系统形式' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={HOT_WATER_SYSTEM_TYPE_OPTIONS} />
        </Form.Item>

        <SectionTitle>循环泵</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'hotWater', 'circPump']}
          rules={[{ required: true, message: '请选择循环泵' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={HOT_WATER_CIRC_PUMP_OPTIONS} />
        </Form.Item>

        <SectionTitle>循环控制</SectionTitle>
        <Form.Item name={['mep', 'plumbing', 'hotWater', 'circControl']} style={{ marginBottom: 16 }}>
          <Checkbox.Group options={HOT_WATER_CIRC_CONTROL_OPTIONS.map((o) => ({ label: o, value: o }))} />
        </Form.Item>

        <SectionTitle>供/回水温度</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Form.Item name={['mep', 'plumbing', 'hotWater', 'supplyTemp']} noStyle>
            <InputNumber min={0} max={100} placeholder="供水" addonAfter="℃" style={{ width: 140 }} />
          </Form.Item>
          <span style={{ color: '#999' }}>/</span>
          <Form.Item name={['mep', 'plumbing', 'hotWater', 'returnTemp']} noStyle>
            <InputNumber min={0} max={100} placeholder="回水" addonAfter="℃" style={{ width: 140 }} />
          </Form.Item>
        </div>
      </div>

      {/* 3. 雨水利用 */}
      <CategoryTitle>雨水利用</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>雨水收集</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'rainwater', 'collection']}
          rules={[{ required: true, message: '请选择雨水收集方式' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={RAIN_COLLECTION_OPTIONS} />
        </Form.Item>
        {showRainStorage && (
          <>
            <SectionTitle>调蓄池容积</SectionTitle>
            <Form.Item
              name={['mep', 'plumbing', 'rainwater', 'storageVolume']}
              rules={[{ required: true, message: '请输入调蓄池容积' }]}
              style={{ marginBottom: 16 }}
            >
              <InputNumber min={0} placeholder="请输入" addonAfter="m³" style={{ width: 200 }} />
            </Form.Item>
          </>
        )}
        <SectionTitle>海绵设施</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'rainwater', 'spongeFacility']}
          rules={[{ required: true, message: '请选择海绵设施' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={SPONGE_FACILITY_OPTIONS} />
        </Form.Item>
      </div>

      {/* 4. 给排水计量与管理水平 */}
      <CategoryTitle>给排水计量与管理水平</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>计量层级</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'metering', 'level']}
          rules={[{ required: true, message: '请选择计量层级' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            {METER_LEVEL_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {o.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <SectionTitle>重点分项</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'metering', 'keyItem']}
          rules={[{ required: true, message: '请选择重点分项' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {METER_KEY_ITEM_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>监测管理</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'metering', 'monitoring']}
          rules={[{ required: true, message: '请选择监测管理' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {METER_MONITORING_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>管网状况</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'metering', 'pipeCondition']}
          rules={[{ required: true, message: '请选择管网状况' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {PIPE_CONDITION_OPTIONS.map((o) => (
                <Radio key={o.value} value={o.value}>{o.label}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>节水器具</SectionTitle>
        <Form.Item
          name={['mep', 'plumbing', 'metering', 'waterSavingAppliance']}
          rules={[{ required: true, message: '请选择节水器具采用情况' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={WATER_SAVING_OPTIONS} />
        </Form.Item>
      </div>
    </>
  );
}

// ---- 智能化系统内容 ----

function SmartContent() {
  return (
    <>
      {/* 1. 院区智能化水平 */}
      <CategoryTitle>院区智能化水平</CategoryTitle>
      <Form.Item
        name={['mep', 'smart', 'level']}
        rules={[{ required: true, message: '请选择院区智能化水平' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group>
          {SMART_LEVEL_OPTIONS.map((o) => (
            <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {o.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      {/* 2. 能源站机房群控水平 */}
      <CategoryTitle>能源站机房群控水平</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>冷冻水循环泵</SectionTitle>
        <Form.Item
          name={['mep', 'smart', 'chillerPumpVfd']}
          rules={[{ required: true, message: '请选择冷冻水循环泵' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={VFD_RADIO_OPTIONS} />
        </Form.Item>

        <SectionTitle>冷却水循环泵</SectionTitle>
        <Form.Item
          name={['mep', 'smart', 'condenserPumpVfd']}
          rules={[{ required: true, message: '请选择冷却水循环泵' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={VFD_RADIO_OPTIONS} />
        </Form.Item>

        <SectionTitle>冷却塔风机</SectionTitle>
        <Form.Item
          name={['mep', 'smart', 'coolingTowerFanVfd']}
          rules={[{ required: true, message: '请选择冷却塔风机' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={VFD_RADIO_OPTIONS} />
        </Form.Item>
      </div>
    </>
  );
}

// ---- 机电安装系统内容 ----

function InstallContent() {
  const geoHeatExchanger = Form.useWatch(['mep', 'install', 'geoHeatExchanger'], { preserve: true }) as string | undefined;
  const showGeoHeatArea = geoHeatExchanger === '有';

  return (
    <>
      {/* 1. 电网增容 */}
      <CategoryTitle>电网增容</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>采用节能技术或更换设备时（蓄冷技术和相变储热技术）</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'gridExpansionStorage']}
          rules={[{ required: true, message: '请选择蓄冷/相变储热技术的电网增容情况' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            {GRID_EXPANSION_STORAGE_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {o.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <SectionTitle>采用光伏发电相关技术（光储充一体化技术）</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'gridExpansionPv']}
          rules={[{ required: true, message: '请选择光储充一体化的电网增容情况' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group>
            {GRID_EXPANSION_PV_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {o.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 2. 机电站房安装条件 */}
      <CategoryTitle>机电站房安装条件</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>改造主站房（制冷站房、锅炉房及换热站）</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'mainStation']}
          rules={[{ required: true, message: '请选择改造主站房条件' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            {MAIN_STATION_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {o.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <SectionTitle>扩建站房（冰蓄冷机房、相变储热机房）</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'expansionStation']}
          rules={[{ required: true, message: '请选择扩建站房条件' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group>
            {EXPANSION_STATION_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {o.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 3. 室外场地条件 */}
      <CategoryTitle>室外场地条件</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>地源热泵换热井</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'geoHeatExchanger']}
          rules={[{ required: true, message: '请选择地源热泵换热井条件' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={GEO_HEAT_EXCHANGER_OPTIONS} />
        </Form.Item>
        {showGeoHeatArea && (
          <>
            <SectionTitle>场地面积</SectionTitle>
            <Form.Item
              name={['mep', 'install', 'geoHeatExchangerArea']}
              rules={[{ required: true, message: '请输入场地面积' }]}
              style={{ marginBottom: 16 }}
            >
              <InputNumber style={{ width: 220 }} min={0} placeholder="请输入" addonAfter="㎡" />
            </Form.Item>
          </>
        )}

        <SectionTitle>室外储能舱</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'outdoorStorageCabin']}
          rules={[{ required: true, message: '请选择室外储能舱条件' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {OUTDOOR_STORAGE_CABIN_OPTIONS.map((o) => (
                <Radio key={o.value} value={o.value}>{o.label}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>屋顶可供安装光伏面积</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'rooftopPvArea']}
          rules={[{ required: true, message: '请选择屋顶光伏面积比例' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {ROOFTOP_PV_AREA_OPTIONS.map((o) => (
                <Radio key={o.value} value={o.value}>{o.label}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>屋顶承重（太阳能光伏板）</SectionTitle>
        <Form.Item
          name={['mep', 'install', 'rooftopLoadBearing']}
          rules={[{ required: true, message: '请选择屋顶承重情况' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {ROOFTOP_LOAD_BEARING_OPTIONS.map((o) => (
                <Radio key={o.value} value={o.value}>{o.label}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 4. 自控系统安装条件 */}
      <CategoryTitle>自控系统安装条件</CategoryTitle>
      <Form.Item
        name={['mep', 'install', 'autoControl']}
        rules={[{ required: true, message: '请选择自控系统安装条件' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
            {AUTO_CONTROL_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value}>{o.label}</Radio>
            ))}
          </div>
        </Radio.Group>
      </Form.Item>
    </>
  );
}

// ---- 医疗动力系统内容 ----

function MedicalPowerContent() {
  const gasTypes = Form.useWatch(['mep', 'medicalPower', 'gasTypes'], { preserve: true }) as string | undefined;
  const compressorType = Form.useWatch(['mep', 'medicalPower', 'compressedAir', 'compressorType'], { preserve: true }) as string | undefined;
  const vacuumPumpType = Form.useWatch(['mep', 'medicalPower', 'vacuum', 'pumpType'], { preserve: true }) as string | undefined;

  const showGasTypesOther = gasTypes === '其他';
  const showCompressorTypeOther = compressorType === '其他';
  const showVacuumPumpTypeOther = vacuumPumpType === '其他';

  return (
    <>
      {/* 1. 医用气体配置及计量 */}
      <CategoryTitle>医用气体配置及计量</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>气体种类</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'gasTypes']}
          rules={[{ required: true, message: '请选择气体种类' }]}
          style={{ marginBottom: 8 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {MED_GAS_TYPE_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
        {showGasTypesOther && (
          <Form.Item
            name={['mep', 'medicalPower', 'gasTypesOther']}
            rules={[{ required: true, message: '请输入其他气体种类' }]}
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="请输入其他气体种类" style={{ width: 280 }} />
          </Form.Item>
        )}

        <SectionTitle>供应形式</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'supplyForm']}
          rules={[{ required: true, message: '请选择供应形式' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={MED_GAS_SUPPLY_FORM_OPTIONS} />
        </Form.Item>

        <SectionTitle>服务区域</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'serviceArea']}
          rules={[{ required: true, message: '请选择服务区域' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {MED_GAS_SERVICE_AREA_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>

        <SectionTitle>计量层级</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'meterLevel']}
          rules={[{ required: true, message: '请选择计量层级' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {MED_GAS_METER_LEVEL_OPTIONS.map((o) => (
                <Radio key={o.value} value={o.value}>{o.label}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 2. 氧气系统 */}
      <CategoryTitle>氧气系统</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>氧气主气源</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'oxygen', 'mainSource']}
          rules={[{ required: true, message: '请选择氧气主气源' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={OXYGEN_MAIN_SOURCE_OPTIONS} />
        </Form.Item>

        <SectionTitle>备用气源</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'oxygen', 'backupSource']}
          rules={[{ required: true, message: '请选择备用气源' }]}
          style={{ marginBottom: 16 }}
        >
          <Radio.Group options={OXYGEN_BACKUP_SOURCE_OPTIONS} />
        </Form.Item>

        <SectionTitle>分科室计量</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'oxygen', 'deptMetering']}
          rules={[{ required: true, message: '请选择是否分科室计量' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={YES_NO_STRING_OPTIONS} />
        </Form.Item>
      </div>

      {/* 3. 医用压缩空气系统 */}
      <CategoryTitle>医用压缩空气系统</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>用途</SectionTitle>
        <Form.Item name={['mep', 'medicalPower', 'compressedAir', 'purpose']} style={{ marginBottom: 16 }}>
          <Checkbox.Group options={COMPRESSED_AIR_PURPOSE_OPTIONS.map((o) => ({ label: o, value: o }))} />
        </Form.Item>

        <SectionTitle>压缩机形式</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'compressedAir', 'compressorType']}
          rules={[{ required: true, message: '请选择压缩机形式' }]}
          style={{ marginBottom: 8 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {COMPRESSOR_TYPE_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
        {showCompressorTypeOther && (
          <Form.Item
            name={['mep', 'medicalPower', 'compressedAir', 'compressorTypeOther']}
            rules={[{ required: true, message: '请输入其他压缩机形式' }]}
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="请输入其他压缩机形式" style={{ width: 280 }} />
          </Form.Item>
        )}

        <SectionTitle>控制方式</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'compressedAir', 'controlMode']}
          rules={[{ required: true, message: '请选择控制方式' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={COMPRESSED_AIR_CONTROL_OPTIONS} />
        </Form.Item>
      </div>

      {/* 4. 医用真空负压吸引系统 */}
      <CategoryTitle>医用真空负压吸引系统</CategoryTitle>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <SectionTitle>真空泵形式</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'vacuum', 'pumpType']}
          rules={[{ required: true, message: '请选择真空泵形式' }]}
          style={{ marginBottom: 8 }}
        >
          <Radio.Group>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {VACUUM_PUMP_TYPE_OPTIONS.map((o) => (
                <Radio key={o} value={o}>{o}</Radio>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
        {showVacuumPumpTypeOther && (
          <Form.Item
            name={['mep', 'medicalPower', 'vacuum', 'pumpTypeOther']}
            rules={[{ required: true, message: '请输入其他真空泵形式' }]}
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="请输入其他真空泵形式" style={{ width: 280 }} />
          </Form.Item>
        )}

        <SectionTitle>控制方式</SectionTitle>
        <Form.Item
          name={['mep', 'medicalPower', 'vacuum', 'controlMode']}
          rules={[{ required: true, message: '请选择控制方式' }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group options={VACUUM_CONTROL_OPTIONS} />
        </Form.Item>
      </div>
    </>
  );
}

// ---- 主组件 ----

export default function SubStep4MEP() {
  const [activeTab, setActiveTab] = useState<string>('hvac');

  // 用 CSS display 切换 tab 内容，保证所有 Form.Item 始终挂载
  return (
    <>
      <style>{`
        .mep-tabs .ant-tabs-nav-list {
          width: 100%;
        }
        .mep-tabs .ant-tabs-tab {
          flex: 1;
          justify-content: center;
          margin: 0 !important;
        }
        /* 冷源表格表头样式 */
        .cold-source-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
          font-size: 13px;
        }
        /* 冷源表格行样式 */
        .cold-source-row > td {
          padding: 10px 8px;
          vertical-align: middle;
        }
        /* 第一列多选框列宽度缩小 */
        .cold-source-row td:first-child {
          padding-left: 12px;
        }
        .cold-source-table .ant-table-cell {
          border-right: 1px solid #f0f0f0;
        }
        .cold-source-table .ant-table-cell:last-child {
          border-right: none;
        }
        /* 多选框居中 */
        .cold-source-row td:first-child .ant-checkbox-wrapper {
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }
        .cold-source-row .ant-radio-group {
          display: inline-flex;
        }
        .cold-source-row .ant-form-item {
          margin-bottom: 0;
        }
        .cold-source-row .ant-form-item-control-input {
          align-items: center;
          min-height: 28px;
        }
        .cold-source-row .ant-form-item-control-input-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cold-source-row .ant-select {
          width: 100%;
        }
        /* 蒸汽表格供汽范围/冷凝水回收多选行间距 */
        .cold-source-row .ant-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 12px;
          padding: 6px 0;
        }
      `}</style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mep-tabs"
        tabBarStyle={{ marginBottom: 28 }}
        items={[
          { key: 'hvac', label: '暖通动力系统' },
          { key: 'electrical', label: '电气系统' },
          { key: 'plumbing', label: '给排水系统' },
          { key: 'smart', label: '智能化系统' },
          { key: 'medicalPower', label: '医疗动力系统' },
          { key: 'install', label: '机电安装系统' },
        ]}
      />
      {/* 所有 tab 内容始终渲染，用 display 切换可见性 */}
      <div style={{ display: activeTab === 'hvac' ? 'block' : 'none' }}>
        <HvacContent />
      </div>
      <div style={{ display: activeTab === 'electrical' ? 'block' : 'none' }}>
        <ElectricalContent />
      </div>
      <div style={{ display: activeTab === 'plumbing' ? 'block' : 'none' }}>
        <PlumbingContent />
      </div>
      <div style={{ display: activeTab === 'smart' ? 'block' : 'none' }}>
        <SmartContent />
      </div>
      <div style={{ display: activeTab === 'medicalPower' ? 'block' : 'none' }}>
        <MedicalPowerContent />
      </div>
      <div style={{ display: activeTab === 'install' ? 'block' : 'none' }}>
        <InstallContent />
      </div>
    </>
  );
}