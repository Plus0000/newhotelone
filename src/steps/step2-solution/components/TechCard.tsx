import { Checkbox, Tag, Button, Tooltip } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { TechEntry } from '@/data/materials';
import type { TechScoreResult } from '../techScoring';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../constants';

interface Props {
  tech: TechEntry;
  selected: boolean;
  /** 该附属技术当前挂载的主技术 id 列表（仅对附属技术有效） */
  boundMainTechIds?: string[];
  /** 该附属技术挂载的主技术名称列表（用于 tooltip 显示） */
  boundMainTechNames?: string[];
  onToggle: (id: string) => void;
  onDetail: (id: string) => void;
  scoreResult?: TechScoreResult;
}

function getScoreColor(score: number) {
  if (score >= 0.8) return { text: '#389e0d', bg: '#f6ffed', bar: '#52c41a' };
  if (score >= 0.5) return { text: '#d46b08', bg: '#fff7e6', bar: '#fa8c16' };
  return { text: '#cf1322', bg: '#fff2f0', bar: '#f5222d' };
}

function nameFontSize(name: string): number {
  const len = name.length;
  if (len <= 6) return 18;
  if (len <= 8) return 17;
  if (len <= 10) return 16;
  return 15;
}

export function TechCard({
  tech,
  selected,
  boundMainTechIds = [],
  boundMainTechNames = [],
  onToggle,
  onDetail,
  scoreResult,
}: Props) {
  const color = CATEGORY_COLORS[tech.category] || '#2B87C9';
  const isVetoed = scoreResult?.isVetoed ?? false;
  const score = scoreResult?.score ?? 1;
  const scorePercent = (score * 100).toFixed(0);
  const sc = getScoreColor(score);
  const titleFs = nameFontSize(tech.name);
  const isDependent = !!tech.isDependentTech;
  const hasBinding = boundMainTechIds.length > 0;
  const bindingTooltip =
    isDependent && hasBinding
      ? `已挂载主技术：${boundMainTechNames.join('、')}`
      : isDependent
        ? '未挂载主技术（需在弹窗中选择）'
        : undefined;

  return (
    <Tooltip title={isVetoed && scoreResult ? scoreResult.vetoReasons.join('；') : undefined}>
      <div
        style={{
          position: 'relative',
          height: '100%',
          background: '#fff',
          borderRadius: 16,
          border: selected ? `2px solid ${color}` : '1px solid #f0f0f0',
          padding: '24px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          cursor: 'default',
          ...(isVetoed ? { opacity: 0.45, filter: 'grayscale(0.8)' } : {}),
        }}
        onMouseEnter={(e) => {
          if (!isVetoed) e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={(e) => {
          if (!isVetoed) e.currentTarget.style.boxShadow = '';
        }}
      >
        <Checkbox
          checked={selected}
          disabled={isVetoed}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(tech.id);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}
        />

        {/* 技术名称 */}
        <div style={{ paddingRight: 24 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: titleFs,
              color: '#1a1a1a',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tech.name}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag color={color} style={{ fontSize: 11 }}>
              {CATEGORY_LABELS[tech.category]}
            </Tag>
            {isDependent && (
              <Tooltip title={bindingTooltip}>
                <Tag color={hasBinding ? 'gold' : 'default'} style={{ fontSize: 11 }}>
                  附属{hasBinding ? ` · ${boundMainTechIds.length}主` : ' · 未挂载'}
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>

        {/* 适配度 */}
        <div
          style={{
            background: sc.bg,
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {isVetoed ? (
            <span style={{ fontSize: 24, fontWeight: 700, color: '#999' }}>不适用</span>
          ) : (
            <>
              <div>
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: sc.text,
                    lineHeight: 1,
                    letterSpacing: -1,
                  }}
                >
                  {scorePercent}
                </span>
                <span style={{ fontSize: 17, fontWeight: 700, color: sc.text, marginLeft: 2 }}>
                  %
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: sc.text, marginBottom: 6 }}>
                  适配度
                </div>
                <div
                  style={{
                    height: 4,
                    background: '#0000000f',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${scorePercent}%`,
                      background: sc.bar,
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 指标 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="基准节能率" value={tech.energySavingRate} />
          <MetricRow label="固定投资指标" value={tech.investmentIndex} />
          <MetricRow label="年运行能耗" value={tech.annualEnergy} />
          <MetricRow label="投资回收期" value={tech.paybackPeriod} />
        </div>

        <Button
          type="default"
          icon={<ArrowRightOutlined />}
          onClick={() => onDetail(tech.id)}
          style={{ width: '100%', borderRadius: 8, height: 36 }}
        >
          查看详情
        </Button>
      </div>
    </Tooltip>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        lineHeight: '24px',
      }}
    >
      <span style={{ color: '#8c8c8c', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontWeight: 500,
          color: '#1a1a1a',
          textAlign: 'right',
          marginLeft: 16,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 150,
        }}
      >
        {value || '-'}
      </span>
    </div>
  );
}
