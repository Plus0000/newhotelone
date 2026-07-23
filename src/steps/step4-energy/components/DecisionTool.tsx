import { useState, useMemo, useCallback } from 'react';
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
  Drawer,
  InputNumber,
  message,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { DecisionProjectData } from '@/shared/stores/projectStore';
import {
  DECISION_INVESTMENT_MODE_OPTIONS,
  DECISION_INVESTMENT_MODE_LABEL,
  DECISION_ACCOUNTING_OPTIONS,
  DECISION_ACCOUNTING_LABEL,
  OPERATING_PERIOD_OPTIONS,
  STATIC_PAYBACK_OPTIONS,
  createDefaultDecisionData,
} from '../constants';

const { Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────────

interface DecisionRow {
  projectId: string;
  projectName: string;
  investmentMode: string;
  operatingPeriod: number;
  avgOperatingIncome: number;
  avgNetProfit: number;
  staticPaybackPeriod: number;
  dynamicPaybackPeriod: number;
  totalInvestmentReturn: number;
  accountingStatus: string;
  author: string;
  fillDate: string;
}

// ── Component ──────────────────────────────────────────────────────────

export default function DecisionTool() {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const saveProjectStep4Data = useProjectStore((s) => s.saveProjectStep4Data);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<number | 'all'>('all');
  const [filterPayback, setFilterPayback] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Drawer
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);

  // ── Table data ──
  const tableData: DecisionRow[] = useMemo(() => {
    return projects
      .filter((p) => {
        const step2 = useProjectStore.getState().projectsStep2Data[p.id];
        return Array.isArray(step2) && step2.length > 0;
      })
      .map((p) => {
        const step4 = projectsStep4Data[p.id];
        const dd = step4?.decisionData;
        return {
          projectId: p.id,
          projectName: p.projectName,
          investmentMode: dd?.investmentMode ?? '',
          operatingPeriod: dd?.operatingPeriod ?? 0,
          avgOperatingIncome: dd?.avgOperatingIncome ?? 0,
          avgNetProfit: dd?.avgNetProfit ?? 0,
          staticPaybackPeriod: dd?.staticPaybackPeriod ?? 0,
          dynamicPaybackPeriod: dd?.dynamicPaybackPeriod ?? 0,
          totalInvestmentReturn: dd?.totalInvestmentReturn ?? 0,
          accountingStatus: dd?.accountingStatus ?? 'pending',
          author: step4?.author || p.author,
          fillDate: step4?.fillDate || p.fillDate,
        };
      });
  }, [projects, projectsStep4Data]);

  // ── Filtered data ──
  const filteredData = useMemo(() => {
    return tableData.filter((r) => {
      if (searchName && !r.projectName.toLowerCase().includes(searchName.toLowerCase()))
        return false;
      if (filterMode !== 'all' && r.investmentMode !== filterMode) return false;
      if (filterPeriod !== 'all' && r.operatingPeriod !== filterPeriod) return false;
      if (filterPayback !== 'all' && r.staticPaybackPeriod !== filterPayback) return false;
      if (filterStatus !== 'all' && r.accountingStatus !== filterStatus) return false;
      return true;
    });
  }, [tableData, searchName, filterMode, filterPeriod, filterPayback, filterStatus]);

  const resetFilters = useCallback(() => {
    setSearchName('');
    setFilterMode('all');
    setFilterPeriod('all');
    setFilterPayback('all');
    setFilterStatus('all');
  }, []);

  const handleEdit = useCallback((id: string) => setEditProjectId(id), []);
  const handleView = useCallback((id: string) => setViewProjectId(id), []);

  const fmtNum = (v: number, d = 2) => v.toFixed(d);

  // ── Save ──
  const handleSaveDecision = useCallback(
    (projectId: string, data: DecisionProjectData) => {
      const existing = projectsStep4Data[projectId] ?? {
        investmentMode: '' as const,
        custodyYears: 0,
        techs: {},
        accountingStatus: 'pending' as const,
        author: '',
        fillDate: '',
      };
      saveProjectStep4Data(projectId, { ...existing, decisionData: data });
      setEditProjectId(null);
      message.success('保存成功');
    },
    [projectsStep4Data, saveProjectStep4Data],
  );

  // ── Table Columns ──
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      fixed: 'left' as const,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (v: string) => (
        <Text strong style={{ fontSize: 13 }}>
          {v}
        </Text>
      ),
    },
    {
      title: '投资模式',
      dataIndex: 'investmentMode',
      key: 'investmentMode',
      width: 160,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (v: string) => (
        <span style={{ fontSize: 13 }}>{DECISION_INVESTMENT_MODE_LABEL[v] || '-'}</span>
      ),
    },
    {
      title: '运营期',
      key: 'operatingPeriod',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (_: unknown, r: DecisionRow) => (
        <span style={{ fontSize: 13 }}>{r.operatingPeriod ? `${r.operatingPeriod}年` : '-'}</span>
      ),
    },
    {
      title: '年均运营收入(万元)',
      dataIndex: 'avgOperatingIncome',
      key: 'avgOperatingIncome',
      width: 140,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>
      ),
    },
    {
      title: '运营期年均净利润(万元)',
      dataIndex: 'avgNetProfit',
      key: 'avgNetProfit',
      width: 160,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v ? fmtNum(v) : '-'}</span>
      ),
    },
    {
      title: '静态回收期',
      key: 'staticPayback',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (_: unknown, r: DecisionRow) => (
        <span style={{ fontSize: 13 }}>
          {r.staticPaybackPeriod ? `${r.staticPaybackPeriod}年` : '-'}
        </span>
      ),
    },
    {
      title: '动态回收期',
      key: 'dynamicPayback',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (_: unknown, r: DecisionRow) => (
        <span style={{ fontSize: 13 }}>
          {r.dynamicPaybackPeriod ? `${r.dynamicPaybackPeriod}年` : '-'}
        </span>
      ),
    },
    {
      title: '总投资收益率',
      dataIndex: 'totalInvestmentReturn',
      key: 'totalInvestmentReturn',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: v > 0 ? '#52c41a' : '#595959' }}>
          {v ? `${v.toFixed(1)}%` : '-'}
        </span>
      ),
    },
    {
      title: '核算状态',
      dataIndex: 'accountingStatus',
      key: 'accountingStatus',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      onCell: () => ({ style: { textAlign: 'center' as const } }),
      render: (v: string) => (
        <Tag
          color={v === 'completed' ? 'success' : v === 'reported' ? 'blue' : 'default'}
          style={{ fontSize: 11 }}
        >
          {DECISION_ACCOUNTING_LABEL[v] || '待核算'}
        </Tag>
      ),
    },
    {
      title: '填写人',
      dataIndex: 'author',
      key: 'author',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (v: string) => <span style={{ fontSize: 13 }}>{v || '-'}</span>,
    },
    {
      title: '填写时间',
      dataIndex: 'fillDate',
      key: 'fillDate',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (v: string) => <span style={{ fontSize: 13 }}>{v || '-'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      onCell: () => ({ style: { textAlign: 'center' as const } }),
      render: (_: unknown, r: DecisionRow) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(r.projectId)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleView(r.projectId)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选区 */}
      <Card
        size="small"
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
                项目名称
              </span>
              <Input
                placeholder="请输入"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                allowClear
                style={{ width: 150 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                投资模式
              </span>
              <Select
                value={filterMode}
                onChange={setFilterMode}
                options={[{ label: '全部', value: 'all' }, ...DECISION_INVESTMENT_MODE_OPTIONS]}
                style={{ width: 170 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                运营期
              </span>
              <Select
                value={filterPeriod}
                onChange={setFilterPeriod}
                options={[{ label: '全部', value: 'all' }, ...OPERATING_PERIOD_OPTIONS]}
                style={{ width: 100 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                静态回收期
              </span>
              <Select
                value={filterPayback}
                onChange={setFilterPayback}
                options={[{ label: '全部', value: 'all' }, ...STATIC_PAYBACK_OPTIONS]}
                style={{ width: 100 }}
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
                value={filterStatus}
                onChange={setFilterStatus}
                options={DECISION_ACCOUNTING_OPTIONS}
                style={{ width: 110 }}
              />
            </div>
          </Col>
          <Col>
            <Space>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card
        size="small"
        style={{ border: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '4px 16px 16px' }}
      >
        <Table
          rowKey="projectId"
          dataSource={filteredData}
          columns={columns}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1600 }}
          locale={{ emptyText: '暂无项目数据' }}
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
        />
      </Card>

      {/* 编辑 Drawer */}
      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            投资计算 - {projects.find((p) => p.id === editProjectId)?.projectName ?? ''}
          </Text>
        }
        open={editProjectId !== null}
        onClose={() => setEditProjectId(null)}
        width={640}
        destroyOnClose
      >
        {editProjectId && (
          <DecisionEditForm
            projectId={editProjectId}
            onSave={(data) => handleSaveDecision(editProjectId, data)}
            onCancel={() => setEditProjectId(null)}
          />
        )}
      </Drawer>

      {/* 查看 Drawer */}
      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            投资数据 - {projects.find((p) => p.id === viewProjectId)?.projectName ?? ''}
          </Text>
        }
        open={viewProjectId !== null}
        onClose={() => setViewProjectId(null)}
        width={640}
        destroyOnClose
      >
        {viewProjectId && <DecisionViewContent projectId={viewProjectId} />}
      </Drawer>
    </div>
  );
}

// ── Edit Form ──────────────────────────────────────────────────────────

function DecisionEditForm({
  projectId,
  onSave,
  onCancel,
}: {
  projectId: string;
  onSave: (data: DecisionProjectData) => void;
  onCancel: () => void;
}) {
  const step4 = useProjectStore((s) => s.projectsStep4Data[projectId]);

  const [form, setForm] = useState<DecisionProjectData>(
    step4?.decisionData ?? (createDefaultDecisionData() as DecisionProjectData),
  );

  const update = (field: keyof DecisionProjectData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#595959',
    whiteSpace: 'nowrap',
    minWidth: 80,
  };
  const valueStyle: React.CSSProperties = { width: '100%' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>投资模式</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>投资模式</Text>
              <Select
                value={form.investmentMode || undefined}
                onChange={(v) => update('investmentMode', v)}
                options={DECISION_INVESTMENT_MODE_OPTIONS}
                style={{ width: '100%' }}
                placeholder="请选择投资模式"
                variant="filled"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>运营数据</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>运营期</Text>
              <Select
                value={form.operatingPeriod || undefined}
                onChange={(v) => update('operatingPeriod', v)}
                options={OPERATING_PERIOD_OPTIONS}
                style={valueStyle}
                placeholder="请选择"
                variant="filled"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>年均运营收入</Text>
              <InputNumber
                value={form.avgOperatingIncome}
                onChange={(v) => update('avgOperatingIncome', v ?? 0)}
                min={0}
                style={valueStyle}
                variant="filled"
                placeholder="万元"
                size="middle"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>年均净利润</Text>
              <InputNumber
                value={form.avgNetProfit}
                onChange={(v) => update('avgNetProfit', v ?? 0)}
                min={0}
                style={valueStyle}
                variant="filled"
                placeholder="万元"
                size="middle"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>静态回收期</Text>
              <Select
                value={form.staticPaybackPeriod || undefined}
                onChange={(v) => update('staticPaybackPeriod', v)}
                options={STATIC_PAYBACK_OPTIONS}
                style={valueStyle}
                placeholder="请选择"
                variant="filled"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>动态回收期</Text>
              <InputNumber
                value={form.dynamicPaybackPeriod}
                onChange={(v) => update('dynamicPaybackPeriod', v ?? 0)}
                min={0}
                style={valueStyle}
                variant="filled"
                placeholder="年"
                size="middle"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>总投资收益率</Text>
              <InputNumber
                value={form.totalInvestmentReturn}
                onChange={(v) => update('totalInvestmentReturn', v ?? 0)}
                min={0}
                max={100}
                style={valueStyle}
                variant="filled"
                placeholder="%"
                size="middle"
              />
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>%</Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>核算状态</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>核算状态</Text>
              <Select
                value={form.accountingStatus || 'pending'}
                onChange={(v) => update('accountingStatus', v)}
                options={[
                  { label: '待核算', value: 'pending' },
                  { label: '已核算', value: 'completed' },
                  { label: '已出报告', value: 'reported' },
                ]}
                style={valueStyle}
                variant="filled"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          paddingTop: 16,
          borderTop: '1px solid #e8ecf0',
        }}
      >
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={() => onSave(form)}>
          保存
        </Button>
      </div>
    </div>
  );
}

// ── View Content ───────────────────────────────────────────────────────

function DecisionViewContent({ projectId }: { projectId: string }) {
  const step4 = useProjectStore((s) => s.projectsStep4Data[projectId]);
  const dd = step4?.decisionData;

  if (!dd) {
    return <Text type="secondary">暂无数据</Text>;
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#595959',
    whiteSpace: 'nowrap',
    minWidth: 80,
  };
  const dataStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>投资模式</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>投资模式</Text>
              <Text style={dataStyle}>
                {DECISION_INVESTMENT_MODE_LABEL[dd.investmentMode] || '-'}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>运营数据</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>运营期</Text>
              <Text style={dataStyle}>{dd.operatingPeriod ? `${dd.operatingPeriod}年` : '-'}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>年均运营收入</Text>
              <Text style={dataStyle}>
                {dd.avgOperatingIncome ? `${dd.avgOperatingIncome.toFixed(2)}万元` : '-'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>年均净利润</Text>
              <Text style={dataStyle}>
                {dd.avgNetProfit ? `${dd.avgNetProfit.toFixed(2)}万元` : '-'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>静态回收期</Text>
              <Text style={dataStyle}>
                {dd.staticPaybackPeriod ? `${dd.staticPaybackPeriod}年` : '-'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>动态回收期</Text>
              <Text style={dataStyle}>
                {dd.dynamicPaybackPeriod ? `${dd.dynamicPaybackPeriod}年` : '-'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>总投资收益率</Text>
              <Text style={{ ...dataStyle, color: '#52c41a' }}>
                {dd.totalInvestmentReturn ? `${dd.totalInvestmentReturn.toFixed(1)}%` : '-'}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>核算状态</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={labelStyle}>核算状态</Text>
              <Tag
                color={
                  dd.accountingStatus === 'completed'
                    ? 'success'
                    : dd.accountingStatus === 'reported'
                      ? 'blue'
                      : 'default'
                }
              >
                {DECISION_ACCOUNTING_LABEL[dd.accountingStatus] || '待核算'}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
