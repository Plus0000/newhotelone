import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Steps,
  Drawer,
  Tabs,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { TechInvestment } from '@/shared/stores/projectStore';
import { techDefaultInvestments } from '@/data/materials';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import { formatLocation } from '@/data/regions';
import { createDefaultInvestment } from './constants';
import {
  calcFixedFromAll,
  calcInitialFromAll,
  calcMaintenanceFromAll,
  calcTotal,
} from '@/shared/utils/investment';

import { TechEditBasicInfo } from './components/TechEditBasicInfo';
import { TechInvestmentTable } from './components/TechInvestmentTable';
import { InvestmentSummaryModal } from './components/InvestmentSummaryModal';

const { Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────

interface TechRow {
  key: string;
  techId: string;
  techName: string;
  hasSubsidy: boolean;
  subsidyRate: string;
  fixedInvestment: number;
  initialInvestment: number;
  maintenanceCost: number;
  accountingStatus: 'pending' | 'completed';
  author: string;
  fillDate: string;
  investment: TechInvestment;
}

// ── Helpers ────────────────────────────────────────────────────────

function toInvestmentRows(
  techId: string,
  tab: 'equipment' | 'materials' | 'installation' | 'maintenance',
): TechInvestment[typeof tab] {
  const defaults = techDefaultInvestments.find((d) => d.techId === techId);
  const rows = defaults?.[tab] ?? [];
  return rows.map((r) => ({
    id: crypto.randomUUID(),
    name: r.name,
    ...(r.category ? { category: r.category } : {}),
    specification: r.specification,
    quantity: r.quantity,
    unit: r.unit,
    unitPrice: r.unitPrice,
    subtotal: r.quantity * r.unitPrice,
    isMainEquipment: r.isMainEquipment,
    powerKw: r.powerKw,
    powerUnit: r.powerUnit || (r.powerKw != null && r.powerKw !== 0 ? 'kW' : ''),
    remark: r.remark || '',
    ...(r.costType ? { costType: r.costType } : {}),
    ...(r.maintenanceYears ? { maintenanceYears: r.maintenanceYears } : {}),
    ...(r.totalLifecycleCost ? { totalLifecycleCost: r.totalLifecycleCost } : {}),
  }));
}

const ACCOUNTING_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '已核算', value: 'completed' },
  { label: '待核算', value: 'pending' },
];

type EditViewStep = 'basicInfo' | 'investment';

// ── Component ──────────────────────────────────────────────────────

export default function Step3Twins() {
  const projectId = useProjectStore((s) => s.projectId);
  const projects = useProjectStore((s) => s.projects);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const saveProjectStep3Data = useProjectStore((s) => s.saveProjectStep3Data);
  const saveProjectStep3SelectedTechs = useProjectStore((s) => s.saveProjectStep3SelectedTechs);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const setStep3Editing = useProjectStore((s) => s.setStep3Editing);
  const step1Data = useProjectStore((s) => s.step1Data);
  const techEntries = useMergedTechEntries();

  const [searchTech, setSearchTech] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarized, setSummarized] = useState(false);

  const [editView, setEditView] = useState<{
    open: boolean;
    techId: string;
    techName: string;
    techCategory: string;
    editable: boolean;
    step: EditViewStep;
    investment: TechInvestment | null;
  }>({
    open: false,
    techId: '',
    techName: '',
    techCategory: '',
    editable: false,
    step: 'basicInfo',
    investment: null,
  });

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

  // 当前项目
  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  // 候选池：全量技术，让用户在 Step 3 重新勾选（不继承 Step 2 选择）
  const candidateTechIds = useMemo(() => techEntries.map((t) => t.id), [techEntries]);

  // 首次进入：用 Step3 已存的 selectedTechs 回填，没有则为空（用户重新勾）
  useEffect(() => {
    if (!projectId || initialized) return;
    const saved = projectsStep3SelectedTechs[projectId];
    if (Array.isArray(saved) && saved.length > 0) {
      setSelectedTechIds(saved);
    } else {
      setSelectedTechIds([]);
    }
    setInitialized(true);
  }, [projectId, initialized, projectsStep3SelectedTechs]);

  // 选中变化 → 写回 store（按 projectId 合并）
  useEffect(() => {
    if (!projectId || !initialized) return;
    saveProjectStep3SelectedTechs({
      ...projectsStep3SelectedTechs,
      [projectId]: selectedTechIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechIds, projectId, initialized]);

  // 表格数据：基于候选池（全部技术）
  const allRows: TechRow[] = useMemo(() => {
    if (!projectId) return [];
    const investments = projectsStep3Data[projectId] ?? {};
    return candidateTechIds.map((techId) => {
      const tech = techEntries.find((t) => t.id === techId);
      const inv = investments[techId];
      if (!inv) {
        const defaultInv = createDefaultInvestment(techId, projectId);
        return {
          key: techId,
          techId,
          techName: tech?.name ?? techId,
          hasSubsidy: false,
          subsidyRate: '',
          fixedInvestment: calcFixedFromAll(defaultInv),
          initialInvestment: calcInitialFromAll(defaultInv),
          maintenanceCost: calcMaintenanceFromAll(defaultInv),
          accountingStatus: 'pending' as const,
          author: '',
          fillDate: '',
          investment: defaultInv,
        };
      }
      return {
        key: techId,
        techId,
        techName: tech?.name ?? techId,
        hasSubsidy: !!inv.subsidyRate,
        subsidyRate: inv.subsidyRate || '',
        fixedInvestment: calcFixedFromAll(inv),
        initialInvestment: calcInitialFromAll(inv),
        maintenanceCost: calcMaintenanceFromAll(inv),
        accountingStatus: (() => {
          const fi = calcFixedFromAll(inv);
          const ii = calcInitialFromAll(inv);
          const mc = calcMaintenanceFromAll(inv);
          return fi !== 0 || ii !== 0 || mc !== 0 ? 'completed' : 'pending';
        })(),
        author: inv.author || project?.author || '',
        fillDate: inv.fillDate || project?.fillDate || '',
        investment: inv,
      };
    });
  }, [projectId, candidateTechIds, projectsStep3Data, project, techEntries]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (searchTech && !r.techName.toLowerCase().includes(searchTech.toLowerCase())) return false;
      if (statusFilter !== 'all' && r.accountingStatus !== statusFilter) return false;
      return true;
    });
  }, [allRows, searchTech, statusFilter]);

  // 概算汇总数据：当前项目下被勾选的技术
  const summaryData = useMemo(() => {
    if (!project) return [];
    const selectedSet = new Set(selectedTechIds);
    return allRows
      .filter((r) => selectedSet.has(r.techId))
      .map((r) => ({ ...r.investment, techName: r.techName, projectName: project.projectName }));
  }, [allRows, selectedTechIds, project]);

  // 项目层汇总
  const projectTotals = useMemo(() => {
    const selectedRows = allRows.filter((r) => selectedTechIds.includes(r.techId));
    return {
      fixed: selectedRows.reduce((s, r) => s + r.fixedInvestment, 0),
      initial: selectedRows.reduce((s, r) => s + r.initialInvestment, 0),
      maintenance: selectedRows.reduce((s, r) => s + r.maintenanceCost, 0),
      allCompleted:
        selectedRows.length > 0 && selectedRows.every((r) => r.accountingStatus === 'completed'),
    };
  }, [allRows, selectedTechIds]);

  // ── 编辑处理 ──────────────────────────────────────────────────────

  const getOrCreateInvestment = useCallback(
    (techId: string, pid: string): TechInvestment => {
      const investments = projectsStep3Data[pid] ?? {};
      const existing = investments[techId];
      const allRows = existing
        ? [
            ...existing.equipment,
            ...existing.materials,
            ...existing.installation,
            ...existing.maintenance,
          ]
        : [];
      const totalRows = allRows.length;
      // 旧数据 unitPrice 单位是元（>1000 视为旧单位），新数据是万元 - 重新生成覆盖
      const hasLegacyUnitPrice = allRows.some((r) => r.unitPrice > 1000);
      if (existing && totalRows > 0 && !hasLegacyUnitPrice) return existing;

      const base = existing ?? createDefaultInvestment(techId, pid);
      const inv: TechInvestment = {
        ...base,
        equipment: toInvestmentRows(techId, 'equipment'),
        materials: toInvestmentRows(techId, 'materials'),
        installation: toInvestmentRows(techId, 'installation'),
        maintenance: toInvestmentRows(techId, 'maintenance'),
      };
      inv.initialInvestment =
        calcTotal(inv.equipment) + calcTotal(inv.materials) + calcTotal(inv.installation);
      inv.maintenanceCost = calcTotal(inv.maintenance);
      inv.fixedInvestment = inv.initialInvestment + inv.maintenanceCost;
      return inv;
    },
    [projectsStep3Data],
  );

  const handleOpenEdit = useCallback(
    (techId: string, editable: boolean) => {
      if (!projectId) return;
      const tech = techEntries.find((t) => t.id === techId);
      const inv = getOrCreateInvestment(techId, projectId);
      setStep3Editing(true);
      setEditView({
        open: true,
        techId,
        techName: tech?.name ?? techId,
        techCategory: tech?.category ?? '',
        editable,
        step: 'basicInfo',
        investment: {
          ...inv,
          author: inv.author || project?.author || '',
          fillDate: inv.fillDate || project?.fillDate || '',
        },
      });
    },
    [projectId, getOrCreateInvestment, project, setStep3Editing, techEntries],
  );

  const handleSaveBasicInfo = useCallback(
    (partial: Partial<TechInvestment>) => {
      if (!projectId || !editView.investment) return;
      const updated = { ...editView.investment, ...partial };
      const current = projectsStep3Data[projectId] ?? {};
      saveProjectStep3Data(projectId, { ...current, [editView.techId]: updated });
      setEditView((prev) => ({ ...prev, investment: updated }));
    },
    [projectId, editView, projectsStep3Data, saveProjectStep3Data],
  );

  const handleBasicInfoNext = useCallback(() => {
    setEditView((prev) => ({ ...prev, step: 'investment' }));
  }, []);

  const handleSaveInvestment = useCallback(
    (inv: TechInvestment) => {
      if (!projectId) return;
      const current = projectsStep3Data[projectId] ?? {};
      saveProjectStep3Data(projectId, { ...current, [editView.techId]: inv });
      setEditView((prev) => ({ ...prev, investment: inv }));
    },
    [projectId, editView.techId, projectsStep3Data, saveProjectStep3Data],
  );

  const handleOpenView = useCallback(
    (techId: string) => {
      if (!projectId) return;
      const tech = techEntries.find((t) => t.id === techId);
      const inv = getOrCreateInvestment(techId, projectId);
      const location = project?.location || (step1Data.location as string[]) || [];
      setViewDrawer({
        open: true,
        investment: inv,
        techName: tech?.name ?? techId,
        location,
      });
    },
    [projectId, getOrCreateInvestment, project, step1Data.location, techEntries],
  );

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

  // ── Tech Table Columns ────────────────────────────────────────────

  const techColumns: ColumnsType<TechRow> = [
    {
      title: '技术名称',
      dataIndex: 'techName',
      key: 'techName',
      fixed: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left', whiteSpace: 'normal', minWidth: 180 } }),
      render: (name: string) => (
        <Text strong style={{ fontSize: 13 }}>
          {name}
        </Text>
      ),
    },
    {
      title: '是否补贴',
      key: 'hasSubsidy',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) =>
        r.hasSubsidy ? (
          <Tag color="blue" style={{ fontSize: 11 }}>
            是
          </Tag>
        ) : (
          <Text type="secondary">否</Text>
        ),
    },
    {
      title: '补贴额度',
      key: 'subsidyRate',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (_: unknown, r: TechRow) =>
        r.hasSubsidy ? (
          <span style={{ fontSize: 12 }}>{r.subsidyRate}</span>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '核算状态',
      key: 'accountingStatus',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) =>
        r.accountingStatus === 'completed' ? (
          <Tag color="success" style={{ fontSize: 11 }}>
            已核算
          </Tag>
        ) : (
          <Tag style={{ fontSize: 11 }}>未核算</Tag>
        ),
    },
    {
      title: '固定投资(万元)',
      dataIndex: 'fixedInvestment',
      key: 'fixedInvestment',
      width: 130,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{v.toFixed(2)}</span>
      ),
    },
    {
      title: '初投资(万元)',
      dataIndex: 'initialInvestment',
      key: 'initialInvestment',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span>
      ),
    },
    {
      title: '运维费(万元)',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span>
      ),
    },
    {
      title: '补贴(万元)',
      key: 'subsidyAmount',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (_: unknown, r: TechRow) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1677ff' }}>
          {r.investment.subsidyAmount ? r.investment.subsidyAmount.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      title: '投资指标',
      key: 'investmentIndex',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, r: TechRow) => {
        const area = project?.totalArea || 0;
        const val = area > 0 ? r.fixedInvestment / area : 0;
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {val.toFixed(4)}
          </span>
        );
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
          <Button type="link" size="small" onClick={() => handleOpenEdit(r.techId, true)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleOpenView(r.techId)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // ── 编辑视图渲染 ──────────────────────────────────────────────────

  if (editView.open && editView.investment) {
    const location = project?.location || (step1Data.location as string[]) || [];

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToTable}
            style={{ color: '#1677ff', padding: '4px 8px' }}
          >
            返回总表
          </Button>
          <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
          <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
            {editView.techName}
          </Text>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: '14px 24px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}
        >
          <Steps
            current={editView.step === 'basicInfo' ? 0 : 1}
            size="small"
            style={{ maxWidth: 500, margin: '0 auto' }}
            items={[
              {
                title: (
                  <span
                    style={{
                      fontSize: 13,
                      color: editView.step === 'basicInfo' ? '#1677ff' : '#1a1a1a',
                      fontWeight: editView.step === 'basicInfo' ? 600 : 400,
                    }}
                  >
                    基本信息
                  </span>
                ),
              },
              {
                title: (
                  <span
                    style={{
                      fontSize: 13,
                      color: editView.step !== 'basicInfo' ? '#1677ff' : '#8c8c8c',
                      fontWeight: editView.step !== 'basicInfo' ? 600 : 400,
                    }}
                  >
                    单项技术固定投资计算表
                  </span>
                ),
              },
            ]}
          />
        </div>

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

  if (!project) {
    return (
      <Card>
        <Empty description="未找到当前项目，请返回项目列表重新进入" />
      </Card>
    );
  }

  if (candidateTechIds.length === 0) {
    return (
      <Card>
        <Empty description="暂无可选技术" />
      </Card>
    );
  }

  const accountingStatus = projectTotals.allCompleted || summarized ? 'completed' : 'pending';

  return (
    <div>
      {/* 项目头部信息 */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          border: '1px solid #e8ecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ background: '#f0f5ff', padding: '14px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 15, color: '#1a1a1a' }}>
            {project.projectName}
          </Text>
          <Tag
            color={accountingStatus === 'completed' ? 'success' : 'default'}
            style={{ fontSize: 11 }}
          >
            {accountingStatus === 'completed' ? '已核算' : '待核算'}
          </Tag>
          <Divider type="vertical" />
          <Space size={4} style={{ fontSize: 12, color: '#8c8c8c' }}>
            <EnvironmentOutlined />
            <span>{formatLocation(project.location) || '-'}</span>
          </Space>
          <Divider type="vertical" />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            总固定投资{' '}
            <strong style={{ color: '#1677ff' }}>{projectTotals.fixed.toFixed(2)}</strong> 万元
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            总初投资 <strong>{projectTotals.initial.toFixed(2)}</strong> 万元
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            总运维费 <strong>{projectTotals.maintenance.toFixed(2)}</strong> 万元
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              type="primary"
              size="small"
              icon={<CalculatorOutlined />}
              disabled={selectedTechIds.length === 0}
              onClick={() => {
                setSummarized(true);
                setSummaryOpen(true);
              }}
            >
              概算汇总
            </Button>
          </div>
        </div>
      </Card>

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
              <span
                style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                技术名称
              </span>
              <Input
                placeholder="请输入"
                prefix={<SearchOutlined />}
                value={searchTech}
                onChange={(e) => setSearchTech(e.target.value)}
                allowClear
                style={{ width: 200 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                核算状态
              </span>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={ACCOUNTING_OPTIONS}
                style={{ width: 120 }}
              />
            </div>
          </Col>
          <Col>
            <Button
              onClick={() => {
                setSearchTech('');
                setStatusFilter('all');
              }}
            >
              重置
            </Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              候选 {candidateTechIds.length} 项 / 已选 {selectedTechIds.length} 项
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Tech table */}
      <Card
        size="small"
        style={{
          border: '1px solid #e8ecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="key"
          dataSource={filteredRows}
          columns={techColumns}
          pagination={false}
          size="small"
          scroll={{ x: 1500 }}
          bordered
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
                <td {...props} style={{ whiteSpace: 'nowrap', ...props.style }} />
              ),
            },
          }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedTechIds,
            onChange: (keys) => setSelectedTechIds(keys as string[]),
          }}
          locale={{ emptyText: '暂无匹配的技术' }}
        />
      </Card>

      {/* Summary modal */}
      <InvestmentSummaryModal
        open={summaryOpen}
        investments={summaryData}
        onClose={() => setSummaryOpen(false)}
      />

      {/* 查看 Drawer */}
      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            {viewDrawer.techName}
          </Text>
        }
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
