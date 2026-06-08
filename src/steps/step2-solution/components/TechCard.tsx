import { Checkbox, Tag, Progress, Button } from 'antd';
import { FireOutlined, DashboardOutlined, SunOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, CATEGORY_COLORS, RATING_STARS } from '../constants';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  efficiency: <FireOutlined style={{ fontSize: 28 }} />,
  intelligent: <DashboardOutlined style={{ fontSize: 28 }} />,
  renewable: <SunOutlined style={{ fontSize: 28 }} />,
};

const SCORE_COLOR = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1890ff';
  return '#faad14';
};

interface Props {
  tech: TechEntry;
  selected: boolean;
  onToggle: (id: string) => void;
  onDetail: (id: string) => void;
}

export function TechCard({ tech, selected, onToggle, onDetail }: Props) {
  const color = CATEGORY_COLORS[tech.category] || '#2B87C9';

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-container)',
        borderRadius: 12,
        border: selected ? `2px solid ${color}` : '1px solid var(--border-section)',
        padding: '20px 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Checkbox
        checked={selected}
        onChange={(e) => { e.stopPropagation(); onToggle(tech.id); }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 10, right: 10 }}
      />

      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--bg-section)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {CATEGORY_ICONS[tech.category]}
      </div>

      <span style={{ fontWeight: 600, fontSize: 15, textAlign: 'center' }}>
        {tech.name}
      </span>

      <Tag color={color}>{CATEGORY_LABELS[tech.category]}</Tag>

      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
          <span style={{ color: '#8c8c8c' }}>适配度</span>
          <span style={{ fontWeight: 500 }}>{tech.score}</span>
        </div>
        <Progress
          percent={tech.score}
          showInfo={false}
          size="small"
          strokeColor={SCORE_COLOR(tech.score)}
          trailColor="var(--bg-section)"
        />
      </div>

      <span style={{ fontSize: 14, color: '#faad14', letterSpacing: 2 }}>
        {RATING_STARS[tech.rating]}
      </span>

      <div style={{ width: '100%', fontSize: 12, lineHeight: '20px' }}>
        <MetricRow label="基准节能率" value={tech.energySavingRate} />
        <MetricRow label="固定投资指标" value={tech.investmentIndex} />
        <MetricRow label="年运行能耗" value={tech.annualEnergy} />
        <MetricRow label="投资回收期" value={tech.paybackPeriod} />
      </div>

      <Button
        type="text"
        icon={<ArrowRightOutlined />}
        onClick={() => onDetail(tech.id)}
        style={{ marginTop: 4 }}
      >
        查看详情
      </Button>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
      <span style={{ color: '#8c8c8c' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}