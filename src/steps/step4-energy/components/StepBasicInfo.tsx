import { Card, Row, Col, InputNumber, Typography, Divider } from 'antd';
import { ThunderboltOutlined, FireOutlined } from '@ant-design/icons';
import type { EnergyPrices } from '@/shared/stores/projectStore';

const { Text } = Typography;

interface Props {
  author: string;
  fillDate: string;
  location: string[];
  energyPrices: EnergyPrices;
  onChange: (prices: EnergyPrices) => void;
}

export default function StepBasicInfo({
  author,
  fillDate,
  location,
  energyPrices,
  onChange,
}: Props) {
  const locationLabel = location?.length >= 2 ? `${location[0]} ${location[1]}` : '-';

  const updatePrice = (field: keyof EnergyPrices, value: number | null) => {
    if (value === null) return;
    onChange({ ...energyPrices, [field]: value });
  };

  const PriceInput = ({
    value,
    unit,
    onChange: onValChange,
  }: {
    value: number;
    unit: string;
    onChange: (v: number) => void;
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <InputNumber
        value={value}
        onChange={(v) => v !== null && onValChange(v)}
        size="middle"
        step={0.0001}
        min={0}
        style={{ width: 110, fontVariantNumeric: 'tabular-nums' }}
        variant="filled"
      />
      {unit && <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{unit}</Text>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 填写人信息 ── */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>填写人信息</span>}
        style={{ marginBottom: 16, border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[40, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>
                填写人
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{author || '-'}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>
                填写日期
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{fillDate || '-'}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── 能源信息 ── */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>能源信息</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '16px 20px 20px' }}
      >
        {/* 所在地 */}
        <Row gutter={[40, 12]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>
                所在地
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{locationLabel}</Text>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '0 0 20px' }} />

        {/* 三价格卡片并排 */}
        <Row gutter={16}>
          {/* 工商业电价 */}
          <Col span={8}>
            <div
              style={{
                background: '#fffff5',
                borderRadius: 8,
                border: '1px solid #fff3d6',
                padding: '14px 16px',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: '#1a1a1a' }}>
                  工商业电价
                </Text>
                <Text style={{ fontSize: 11, color: '#595959' }}>元/kWh</Text>
              </div>
              <Row gutter={[8, 10]}>
                <Col span={12}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>高峰</Text>
                    <PriceInput
                      value={energyPrices.peakPrice}
                      unit=""
                      onChange={(v) => updatePrice('peakPrice', v)}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>平段</Text>
                    <PriceInput
                      value={energyPrices.flatPrice}
                      unit=""
                      onChange={(v) => updatePrice('flatPrice', v)}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>低谷</Text>
                    <PriceInput
                      value={energyPrices.valleyPrice}
                      unit=""
                      onChange={(v) => updatePrice('valleyPrice', v)}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>综合</Text>
                    <PriceInput
                      value={energyPrices.comprehensivePrice}
                      unit=""
                      onChange={(v) => updatePrice('comprehensivePrice', v)}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          {/* 工商业天然气价 */}
          <Col span={8}>
            <div
              style={{
                background: '#fff7fa',
                borderRadius: 8,
                border: '1px solid #ffdce8',
                padding: '14px 16px',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FireOutlined style={{ color: '#eb2f96', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: '#1a1a1a' }}>
                  工商业天然气价
                </Text>
                <Text style={{ fontSize: 11, color: '#595959' }}>元/Nm³</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text
                  style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 56 }}
                >
                  天然气价
                </Text>
                <PriceInput
                  value={energyPrices.gasPrice}
                  unit=""
                  onChange={(v) => updatePrice('gasPrice', v)}
                />
              </div>
            </div>
          </Col>

          {/* 工商业用水价格 */}
          <Col span={8}>
            <div
              style={{
                background: '#f0fbff',
                borderRadius: 8,
                border: '1px solid #bae7ff',
                padding: '14px 16px',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1677ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 2L12 22M12 2L8 6M12 2L16 6" />
                </svg>
                <Text strong style={{ fontSize: 13, color: '#1a1a1a' }}>
                  工商业用水价格
                </Text>
                <Text style={{ fontSize: 11, color: '#595959' }}>元/m³</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text
                  style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 56 }}
                >
                  自来水价
                </Text>
                <PriceInput
                  value={energyPrices.waterPrice}
                  unit=""
                  onChange={(v) => updatePrice('waterPrice', v)}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
