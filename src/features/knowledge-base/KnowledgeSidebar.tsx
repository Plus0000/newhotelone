import { useState, useRef, useEffect, useMemo } from 'react';
import { Tabs, Tooltip, Input, Empty, Select } from 'antd';
import { BookOpen, FileText, Database, Landmark, Search } from 'lucide-react';
import { standards } from '@/data/standards';
import { policies, subsidies } from '@/data/policies';
import {
  useMergedTechEntries,
  useMergedEquipmentItems,
} from './store';
import './KnowledgeSidebar.css';

type TabKey = 'standards' | 'materials' | 'policies';

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

const TABS: { key: TabKey; label: string; icon: React.ReactNode; tip: string }[] = [
  { key: 'standards', label: '规范标准库', icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} />, tip: '规范标准库' },
  { key: 'materials', label: '系统素材库', icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE} />, tip: '系统素材库' },
  { key: 'policies', label: '政策绿融库', icon: <Landmark size={ICON_SIZE} strokeWidth={ICON_STROKE} />, tip: '政策绿融库' },
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
  local_standard: '地标',
};

export function KnowledgeSidebar() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('standards');
  const [topOffset, setTopOffset] = useState(NAV_HEIGHT);
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

  return (
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
            { key: 'standards', label: '规范', children: <StandardsList /> },
            { key: 'materials', label: '素材', children: <MaterialsList /> },
            { key: 'policies', label: '政策', children: <PoliciesList /> },
          ]}
        />
      </div>
    </div>
  );
}

// ── 规范标准库 ─────────────────────────────────────────

function StandardsList() {
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
        (s) =>
          s.name.toLowerCase().includes(k) ||
          s.code.toLowerCase().includes(k)
      );
    }
    return list;
  }, [q, cat]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索规范名称/编号" />
      <div className="kb-list__filter">
        <Select
          value={cat}
          onChange={setCat}
          size="middle"
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: `全部 (${standards.length})` },
            ...categories,
          ]}
        />
      </div>
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配" />
      ) : (
        data.map((s) => (
          <div key={s.id} className="kb-card kb-card--standard">
            <div className="kb-card__title-row">
              <span className="kb-card__title">{s.name}</span>
              <span className="kb-pill kb-pill--system">预置</span>
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

function MaterialsList() {
  const [sub, setSub] = useState<'tech' | 'equipment'>('tech');
  return (
    <Tabs
      activeKey={sub}
      onChange={(k) => setSub(k as 'tech' | 'equipment')}
      size="small"
      items={[
        { key: 'tech', label: '节能技术', children: <TechList /> },
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

function TechList() {
  const techEntries = useMergedTechEntries();
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return techEntries;
    return techEntries.filter(
      (t) =>
        t.name.toLowerCase().includes(k) ||
        t.advantage.toLowerCase().includes(k)
    );
  }, [q, techEntries]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索技术名称/优势" />
      <div className="kb-list__count">共 {data.length} 项技术</div>
      {data.map((t) => (
        <div key={t.id} className="kb-card kb-card--tech">
          <div className="kb-card__title-row">
            <span className="kb-card__title">{t.name}</span>
            <span className={`kb-pill kb-pill--${t.isSystem ? 'system' : 'mine'}`}>
              {t.isSystem ? '预置' : '我的'}
            </span>
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
      ))}
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
            <span className="kb-card__price">¥{e.price.toLocaleString()}/{e.unit}</span>
          </div>
          <div className="kb-card__desc kb-card__desc--mono">{e.specification}</div>
        </div>
      ))}
    </div>
  );
}

// ── 政策绿融库 ─────────────────────────────────────────

function PoliciesList() {
  const [sub, setSub] = useState<'policy' | 'subsidy'>('policy');
  return (
    <Tabs
      activeKey={sub}
      onChange={(k) => setSub(k as 'policy' | 'subsidy')}
      size="small"
      items={[
        { key: 'policy', label: '政策', children: <PolicyEntries /> },
        { key: 'subsidy', label: '补贴', children: <SubsidyEntries /> },
      ]}
    />
  );
}

const POLICY_CATEGORY_LABEL: Record<string, string> = {
  energy: '能源',
  subsidy: '补贴',
  green_finance: '绿融',
};

const LEVEL_LABEL: Record<string, string> = {
  municipality: '直辖市',
  province: '省级',
  city: '市级',
  district: '区级',
};

function PolicyEntries() {
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return policies;
    return policies.filter(
      (p) =>
        p.region.toLowerCase().includes(k) ||
        p.name.toLowerCase().includes(k) ||
        p.summary.toLowerCase().includes(k)
    );
  }, [q]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索地区/政策名" />
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.map((p) => (
        <div key={p.id} className="kb-card kb-card--policy">
          <div className="kb-card__title-row">
            <span className="kb-card__title">{p.name}</span>
            <span className="kb-pill kb-pill--system">预置</span>
          </div>
          <div className="kb-card__meta">
            <span>{p.region}</span>
            <span className="kb-card__sep">·</span>
            <span>{POLICY_CATEGORY_LABEL[p.category] ?? p.category}</span>
            {p.peakValleyPriceDiff !== undefined && (
              <>
                <span className="kb-card__sep">·</span>
                <span>峰谷价差 {p.peakValleyPriceDiff}元</span>
              </>
            )}
          </div>
          <div className="kb-card__desc">{p.summary}</div>
          {p.url && (
            <a className="kb-card__link" href={p.url} target="_blank" rel="noreferrer">
              查看原文 →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function SubsidyEntries() {
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return subsidies;
    return subsidies.filter(
      (s) => s.region.toLowerCase().includes(k) || s.name.toLowerCase().includes(k)
    );
  }, [q]);

  return (
    <div className="kb-list">
      <SearchBox value={q} onChange={setQ} placeholder="搜索地区/补贴名称" />
      <div className="kb-list__count">共 {data.length} 条</div>
      {data.map((s) => (
        <div key={s.id} className="kb-card kb-card--subsidy">
          <div className="kb-card__title-row">
            <span className="kb-card__title">{s.name}</span>
            <span className="kb-pill kb-pill--system">预置</span>
          </div>
          <div className="kb-card__meta">
            <span>{s.region}</span>
            <span className="kb-card__sep">·</span>
            <span>{LEVEL_LABEL[s.level] ?? s.level}</span>
            <span className="kb-card__sep">·</span>
            <span>{s.subsidyMode === 'investment' ? '投资补贴' : '容量补贴'}</span>
          </div>
          <div className="kb-card__desc">
            {s.subsidyMode === 'investment'
              ? `投资比例 ${s.investmentRatio}%`
              : `${s.subsidyIndex} ${s.subsidyIndexUnit}`}
            <span className="kb-card__sep">·</span>
            依据：{s.policyRef}
          </div>
        </div>
      ))}
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
