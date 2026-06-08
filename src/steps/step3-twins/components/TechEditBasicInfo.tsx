import { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, Tag, Radio, InputNumber, Select, Row, Col, Divider, Empty, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TechInvestment } from '@/shared/stores/projectStore';
import { querySubsidies, policies, type SubsidyEntry } from '@/data/policies';
import { formatLocation, isMunicipality } from '@/data/regions';

interface Props {
  investment: TechInvestment;
  location: string[];
  onSave: (data: Partial<TechInvestment>) => void;
  onNext: () => void;
  editable: boolean;
}

const CAPACITY_UNITS = ['kW', 'MW', 'kWh', 'MWh', 't/h', '㎡'];

export function TechEditBasicInfo({ investment, location, onSave, onNext, editable }: Props) {
  const [form] = Form.useForm();
  const [subsidyMode, setSubsidyMode] = useState<'' | 'investment' | 'capacity'>(investment.subsidyMode || '');
  const [queryResult, setQueryResult] = useState<SubsidyEntry[] | null>(null);
  const [queried, setQueried] = useState(false);

  const locationStr = formatLocation(location);

  useEffect(() => {
    form.setFieldsValue({
      author: investment.author,
      fillDate: investment.fillDate ? dayjs(investment.fillDate) : dayjs(),
      subsidyMode: investment.subsidyMode || '',
      investmentRatio: investment.investmentRatio || undefined,
      subsidyIndex: investment.subsidyIndex || undefined,
      subsidyIndexUnit: investment.subsidyIndexUnit || undefined,
      systemCapacity: investment.systemCapacity || undefined,
      systemCapacityUnit: investment.systemCapacityUnit || undefined,
    });
    setSubsidyMode(investment.subsidyMode || '');
  }, [investment, form]);

  const handleQuerySubsidy = () => {
    if (!location || location.length === 0) {
      message.warning('项目所在地信息缺失，无法查询');
      return;
    }
    const locationText = location.join(' ');
    const results = querySubsidies(locationText);
    setQueryResult(results);
    setQueried(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const saveData: Partial<TechInvestment> = {
      author: values.author,
      fillDate: values.fillDate?.format('YYYY-MM-DD') || '',
      subsidyMode: values.subsidyMode || '',
      investmentRatio: values.investmentRatio || 0,
      subsidyIndex: values.subsidyIndex || 0,
      subsidyIndexUnit: values.subsidyIndexUnit || '',
      systemCapacity: values.systemCapacity || 0,
      systemCapacityUnit: values.systemCapacityUnit || '',
      basicInfoCompleted: true,
    };

    const invRatio = saveData.investmentRatio ?? 0;
    const subIndex = saveData.subsidyIndex ?? 0;
    const sysCap = saveData.systemCapacity ?? 0;

    if (saveData.subsidyMode === 'investment' && invRatio > 0) {
      const initialInvestment =
        investment.equipment.reduce((s, r) => s + r.subtotal, 0) +
        investment.materials.reduce((s, r) => s + r.subtotal, 0) +
        investment.installation.reduce((s, r) => s + r.subtotal, 0);
      saveData.subsidyAmount = initialInvestment * (invRatio / 100);
      saveData.subsidyRate = `${invRatio}%`;
    } else if (saveData.subsidyMode === 'capacity' && subIndex > 0 && sysCap > 0) {
      const capUnit = saveData.systemCapacityUnit ?? '';
      const idxUnit = saveData.subsidyIndexUnit ?? '';
      let capacity = sysCap;
      if (capUnit === 'MW' && idxUnit.includes('kW')) capacity *= 1000;
      saveData.subsidyAmount = capacity * subIndex;
      saveData.subsidyRate = `${subIndex}${idxUnit}`;
    } else {
      saveData.subsidyAmount = 0;
      saveData.subsidyRate = '';
    }

    onSave(saveData);
    message.success('基本信息已保存');
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    onNext();
  };

  return (
    <div>
      <Form form={form} layout="vertical" disabled={!editable}>
        {/* 填写人信息 */}
        <Card
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>填写人信息</span>}
          size="small"
          style={{ marginBottom: 16, border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        >
          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item label="填写人名称" name="author" rules={[{ required: true, message: '请输入填写人名称' }]} style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="请输入填写人名称" />
            </Form.Item>
            <Form.Item label="填写日期" name="fillDate" rules={[{ required: true, message: '请选择填写日期' }]} style={{ flex: 1, marginBottom: 0 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Card>

        {/* 能源政策与补贴政策 */}
        <Card
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>能源政策与补贴政策</span>}
          size="small"
          style={{ border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        >
          {/* 项目所在地 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#595959', marginBottom: 6, fontWeight: 500 }}>项目所在地</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input value={locationStr || '暂无'} disabled style={{ flex: 1, maxWidth: 300 }} />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleQuerySubsidy} disabled={!editable}>
                查询
              </Button>
            </div>
            {location && location.length > 0 && (
              <span style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
                {isMunicipality(location[0]) ? '直辖市 — 查询市级补贴' : '省份 — 查询省级补贴，若市级有补贴则显示市级'}
              </span>
            )}
          </div>

          {/* 查询结果 */}
          {queried && (
            <div style={{ marginBottom: 16 }}>
              {queryResult && queryResult.length > 0 ? (
                <div>
                  <div style={{ fontSize: 13, color: '#1677ff', marginBottom: 12, fontWeight: 500 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    查询到 {queryResult.length} 项补贴政策
                  </div>
                  <Row gutter={[16, 16]}>
                    {queryResult.map((s, idx) => {
                      const matchedPolicy = policies.find((p) => p.region === s.region);
                      const accentColor = idx % 2 === 0 ? '#1677ff' : '#52c41a';
                      return (
                        <Col span={12} key={s.id}>
                          <Card
                            size="small"
                            style={{
                              height: '100%',
                              border: `1px solid ${accentColor}22`,
                              borderRadius: 8,
                              borderLeft: `4px solid ${accentColor}`,
                              background: idx % 2 === 0 ? '#f0f5ff' : '#f6ffed',
                            }}
                            bodyStyle={{ padding: 14 }}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <Tag
                                color={s.level === 'municipality' ? 'blue' : s.level === 'province' ? 'green' : 'orange'}
                                style={{ fontSize: 11, marginRight: 6 }}
                              >
                                {s.level === 'municipality' ? '直辖市' : s.level === 'province' ? '省级' : '市级'}
                              </Tag>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{s.name}</span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#595959',
                                lineHeight: 1.7,
                                marginBottom: 8,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {matchedPolicy?.summary || '暂无详细内容'}
                            </div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 8 }}>政策依据：{s.policyRef}</div>
                            {matchedPolicy?.url ? (
                              <a
                                href={matchedPolicy.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 12 }}
                              >
                                查看详情 →
                              </a>
                            ) : (
                              <span style={{ fontSize: 12, color: '#bfbfbf' }}>暂无外网链接</span>
                            )}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该地区暂无补贴政策" />
                </div>
              )}
            </div>
          )}

          <Divider style={{ margin: '16px 0' }} />

          {/* 补贴额度 */}
          <Form.Item label="补贴方式" name="subsidyMode" style={{ marginBottom: 16 }}>
            <Radio.Group onChange={(e) => setSubsidyMode(e.target.value)}>
              <Radio value="">无补贴</Radio>
              <Radio value="investment">按系统初投资</Radio>
              <Radio value="capacity">按系统容量</Radio>
            </Radio.Group>
          </Form.Item>

          {subsidyMode === 'investment' && (
            <Form.Item label="投资比例 (%)" name="investmentRatio" rules={[{ required: true, message: '请输入投资比例' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} max={100} placeholder="请输入补贴比例" addonAfter="%" style={{ width: 200 }} size="middle" />
            </Form.Item>
          )}

          {subsidyMode === 'capacity' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Form.Item label="补贴指标" name="subsidyIndex" rules={[{ required: true, message: '请输入补贴指标' }]} style={{ marginBottom: 0 }}>
                <InputNumber min={0} placeholder="请输入补贴指标" style={{ width: 140 }} size="middle" />
              </Form.Item>
              <Form.Item label="补贴指标单位" name="subsidyIndexUnit" rules={[{ required: true, message: '请选择单位' }]} style={{ marginBottom: 0 }}>
                <Select placeholder="请选择单位" allowClear style={{ width: 120 }} options={CAPACITY_UNITS.map((u) => ({ label: u, value: u }))} />
              </Form.Item>
              <Form.Item label="系统容量" name="systemCapacity" rules={[{ required: true, message: '请输入系统容量' }]} style={{ marginBottom: 0 }}>
                <InputNumber min={0} placeholder="请输入系统容量" style={{ width: 140 }} size="middle" />
              </Form.Item>
              <Form.Item label="容量单位" name="systemCapacityUnit" rules={[{ required: true, message: '请选择单位' }]} style={{ marginBottom: 0 }}>
                <Select placeholder="请选择单位" allowClear style={{ width: 120 }} options={CAPACITY_UNITS.map((u) => ({ label: u, value: u }))} />
              </Form.Item>
            </div>
          )}
        </Card>
      </Form>

      {/* 底部按钮 */}
      {editable && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e8ecf0' }}>
          <Button onClick={handleSave}>保存</Button>
          <Button type="primary" onClick={handleSaveAndNext}>保存并下一步</Button>
        </div>
      )}
    </div>
  );
}
