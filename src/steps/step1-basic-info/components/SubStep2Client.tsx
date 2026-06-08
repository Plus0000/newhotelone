import { Form, Input, Select } from 'antd';
import { UNIT_NATURES, CLIENT_IDENTITIES, CONTACT_LEVELS, PROJECT_SOURCES } from '../constants';

const CHANNEL_OPTIONS = [
  { label: '渠道方能直接对接客户', value: '渠道方能直接对接客户' },
  { label: '渠道方需要通过中间方对接客户', value: '渠道方需要通过中间方对接客户' },
];

export default function SubStep2Client() {
  return (
    <>
      <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>客户信息</div>

      <Form.Item
        label="医院名称"
        name="hospitalName"
        rules={[{ required: true, message: '请输入医院全称' }]}
      >
        <Input placeholder="请输入医院全称" />
      </Form.Item>
      <Form.Item
        label="单位性质"
        name="unitNature"
        rules={[{ required: true, message: '请选择单位性质' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={UNIT_NATURES.map((n) => ({ label: n, value: n }))}
        />
      </Form.Item>
      <Form.Item
        label="客户身份"
        name="clientIdentity"
        rules={[{ required: true, message: '请选择客户身份' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={CLIENT_IDENTITIES.map((c) => ({ label: c, value: c }))}
        />
      </Form.Item>
      <Form.Item
        label="对接人职级"
        name="contactLevel"
        rules={[{ required: true, message: '请选择对接人职级' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={CONTACT_LEVELS.map((l) => ({ label: l, value: l }))}
        />
      </Form.Item>
      <Form.Item
        label="客户/项目来源"
        name="projectSource"
        rules={[{ required: true, message: '请选择项目来源' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={PROJECT_SOURCES.map((s) => ({ label: s, value: s }))}
        />
      </Form.Item>

      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>渠道方信息</div>

      <Form.Item label="单位名称" name="channelName">
        <Input placeholder='请输入单位名称，或写"无"' />
      </Form.Item>
      <Form.Item label="客户对接" name="channelDirect">
        <Select placeholder="请选择" allowClear options={CHANNEL_OPTIONS} />
      </Form.Item>
    </>
  );
}