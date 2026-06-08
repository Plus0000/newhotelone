import { Form, InputNumber, Input, Button, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

export default function SubStep5Policy() {
  return (
    <>
      {/* 峰谷电政策 */}
      <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>峰谷电政策</div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，用于节能技术适配度计算
      </Paragraph>
      <Form.Item label="峰谷电价差" name={['energy', 'peakValleyDiff']}>
        <InputNumber
          style={{ width: '100%' }}
          placeholder="根据所在地自动关联"
          addonAfter="元/kWh"
          min={0}
        />
      </Form.Item>
      <Form.Item label="夜间谷电时长" name={['energy', 'valleyHours']}>
        <InputNumber
          style={{ width: '100%' }}
          placeholder="根据所在地自动关联"
          addonAfter="h"
          min={0}
        />
      </Form.Item>

      {/* 能源政策 */}
      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>能源政策</div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，多条政策按发布时间排序，可添加或删除
      </Paragraph>
      <Form.List name="energyPolicies">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <div
                key={key}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  background: 'var(--bg-nested)',
                  borderRadius: 8,
                  border: '1px solid var(--border-section)',
                  position: 'relative',
                }}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(name)}
                  style={{ position: 'absolute', top: 8, right: 8 }}
                />
                <Form.Item
                  {...rest}
                  name={[name, 'name']}
                  label="政策名称"
                  rules={[{ required: true, message: '请输入政策名称' }]}
                >
                  <Input placeholder="请输入政策名称" />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'url']} label="政策链接">
                  <Input placeholder="请输入政策链接" />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'detail']} label="政策详情">
                  <Input.TextArea placeholder="请输入政策详情" rows={3} />
                </Form.Item>
              </div>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              添加能源政策
            </Button>
          </>
        )}
      </Form.List>

      {/* 可再生能源利用专项补贴 */}
      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>
        可再生能源利用专项补贴
      </div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，用于判断节能技术适配度。投资概算时提取具体补贴数值用于计算。
      </Paragraph>
      <Form.List name="renewableSubsidies">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <div
                key={key}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  background: 'var(--bg-nested)',
                  borderRadius: 8,
                  border: '1px solid var(--border-section)',
                  position: 'relative',
                }}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(name)}
                  style={{ position: 'absolute', top: 8, right: 8 }}
                />
                <Form.Item
                  {...rest}
                  name={[name, 'name']}
                  label="政策名称"
                  rules={[{ required: true, message: '请输入政策名称' }]}
                >
                  <Input placeholder="请输入政策名称" />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'url']} label="政策链接">
                  <Input placeholder="请输入政策链接" />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'detail']} label="政策详情">
                  <Input.TextArea placeholder="请输入政策详情" rows={3} />
                </Form.Item>
              </div>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              添加补贴政策
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}