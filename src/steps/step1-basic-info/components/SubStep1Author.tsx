import { Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { DEPARTMENTS } from '../constants';

export default function SubStep1Author() {
  return (
    <>
      <Form.Item
        label="业务负责人姓名"
        name="author"
        rules={[{ required: true, message: '请输入业务负责人姓名' }]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>
      <Form.Item
        label="所属业务部门"
        name="department"
        rules={[{ required: true, message: '请选择所属业务部门' }]}
      >
        <Select placeholder="请选择" allowClear options={DEPARTMENTS.map((d) => ({ label: d, value: d }))} />
      </Form.Item>
      <Form.Item
        label="联系电话"
        name="phone"
        rules={[{ required: true, message: '请输入联系电话' }]}
      >
        <Input placeholder="请输入电话号码" />
      </Form.Item>
      <Form.Item
        label="填写日期"
        name="fillDate"
        rules={[{ required: true, message: '请选择日期' }]}
        initialValue={dayjs()}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    </>
  );
}