import { Modal, Row, Col, Table, Tag, Button, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../constants';

const { Title, Paragraph } = Typography;

interface Props {
  tech: TechEntry | null;
  open: boolean;
  selected: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
}

export function TechDetailModal({ tech, open, selected, onClose, onToggle }: Props) {
  if (!tech) return null;

  const color = CATEGORY_COLORS[tech.category] || '#2B87C9';

  const boundaryData = [
    { field: '医院类型及规模', value: tech.applicableHospitalTypes },
    {
      field: '最低建筑面积',
      value: tech.minArea > 0 ? `${tech.minArea.toLocaleString()} ㎡` : '无限制',
    },
    { field: '适用气候分区', value: tech.climateZones.join('、') },
    { field: '能源系统类型', value: tech.energySystemType },
    {
      field: '适用科室',
      value: tech.applicableDepts.length > 0 ? tech.applicableDepts.join('、') : '全院适用',
    },
  ];

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 24 }}
      closable
      destroyOnClose
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ marginBottom: 6 }}>
          {tech.name}
        </Title>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color={color}>{CATEGORY_LABELS[tech.category]}</Tag>
          <Tag icon={<BulbOutlined />} color="blue">
            能耗种类：{tech.energyType}
          </Tag>
          <Tag icon={<DisconnectOutlined />} color={tech.mutexTech === '-' ? 'default' : 'orange'}>
            互斥：{tech.mutexTech === '-' ? '无' : tech.mutexTech}
          </Tag>
          <Tag color="purple">作用系统：{tech.affectedSystems.join('、')}</Tag>
        </div>
      </div>

      {/* 解决运营的痛点 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          解决运营的痛点
        </Title>
        <div
          style={{
            background: '#f6ffed',
            borderRadius: 8,
            border: '1px solid #b7eb8f',
            padding: '14px 18px',
            fontSize: 14,
            color: '#135200',
            lineHeight: 1.7,
          }}
        >
          {tech.advantage}
        </div>
      </div>

      {/* 技术原理 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          技术原理
        </Title>
        <div
          style={{
            background: '#fafbfc',
            borderRadius: 10,
            padding: '16px 20px',
            border: '1px solid #e8ecf0',
          }}
        >
          <Paragraph style={{ color: '#555', lineHeight: 1.9, fontSize: 14, marginBottom: 0 }}>
            {tech.principle}
          </Paragraph>
        </div>
      </div>

      {/* 节能率取值 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          节能率取值（基准区间：{tech.energySavingRate}）
        </Title>
        <div
          style={{
            background: '#e6f4ff',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 13,
            color: '#003a8c',
            lineHeight: 1.6,
          }}
        >
          <strong>核心依据：</strong>
          {tech.savingBasis}
        </div>
      </div>

      {/* 适用边界条件 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          适用边界条件
        </Title>
        <Table
          dataSource={boundaryData}
          pagination={false}
          size="small"
          bordered
          rowKey="field"
          components={{
            header: {
              cell: (props: any) => (
                <th
                  {...props}
                  style={{
                    ...props.style,
                    background: '#f0f2f5',
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                  }}
                />
              ),
            },
            body: {
              cell: (props: any) => (
                <td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
              ),
            },
          }}
          columns={[
            {
              title: '条件项',
              dataIndex: 'field',
              key: 'field',
              width: 160,
              onHeaderCell: () => ({ style: { textAlign: 'left' } }),
              onCell: () => ({ style: { textAlign: 'left' } }),
              render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
            },
            {
              title: '条件值',
              dataIndex: 'value',
              key: 'value',
              onHeaderCell: () => ({ style: { textAlign: 'left' } }),
              onCell: () => ({ style: { textAlign: 'left' } }),
              render: (v: string) => <span style={{ color: '#555' }}>{v}</span>,
            },
          ]}
        />
      </div>

      {/* 主要节能参数量化 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          主要节能参数量化
        </Title>
        <Row gutter={14}>
          <Col span={6}>
            <ParamCard
              icon={<ThunderboltOutlined />}
              label="基准节能率"
              value={tech.energySavingRate}
              color="#722ed1"
            />
          </Col>
          <Col span={6}>
            <ParamCard
              icon={<DollarOutlined />}
              label="固定投资指标"
              value={tech.investmentIndex}
              color="#2B87C9"
            />
          </Col>
          <Col span={6}>
            <ParamCard
              icon={<ThunderboltOutlined />}
              label="年运行能耗"
              value={tech.annualEnergy}
              color="#fa8c16"
            />
          </Col>
          <Col span={6}>
            <ParamCard
              icon={<ClockCircleOutlined />}
              label="投资回收期"
              value={tech.paybackPeriod}
              color="#52c41a"
            />
          </Col>
        </Row>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e8ecf0', paddingTop: 16, textAlign: 'right' }}>
        <Button
          type={selected ? 'default' : 'primary'}
          icon={selected ? <CheckCircleOutlined /> : undefined}
          onClick={() => onToggle(tech.id)}
        >
          {selected ? '已选择' : '选择此技术'}
        </Button>
      </div>
    </Modal>
  );
}

function ParamCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #e8ecf0',
        padding: '18px 12px',
        textAlign: 'center',
        height: '100%',
      }}
    >
      <div style={{ fontSize: 20, color, marginBottom: 8 }}>{icon}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: 1.3,
          marginBottom: 6,
          minHeight: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value || '-'}
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>{label}</div>
    </div>
  );
}
