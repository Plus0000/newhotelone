import { useState, useMemo } from 'react';
import { Modal, Table, Empty, Button, Typography, Row, Col, Space } from 'antd';
import {
  ThunderboltOutlined,
  FireOutlined,
  ExperimentOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, parseRateRange, calcComprehensiveRate } from '../constants';
import { StableInputNumber } from '@/shared/components/StableInputNumber';

const { Title } = Typography;

interface Props {
  open: boolean;
  selectedTechs: TechEntry[];
  onClose: () => void;
  onConfirm?: () => void;
}

interface EnergyMetric {
  key: string;
  label: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
}

const METRICS: EnergyMetric[] = [
  { key: 'electricity', label: '耗电量', icon: <ThunderboltOutlined />, unit: '万kWh/年', color: '#2B87C9' },
  { key: 'gas', label: '耗气量', icon: <FireOutlined />, unit: '万m³/年', color: '#fa8c16' },
  { key: 'coal', label: '标煤数', icon: <ExperimentOutlined />, unit: 'tce/年', color: '#595959' },
  { key: 'carbon', label: '碳排量', icon: <CloudOutlined />, unit: 'tCO₂/年', color: '#52c41a' },
];

const DEFAULT_ORIGINAL: Record<string, number> = {
  electricity: 250,
  gas: 18,
  coal: 850,
  carbon: 2100,
};

const TABLE_COMPONENTS = {
  header: {
    cell: (props: any) => (
      <th {...props} style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }} />
    ),
  },
  body: {
    cell: (props: any) => (
      <td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
    ),
  },
};

export function ComprehensiveRateModal({ open, selectedTechs, onClose, onConfirm }: Props) {
  const [original, setOriginal] = useState<Record<string, number>>({ ...DEFAULT_ORIGINAL });

  const result = calcComprehensiveRate(selectedTechs);
  const comprehensiveRate = result ? (result.lower + result.upper) / 2 : 0;

  const saving = useMemo(() => {
    const s: Record<string, number> = {};
    for (const key of Object.keys(original)) {
      s[key] = original[key] * (1 - comprehensiveRate);
    }
    return s;
  }, [original, comprehensiveRate]);

  const parsedTechs = useMemo(() =>
    selectedTechs.map((t) => ({
      ...t,
      parsed: parseRateRange(t.energySavingRate),
    })),
    [selectedTechs]
  );

  const handleOriginalChange = (key: string, value: number | null) => {
    setOriginal((prev) => ({ ...prev, [key]: value ?? 0 }));
  };

  if (selectedTechs.length === 0) {
    return (
      <Modal title="综合节能率估算" open={open} onCancel={onClose} footer={null}>
        <Empty description="请先选择节能技术" />
      </Modal>
    );
  }

  return (
    <Modal
      title="综合节能率估算"
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" onClick={onConfirm}>
            确认完成
          </Button>
        </Space>
      }
      width={900}
      style={{ top: 24 }}
      destroyOnClose
    >
      {/* Energy comparison */}
      <Title level={5} style={{ marginBottom: 12 }}>能耗对比</Title>

      {/* Metric cards overview */}
      <Row gutter={14} style={{ marginBottom: 20 }}>
        {METRICS.map((m) => {
          const orig = original[m.key];
          const saved = saving[m.key];
          const itemRate = orig > 0 ? ((orig - saved) / orig * 100).toFixed(1) : '0.0';
          const isDown = orig > saved;
          return (
            <Col span={6} key={m.key}>
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e8ecf0',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${m.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.color, fontSize: 14,
                  }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>{m.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#bbb' }}>原始</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                    {orig.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#bbb' }}>节能</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                    {saved.toFixed(2)}
                  </span>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDown ? '#52c41a' : '#ff4d4f',
                }}>
                  ↓ {itemRate}%
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Editable comparison table */}
      <div style={{
        background: '#fafbfc',
        borderRadius: 10,
        border: '1px solid #e8ecf0',
        padding: '16px 20px',
        marginBottom: 20,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8ecf0' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>
                指标
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>
                原始方案
              </th>
              <th style={{ padding: '8px 4px', width: 30 }} />
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>
                节能方案
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>
                节能率
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => {
              const orig = original[m.key];
              const saved = saving[m.key];
              const itemRate = orig > 0 ? ((orig - saved) / orig * 100).toFixed(1) : '0.0';
              const isDown = orig > saved;
              return (
                <tr key={m.key} style={{ borderBottom: i < METRICS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: m.color, fontSize: 14 }}>{m.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <StableInputNumber
                      value={orig}
                      onValueChange={(v) => handleOriginalChange(m.key, v)}
                      size="small"
                      style={{ width: 170 }}
                      addonAfter={<span style={{ fontSize: 11 }}>{m.unit}</span>}
                      min={0}
                      precision={2}
                    />
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: 16, color: isDown ? '#52c41a' : '#ff4d4f' }}>
                      {isDown ? '→' : '←'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>
                      {saved.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>{m.unit}</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isDown ? '#52c41a' : '#ff4d4f',
                    }}>
                      ↓ {itemRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected techs */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>已选技术</div>
        <Table
          rowKey="id"
          dataSource={selectedTechs}
          pagination={false}
          size="small"
          bordered
          components={TABLE_COMPONENTS}
          columns={[
            { title: '技术名称', dataIndex: 'name', key: 'name', onHeaderCell: () => ({ style: { textAlign: 'left' } }), onCell: () => ({ style: { textAlign: 'left' } }) },
            {
              title: '分类',
              dataIndex: 'category',
              key: 'category',
              onHeaderCell: () => ({ style: { textAlign: 'left' } }),
              onCell: () => ({ style: { textAlign: 'left' } }),
              render: (c: string) => CATEGORY_LABELS[c] || c,
            },
            { title: '节能率', dataIndex: 'energySavingRate', key: 'rate', onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }) },
          ]}
        />
      </div>

      {/* Formula */}
      <div
        style={{
          background: 'var(--bg-section)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>计算公式</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#555', marginBottom: 10 }}>
          综合节能率 = 1 - (1-η₁)(1-η₂)...(1-ηₙ)
        </div>
        {parsedTechs.map((t) => (
          <div key={t.id} style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
            {t.name}: η = {t.parsed ? `${(t.parsed.lower * 100).toFixed(0)}% ~ ${(t.parsed.upper * 100).toFixed(0)}%` : '数据异常'}
          </div>
        ))}
      </div>

      {/* Result */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2B87C9 0%, #52c41a 100%)',
          borderRadius: 8,
          padding: '20px 24px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>综合节能率估算结果</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>
          {result
            ? `${(result.lower * 100).toFixed(1)}% ~ ${(result.upper * 100).toFixed(1)}%`
            : '无法计算'}
        </div>
      </div>

      {/* Note */}
      <div style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
        注：实际节能效果受建筑条件、气候环境、运行管理等多因素影响，以上为理论估算值。
      </div>
    </Modal>
  );
}
