import { Modal, Row, Col, Table, Progress, Tag, Button, Typography } from 'antd';
import {
  CheckCircleOutlined,

  FileTextOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, CATEGORY_COLORS, RATING_STARS } from '../constants';

const { Title, Paragraph } = Typography;

interface Props {
  tech: TechEntry | null;
  open: boolean;
  selected: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1890ff';
  return '#faad14';
};

export function TechDetailModal({ tech, open, selected, onClose, onToggle }: Props) {
  if (!tech) return null;

  const color = CATEGORY_COLORS[tech.category] || '#2B87C9';
  const scoreColor = SCORE_COLOR(tech.score);

  const boundaryData = [
    { field: '适用医院类型', value: tech.applicableHospitalTypes.join('、') },
    { field: '最低建筑面积', value: tech.minArea > 0 ? `${tech.minArea.toLocaleString()} ㎡` : '无限制' },
    { field: '适用气候分区', value: tech.climateZones.join('、') },
    { field: '能源系统类型', value: tech.energySystemType },
    { field: '适用场景', value: tech.applicableScenes.join('、') },
    { field: '适用科室', value: tech.applicableDepts.length > 0 ? tech.applicableDepts.join('、') : '全院适用' },
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
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 6 }}>{tech.name}</Title>
        <Tag color={color}>{CATEGORY_LABELS[tech.category]}</Tag>
      </div>

      {/* Hero section: score + metrics */}
      <Row gutter={20} style={{ marginBottom: 28 }}>
        {/* Left: Score card */}
        <Col span={10}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e8ecf0',
            padding: '24px 20px',
            height: '100%',
          }}>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>适配度得分</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor, lineHeight: 1, marginBottom: 12 }}>
              {tech.score}
            </div>
            <Progress
              percent={tech.score}
              showInfo={false}
              strokeColor={scoreColor}
              trailColor="#f0f0f0"
              strokeWidth={8}
              style={{ marginBottom: 14 }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#bbb',
              marginTop: -8,
              marginBottom: 14,
            }}>
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#8c8c8c' }}>推荐等级</span>
              <span style={{ color: '#faad14', letterSpacing: 3, fontSize: 16 }}>
                {RATING_STARS[tech.rating]}
              </span>
            </div>
          </div>
        </Col>

        {/* Right: Metric cards */}
        <Col span={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <MetricRow
              icon={<FileTextOutlined />}
              label="数据引用（次）"
              value={tech.dataAccessCount}
              color="#2B87C9"
            />
            <MetricRow
              icon={<ExperimentOutlined />}
              label="计算方法引用（次）"
              value={tech.citationCount}
              color="#722ed1"
            />
            <MetricRow
              icon={<EyeOutlined />}
              label="在线计算（次）"
              value={Math.floor(tech.dataAccessCount * 0.72)}
              color="#52c41a"
            />
          </div>
        </Col>
      </Row>

      {/* 解决运营的痛点 */}
      <div style={{ marginBottom: 28 }}>
        <Title level={5} style={{ marginBottom: 12 }}>解决运营的痛点</Title>
        <div style={{
          background: '#f6ffed',
          borderRadius: 8,
          border: '1px solid #b7eb8f',
          padding: '14px 18px',
          fontSize: 14,
          color: '#135200',
          lineHeight: 1.7,
        }}>
          {tech.advantage}
        </div>
      </div>

      {/* 技术原理 */}
      <div style={{ marginBottom: 28 }}>
        <Title level={5} style={{ marginBottom: 12 }}>技术原理</Title>
        <div style={{
          background: '#fafbfc',
          borderRadius: 10,
          padding: '16px 20px',
          border: '1px solid #e8ecf0',
        }}>
          <Paragraph style={{ color: '#555', lineHeight: 1.9, fontSize: 14, marginBottom: 0 }}>
            {tech.principle}
          </Paragraph>
        </div>
      </div>

      {/* 适用边界条件 */}
      <div style={{ marginBottom: 28 }}>
        <Title level={5} style={{ marginBottom: 12 }}>适用边界条件</Title>
        <Table
          dataSource={boundaryData}
          pagination={false}
          size="small"
          bordered
          rowKey="field"
          components={{
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
        <Title level={5} style={{ marginBottom: 12 }}>主要节能参数量化</Title>
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

function MetricRow({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e8ecf0',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, color: '#555' }}>{label}</span>
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function ParamCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e8ecf0',
      padding: '18px 12px',
      textAlign: 'center',
      height: '100%',
    }}>
      <div style={{ fontSize: 20, color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 6 }}>
        {value || '-'}
      </div>
      <div style={{ fontSize: 11, color: '#999' }}>{label}</div>
    </div>
  );
}