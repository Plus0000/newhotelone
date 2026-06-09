import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, Table, Input, Select, Button, Tag, Space, Row, Col, Typography, Divider, Checkbox, Steps, Drawer, Tabs } from 'antd';
import { SearchOutlined, CalculatorOutlined, EnvironmentOutlined, CaretDownOutlined, CaretRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { TechInvestment } from '@/shared/stores/projectStore';
import { techEntries, techDefaultInvestments } from '@/data/materials';
import { formatLocation } from '@/data/regions';
import { createDefaultInvestment, calcTotal } from './constants';

import { TechEditBasicInfo } from './components/TechEditBasicInfo';
import { TechInvestmentTable } from './components/TechInvestmentTable';
import { InvestmentSummaryModal } from './components/InvestmentSummaryModal';

const { Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────

interface TechRow {
  key: string;
  techId: string;
  techName: string;
  selected: boolean;
  hasSubsidy: boolean;
  subsidyRate: string;
  fixedInvestment: number;
  initialInvestment: number;
  maintenanceCost: number;
  accountingStatus: 'pending' | 'completed';
  author: string;
  fillDate: string;
  investment: TechInvestment;
  projectId: string;
}

interface ProjectItem {
  id: string;
  projectName: string;
  location: string[];
  totalArea: number;
  totalFixedInvestment: number;
  totalInitialInvestment: number;
  totalMaintenanceCost: number;
  techCount: number;
  accountingStatus: 'pending' | 'completed';
  author: string;
  fillDate: string;
  children: TechRow[];
}

// ── Helpers ────────────────────────────────────────────────────────

function calcInitial(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed') return inv.initialInvestment ?? 0;
  return inv.equipment.reduce((s, r) => s + r.subtotal, 0)
    + inv.materials.reduce((s, r) => s + r.subtotal, 0)
    + inv.installation.reduce((s, r) => s + r.subtotal, 0);
}

function calcMaintenance(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed') return inv.maintenanceCost ?? 0;
  return inv.maintenance.reduce((s, r) => s + r.subtotal, 0);
}

function calcFixed(inv: TechInvestment): number {
  if (inv.accountingStatus === 'completed' && inv.fixedInvestment > 0) {
    return inv.fixedInvestment;
  }
  return calcInitial(inv) + calcMaintenance(inv);
}

/** 将素材库默认数据转换为 InvestmentRow[] */
function toInvestmentRows(techId: string, tab: 'equipment' | 'materials' | 'installation' | 'maintenance'): TechInvestment[typeof tab] {
  const defaults = techDefaultInvestments.find((d) => d.techId === techId);
  const rows = defaults?.[tab] ?? [];
  return rows.map((r) => ({
    id: crypto.randomUUID(),
    name: r.name,
    specification: r.specification,
    quantity: r.quantity,
    unit: r.unit,
    unitPrice: r.unitPrice,
    subtotal: r.quantity * r.unitPrice,
    isMainEquipment: r.isMainEquipment,
    powerKw: r.powerKw,
    remark: r.remark || '',
  }));
}

const INVESTMENT_RANGES = [
  { label: '全部', value: 'all' },
  { label: '<500万元', value: 'lt500' },
  { label: '500~1000万元', value: '500-1000' },
  { label: '1000~2000万元', value: '1000-2000' },
  { label: '≥2000万元', value: 'gte2000' },
];

const ACCOUNTING_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '已核算', value: 'completed' },
  { label: '待核算', value: 'pending' },
];

function matchRange(val: number, range: string): boolean {
  if (range === 'all') return true;
  if (range === 'lt500') return val < 500;
  if (range === '500-1000') return val >= 500 && val < 1000;
  if (range === '1000-2000') return val >= 1000 && val < 2000;
  if (range === 'gte2000') return val >= 2000;
  return true;
}

// ── 编辑视图步骤 ──────────────────────────────────────────────────

type EditViewStep = 'basicInfo' | 'investment';

// ── Component ──────────────────────────────────────────────────────

export default function Step3Twins() {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep2Data = useProjectStore((s) => s.projectsStep2Data);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const saveProjectStep3Data = useProjectStore((s) => s.saveProjectStep3Data);
  const saveProjectStep3SelectedTechs = useProjectStore((s) => s.saveProjectStep3SelectedTechs);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const setStep3Editing = useProjectStore((s) => s.setStep3Editing);
  const step1Data = useProjectStore((s) => s.step1Data);

  const [searchProject, setSearchProject] = useState('');
  const [searchTech, setSearchTech] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [investmentRange, setInvestmentRange] = useState('all');

  const [allSelectedKeys, setAllSelectedKeys] = useState<Set<string>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryProjectId, setSummaryProjectId] = useState<string | null>(null);
  const [summarizedProjectIds, setSummarizedProjectIds] = useState<Set<string>>(new Set());

  // ── 从 store 回填已选中的技术 ─────────────────────────────────────
  // 优先读 Step 3 自己的选中记录，首次进入时回退读 Step 2 的筛选结果
  // 按 projectId 跟踪已初始化项目，避免 useRef(false) 被空数据提前锁定
  const initializedProjects = useRef<Set<string>>(new Set());
  useEffect(() => {
    let changed = false;
    setAllSelectedKeys((prev) => {
      const keys = new Set(prev);

      // Step 3 已有的选中记录
      for (const [projectId, techIds] of Object.entries(projectsStep3SelectedTechs)) {
        if (initializedProjects.current.has(projectId)) continue;
        for (const techId of techIds) {
          keys.add(`tech-${projectId}-${techId}`);
        }
        initializedProjects.current.add(projectId);
        changed = true;
      }

      // 首次进入：Step 3 无记录，回退读 Step 2 筛选结果
      for (const [projectId, techIds] of Object.entries(projectsStep2Data)) {
        if (initializedProjects.current.has(projectId)) continue;
        if (techIds.length === 0) continue;
        for (const techId of techIds) {
          keys.add(`tech-${projectId}-${techId}`);
        }
        initializedProjects.current.add(projectId);
        changed = true;
      }

      return changed ? keys : prev;
    });
  }, [projectsStep3SelectedTechs, projectsStep2Data]);

  // ── 编辑视图状态 ──────────────────────────────────────────────────
  const [editView, setEditView] = useState<{
    open: boolean;
    projectId: string;
    techId: string;
    techName: string;
    techCategory: string;
    editable: boolean;
    step: EditViewStep;
    investment: TechInvestment | null;
  }>({
    open: false,
    projectId: '',
    techId: '',
    techName: '',
    techCategory: '',
    editable: false,
    step: 'basicInfo',
    investment: null,
  });

  // ── 查看 Drawer 状态 ─────────────────────────────────────────────
  const [viewDrawer, setViewDrawer] = useState<{
    open: boolean;
    investment: TechInvestment | null;
    techName: string;
    location: string[];
  }>({
    open: false,
    investment: null,
    techName: '',
    location: [],
  });

  // ── Data ──────────────────────────────────────────────────────────

  const allProjects: ProjectItem[] = useMemo(() => {
    return projects
      .filter((p) => {
        const techs = projectsStep2Data[p.id];
        return Array.isArray(techs) && techs.length > 0;
      })
      .map((p) => {
        const selectedTechIds = new Set(projectsStep2Data[p.id] ?? []);
        const investments = projectsStep3Data[p.id] ?? {};

        const children: TechRow[] = techEntries.map((tech) => {
          const techId = tech.id;
          const isSelected = selectedTechIds.has(techId);
          const inv = investments[techId];
          if (!inv) {
            const defaultInv = createDefaultInvestment(techId, p.id);
            const defaultFixed = calcFixed(defaultInv);
            return {
              key: `tech-${p.id}-${techId}`,
              techId,
              techName: tech.name,
              selected: isSelected,
              hasSubsidy: false,
              subsidyRate: '',
              fixedInvestment: defaultFixed,
              initialInvestment: calcInitial(defaultInv),
              maintenanceCost: calcMaintenance(defaultInv),
              accountingStatus: 'pending' as const,
              author: '',
              fillDate: '',
              investment: defaultInv,
              projectId: p.id,
            };
          }
          const fixed = calcFixed(inv);
          return {
            key: `tech-${p.id}-${techId}`,
            techId,
            techName: tech.name,
            selected: isSelected,
            hasSubsidy: !!inv.subsidyRate,
            subsidyRate: inv.subsidyRate || '',
            fixedInvestment: fixed,
            initialInvestment: calcInitial(inv),
            maintenanceCost: calcMaintenance(inv),
            accountingStatus: inv.accountingStatus ?? 'pending',
            author: inv.author || p.author,
            fillDate: inv.fillDate || p.fillDate,
            investment: inv,
            projectId: p.id,
          };
        });

        return {
          id: p.id,
          projectName: p.projectName,
          location: p.location,
          totalArea: p.totalArea,
          totalFixedInvestment: children.reduce((s, c) => s + c.fixedInvestment, 0),
          totalInitialInvestment: children.reduce((s, c) => s + c.initialInvestment, 0),
          totalMaintenanceCost: children.reduce((s, c) => s + c.maintenanceCost, 0),
          techCount: children.length,
          accountingStatus: children.length > 0 && children.every((c) => c.accountingStatus === 'completed')
            ? 'completed' : 'pending',
          author: p.author,
          fillDate: p.fillDate,
          children,
        };
      });
  }, [projects, projectsStep2Data, projectsStep3Data]);

  useEffect(() => {
    if (allProjects.length > 0) {
      setExpandedKeys(new Set(allProjects.map((p) => p.id)));
    }
  }, [allProjects.length]);

  // ── Persist selected techs to store ──
  useEffect(() => {
    const selectedByProject: Record<string, string[]> = {};
    for (const key of allSelectedKeys) {
      // key = "tech-{projectId}-{techId}"
      const rest = key.slice(5); // remove "tech-"
      const lastHyphen = rest.lastIndexOf('-');
      const projectId = rest.slice(0, lastHyphen);
      const techId = rest.slice(lastHyphen + 1);
      if (!selectedByProject[projectId]) {
        selectedByProject[projectId] = [];
      }
      selectedByProject[projectId].push(techId);
    }
    saveProjectStep3SelectedTechs(selectedByProject);
  }, [allSelectedKeys, saveProjectStep3SelectedTechs]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (searchProject && !p.projectName.toLowerCase().includes(searchProject.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.accountingStatus !== statusFilter) return false;
      if (investmentRange !== 'all' && !matchRange(p.totalFixedInvestment, investmentRange)) return false;
      return true;
    });
  }, [allProjects, searchProject, statusFilter, investmentRange]);

  const displayProjects = useMemo(() => {
    if (!searchTech) return filteredProjects;
    return filteredProjects
      .map((p) => ({
        ...p,
        children: p.children.filter((c) => c.techName.toLowerCase().includes(searchTech.toLowerCase())),
      }))
      .filter((p) => p.children.length > 0);
  }, [filteredProjects, searchTech]);

  const summaryData = useMemo(() => {
    if (!summaryProjectId) return [];
    const project = allProjects.find((p) => p.id === summaryProjectId);
    if (!project) return [];
    return project.children
      .filter((c) => allSelectedKeys.has(c.key))
      .map((c) => ({ ...c.investment, techName: c.techName, projectName: project.projectName }));
  }, [summaryProjectId, allProjects, allSelectedKeys]);

  // ── 编辑处理 ──────────────────────────────────────────────────────

  /** 获取或创建某技术的投资数据（带素材库默认行） */
  const getOrCreateInvestment = useCallback((techId: string, projectId: string): TechInvestment => {
    const investments = projectsStep3Data[projectId] ?? {};
    const existing = investments[techId];
    if (existing) return existing;

    const inv = createDefaultInvestment(techId, projectId);
    // 填充素材库默认数据
    inv.equipment = toInvestmentRows(techId, 'equipment');
    inv.materials = toInvestmentRows(techId, 'materials');
    inv.installation = toInvestmentRows(techId, 'installation');
    inv.maintenance = toInvestmentRows(techId, 'maintenance');
    inv.fixedInvestment = calcTotal(inv.equipment) + calcTotal(inv.materials) + calcTotal(inv.installation) + calcTotal(inv.maintenance);
    return inv;
  }, [projectsStep3Data]);

  const handleOpenEdit = useCallback((techId: string, projectId: string, editable: boolean) => {
    const tech = techEntries.find((t) => t.id === techId);
    const inv = getOrCreateInvestment(techId, projectId);
    const project = projects.find((p) => p.id === projectId);

    setStep3Editing(true);

    setEditView({
      open: true,
      projectId,
      techId,
      techName: tech?.name ?? techId,
      techCategory: tech?.category ?? '',
      editable,
      step: 'basicInfo',
      investment: { ...inv, author: inv.author || project?.author || '', fillDate: inv.fillDate || project?.fillDate || '' },
    });
  }, [getOrCreateInvestment, projects]);

  const handleSaveBasicInfo = useCallback((partial: Partial<TechInvestment>) => {
    if (!editView.investment) return;
    const updated = { ...editView.investment, ...partial };
    // 先保存到 store
    const current = projectsStep3Data[editView.projectId] ?? {};
    const newInvestments = { ...current, [editView.techId]: updated };
    saveProjectStep3Data(editView.projectId, newInvestments);
    // 更新本地编辑状态
    setEditView((prev) => ({ ...prev, investment: updated }));
  }, [editView, projectsStep3Data, saveProjectStep3Data]);

  const handleBasicInfoNext = useCallback(() => {
    setEditView((prev) => ({ ...prev, step: 'investment' }));
  }, []);

  const handleSaveInvestment = useCallback((inv: TechInvestment) => {
    const current = projectsStep3Data[editView.projectId] ?? {};
    const newInvestments = { ...current, [editView.techId]: inv };
    saveProjectStep3Data(editView.projectId, newInvestments);
    setEditView((prev) => ({ ...prev, investment: inv }));
  }, [editView, projectsStep3Data, saveProjectStep3Data]);

  // ── 查看 Drawer 处理 ────────────────────────────────────────────

  const handleOpenView = useCallback((techId: string, projectId: string) => {
    const tech = techEntries.find((t) => t.id === techId);
    const inv = getOrCreateInvestment(techId, projectId);
    const project = projects.find((p) => p.id === projectId);
    const location = project?.location || (step1Data.location as string[]) || [];

    setViewDrawer({
      open: true,
      investment: inv,
      techName: tech?.name ?? techId,
      location,
    });
  }, [getOrCreateInvestment, projects, step1Data.location]);

  const handleCloseView = useCallback(() => {
    setViewDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  const handleBackToTable = useCallback(() => {
    setStep3Editing(false);
    setEditView((prev) => ({
      ...prev,
      open: false,
      step: 'basicInfo',
      investment: null,
    }));
  }, [setStep3Editing]);

  const toggleKey = useCallback((s: Set<string>, k: string) => {
    const next = new Set(s);
    next.has(k) ? next.delete(k) : next.add(k);
    return next;
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedKeys((prev) => toggleKey(prev, id));
  }, [toggleKey]);

  const toggleAllInProject = useCallback((project: ProjectItem) => {
    setAllSelectedKeys((prev) => {
      const next = new Set(prev);
      const allChildKeys = project.children.map((c) => c.key);
      const allSelected = allChildKeys.every((k) => next.has(k));
      if (allSelected) {
        allChildKeys.forEach((k) => next.delete(k));
      } else {
        allChildKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }, []);

  // ── Tech Table Columns ────────────────────────────────────────────

  const techColumns: ColumnsType<TechRow> = [
    {
      title: '技术名称',
      dataIndex: 'techName',
      key: 'techName',
      width: 230,
      fixed: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (name: string) => (
        <Text strong style={{ fontSize: 13 }}>{name}</Text>
      ),
    },
    {
      title: '是否补贴',
      key: 'hasSubsidy',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) =>
        r.hasSubsidy ? <Tag color="blue" style={{ fontSize: 11 }}>是</Tag> : <Text type="secondary">否</Text>,
    },
    {
      title: '补贴额度',
      key: 'subsidyRate',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (_: unknown, r: TechRow) =>
        r.hasSubsidy ? <span style={{ fontSize: 12 }}>{r.subsidyRate}</span> : <Text type="secondary">-</Text>,
    },
    {
      title: '固定投资(万元)',
      dataIndex: 'fixedInvestment',
      key: 'fixedInvestment',
      width: 130,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{v.toFixed(2)}</span>,
    },
    {
      title: '初投资(万元)',
      dataIndex: 'initialInvestment',
      key: 'initialInvestment',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span>,
    },
    {
      title: '运维费(万元)',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span>,
    },
    {
      title: '补贴(万元)',
      key: 'subsidyAmount',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (_: unknown, r: TechRow) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1677ff' }}>{(r.fixedInvestment * 0.3).toFixed(2)}</span>
      ),
    },
    {
      title: '投资指标',
      key: 'investmentIndex',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) => {
        const project = projects.find((p) => p.id === r.projectId);
        const area = project?.totalArea || 0;
        const val = area > 0 ? r.fixedInvestment / area : 0;
        return <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{val.toFixed(4)}</span>;
      },
    },
    {
      title: '填写人',
      dataIndex: 'author',
      key: 'author',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (v: string) => v || '-',
    },
    {
      title: '填写时间',
      dataIndex: 'fillDate',
      key: 'fillDate',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v || '-'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleOpenEdit(r.techId, r.projectId, true)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleOpenView(r.techId, r.projectId)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // ── 编辑视图渲染 ──────────────────────────────────────────────────

  if (editView.open && editView.investment) {
    const project = projects.find((p) => p.id === editView.projectId);
    const location = project?.location || (step1Data.location as string[]) || [];

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* 第一行：返回按钮 + 技术名称 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToTable}
            style={{ color: '#1677ff', padding: '4px 8px' }}
          >
            返回总表
          </Button>
          <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
          <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{editView.techName}</Text>
        </div>

        {/* 第二行：步骤导航 */}
        <div style={{
          marginBottom: 16,
          padding: '14px 24px',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
        }}>
          <Steps
            current={editView.step === 'basicInfo' ? 0 : 1}
            size="small"
            style={{ maxWidth: 500, margin: '0 auto' }}
            items={[
              {
                title: <span style={{
                  fontSize: 13,
                  color: editView.step === 'basicInfo' ? '#1677ff' : '#1a1a1a',
                  fontWeight: editView.step === 'basicInfo' ? 600 : 400,
                }}>基本信息</span>,
              },
              {
                title: <span style={{
                  fontSize: 13,
                  color: editView.step !== 'basicInfo' ? '#1677ff' : '#8c8c8c',
                  fontWeight: editView.step !== 'basicInfo' ? 600 : 400,
                }}>单项技术固定投资计算表</span>,
              },
            ]}
          />
        </div>

        {/* 子步骤内容 */}
        {editView.step === 'basicInfo' ? (
          <TechEditBasicInfo
            investment={editView.investment}
            location={location}
            editable={editView.editable}
            onSave={handleSaveBasicInfo}
            onNext={handleBasicInfoNext}
          />
        ) : (
          <TechInvestmentTable
            investment={editView.investment}
            techName={editView.techName}
            editable={editView.editable}
            onSave={handleSaveInvestment}
            onBack={handleBackToTable}
          />
        )}
      </div>
    );
  }

  // ── 总表视图渲染 ──────────────────────────────────────────────────

  return (
    <div>
      {/* Filter bar */}
      <Card
        style={{
          marginBottom: 16,
          border: '1px solid #e8ecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[20, 12]} align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>项目名称</span>
              <Input
                placeholder="请输入"
                prefix={<SearchOutlined />}
                value={searchProject}
                onChange={(e) => setSearchProject(e.target.value)}
                allowClear
                style={{ width: 170 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>技术名称</span>
              <Input
                placeholder="请输入"
                prefix={<SearchOutlined />}
                value={searchTech}
                onChange={(e) => setSearchTech(e.target.value)}
                allowClear
                style={{ width: 170 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>核算状态</span>
              <Select value={statusFilter} onChange={setStatusFilter} options={ACCOUNTING_OPTIONS} placeholder="请选择" allowClear style={{ width: 120 }} />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>总固定投资</span>
              <Select value={investmentRange} onChange={setInvestmentRange} options={INVESTMENT_RANGES} placeholder="请选择" allowClear style={{ width: 140 }} />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={() => { setSearchProject(''); setSearchTech(''); setStatusFilter('all'); setInvestmentRange('all'); }}
              >
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            </div>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>共 {filteredProjects.length} 个项目</Text>
          </Col>
        </Row>
      </Card>

      {/* Project cards */}
      {displayProjects.length === 0 ? (
        <Card size="small">
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c', fontSize: 13 }}>
            暂无项目数据，请先在 Step 2 为项目选择节能技术
          </div>
        </Card>
      ) : (
        displayProjects.map((project) => {
          const expanded = expandedKeys.has(project.id);
          const childKeys = project.children.map((c) => c.key);
          const allChildrenSelected = childKeys.length > 0 && childKeys.every((k) => allSelectedKeys.has(k));
          const someChildrenSelected = childKeys.some((k) => allSelectedKeys.has(k));
          const indeterminate = someChildrenSelected && !allChildrenSelected;
          const techsInCard = project.children;

          return (
            <Card
              key={project.id}
              size="small"
              style={{
                marginBottom: 16,
                overflow: 'hidden',
                border: '1px solid #e8ecf0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              headStyle={{ background: '#f0f5ff', padding: '14px 20px' }}
              bodyStyle={{ background: '#fafafa', padding: '12px 20px 16px' }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Button
                    type="text"
                    size="small"
                    icon={expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                    onClick={() => toggleExpand(project.id)}
                    style={{ color: '#595959' }}
                  />
                  <Checkbox
                    checked={allChildrenSelected}
                    indeterminate={indeterminate}
                    onChange={() => toggleAllInProject(project)}
                  />
                  <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>{project.projectName}</Text>
                  <Tag color={project.accountingStatus === 'completed' || summarizedProjectIds.has(project.id) ? 'success' : 'default'} style={{ fontSize: 11 }}>
                    {project.accountingStatus === 'completed' || summarizedProjectIds.has(project.id) ? '已核算' : '待核算'}
                  </Tag>
                  <Divider type="vertical" />
                  <Space size={4} style={{ fontSize: 12, color: '#8c8c8c' }}>
                    <EnvironmentOutlined />
                    <span>{formatLocation(project.location) || '-'}</span>
                  </Space>
                  <Divider type="vertical" />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    总固定投资 <strong style={{ color: '#1677ff' }}>{project.totalFixedInvestment.toFixed(2)}</strong> 万元
                  </span>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    总初投资 <strong>{project.totalInitialInvestment.toFixed(2)}</strong> 万元
                  </span>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    总运维费 <strong>{project.totalMaintenanceCost.toFixed(2)}</strong> 万元
                  </span>
                </div>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<CalculatorOutlined />}
                  disabled={!someChildrenSelected}
                  onClick={() => {
                    setSummarizedProjectIds((prev) => new Set(prev).add(project.id));
                    setSummaryProjectId(project.id);
                    setSummaryOpen(true);
                  }}
                >
                  概算汇总
                </Button>
              }
            >
              {expanded && (
                <Table
                  rowKey="key"
                  dataSource={techsInCard}
                  columns={techColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 1500 }}
                  bordered
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
                  rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys: childKeys.filter((k) => allSelectedKeys.has(k)),
                    onChange: (keys) => {
                      const next = new Set(allSelectedKeys);
                      childKeys.forEach((k) => {
                        (keys as string[]).includes(k) ? next.add(k) : next.delete(k);
                      });
                      setAllSelectedKeys(next);
                    },
                  }}
                  locale={{ emptyText: '暂无匹配的技术' }}
                />
              )}
            </Card>
          );
        })
      )}

      {/* Summary modal */}
      <InvestmentSummaryModal
        open={summaryOpen}
        investments={summaryData}
        onClose={() => { setSummaryOpen(false); setSummaryProjectId(null); }}
      />

      {/* 查看 Drawer */}
      <Drawer
        title={<Text strong style={{ fontSize: 16 }}>{viewDrawer.techName}</Text>}
        open={viewDrawer.open}
        onClose={handleCloseView}
        width={960}
        destroyOnClose
      >
        {viewDrawer.investment && (
          <Tabs
            items={[
              {
                key: 'basicInfo',
                label: '基本信息',
                children: (
                  <TechEditBasicInfo
                    investment={viewDrawer.investment}
                    location={viewDrawer.location}
                    editable={false}
                    onSave={() => {}}
                    onNext={() => {}}
                  />
                ),
              },
              {
                key: 'investment',
                label: '单项技术固定投资计算表',
                children: (
                  <TechInvestmentTable
                    investment={viewDrawer.investment}
                    techName={viewDrawer.techName}
                    editable={false}
                    hideFooter
                    onSave={() => {}}
                    onBack={handleCloseView}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
