import { useState } from 'react';
import { Form, Select, Checkbox, Radio, Tabs } from 'antd';

// ---- 暖通动力系统 ----

const COLD_SOURCE_OPTIONS = [
  '传统电制冷冷水机组',
  '地源/空气源热泵类',
  '溴化锂吸收式冷水机组',
  '区域供冷',
  '冰/蓄水冷',
  '直燃机',
  '三联供',
  '分体空调',
  'VRV 空调',
];

const HEAT_SOURCE_OPTIONS = [
  '燃气锅炉',
  '市政热力',
  '地源/空气源热泵类',
  '相变储热类',
  '直燃机',
  '三联供',
  '分体空调',
  'VRV 空调',
];

const WATER_PARTITION_OPTIONS = [
  { label: '系统已按医疗区域分区设置(门诊、医技、病房、洁净、行政后勤等)', value: '已分区' },
  { label: '系统未按医疗区域分区设置', value: '未分区' },
];

// ---- 电气系统 ----

const LIGHTING_TYPE_OPTIONS = [
  '白炽灯',
  '普通荧光灯',
  '节能型荧光灯(带电子镇流器的三基色荧光灯、CFL紧凑型荧光灯)',
  'LED灯',
];

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

// ---- 通用 ----

const COMMON_OPTIONS = [
  { label: '有', value: '有' },
  { label: '无', value: '无' },
  { label: '待确认', value: '待确认' },
];

// ---- 暖通动力系统内容 ----

function HvacContent() {
  return (
    <>
      <Form.Item
        label="冷源系统类型"
        name={['mep', 'coldSource']}
        rules={[{ required: true, message: '请选择冷源系统类型' }]}
        style={{ marginBottom: 24 }}
      >
        <Checkbox.Group options={COLD_SOURCE_OPTIONS.map((o) => ({ label: o, value: o }))} />
      </Form.Item>
      <Form.Item
        label="热源系统类型"
        name={['mep', 'heatSource']}
        rules={[{ required: true, message: '请选择热源系统类型' }]}
        style={{ marginBottom: 24 }}
      >
        <Checkbox.Group options={HEAT_SOURCE_OPTIONS.map((o) => ({ label: o, value: o }))} />
      </Form.Item>
      <Form.Item
        label="空调水管路分区情况"
        name={['mep', 'waterPartition']}
        rules={[{ required: true, message: '请选择空调水管路分区情况' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group options={WATER_PARTITION_OPTIONS} />
      </Form.Item>
    </>
  );
}

// ---- 电气系统内容 ----

function ElectricalContent() {
  const smartLighting = Form.useWatch(['mep', 'smartLighting'], { preserve: true });

  return (
    <>
      <Form.Item
        label="照明灯具种类"
        name={['mep', 'lightingType']}
        rules={[{ required: true, message: '请选择照明灯具种类' }]}
        style={{ marginBottom: 24 }}
      >
        <Checkbox.Group options={LIGHTING_TYPE_OPTIONS.map((o) => ({ label: o, value: o }))} />
      </Form.Item>

      <Form.Item
        label="智能照明"
        name={['mep', 'smartLighting']}
        rules={[{ required: true, message: '请选择智能照明' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group
          options={[
            { label: '未采用智能照明', value: '未采用' },
            { label: '已采用智能照明', value: '已采用' },
          ]}
        />
      </Form.Item>

      {smartLighting === '已采用' && (
        <div
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: 'var(--bg-section)',
            borderRadius: 8,
            border: '1px solid var(--border-section)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#1a1a2e' }}>
            一级适配区
          </div>
          <Form.Item
            name={['mep', 'smartLevel1']}
            style={{ marginBottom: 20 }}
          >
            <Checkbox.Group
              options={SMART_LIGHTING_LEVEL1_OPTIONS.map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#1a1a2e' }}>
            二级适配区
          </div>
          <Form.Item
            name={['mep', 'smartLevel2']}
            style={{ marginBottom: 20 }}
          >
            <Checkbox.Group
              options={SMART_LIGHTING_LEVEL2_OPTIONS.map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#1a1a2e' }}>
            三级适配区
          </div>
          <Form.Item
            name={['mep', 'smartLevel3']}
            style={{ marginBottom: 0 }}
          >
            <Checkbox.Group
              options={SMART_LIGHTING_LEVEL3_OPTIONS.map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>
        </div>
      )}

      <Form.Item
        label="照明管理水平"
        name={['mep', 'lightingMgmt']}
        rules={[{ required: true, message: '请选择照明管理水平' }]}
        style={{ marginBottom: 24 }}
      >
        <Radio.Group options={LIGHTING_MGMT_OPTIONS} />
      </Form.Item>
    </>
  );
}

// ---- 其余 Tab 内容 ----

function SelectFieldsTab({ fields }: { fields: { name: string; label: string }[] }) {
  return (
    <>
      {fields.map((f) => (
        <Form.Item key={f.name} label={f.label} name={['mep', f.name]} style={{ marginBottom: 24 }}>
          <Select placeholder="请选择" allowClear options={COMMON_OPTIONS} />
        </Form.Item>
      ))}
    </>
  );
}

const PLUMBING_FIELDS = [
  { name: 'waterSupply', label: '给水方式' },
  { name: 'drainage', label: '排水方式' },
  { name: 'hotWater', label: '热水系统' },
];

const SMART_FIELDS = [
  { name: 'smartLevel', label: '智能化水平' },
  { name: 'vfd', label: '设备变频' },
];

const MEDICAL_POWER_FIELDS = [
  { name: 'medGas', label: '医用气体系统' },
  { name: 'vacuum', label: '负压吸引系统' },
];

const INSTALL_FIELDS = [
  { name: 'gridExpansion', label: '电网增容' },
  { name: 'outdoorSpace', label: '室外场地条件' },
  { name: 'autoControl', label: '自控安装条件' },
];

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
        <SelectFieldsTab fields={PLUMBING_FIELDS} />
      </div>
      <div style={{ display: activeTab === 'smart' ? 'block' : 'none' }}>
        <SelectFieldsTab fields={SMART_FIELDS} />
      </div>
      <div style={{ display: activeTab === 'medicalPower' ? 'block' : 'none' }}>
        <SelectFieldsTab fields={MEDICAL_POWER_FIELDS} />
      </div>
      <div style={{ display: activeTab === 'install' ? 'block' : 'none' }}>
        <SelectFieldsTab fields={INSTALL_FIELDS} />
      </div>
    </>
  );
}
