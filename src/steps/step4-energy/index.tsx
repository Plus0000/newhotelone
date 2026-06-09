import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Tag, Space, Row, Col, Typography, Divider, Drawer, Tabs, Tooltip } from 'antd';
import { SearchOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatLocation } from '@/data/regions';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { TechInvestment } from '@/shared/stores/projectStore';
import { techEntries } from '@/data/materials';
import { ACCOUNTING_OPTIONS } from './constants';
import EditView from './components/EditView';
import DataAnalysis from './components/DataAnalysis';

const { Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────

interface TechRow {
  key: string;
  techId: string;
  techName: string;
  savingEnergyRun: number;
  savingCostRun: number;
  originalEnergyRun: number;
  originalCostRun: number;
  itemSavingRate: number;
  fixedInvestment: number;
  initialInvestment: number;
  installationCost: number;
  maintenanceSelectedCost: number;
  parentComprehensiveRate: number;
  /** 综合节能率列合并行数：第一行=总行数，其余=0 */
  _csRowSpan: number;
  author: string;
  fillDate: string;
}

interface ProjectItem {
  id: string;
  projectName: string;
  fixedInvestment: number;
  initialInvestment: number;
  installationCost: number;
  maintenanceSelectedCost: number;
  comprehensiveRate: number;
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

/** 主要设备 + 主要材料 选中行小计（初投资） */
function calcSelectedEquipMat(inv: TechInvestment): number {
  return inv.equipment.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0)
    + inv.materials.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

/** 安装与调试 选中行小计 */
function calcSelectedInstallation(inv: TechInvestment): number {
  return inv.installation.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

/** 运营与维护 选中行小计 */
function calcSelectedMaintenance(inv: TechInvestment): number {
  return inv.maintenance.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0);
}

function fmtNum(v: number, digits = 2): string {
  return v.toFixed(digits);
}

// ── Component ──────────────────────────────────────────────────────

export default function Step4Energy() {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);

  const [searchProject, setSearchProject] = useState('');
  const [searchTech, setSearchTech] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);
  const [analysisProjectId, setAnalysisProjectId] = useState<string | null>(null);

  // ── Data ────────────────────────────────────────────────────────

  const allProjects: ProjectItem[] = useMemo(() => {
    return projects
      .filter((p) => {
        const techs = projectsStep3SelectedTechs[p.id];
        return Array.isArray(techs) && techs.length > 0;
      })
      .map((p) => {
        const techIds = projectsStep3SelectedTechs[p.id] ?? [];
        const investments = projectsStep3Data[p.id] ?? {};
        const step4 = projectsStep4Data[p.id];

        const children: Omit<TechRow, 'parentComprehensiveRate' | '_csRowSpan'>[] = techIds.map((techId) => {
          const tech = techEntries.find((t) => t.id === techId);
          const inv = investments[techId];
          const tech4 = step4?.techs?.[techId];

          const fixed = inv ? calcFixed(inv) : 0;
          const initial = inv ? calcSelectedEquipMat(inv) : 0;
          const install = inv ? calcSelectedInstallation(inv) : 0;
          const maint = inv ? calcSelectedMaintenance(inv) : 0;

          return {
            key: `tech-${p.id}-${techId}`,
            techId,
            techName: tech?.name ?? techId,
            savingEnergyRun: tech4?.savingEnergyRun ?? 0,
            savingCostRun: tech4?.savingCostRun ?? 0,
            originalEnergyRun: tech4?.originalEnergyRun ?? 0,
            originalCostRun: tech4?.originalCostRun ?? 0,
            itemSavingRate: tech4?.itemSavingRate ?? 0,
            fixedInvestment: fixed,
            initialInvestment: initial,
            installationCost: install,
            maintenanceSelectedCost: maint,
            author: inv?.author ?? '',
            fillDate: inv?.fillDate ?? '',
          };
        });

        const totalFixed = children.reduce((s, c) => s + c.fixedInvestment, 0);
        const totalInitial = children.reduce((s, c) => s + c.initialInvestment, 0);
        const totalInstall = children.reduce((s, c) => s + c.installationCost, 0);
        const totalMaint = children.reduce((s, c) => s + c.maintenanceSelectedCost, 0);

        // 综合节能率 = (原方案总能耗 - 节能方案总能耗) / 原方案总能耗
        const totalOriginalEnergy = children.reduce((s, c) => s + c.originalEnergyRun, 0);
        const totalSavingEnergy = children.reduce((s, c) => s + c.savingEnergyRun, 0);
        const comprehensiveRate = totalOriginalEnergy > 0 ? (totalOriginalEnergy - totalSavingEnergy) / totalOriginalEnergy : 0;

        // 给每行注入父级综合节能率（用于表格列展示）
        const childrenWithRate = children.map((c, i) => ({
          ...c,
          parentComprehensiveRate: comprehensiveRate,
          _csRowSpan: i === 0 ? children.length : 0,
        }));

        return {
          id: p.id,
          projectName: p.projectName,
          fixedInvestment: totalFixed,
          initialInvestment: totalInitial,
          installationCost: totalInstall,
          maintenanceSelectedCost: totalMaint,
          comprehensiveRate,
          accountingStatus: step4?.accountingStatus ?? 'pending',
          author: step4?.author ?? p.author,
          fillDate: step4?.fillDate ?? p.fillDate,
          children: childrenWithRate,
        };
      });
  }, [projects, projectsStep3SelectedTechs, projectsStep3Data, projectsStep4Data]);

  useEffect(() => {
    if (allProjects.length > 0) {
      setExpandedKeys(new Set(allProjects.map((p) => p.id)));
    }
  }, [allProjects.length]);

  // ── Filters ─────────────────────────────────────────────────────

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (searchProject && !p.projectName.toLowerCase().includes(searchProject.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.accountingStatus !== statusFilter) return false;
      if (rateFilter !== 'all') {
        const threshold = parseFloat(rateFilter);
        if (p.comprehensiveRate < threshold) return false;
      }
      return true;
    });
  }, [allProjects, searchProject, statusFilter, rateFilter]);

  const displayProjects = useMemo(() => {
    if (!searchTech) return filteredProjects;
    return filteredProjects
      .map((p) => ({
        ...p,
        children: p.children.filter((c) => c.techName.toLowerCase().includes(searchTech.toLowerCase())),
      }))
      .filter((p) => p.children.length > 0);
  }, [filteredProjects, searchTech]);

  const resetFilters = useCallback(() => {
    setSearchProject('');
    setSearchTech('');
    setStatusFilter('all');
    setRateFilter('all');
  }, []);

  const handleOpenView = useCallback((projectId: string) => {
    setViewProjectId(projectId);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewProjectId(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Tech Columns ────────────────────────────────────────────────

  const techColumns: ColumnsType<TechRow> = [
    {
      title: '技术名称',
      dataIndex: 'techName',
      key: 'techName',
      width: 220,
      fixed: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (name: string) => <Text strong style={{ fontSize: 13 }}>{name}</Text>,
    },
    {
      title: '原方案',
      key: 'original',
      onHeaderCell: () => ({ style: { background: '#f0f0f0', textAlign: 'center' } }),
      children: [
        {
          title: '运行能耗(万kWh/年)',
          dataIndex: 'originalEnergyRun',
          key: 'originalEnergyRun',
          width: 150,
          onHeaderCell: () => ({ style: { background: '#f7f7f7', borderLeft: '3px solid #bfbfbf', textAlign: 'right' } }),
          onCell: () => ({ style: { borderLeft: '3px solid #e8e8e8', textAlign: 'right' } }),
          render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>,
        },
        {
          title: '运行费用(万元/年)',
          dataIndex: 'originalCostRun',
          key: 'originalCostRun',
          width: 140,
          onHeaderCell: () => ({ style: { background: '#f7f7f7', textAlign: 'right' } }),
          onCell: () => ({ style: { textAlign: 'right' } }),
          render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>,
        },
      ],
    },
    {
      title: '节能方案',
      key: 'saving',
      onHeaderCell: () => ({ style: { background: '#edf7ed', textAlign: 'center' } }),
      children: [
        {
          title: '运行能耗(万kWh/年)',
          dataIndex: 'savingEnergyRun',
          key: 'savingEnergyRun',
          width: 150,
          onHeaderCell: () => ({ style: { background: '#f0faf0', borderLeft: '3px solid #95de64', textAlign: 'right' } }),
          onCell: () => ({ style: { borderLeft: '3px solid #d9f7be', textAlign: 'right' } }),
          render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>,
        },
        {
          title: '运行费用(万元/年)',
          dataIndex: 'savingCostRun',
          key: 'savingCostRun',
          width: 140,
          onHeaderCell: () => ({ style: { background: '#f0faf0', textAlign: 'right' } }),
          onCell: () => ({ style: { textAlign: 'right' } }),
          render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>,
        },
      ],
    },
    {
      title: '节能率',
      key: 'savingRate',
      onHeaderCell: () => ({ style: { background: '#d6e4ff', textAlign: 'center' } }),
      children: [
        {
          title: '分项节能率',
          dataIndex: 'itemSavingRate',
          key: 'itemSavingRate',
          width: 120,
          onHeaderCell: () => ({ style: { background: '#e6f4ff', borderLeft: '3px solid #1677ff', textAlign: 'center' } }),
          onCell: () => ({ style: { background: '#f5f9ff', borderLeft: '3px solid #91caff', textAlign: 'center' } }),
          render: (v: number) => {
            if (v === undefined || v === null) return <Text type="secondary">-</Text>;
            return <span style={{ color: '#22c55e', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(1)}%</span>;
          },
        },
        {
          title: '综合节能率',
          dataIndex: 'parentComprehensiveRate',
          key: 'parentComprehensiveRate',
          width: 130,
          onHeaderCell: () => ({ style: { background: '#e6f4ff', textAlign: 'center' } }),
          onCell: (record: TechRow) => ({
            style: { background: '#f5f9ff', textAlign: 'center', verticalAlign: 'middle' },
            rowSpan: record._csRowSpan,
          }),
          render: (v: number) => {
            if (v === undefined || v === null) return <Text type="secondary">-</Text>;
            return <span style={{ color: '#1677ff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(1)}%</span>;
          },
        },
      ],
    },
    {
      title: '固定投资(万元)',
      dataIndex: 'fixedInvestment',
      key: 'fixedInvestment',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{fmtNum(v)}</span>,
    },
    {
      title: '初投资(万元)',
      dataIndex: 'initialInvestment',
      key: 'initialInvestment',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(v)}</span>,
    },
    {
      title: '安装与调试(万元)',
      dataIndex: 'installationCost',
      key: 'installationCost',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(v)}</span>,
    },
    {
      title: '运营与维护(万元)',
      dataIndex: 'maintenanceSelectedCost',
      key: 'maintenanceSelectedCost',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' } }),
      onCell: () => ({ style: { textAlign: 'right' } }),
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNum(v)}</span>,
    },
    {
      title: '填写人',
      dataIndex: 'author',
      key: 'author',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      title: '填写时间',
      dataIndex: 'fillDate',
      key: 'fillDate',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'left' } }),
      onCell: () => ({ style: { textAlign: 'left' } }),
      render: (v: string) => <span>{v || '-'}</span>,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────

  if (editProjectId) {
    return <EditView projectId={editProjectId} onBack={() => setEditProjectId(null)} />;
  }

  return (
    <>
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
                  style={{ width: 150 }}
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
                  style={{ width: 150 }}
                />
              </div>
            </Col>
                        <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>核算状态</span>
                <Select value={statusFilter} onChange={setStatusFilter} options={ACCOUNTING_OPTIONS} style={{ width: 110 }} />
              </div>
            </Col>
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>综合节能率</span>
                <Select
                  value={rateFilter}
                  onChange={setRateFilter}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '≥10%', value: '10' },
                    { label: '≥20%', value: '20' },
                    { label: '≥30%', value: '30' },
                    { label: '≥40%', value: '40' },
                  ]}
                  style={{ width: 110 }}
                />
              </div>
            </Col>
            <Col>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={resetFilters}>重置</Button>
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              </div>
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>共 {filteredProjects.length} 个项目</Text>
            </Col>
          </Row>
        </Card>

        {/* Project cards with expandable tech rows */}
        {displayProjects.length === 0 ? (
          <Card size="small">
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c', fontSize: 13 }}>
              暂无项目数据，请先在 Step 3 勾选需要分析的技术
            </div>
          </Card>
        ) : (
          displayProjects.map((project) => {
            const expanded = expandedKeys.has(project.id);

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
                    <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>{project.projectName}</Text>
                    <Tag color={project.accountingStatus === 'completed' ? 'success' : 'default'} style={{ fontSize: 11 }}>
                      {project.accountingStatus === 'completed' ? '已核算' : '待核算'}
                    </Tag>
                    <Divider type="vertical" />
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      固定投资 <strong style={{ color: '#1677ff' }}>{fmtNum(project.fixedInvestment)}</strong> 万元
                    </span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      初投资 <strong>{fmtNum(project.initialInvestment)}</strong> 万元
                    </span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      安装与调试 <strong>{fmtNum(project.installationCost)}</strong> 万元
                    </span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      运营与维护 <strong>{fmtNum(project.maintenanceSelectedCost)}</strong> 万元
                    </span>
                  </div>
                }
                extra={
                  <Space size={8}>
                    <Button type="primary" size="small" onClick={() => setEditProjectId(project.id)}>编辑</Button>
                    <Button size="small" onClick={() => handleOpenView(project.id)}>查看</Button>
                    <Button
                      size="small"
                      disabled={!projectsStep4Data[project.id]?.techs || Object.keys(projectsStep4Data[project.id].techs!).length === 0}
                      onClick={() => setAnalysisProjectId(project.id)}
                    >
                      分析
                    </Button>
                  </Space>
                }
              >
                {expanded && (
                  <Table
                    rowKey="key"
                    dataSource={project.children}
                    columns={techColumns}
                    pagination={false}
                    size="small"
                    scroll={{ x: 1530 }}
                    bordered
                    components={{
                      header: {
                        cell: (props: any) => {
                          const cs = props.style || {};
                          return (
                            <th {...props} style={{ ...cs, background: cs.background || '#f0f2f5', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }} />
                          );
                        },
                      },
                      body: {
                        cell: (props: any) => {
                          const cs = props.style || {};
                          return (
                            <td {...props} style={{ ...cs, whiteSpace: 'nowrap' }} />
                          );
                        },
                      },
                    }}
                    locale={{ emptyText: '暂无主要设备相关技术' }}
                  />
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 查看 Drawer */}
      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            {viewProjectId ? (projects.find((p) => p.id === viewProjectId)?.projectName ?? '项目详情') : '项目详情'}
          </Text>
        }
        open={viewProjectId !== null}
        onClose={handleCloseView}
        width={800}
        destroyOnClose
      >
        {viewProjectId && <ViewContent projectId={viewProjectId} onClose={handleCloseView} />}
      </Drawer>

      {/* 分析 Drawer */}
      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            {analysisProjectId ? (projects.find((p) => p.id === analysisProjectId)?.projectName ?? '数据分析') : '数据分析'}
          </Text>
        }
        open={analysisProjectId !== null}
        onClose={() => setAnalysisProjectId(null)}
        width={900}
        destroyOnClose
      >
        {analysisProjectId && <DataAnalysis projectId={analysisProjectId} />}
      </Drawer>
    </>
  );
}

// ── View Content ────────────────────────────────────────────────────────

function ViewContent({ projectId, onClose: _onClose }: { projectId: string; onClose: () => void }) {
  const project = useProjectStore((s) => s.projects).find((p) => p.id === projectId);
  const step4 = useProjectStore((s) => s.projectsStep4Data[projectId]);
  const step2 = useProjectStore((s) => s.projectsStep2Data[projectId]);
  const { Text } = Typography;

  if (!project || !step4) {
    return <Text type="secondary">暂无数据</Text>;
  }

  const locationLabel = project.location?.length ? formatLocation(project.location) : '-';
  const prices = step4.energyPrices;
  const zoneConfigs = step4.zoneConfigs;

  const ZONES = [
    { key: '门诊', label: '门诊', color: '#1677ff' },
    { key: '医技', label: '医技', color: '#2f54eb' },
    { key: '病房', label: '病房', color: '#722ed1' },
    { key: '急诊', label: '急诊', color: '#eb2f2f' },
    { key: '行政', label: '行政', color: '#13c2c2' },
  ];

  const PERIOD_LABELS: Record<string, string> = {
    coolingPeriod: '制冷运行时间段',
    heatingPeriod: '供暖运行时间段',
    lightingPeriod: '照明运行时间段',
    hotWaterPeriod: '生活热水运行时间段',
  };

  // ── 基本信息 ──
  const renderBasicInfo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card size="small" title={<span style={{ fontSize: 14, fontWeight: 600 }}>项目信息</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[40, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>填写人</Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{step4.author || project.author || '-'}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>填写日期</Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{step4.fillDate || project.fillDate || '-'}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', minWidth: 64 }}>所在地</Text>
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{locationLabel}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {prices && (
        <Card size="small" title={<span style={{ fontSize: 14, fontWeight: 600 }}>能源价格</span>}
          style={{ border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: '12px 20px' }}
        >
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#fffff5', borderRadius: 6, border: '1px solid #fff3d6' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>高峰电价（元/kWh）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.peakPrice.toFixed(4)}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#fffff5', borderRadius: 6, border: '1px solid #fff3d6' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>平段电价（元/kWh）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.flatPrice.toFixed(4)}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#fffff5', borderRadius: 6, border: '1px solid #fff3d6' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>低谷电价（元/kWh）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.valleyPrice.toFixed(4)}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#fffff5', borderRadius: 6, border: '1px solid #fff3d6' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>综合电价（元/kWh）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.comprehensivePrice.toFixed(4)}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#fff7fa', borderRadius: 6, border: '1px solid #ffdce8' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>天然气价（元/Nm³）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.gasPrice.toFixed(4)}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', background: '#f0fbff', borderRadius: 6, border: '1px solid #bae7ff' }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>自来水价（元/m³）</Text>
                <Text style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prices.waterPrice.toFixed(4)}</Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );

  // ── 条件设定 ──
  const renderConditionSetting = () => {
    if (!zoneConfigs || Object.keys(zoneConfigs).length === 0) {
      return <Text type="secondary">暂无条件设定数据</Text>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(['coolingPeriod', 'heatingPeriod', 'lightingPeriod', 'hotWaterPeriod'] as const).map((periodKey) => (
          <Card key={periodKey} size="small"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>{PERIOD_LABELS[periodKey]}</span>}
            style={{ border: '1px solid #e8ecf0' }}
            headStyle={{ background: '#fafafa', borderBottom: '1px solid #e8ecf0' }}
            bodyStyle={{ padding: '8px 16px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
              {ZONES.map((zone) => {
                const cfg = zoneConfigs[zone.key]?.[periodKey] as { startDate?: string; endDate?: string; startHour?: number; startMinute?: number; endHour?: number; endMinute?: number; publicHolidayCoeff?: number } | undefined;
                return (
                  <div key={zone.key} style={{
                    padding: '8px 10px',
                    background: '#fafafa',
                    borderRadius: 6,
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: zone.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{zone.key.charAt(0)}</div>
                      <Text style={{ fontSize: 12, fontWeight: 600 }}>{zone.key}</Text>
                    </div>
                    {cfg ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#595959' }}>
                        <Tooltip title={`${cfg.startDate || '-'} ~ ${cfg.endDate || '-'}`}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{cfg.startDate || '-'} ~ {cfg.endDate || '-'}</span>
                        </Tooltip>
                        <Tooltip title={`${String(cfg.startHour ?? 0).padStart(2,'0')}:${String(cfg.startMinute ?? 0).padStart(2,'0')} ~ ${String(cfg.endHour ?? 0).padStart(2,'0')}:${String(cfg.endMinute ?? 0).padStart(2,'0')}`}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{String(cfg.startHour ?? 0).padStart(2,'0')}:{String(cfg.startMinute ?? 0).padStart(2,'0')} ~ {String(cfg.endHour ?? 0).padStart(2,'0')}:{String(cfg.endMinute ?? 0).padStart(2,'0')}</span>
                        </Tooltip>
                        <Tooltip title={`公休系数: ${cfg.publicHolidayCoeff ?? '-'}`}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>公休系数: {cfg.publicHolidayCoeff ?? '-'}</span>
                        </Tooltip>
                      </div>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#bfbfbf' }}>未配置</Text>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // ── 节能计算 ──
  const renderCalculation = () => {
    const techIds = step2 ?? [];
    if (techIds.length === 0) {
      return <Text type="secondary">暂无技术数据</Text>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {techIds.map((techId) => {
          const tech = techEntries.find((t) => t.id === techId);
          const techData = step4.techs?.[techId];
          const equipments = step4.savingEquipments?.[techId] ?? [];

          return (
            <Card key={techId} size="small"
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>{tech?.name ?? techId}</span>}
              style={{ border: '1px solid #e8ecf0' }}
              headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              {techData && (
                <div style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 10]}>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>原方案运行能耗</Text>
                        <div><Text strong style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{techData.originalEnergyRun.toFixed(2)}</Text><Text style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>万kWh/年</Text></div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>原方案运行费用</Text>
                        <div><Text strong style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{techData.originalCostRun.toFixed(2)}</Text><Text style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>万元/年</Text></div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>节能方案运行能耗</Text>
                        <div><Text strong style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{techData.savingEnergyRun.toFixed(2)}</Text><Text style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>万kWh/年</Text></div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>节能方案运行费用</Text>
                        <div><Text strong style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{techData.savingCostRun.toFixed(2)}</Text><Text style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>万元/年</Text></div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>分项节能率</Text>
                        <div><Text strong style={{ fontSize: 14, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>{techData.itemSavingRate.toFixed(1)}%</Text></div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>综合节能率</Text>
                        <div><Text strong style={{ fontSize: 14, color: '#1677ff', fontVariantNumeric: 'tabular-nums' }}>{techData.comprehensiveRate.toFixed(1)}%</Text></div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {equipments.length > 0 && (
                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8, display: 'block' }}>节能方案主要设备</Text>
                  <Table
                    rowKey="id"
                    dataSource={equipments}
                    columns={[
                      { title: '设备名称', dataIndex: 'equipmentName', key: 'equipmentName', width: 140, onHeaderCell: () => ({ style: { textAlign: 'left' } }), onCell: () => ({ style: { textAlign: 'left' } }), render: (v: string) => <span style={{ fontSize: 12 }}>{v || '-'}</span> },
                      { title: '额定功率(kW)', dataIndex: 'ratedPower', key: 'ratedPower', width: 100, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12 }}>{v || '-'}</span> },
                      { title: '台数', dataIndex: 'quantity', key: 'quantity', width: 50, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12 }}>{v || '-'}</span> },
                      { title: '服务对象', dataIndex: 'serviceTargets', key: 'serviceTargets', width: 120, onHeaderCell: () => ({ style: { textAlign: 'left' } }), onCell: () => ({ style: { textAlign: 'left' } }), render: (v: string[]) => <span style={{ fontSize: 12 }}>{(v ?? []).join('、') || '-'}</span> },
                      { title: '运行时长(h/年)', dataIndex: 'operatingHours', key: 'operatingHours', width: 110, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12 }}>{v || '-'}</span> },
                      { title: '同时系数', dataIndex: 'simultaneousCoeff', key: 'simultaneousCoeff', width: 80, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12 }}>{v ?? '-'}</span> },
                      { title: '能耗(万kWh/年)', dataIndex: 'energyConsumption', key: 'energyConsumption', width: 120, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span> },
                      { title: '运行费用(万元/年)', dataIndex: 'operatingCost', key: 'operatingCost', width: 130, onHeaderCell: () => ({ style: { textAlign: 'right' } }), onCell: () => ({ style: { textAlign: 'right' } }), render: (v: number) => <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(2)}</span> },
                    ]}
                    pagination={false}
                    size="small"
                    bordered
                    components={{
                      header: { cell: (props: any) => <th {...props} style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }} /> },
                    }}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs
      items={[
        { key: 'basicInfo', label: '基本信息', children: renderBasicInfo() },
        { key: 'condition', label: '条件设定', children: renderConditionSetting() },
        { key: 'calculation', label: '节能计算', children: renderCalculation() },
      ]}
    />
  );
}
