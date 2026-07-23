import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import {
  Tabs,
  Tooltip,
  Input,
  Empty,
  Select,
  Drawer,
  message,
  Row,
  Col,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  BookOpen,
  FileText,
  Database,
  Landmark,
  Search,
  Zap,
  Flame,
  Droplet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { standards, type StandardEntry } from '@/data/standards';
import { policies, energyPrices } from '@/data/policies';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/steps/step2-solution/constants';
import { supabase } from '@/shared/lib/supabase';
import { useMergedTechEntries, useMergedEquipmentItems, type KbTechEntry } from './store';
import './KnowledgeSidebar.css';

const { Title, Paragraph } = Typography;

type TabKey = 'standards' | 'materials' | 'policies';

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

const TABS: { key: TabKey; label: string; icon: React.ReactNode; tip: string }[] = [
  {
    key: 'standards',
    label: '规范标准库',
    icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    tip: '规范标准库',
  },
  {
    key: 'materials',
    label: '系统素材库',
    icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    tip: '系统素材库',
  },
  {
    key: 'policies',
    label: '政策绿融库',
    icon: <Landmark size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    tip: '政策绿融库',
  },
];

const HOVER_OPEN_DELAY = 150;
const HOVER_CLOSE_DELAY = 250;

// 顶部导航栏高度（含 1px 边框）。导航在视野内时侧边栏贴其下方，导航滚出后侧边栏通顶。
const NAV_HEIGHT = 57;

const STANDARD_CATEGORY_LABEL: Record<string, string> = {
  general_design: '通用设计',
  equipment_efficiency: '设备及能效',
  construction_acceptance: '施工验收',
  operation_energy_control: '运维能效管控',
  energy_management: '能源管理技术',
  policy_regulation: '政策法规文件',
  intelligent: '智能化',
  engineering: '工程技术',
  new_energy_grid: '新能源/新型电网',
  green_carbon: '绿色碳排',
  hospital_specific: '医院专属',
  drawing_atlas: '图集',
  energy_quota_local: '能耗定额地标',
};

export function KnowledgeSidebar() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('standards');
  const [topOffset, setTopOffset] = useState(NAV_HEIGHT);
  const [pdfDrawer, setPdfDrawer] = useState<{ open: boolean; standard: StandardEntry | null }>({
    open: false,
    standard: null,
  });
  const [techDrawer, setTechDrawer] = useState<{ open: boolean; tech: KbTechEntry | null }>({
    open: false,
    tech: null,
  });
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setTopOffset(Math.max(0, NAV_HEIGHT - window.scrollY));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const handleEnter = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (!open) {
      openTimer.current = window.setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
    }
  };

  const handleLeave = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  const handleIconClick = (key: TabKey) => {
    setActiveTab(key);
    setOpen(true);
  };

  const pdfUrl = pdfDrawer.standard?.pdfPath
    ? supabase.storage.from('standards-pdfs').getPublicUrl(pdfDrawer.standard.pdfPath).data
        .publicUrl
    : null;

  return (
    <>
      <div
        className={`kb-sidebar ${open ? 'kb-sidebar--open' : ''}`}
        style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="kb-sidebar__rail">
          <div className="kb-sidebar__rail-header">
            <BookOpen size={18} strokeWidth={1.75} />
          </div>
          {TABS.map((t) => (
            <Tooltip key={t.key} title={t.tip} placement="right">
              <button
                type="button"
                className={`kb-sidebar__rail-item ${activeTab === t.key && open ? 'is-active' : ''}`}
                onClick={() => handleIconClick(t.key)}
              >
                {t.icon}
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="kb-sidebar__panel">
          <div className="kb-sidebar__panel-header">
            <span className="kb-sidebar__panel-title">知识库</span>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
            items={[
              {
                key: 'standards',
                label: '规范',
                children: (
                  <StandardsList onOpenPdf={(s) => setPdfDrawer({ open: true, standard: s })} />
                ),
              },
              {
                key: 'materials',
                label: '素材',
                children: (
                  <MaterialsList onOpenTech={(t) => setTechDrawer({ open: true, tech: t })} />
                ),
              },
              { key: 'policies', label: '政策', children: <PoliciesList /> },
            ]}
          />
        </div>
      </div>

      <Drawer
        title={
          <div className="kb-pdf-drawer__title">
            <div className="kb-pdf-drawer__name">{pdfDrawer.standard?.name}</div>
            <div className="kb-pdf-drawer__code">{pdfDrawer.standard?.code}</div>
          </div>
        }
        width={960}
        open={pdfDrawer.open}
        onClose={() => setPdfDrawer({ open: false, standard: null })}
        destroyOnClose
        extra={
          pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              在新标签页打开
            </a>
          )
        }
      >
        {pdfUrl ? (
          <iframe src={pdfUrl} title={pdfDrawer.standard?.name} className="kb-pdf-frame" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 PDF 文件" />
        )}
      </Drawer>

      <Drawer
        title="技术详情"
        width={600}
        open={techDrawer.open}
        onClose={() => setTechDrawer({ open: false, tech: null })}
        destroyOnClose
      >
        {techDrawer.tech && <TechDetail tech={techDrawer.tech} />}
      </Drawer>
    </>
  );
}

// ── 规范标准库 ─────────────────────────────────────────

function StandardsList({ onOpenPdf }: { onOpenPdf: (s: StandardEntry) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of standards) {
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => ({
      value: key,
      label: `${STANDARD_CATEGORY_LABEL[key] ?? key} (${count})`,
    }));
  }, []);

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    let list = standards;
    if (cat !== 'all') list = list.filter((s) => s.category === cat);
    if (k) {
      list = list.filter(
        (s) => s.name.toLowerCase().includes(k) || s.code.toLowerCase().includes(k),
      );
    }
    return list;
  }, [q, cat]);

  const handleCardClick = (s: StandardEntry) => {
    if (!s.pdfPath) {
      message.info('暂无 PDF 文件');
      return;
    }
    onOpenPdf(s);
  };

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索规范名称/编号" />
      <div className="kb-list__filter">
        <Select
          value={cat}
          onChange={setCat}
          size="middle"
          style={{ width: '100%' }}
          options={[{ value: 'all', label: `全部 (${standards.length})` }, ...categories]}
        />
      </div>
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配" />
      ) : (
        data.map((s) => (
          <div
            key={s.id}
            className={`kb-card kb-card--standard ${s.pdfPath ? 'has-pdf' : 'no-pdf'}`}
            onClick={() => handleCardClick(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(s);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="kb-card__title-row">
              <span className="kb-card__title">{s.name}</span>
              <span className={`kb-pill ${s.pdfPath ? 'kb-pill--pdf' : 'kb-pill--system'}`}>
                {s.pdfPath ? '查看原文' : '暂无文件'}
              </span>
            </div>
            <div className="kb-card__meta">
              {s.code && (
                <>
                  <span className="kb-card__code">{s.code}</span>
                  <span className="kb-card__sep">·</span>
                </>
              )}
              <span>{STANDARD_CATEGORY_LABEL[s.category] ?? s.category}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── 系统素材库 ─────────────────────────────────────────

function MaterialsList({ onOpenTech }: { onOpenTech: (tech: KbTechEntry) => void }) {
  const [sub, setSub] = useState<'tech' | 'equipment'>('tech');
  return (
    <Tabs
      activeKey={sub}
      onChange={(k) => setSub(k as 'tech' | 'equipment')}
      size="small"
      items={[
        { key: 'tech', label: '节能技术', children: <TechList onOpenTech={onOpenTech} /> },
        { key: 'equipment', label: '设备品牌', children: <EquipmentList /> },
      ]}
    />
  );
}

const TECH_CATEGORY_LABEL: Record<string, string> = {
  efficiency: '能效',
  intelligent: '智能',
  renewable: '可再生',
};

function TechList({ onOpenTech }: { onOpenTech: (tech: KbTechEntry) => void }) {
  const techEntries = useMergedTechEntries();
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return techEntries;
    return techEntries.filter(
      (t) => t.name.toLowerCase().includes(k) || t.advantage.toLowerCase().includes(k),
    );
  }, [q, techEntries]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索技术名称/优势" />
      <div className="kb-list__count">共 {data.length} 项技术</div>
      {data.map((t) => {
        const clickable = t.isSystem;
        return (
          <div
            key={t.id}
            className={`kb-card kb-card--tech ${clickable ? 'kb-card--clickable' : ''}`}
            onClick={clickable ? () => onOpenTech(t) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenTech(t);
                    }
                  }
                : undefined
            }
          >
            <div className="kb-card__title-row">
              <span className="kb-card__title">{t.name}</span>
              {t.isSystem ? (
                <span className="kb-pill kb-pill--detail">详情</span>
              ) : (
                <span className="kb-pill kb-pill--mine">我的</span>
              )}
            </div>
            <div className="kb-card__meta">
              <span>{TECH_CATEGORY_LABEL[t.category] ?? t.category}</span>
              <span className="kb-card__sep">·</span>
              <span>节能 {t.energySavingRate}</span>
              <span className="kb-card__sep">·</span>
              <span>{t.investmentIndex}</span>
            </div>
            <div className="kb-card__desc">{t.advantage}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 技术详情 ─────────────────────────────────────────

function TechDetail({ tech }: { tech: KbTechEntry }) {
  const color = CATEGORY_COLORS[tech.category] || '#2B87C9';

  const boundaryData = [
    { field: '医院类型及规模', value: tech.applicableHospitalTypes || '-' },
    {
      field: '最低建筑面积',
      value: tech.minArea > 0 ? `${tech.minArea.toLocaleString()} ㎡` : '无限制',
    },
    { field: '适用气候分区', value: tech.climateZones.join('、') || '-' },
    { field: '能源系统类型', value: tech.energySystemType || '-' },
    {
      field: '适用科室',
      value: tech.applicableDepts.length > 0 ? tech.applicableDepts.join('、') : '全院适用',
    },
    { field: '主要作用系统', value: tech.primarySystem || '-' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          {tech.name}
        </Title>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag color={color}>{CATEGORY_LABELS[tech.category] ?? tech.category}</Tag>
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
      <DetailBlock title="解决运营的痛点">
        <div
          style={{
            background: '#f6ffed',
            borderRadius: 8,
            border: '1px solid #b7eb8f',
            padding: '12px 16px',
            fontSize: 13,
            color: '#135200',
            lineHeight: 1.7,
          }}
        >
          {tech.advantage}
        </div>
      </DetailBlock>

      {/* 技术原理 */}
      <DetailBlock title="技术原理">
        <div
          style={{
            background: '#fafbfc',
            borderRadius: 10,
            padding: '14px 18px',
            border: '1px solid #e8ecf0',
          }}
        >
          <Paragraph style={{ color: '#555', lineHeight: 1.9, fontSize: 13, marginBottom: 0 }}>
            {tech.principle}
          </Paragraph>
        </div>
      </DetailBlock>

      {/* 节能率取值 */}
      <DetailBlock title={`节能率取值（基准区间：${tech.energySavingRate}）`}>
        <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
          <Col span={12}>
            <ParamCard label="无历史数据" value={`${tech.savingRates.v1}%`} color="#722ed1" />
          </Col>
          <Col span={12}>
            <ParamCard label="偏差 ≤10%" value={`${tech.savingRates.v2}%`} color="#722ed1" />
          </Col>
          <Col span={12}>
            <ParamCard label="偏差 10%-20%" value={`${tech.savingRates.v3}%`} color="#722ed1" />
          </Col>
          <Col span={12}>
            <ParamCard label="偏差 >20%" value={`${tech.savingRates.v4}%`} color="#722ed1" />
          </Col>
        </Row>
        <div
          style={{
            background: '#e6f4ff',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 12,
            color: '#003a8c',
            lineHeight: 1.6,
          }}
        >
          <strong>核心依据：</strong>
          {tech.savingBasis}
        </div>
      </DetailBlock>

      {/* 适用边界条件 */}
      <DetailBlock title="适用边界条件">
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
                    fontSize: 12,
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
              width: 130,
              onHeaderCell: () => ({ style: { textAlign: 'left' } }),
              onCell: () => ({ style: { textAlign: 'left' } }),
              render: (v: string) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>,
            },
            {
              title: '条件值',
              dataIndex: 'value',
              key: 'value',
              onHeaderCell: () => ({ style: { textAlign: 'left' } }),
              onCell: () => ({ style: { textAlign: 'left' } }),
              render: (v: string) => <span style={{ color: '#555', fontSize: 12 }}>{v}</span>,
            },
          ]}
        />
      </DetailBlock>

      {/* 主要节能参数量化 */}
      <DetailBlock title="主要节能参数量化">
        <Row gutter={[10, 10]}>
          <Col span={12}>
            <ParamCard
              icon={<DollarOutlined />}
              label="固定投资指标"
              value={tech.investmentIndex}
              color="#2B87C9"
            />
          </Col>
          <Col span={12}>
            <ParamCard
              icon={<ThunderboltOutlined />}
              label="年运行能耗"
              value={tech.annualEnergy}
              color="#fa8c16"
            />
          </Col>
          <Col span={12}>
            <ParamCard
              icon={<ClockCircleOutlined />}
              label="投资回收期"
              value={tech.paybackPeriod}
              color="#52c41a"
            />
          </Col>
        </Row>
      </DetailBlock>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Title level={5} style={{ marginBottom: 10, fontSize: 14 }}>
        {title}
      </Title>
      {children}
    </div>
  );
}

function ParamCard({
  icon,
  label,
  value,
  color,
}: {
  icon?: ReactNode;
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
        padding: '14px 12px',
        textAlign: 'center',
        height: '100%',
      }}
    >
      {icon && <div style={{ fontSize: 18, color, marginBottom: 6 }}>{icon}</div>}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: 1.3,
          marginBottom: 4,
          minHeight: 32,
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

function EquipmentList() {
  const equipmentItems = useMergedEquipmentItems();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    equipmentItems.forEach((e) => set.add(e.category));
    return ['all', ...set];
  }, [equipmentItems]);

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    return equipmentItems.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!k) return true;
      return (
        e.brand.toLowerCase().includes(k) ||
        e.specification.toLowerCase().includes(k) ||
        e.equipmentType.toLowerCase().includes(k)
      );
    });
  }, [equipmentItems, q, category]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索品牌/型号/类型" />
      <div className="kb-chip-row">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`kb-chip ${category === c ? 'is-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c === 'all' ? '全部' : c}
          </button>
        ))}
      </div>
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.map((e) => (
        <div key={e.id} className="kb-card kb-card--equipment">
          <div className="kb-card__title-row">
            <span className="kb-card__title">
              {e.brand} · {e.equipmentType}
            </span>
            <span className={`kb-pill kb-pill--${e.isSystem ? 'system' : 'mine'}`}>
              {e.isSystem ? '预置' : '我的'}
            </span>
          </div>
          <div className="kb-card__meta">
            <span>{e.category}</span>
            <span className="kb-card__sep">·</span>
            <span>{e.subCategory}</span>
            <span className="kb-card__sep">·</span>
            <span className="kb-card__price">
              ¥{e.price.toLocaleString()}/{e.unit}
            </span>
          </div>
          <div className="kb-card__desc kb-card__desc--mono">{e.specification}</div>
        </div>
      ))}
    </div>
  );
}

// ── 政策绿融库 ─────────────────────────────────────────

function PoliciesList() {
  const [sub, setSub] = useState<'policy' | 'price'>('policy');
  return (
    <Tabs
      activeKey={sub}
      onChange={(k) => setSub(k as 'policy' | 'price')}
      size="small"
      items={[
        { key: 'policy', label: '政策', children: <PolicyEntries /> },
        { key: 'price', label: '能源价格', children: <EnergyPriceEntries /> },
      ]}
    />
  );
}

const POLICY_CATEGORY_COLOR: Record<string, string> = {
  补贴: 'magenta',
  政策: 'blue',
};

function PolicyEntries() {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return policies;
    return policies.filter(
      (p) =>
        p.province.toLowerCase().includes(k) ||
        p.city.toLowerCase().includes(k) ||
        p.energyPolicy.toLowerCase().includes(k) ||
        p.policyCategory.toLowerCase().includes(k) ||
        p.publishOrg.toLowerCase().includes(k) ||
        p.policyName.toLowerCase().includes(k) ||
        p.summary.toLowerCase().includes(k),
    );
  }, [q]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索省份/城市/政策/机构" />
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.map((p) => {
        const isExpanded = expanded.has(p.id);
        const hasDetail = !!p.summary || !!p.validPeriod || !!p.remark || !!p.url;
        const categoryColor = POLICY_CATEGORY_COLOR[p.policyCategory] || 'default';
        return (
          <div key={p.id} className="kb-card kb-card--policy">
            <div className="kb-card__title-row">
              <span className="kb-card__title">{p.energyPolicy}</span>
              <span className="kb-pill kb-pill--system">预置</span>
            </div>
            <div className="kb-card__meta">
              <Tag
                color={categoryColor}
                style={{ fontSize: 11, marginRight: 0, marginBottom: 0 }}
              >
                {p.policyCategory}
              </Tag>
              <Tag color="geekblue" style={{ fontSize: 11, marginRight: 0, marginBottom: 0 }}>
                {p.province}
              </Tag>
              <Tag style={{ fontSize: 11, marginRight: 0, marginBottom: 0, color: '#595959', borderColor: '#d9d9d9' }}>
                {p.city}
              </Tag>
            </div>
            <div className="kb-card__meta" style={{ marginBottom: 4 }}>
              <Tag style={{ fontSize: 11, marginRight: 0, marginBottom: 0, color: '#8c8c8c', borderColor: '#e8e8e8' }}>
                {p.publishYear}
              </Tag>
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{p.publishOrg}</span>
            </div>
            {p.policyName && (
              <div
                className="kb-card__desc"
                style={{ fontSize: 12, color: '#595959', marginTop: 4 }}
              >
                {p.policyName}
              </div>
            )}
            {isExpanded && hasDetail && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px dashed #e8e8e8',
                  fontSize: 11,
                  color: '#595959',
                  lineHeight: 1.7,
                }}
              >
                {p.summary && <div style={{ marginBottom: 4 }}>{p.summary}</div>}
                {p.validPeriod && <div>有效期：{p.validPeriod}</div>}
                {p.remark && <div style={{ color: '#8c8c8c' }}>备注：{p.remark}</div>}
                {p.url && (
                  <a className="kb-card__link" href={p.url} target="_blank" rel="noreferrer">
                    查看原文
                  </a>
                )}
              </div>
            )}
            {hasDetail && (
              <button
                type="button"
                onClick={() => toggleExpand(p.id)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: 11,
                  color: '#8c8c8c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} strokeWidth={1.75} />
                    收起详情
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} strokeWidth={1.75} />
                    展开详情（摘要 / 原文链接）
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EnergyPriceEntries() {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return energyPrices;
    return energyPrices.filter(
      (e) => e.province.toLowerCase().includes(k) || e.city.toLowerCase().includes(k),
    );
  }, [q]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索省份/城市" />
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.map((e) => {
        const isExpanded = expanded.has(e.id);
        const hasDetail =
          !!e.electricity?.peakHours ||
          !!e.electricity?.flatHours ||
          !!e.electricity?.valleyHours ||
          !!e.electricity?.sharpHours ||
          !!e.electricity?.policyRef ||
          !!e.electricity?.remark ||
          !!e.gas?.policyRef ||
          !!e.gas?.remark ||
          !!e.water?.policyRef ||
          !!e.water?.remark;

        return (
          <div key={e.id} className="kb-card kb-card--policy">
            <div className="kb-card__title-row">
              <span className="kb-card__title">
                {e.province} · {e.city}
              </span>
              <span className="kb-pill kb-pill--system">预置</span>
            </div>
            <div className="kb-card__meta">
              <span>{e.userType}</span>
            </div>

            {/* 电：层级 1+2 默认展开，层级 3 点击展开 */}
            {e.electricity && (
              <div
                style={{
                  background: '#fffff5',
                  border: '1px solid #fff3d6',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginTop: 8,
                }}
              >
                {/* 层级 1：主数据 - 综合价 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Zap size={14} strokeWidth={1.75} style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>工商业电价</span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>元/kWh</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#595959' }}>
                    综合{' '}
                    <strong style={{ fontSize: 16, color: '#faad14' }}>
                      {e.electricity.composite}
                    </strong>
                  </span>
                </div>
                {/* 层级 2：峰平谷小卡片 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${e.electricity.sharp !== undefined ? 4 : 3}, 1fr)`,
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 6,
                      padding: '8px 10px',
                      boxShadow: '0 1px 2px rgba(138, 95, 0, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#fa8c16',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>高峰</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
                      {e.electricity.peak}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 6,
                      padding: '8px 10px',
                      boxShadow: '0 1px 2px rgba(138, 95, 0, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#faad14',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>平段</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
                      {e.electricity.flat}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 6,
                      padding: '8px 10px',
                      boxShadow: '0 1px 2px rgba(138, 95, 0, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#52c41a',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>低谷</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
                      {e.electricity.valley}
                    </div>
                  </div>
                  {e.electricity.sharp !== undefined && (
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: 6,
                        padding: '8px 10px',
                        boxShadow: '0 1px 2px rgba(138, 95, 0, 0.08)',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#cf1322',
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>尖峰</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>
                        {e.electricity.sharp}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: '#8c8c8c' }}>
                  峰谷差{' '}
                  <span style={{ color: '#fa8c16', fontWeight: 600 }}>
                    {e.electricity.peakValleyDiff}
                  </span>{' '}
                  元/kWh
                </div>
                {/* 层级 3：时段 + 政策参考 + 备注 */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed #fff3d6',
                      fontSize: 11,
                      color: '#595959',
                      lineHeight: 1.7,
                    }}
                  >
                    {e.electricity.peakHours && <div>峰段：{e.electricity.peakHours}</div>}
                    {e.electricity.flatHours && <div>平段：{e.electricity.flatHours}</div>}
                    {e.electricity.valleyHours && <div>谷段：{e.electricity.valleyHours}</div>}
                    {e.electricity.sharpHours && <div>尖峰段：{e.electricity.sharpHours}</div>}
                    {e.electricity.policyRef && <div>政策参考：{e.electricity.policyRef}</div>}
                    {e.electricity.remark && <div>备注：{e.electricity.remark}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 气：层级 1 默认展开，层级 3 点击展开 */}
            {e.gas && (
              <div
                style={{
                  background: '#fff7fa',
                  border: '1px solid #ffdce8',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginTop: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={14} strokeWidth={1.75} style={{ color: '#eb2f96' }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>工商业天然气</span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>元/Nm³</span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: '#eb2f96' }}
                  >
                    {e.gas.terminalPrice}
                  </span>
                </div>
                {isExpanded && (e.gas.policyRef || e.gas.remark) && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed #ffdce8',
                      fontSize: 11,
                      color: '#595959',
                      lineHeight: 1.7,
                    }}
                  >
                    {e.gas.policyRef && <div>政策参考：{e.gas.policyRef}</div>}
                    {e.gas.remark && <div>备注：{e.gas.remark}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 水：层级 1 默认展开，层级 3 点击展开 */}
            {e.water && (
              <div
                style={{
                  background: '#f0fbff',
                  border: '1px solid #d6f0ff',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginTop: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Droplet size={14} strokeWidth={1.75} style={{ color: '#1677ff' }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>工商业用水</span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>元/m³</span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: '#1677ff' }}
                  >
                    {e.water.composite}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                  基本 {e.water.base} + 污水 {e.water.sewage}
                </div>
                {isExpanded && (e.water.policyRef || e.water.remark) && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed #d6f0ff',
                      fontSize: 11,
                      color: '#595959',
                      lineHeight: 1.7,
                    }}
                  >
                    {e.water.policyRef && <div>政策参考：{e.water.policyRef}</div>}
                    {e.water.remark && <div>备注：{e.water.remark}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 层级 3 展开按钮 */}
            {hasDetail && (
              <button
                type="button"
                onClick={() => toggleExpand(e.id)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: 11,
                  color: '#8c8c8c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} strokeWidth={1.75} />
                    收起详情
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} strokeWidth={1.75} />
                    展开详情（时段 / 政策参考）
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 通用搜索框 ─────────────────────────────────────────

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      prefix={<Search size={14} strokeWidth={1.75} style={{ color: '#bfbfbf' }} />}
      allowClear
      size="small"
      className="kb-search"
    />
  );
}
