import { Form, Input, Cascader, Select, InputNumber } from 'antd';
import {
  HOSPITAL_TYPES,
  HOSPITAL_NATURES,
  HOSPITAL_LEVELS,
  HOSPITAL_SCALES,
  PROJECT_STAGES,
  PROJECT_PROPERTIES,
  BUILDING_TYPES,
} from '../constants';
import { regionOptions } from '@/data/regions';

export default function SubStep3Hospital() {
  return (
    <>
      <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>项目基本信息</div>
      <Form.Item
        label="项目名称"
        name="projectName"
        rules={[{ required: true, message: '请输入项目名称' }]}
      >
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item
        label="所在地"
        name="location"
        rules={[{ required: true, message: '请选择所在地' }]}
      >
        <Cascader
          options={regionOptions}
          placeholder="请选择省/市"
          showSearch
          changeOnSelect
          allowClear
        />
      </Form.Item>
      <Form.Item label="具体地址" name="address">
        <Input placeholder="请输入具体地址" />
      </Form.Item>
      <Form.Item
        label="项目阶段"
        name="projectStage"
        rules={[{ required: true, message: '请选择项目阶段' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={PROJECT_STAGES.map((s) => ({ label: s, value: s }))}
        />
      </Form.Item>
      <Form.Item
        label="项目属性"
        name="projectProperty"
        rules={[{ required: true, message: '请选择项目属性' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={PROJECT_PROPERTIES.map((p) => ({ label: p, value: p }))}
        />
      </Form.Item>
      <Form.Item
        label="建筑类型"
        name="buildingType"
        rules={[{ required: true, message: '请选择建筑类型' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={BUILDING_TYPES.map((b) => ({ label: b, value: b }))}
        />
      </Form.Item>

      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>建筑规模</div>
      <Form.Item
        label="总建筑面积"
        name="totalArea"
        rules={[{ required: true, message: '请输入总建筑面积' }]}
      >
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="㎡" min={0} />
      </Form.Item>
      <Form.Item
        label="地上建筑面积"
        name="aboveGroundArea"
        rules={[{ required: true, message: '请输入地上建筑面积' }]}
      >
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="㎡" min={0} />
      </Form.Item>
      <Form.Item
        label="洁净区域建筑面积"
        name="cleanArea"
        rules={[{ required: true, message: '请输入洁净区域建筑面积' }]}
      >
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="㎡" min={0} />
      </Form.Item>

      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>医院信息</div>
      <Form.Item
        label="医院类型"
        name="hospitalType"
        rules={[{ required: true, message: '请选择医院类型' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={HOSPITAL_TYPES.map((t) => ({ label: t, value: t }))}
        />
      </Form.Item>
      <Form.Item
        label="医院性质"
        name="hospitalNature"
        rules={[{ required: true, message: '请选择医院性质' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={HOSPITAL_NATURES.map((n) => ({ label: n, value: n }))}
        />
      </Form.Item>
      <Form.Item
        label="医院等级"
        name="hospitalLevel"
        rules={[{ required: true, message: '请选择医院等级' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={HOSPITAL_LEVELS.map((l) => ({ label: l, value: l }))}
        />
      </Form.Item>
      <Form.Item
        label="医院规模"
        name="hospitalScale"
        rules={[{ required: true, message: '请选择医院规模' }]}
      >
        <Select
          placeholder="请选择"
          allowClear
          options={HOSPITAL_SCALES.map((s) => ({ label: s, value: s }))}
        />
      </Form.Item>

      <div style={{ margin: '24px 0 16px', fontWeight: 600, fontSize: 15, padding: '10px 16px', background: 'var(--bg-section)', borderRadius: 6, border: '1px solid var(--border-section)' }}>医疗规模（床位数）</div>
      <Form.Item label="普通病房" name="normalBeds" rules={[{ required: true, message: '请输入普通病房产床数' }]}>
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="床" min={0} />
      </Form.Item>
      <Form.Item label="重症监护病床" name="icuBeds" rules={[{ required: true, message: '请输入重症监护床床位数' }]}>
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="床" min={0} />
      </Form.Item>
      <Form.Item label="手术室" name="operatingRooms" rules={[{ required: true, message: '请输入手术室数量' }]}>
        <InputNumber style={{ width: '100%' }} size="middle" placeholder="请输入" addonAfter="间" min={0} />
      </Form.Item>
    </>
  );
}
