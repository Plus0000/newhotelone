import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Typography,
  InputNumber,
  message,
  Tabs,
  Progress,
  Empty,
  Input,
  Select,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  DollarOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useProjectStore } from '@/shared/stores/projectStore';
import { StableInputNumber } from '@/shared/components/StableInputNumber';
import type {
  DecisionProjectData,
  DecisionCalculationResults,
  CalcSummaryRow,
  CalcLoanScheduleRow,
  CalcTotalCostRow,
  CalcProfitRow,
  CalcCashflowRow,
} from '@/shared/stores/projectStore';
import { createDefaultDecisionData } from '@/steps/step4-energy/constants';
import {
  calcFixedFromSelected,
  calcInitialFromSelected,
  calcInstallationFromSelected,
} from '@/shared/utils/investment';
import { financialCalculate, calcInvestmentScore } from './utils/financialCalculate';
import type { ScoreResult } from './utils/financialCalculate';
import ReportView from './report/ReportView';

const { Text } = Typography;

// ── Main Component ───────────────────────────────────────────────────

export default function Step5Decision() {
  const projectId = useProjectStore((s) => s.projectId);
  const projects = useProjectStore((s) => s.projects);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const saveProjectStep4Data = useProjectStore((s) => s.saveProjectStep4Data);
  const setStep5Editing = useProjectStore((s) => s.setStep5Editing);

  const [calcResults, setCalcResults] = useState<DecisionCalculationResults | null>(null);

  // Step5 全程沉浸编辑模式 —— 隐藏 StepperContainer 底栏
  useEffect(() => {
    setStep5Editing(true);
    return () => setStep5Editing(false);
  }, [setStep5Editing]);

  const handleSave = useCallback(
    (pid: string, data: DecisionProjectData) => {
      const existing = projectsStep4Data[pid] ?? {
        investmentMode: '' as const,
        custodyYears: 0,
        techs: {},
        accountingStatus: 'pending' as const,
        author: '',
        fillDate: '',
      };
      saveProjectStep4Data(pid, { ...existing, decisionData: data });
      message.success('保存成功');
    },
    [projectsStep4Data, saveProjectStep4Data],
  );

  const handleCalculate = useCallback(
    (pid: string, data: DecisionProjectData) => {
      try {
        const results = financialCalculate(data);
        const step4ProjectData = projectsStep4Data[pid];
        const techValues = Object.values(step4ProjectData?.techs ?? {});
        results.comprehensiveRate = techValues.length > 0 ? techValues[0].comprehensiveRate : 0;
        setCalcResults(results);
        const updated: DecisionProjectData = {
          ...data,
          calculationResults: results,
          avgOperatingIncome: results.annualAvgProfit,
          avgNetProfit: results.annualAvgNetProfit,
          staticPaybackPeriod: results.staticPayback,
          dynamicPaybackPeriod: results.dynamicPayback,
          totalInvestmentReturn: results.roi,
          accountingStatus: 'completed',
        };
        const existing = projectsStep4Data[pid] ?? {
          investmentMode: '' as const,
          custodyYears: 0,
          techs: {},
          accountingStatus: 'pending' as const,
          author: '',
          fillDate: '',
        };
        saveProjectStep4Data(pid, { ...existing, decisionData: updated });
        message.success('计算完成');
      } catch {
        message.error('计算异常，请检查输入数据');
      }
    },
    [projectsStep4Data, saveProjectStep4Data],
  );

  if (!projectId) {
    return (
      <div style={{ padding: '60px 0' }}>
        <Empty description="未选择项目" />
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div style={{ padding: '60px 0' }}>
        <Empty description="项目不存在" />
      </div>
    );
  }

  return (
    <DecisionEditView
      projectId={projectId}
      projectName={project.projectName}
      onSave={(data) => handleSave(projectId, data)}
      onCalculate={(data) => handleCalculate(projectId, data)}
      calculatedResults={calcResults}
    />
  );
}

// ── Edit View ────────────────────────────────────────────────────────

function DecisionEditView({
  projectId,
  projectName,
  onSave,
  onCalculate,
  calculatedResults,
}: {
  projectId: string;
  projectName: string;
  onSave: (data: DecisionProjectData) => void;
  onCalculate: (data: DecisionProjectData) => void;
  calculatedResults: DecisionCalculationResults | null;
}) {
  const projects = useProjectStore((s) => s.projects);
  const step4 = useProjectStore((s) => s.projectsStep4Data[projectId]);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const saveProjectStep4Data = useProjectStore((s) => s.saveProjectStep4Data);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const setFlatStepIndex = useProjectStore((s) => s.setFlatStepIndex);

  const existing = step4?.decisionData;

  // Build auto-fill data from Step 3 + Step 4
  const autoFill = useMemo(() => {
    let techIds = projectsStep3SelectedTechs[projectId] ?? [];
    // Fallback: use Step 4 tech keys when selectedTechs is empty
    if (techIds.length === 0 && step4?.techs) {
      techIds = Object.keys(step4.techs);
    }
    const investments = projectsStep3Data[projectId] ?? {};
    const step4Data = step4;

    let totalFixed = 0;
    let totalInitial = 0;
    let totalInstall = 0;
    let totalMaintenance = 0;
    let totalRepair = 0;
    let totalLabor = 0;
    let totalEnergyCost = 0;
    let totalAnnualSaving = 0;

    for (const techId of techIds) {
      const inv = investments[techId];
      if (!inv) continue;
      totalFixed += calcFixedFromSelected(inv);
      totalInitial += calcInitialFromSelected(inv);
      totalInstall += calcInstallationFromSelected(inv);
      // Split maintenance by costType - 用实时行数据，避免与 calcMaintenanceFromSelected 持久化值不一致
      for (const row of inv.maintenance) {
        if (row.selected === false) continue;
        if (row.costType === 'labor') {
          totalLabor += row.subtotal;
        } else {
          totalRepair += row.subtotal;
        }
      }
    }
    // maintenanceCost = repair + labor（与 financialCalculate 口径一致，不含 admin）
    totalMaintenance = totalRepair + totalLabor;

    // Energy cost & saving from Step 4
    if (step4Data?.techs) {
      for (const techId of techIds) {
        const t4 = step4Data.techs[techId];
        if (t4) {
          totalEnergyCost += t4.savingCostRun ?? 0;
          totalAnnualSaving += (t4.originalCostRun ?? 0) - (t4.savingCostRun ?? 0);
        }
      }
    }

    return {
      totalFixedInvestment: totalFixed,
      initialInvestment: totalInitial,
      installationCost: totalInstall,
      maintenanceCost: totalMaintenance,
      energyCost: totalEnergyCost,
      annualEnergySaving: totalAnnualSaving,
      repairCost: totalRepair,
      laborCost: totalLabor,
      adminCost: Math.round(totalLabor * 0.05 * 100) / 100,
      // From Step 1 / project (fallback if decisionData has no author/fillDate)
      author: step4?.author ?? '',
      fillDate: step4?.fillDate ?? '',
    };
  }, [projectId, projectsStep3SelectedTechs, projectsStep3Data, step4]);

  const project = projects.find((p) => p.id === projectId);

  const [form, setForm] = useState<DecisionProjectData>(() => ({
    ...(createDefaultDecisionData() as DecisionProjectData),
    ...existing,
    ...autoFill,
  }));

  // Re-sync autoFill when entering (but don't overwrite user edits after initial load)
  const [autoFillApplied, setAutoFillApplied] = useState(false);
  useEffect(() => {
    if (!autoFillApplied) {
      setForm((prev) => ({ ...prev, ...autoFill }));
      setAutoFillApplied(true);
    }
  }, [autoFill, autoFillApplied]);

  const [showResults, setShowResults] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Show results when calculation results arrive
  useEffect(() => {
    if (calculatedResults) {
      setShowResults(true);
      setShowScore(false);
      setShowReport(false);
    }
  }, [calculatedResults]);

  // Sync calculatedResults into form so buttons and callbacks work
  useEffect(() => {
    if (calculatedResults && !form.calculationResults) {
      setForm((prev) => ({ ...prev, calculationResults: calculatedResults }));
    }
  }, [calculatedResults]);

  const update = (field: keyof DecisionProjectData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalcClick = useCallback(() => {
    onCalculate(form);
  }, [onCalculate, form]);

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#595959',
    whiteSpace: 'nowrap',
    minWidth: 90,
  };
  const valueStyle: React.CSSProperties = { width: '100%' };
  const labelStyleSm: React.CSSProperties = {
    fontSize: 13,
    color: '#595959',
    whiteSpace: 'nowrap',
    minWidth: 72,
  };

  // ── Part A: Investment data items ──
  const investmentItems = [
    {
      label: '总固定投资',
      key: 'totalFixedInvestment' as const,
      desc: '投资成本',
      editable: false,
    },
    { label: '初投资', key: 'initialInvestment' as const, desc: '设备材料', editable: false },
    { label: '安装调试', key: 'installationCost' as const, desc: '', editable: false },
    { label: '运营与维护', key: 'maintenanceCost' as const, desc: '', editable: false },
    { label: '能源费', key: 'energyCost' as const, desc: '水、电、气、暖、汽', editable: false },
    { label: '维保费用', key: 'repairCost' as const, desc: '', editable: false },
    { label: '运维人工费用', key: 'laborCost' as const, desc: '', editable: false },
    { label: '管理费用', key: 'adminCost' as const, desc: '办公、住宿、差旅等', editable: false },
    { label: '年节能收益', key: 'annualEnergySaving' as const, desc: '', editable: false },
  ];

  const colDataItem = { textAlign: 'left' as const, fontSize: 13 };
  const colAmount = { textAlign: 'right' as const, fontSize: 13 };

  const handleReport = useCallback(() => {
    if (!form.calculationResults) return;
    // Update accounting status to 'reported'
    const updated = { ...form, accountingStatus: 'reported' as const };
    setForm(updated);
    const existing = projectsStep4Data[projectId] ?? {
      investmentMode: '' as const,
      custodyYears: 0,
      techs: {},
      accountingStatus: 'pending' as const,
      author: '',
      fillDate: '',
    };
    saveProjectStep4Data(projectId, { ...existing, decisionData: updated });
    setShowReport(true);
  }, [form, projectId, projectsStep4Data, saveProjectStep4Data]);

  // ── 底部按钮 ──
  const bottomButtons = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
        borderTop: '1px solid #e8ecf0',
      }}
    >
      <Button icon={<ArrowLeftOutlined />} onClick={() => setFlatStepIndex(7)}>
        上一步
      </Button>
      <Space>
        <Button onClick={() => onSave(form)}>保存</Button>
        <Button type="primary" ghost onClick={handleCalcClick} loading={false}>
          计算
        </Button>
      </Space>
    </div>
  );

  const investmentColumns: any = [
    {
      title: '数据项',
      dataIndex: 'label',
      key: 'label',
      width: 140,
      onHeaderCell: () => ({ style: { ...colDataItem, background: '#f0f2f5', fontWeight: 600 } }),
      onCell: () => ({ style: colDataItem }),
    },
    {
      title: '金额(含税)（万元）',
      key: 'amount',
      width: 200,
      onHeaderCell: () => ({ style: { ...colAmount, background: '#f0f2f5', fontWeight: 600 } }),
      onCell: () => ({ style: colAmount }),
      render: (_: unknown, item: (typeof investmentItems)[number]) => {
        const val = form[item.key] as number;
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', color: '#595959' }}>
            {val != null ? val.toFixed(2) : '-'}
          </span>
        );
      },
    },
    {
      title: '说明',
      key: 'desc',
      width: 160,
      onHeaderCell: () => ({ style: { ...colDataItem, background: '#f0f2f5', fontWeight: 600 } }),
      onCell: () => ({ style: colDataItem }),
      render: (_: unknown, item: (typeof investmentItems)[number]) => {
        if (item.desc) {
          return (
            <span style={{ fontSize: 12, color: '#8c8c8c', fontStyle: 'italic' }}>{item.desc}</span>
          );
        }
        return null;
      },
    },
  ];

  // ── Conditional Rendering ──
  if (showReport && calculatedResults) {
    const project = projects.find((p) => p.id === projectId);
    return (
      <ReportView
        project={project!}
        step4Data={step4}
        techInvestments={projectsStep3Data[projectId]}
        selectedTechIds={projectsStep3SelectedTechs[projectId]}
        calculationResults={calculatedResults}
        decisionData={form}
        onBack={() => setShowReport(false)}
      />
    );
  }

  if (showScore && calculatedResults) {
    const scoreResult = calcInvestmentScore(calculatedResults);
    return (
      <InvestmentScoreView
        projectName={projectName}
        scoreResult={scoreResult}
        calculationResults={calculatedResults}
        onBack={() => setShowScore(false)}
        onReport={handleReport}
      />
    );
  }

  if (showResults && calculatedResults) {
    return (
      <DecisionResultsView
        projectName={projectName}
        results={calculatedResults}
        decisionData={form}
        onBack={() => setShowResults(false)}
        onScore={() => setShowScore(true)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 项目名称 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{projectName}</Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Part 1: 填写人信息 */}
        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>填写人信息</span>}
          style={{ border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: '12px 20px' }}
        >
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text style={labelStyle}>填写人姓名</Text>
                <Input
                  value={form.author ?? project?.author ?? ''}
                  onChange={(e) => update('author' as any, e.target.value)}
                  style={valueStyle}
                  variant="filled"
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text style={labelStyle}>填写日期</Text>
                <Input
                  value={form.fillDate ?? project?.fillDate ?? ''}
                  onChange={(e) => update('fillDate' as any, e.target.value)}
                  style={valueStyle}
                  variant="filled"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Part 2: 基础投资数据 */}
        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>基础投资数据</span>}
          style={{ border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: '12px 20px' }}
        >
          <Table
            rowKey="key"
            dataSource={investmentItems}
            columns={investmentColumns}
            pagination={false}
            size="middle"
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
                  <td
                    {...props}
                    style={{ ...props.style, whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                  />
                ),
              },
            }}
          />
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
            <Row gutter={[16, 10]}>
              <Col span={8}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{ ...labelStyleSm, minWidth: 80 }}>托管运维收费</Text>
                  <StableInputNumber
                    value={form.custodialOperationFee}
                    onValueChange={(v) => update('custodialOperationFee', v)}
                    min={0}
                    size="middle"
                    style={{ width: '100%' }}
                    variant="filled"
                  />
                  <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                    万元/年
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{ ...labelStyleSm, minWidth: 80 }}>运营期</Text>
                  <StableInputNumber
                    value={form.operatingPeriod}
                    onValueChange={(v) => update('operatingPeriod', v)}
                    min={0}
                    size="middle"
                    style={{ width: '100%' }}
                    variant="filled"
                  />
                  <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>年</Text>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Part 3: 效益测算边界条件 */}
        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>效益测算边界条件</span>}
          style={{ border: '1px solid #e8ecf0' }}
          headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 基础参数 */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 10,
                  paddingLeft: 8,
                  borderLeft: '3px solid #1677ff',
                  lineHeight: '13px',
                }}
              >
                基础参数
              </div>
              <Row gutter={[16, 10]}>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>投资模式</Text>
                    <Select
                      value={form.investmentMode || undefined}
                      onChange={(v) => update('investmentMode', v)}
                      options={[
                        { label: 'EMC', value: 'EMC' },
                        { label: 'BOT', value: 'BOT' },
                      ]}
                      style={{ flex: 1 }}
                      variant="filled"
                      placeholder="请选择"
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>建设期</Text>
                    <InputNumber
                      value={form.constructionMonths}
                      onChange={(v) => update('constructionMonths', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>月</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyle, minWidth: 64 }}>资金比例</Text>
                    <InputNumber
                      value={form.fundingRatio}
                      onChange={(v) => update('fundingRatio', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>%</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyle, minWidth: 64 }}>折旧年限</Text>
                    <InputNumber
                      value={form.depreciationYears}
                      onChange={(v) => update('depreciationYears', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>年</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyle, minWidth: 64 }}>残值率</Text>
                    <InputNumber
                      value={form.residualRate}
                      onChange={(v) => update('residualRate', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>%</Text>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 运营费用 */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 10,
                  paddingLeft: 8,
                  borderLeft: '3px solid #1677ff',
                  lineHeight: '13px',
                }}
              >
                运营费用
              </div>
              <Row gutter={[16, 10]}>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>技术服务费</Text>
                    <InputNumber
                      value={form.techServiceFee}
                      onChange={(v) => update('techServiceFee', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                      万元/年
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>通信费</Text>
                    <InputNumber
                      value={form.telecomFee}
                      onChange={(v) => update('telecomFee', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                      万元/年
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>管理费</Text>
                    <InputNumber
                      value={form.managementFee}
                      onChange={(v) => update('managementFee', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                      万元/年
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>其他税费</Text>
                    <InputNumber
                      value={form.otherTax}
                      onChange={(v) => update('otherTax', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                      万元/年
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 融资参数 */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 10,
                  paddingLeft: 8,
                  borderLeft: '3px solid #1677ff',
                  lineHeight: '13px',
                }}
              >
                融资参数
              </div>
              <Row gutter={[16, 10]}>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>贷款期</Text>
                    <InputNumber
                      value={form.loanPeriod}
                      onChange={(v) => update('loanPeriod', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>年</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>宽限期</Text>
                    <InputNumber
                      value={form.gracePeriod}
                      onChange={(v) => update('gracePeriod', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>年</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>还款期</Text>
                    <InputNumber
                      value={form.repaymentPeriod}
                      onChange={(v) => update('repaymentPeriod', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>年</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 64 }}>贷款利率</Text>
                    <InputNumber
                      value={form.loanRate}
                      onChange={(v) => update('loanRate', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>%</Text>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 利润分成 */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 10,
                  paddingLeft: 8,
                  borderLeft: '3px solid #1677ff',
                  lineHeight: '13px',
                }}
              >
                利润分成
              </div>
              <Row gutter={[16, 10]}>
                <Col span={9}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 80 }}>初始利润分成</Text>
                    <InputNumber
                      value={form.initialProfitShare1}
                      onChange={(v) => update('initialProfitShare1', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ flex: 1 }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>%</Text>
                    <Text style={{ fontSize: 12, color: '#bfbfbf', padding: '0 2px' }}>:</Text>
                    <InputNumber
                      value={form.initialProfitShare2}
                      onChange={(v) => update('initialProfitShare2', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ flex: 1 }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>%</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 80 }}>变更年份</Text>
                    <InputNumber
                      value={form.changeYear}
                      onChange={(v) => update('changeYear', v ?? 0)}
                      min={0}
                      size="middle"
                      style={{ width: '100%' }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                      第N年
                    </Text>
                  </div>
                </Col>
                <Col span={9}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ ...labelStyleSm, minWidth: 80 }}>变更利润分成</Text>
                    <InputNumber
                      value={form.changeProfitShare1}
                      onChange={(v) => update('changeProfitShare1', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ flex: 1 }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>%</Text>
                    <Text style={{ fontSize: 12, color: '#bfbfbf', padding: '0 2px' }}>:</Text>
                    <InputNumber
                      value={form.changeProfitShare2}
                      onChange={(v) => update('changeProfitShare2', v ?? 0)}
                      min={0}
                      max={100}
                      size="middle"
                      style={{ flex: 1 }}
                      variant="filled"
                    />
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>%</Text>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Card>

        {bottomButtons}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DecisionResultsView — 七张计算结果表
// ═══════════════════════════════════════════════════════════════════════

function DecisionResultsView({
  projectName,
  results,
  decisionData,
  onBack,
  onScore,
}: {
  projectName: string;
  results: DecisionCalculationResults;
  decisionData: DecisionProjectData;
  onBack: () => void;
  onScore: () => void;
}) {
  const fmt = (v: number, d = 2) => v.toFixed(d);

  // ── Tab 1: 基础项目数据 ──
  const [activeTab, setActiveTab] = useState('base');
  const investmentItemDefs = [
    { label: '总固定投资', key: 'totalFixedInvestment' as const, desc: '投资成本' },
    { label: '初投资', key: 'initialInvestment' as const, desc: '设备材料' },
    { label: '安装调试', key: 'installationCost' as const, desc: '' },
    { label: '托管运维收费', key: 'custodialOperationFee' as const, desc: '' },
    { label: '运营与维护', key: 'maintenanceCost' as const, desc: '' },
    { label: '能源费', key: 'energyCost' as const, desc: '水、电、气、暖、汽' },
    { label: '维保费用', key: 'repairCost' as const, desc: '' },
    { label: '运维人工费用', key: 'laborCost' as const, desc: '' },
    { label: '管理费用', key: 'adminCost' as const, desc: '办公、住宿、差旅等' },
    { label: '年节能收益', key: 'annualEnergySaving' as const, desc: '' },
    { label: '运营期', key: 'operatingPeriod' as const, desc: '' },
  ];

  const baseColumns = [
    {
      title: '数据项',
      dataIndex: 'label',
      key: 'label',
      width: 160,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '金额(含税)（万元）',
      dataIndex: 'val',
      key: 'val',
      width: 180,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v != null ? fmt(v, 2) : '-'}</span>
      ),
    },
    {
      title: '说明',
      dataIndex: 'desc',
      key: 'desc',
      width: 160,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (v: string) =>
        v ? <span style={{ fontSize: 12, color: '#8c8c8c', fontStyle: 'italic' }}>{v}</span> : null,
    },
  ];

  const baseData = investmentItemDefs.map((item) => ({
    key: item.key,
    label: item.label,
    val: (decisionData as any)[item.key] as number,
    desc: item.desc,
  }));

  // ── Tab 3: 测算边界 ──
  const boundarySections = [
    {
      title: '基础参数',
      items: [
        {
          label: '投资模式',
          value: decisionData.investmentMode
            ? decisionData.investmentMode === 'EMC'
              ? 'EMC'
              : 'BOT'
            : '-',
        },
        { label: '建设期', value: `${decisionData.constructionMonths ?? 0} 月` },
        { label: '资金比例', value: `${decisionData.fundingRatio ?? 0}%` },
        { label: '折旧年限', value: `${decisionData.depreciationYears ?? 0} 年` },
        { label: '残值率', value: `${decisionData.residualRate ?? 0}%` },
      ],
    },
    {
      title: '运营费用',
      items: [
        { label: '技术服务费', value: `${fmt(decisionData.techServiceFee ?? 0)} 万元/年` },
        { label: '通信费', value: `${fmt(decisionData.telecomFee ?? 0)} 万元/年` },
        { label: '管理费', value: `${fmt(decisionData.managementFee ?? 0)} 万元/年` },
        { label: '其他税费', value: `${fmt(decisionData.otherTax ?? 0)} 万元/年` },
      ],
    },
    {
      title: '融资参数',
      items: [
        { label: '贷款期', value: `${decisionData.loanPeriod ?? 0} 年` },
        { label: '宽限期', value: `${decisionData.gracePeriod ?? 0} 年` },
        { label: '还款期', value: `${decisionData.repaymentPeriod ?? 0} 年` },
        { label: '贷款利率', value: `${decisionData.loanRate ?? 0}%` },
      ],
    },
    {
      title: '利润分成',
      items: [
        {
          label: '初始利润分成',
          value: `${decisionData.initialProfitShare1 ?? 0}% : ${decisionData.initialProfitShare2 ?? 0}%`,
        },
        { label: '变更年份', value: `第 ${decisionData.changeYear ?? 0} 年` },
        {
          label: '变更利润分成',
          value: `${decisionData.changeProfitShare1 ?? 0}% : ${decisionData.changeProfitShare2 ?? 0}%`,
        },
      ],
    },
  ];

  const summaryColumns: ColumnsType<CalcSummaryRow> = [
    {
      title: '序号',
      dataIndex: 'seq',
      key: 'seq',
      width: 50,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number | string) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {typeof v === 'number' ? fmt(v, 4) : v || '-'}
        </span>
      ),
    },
    {
      title: '参考值',
      dataIndex: 'referenceValue',
      key: 'referenceValue',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '评价',
      dataIndex: 'evaluation',
      key: 'evaluation',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
  ];

  const loanColumns: ColumnsType<CalcLoanScheduleRow> = [
    {
      title: '年份',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '年初余额',
      dataIndex: 'beginningBalance',
      key: 'beginningBalance',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 2)}</span>
      ),
    },
    {
      title: '本年借款',
      dataIndex: 'newLoan',
      key: 'newLoan',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 2)}</span>
      ),
    },
    {
      title: '应计利息',
      dataIndex: 'accruedInterest',
      key: 'accruedInterest',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 4)}</span>
      ),
    },
    {
      title: '还本',
      dataIndex: 'principalRepayment',
      key: 'principalRepayment',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 4)}</span>
      ),
    },
    {
      title: '付息',
      dataIndex: 'interestPayment',
      key: 'interestPayment',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 4)}</span>
      ),
    },
    {
      title: '期末余额',
      dataIndex: 'endingBalance',
      key: 'endingBalance',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v, 2)}</span>
      ),
    },
  ];

  const costColumns: ColumnsType<CalcTotalCostRow> = [
    {
      title: '年份',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      width: 70,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '能源费',
      dataIndex: 'energyCost',
      key: 'energyCost',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '维保费',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '人工',
      dataIndex: 'laborCost',
      key: 'laborCost',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '管理费',
      dataIndex: 'adminCost',
      key: 'adminCost',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '经营成本',
      dataIndex: 'operatingCost',
      key: 'operatingCost',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '折旧',
      dataIndex: 'depreciation',
      key: 'depreciation',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '利息',
      dataIndex: 'interestExpense',
      key: 'interestExpense',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 4),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => <Text strong>{fmt(v, 2)}</Text>,
    },
  ];

  const profitColumns: ColumnsType<CalcProfitRow> = [
    {
      title: '年份',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      width: 65,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '营业收入',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 4),
    },
    {
      title: '税金及附加',
      dataIndex: 'taxSurcharge',
      key: 'taxSurcharge',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 4),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '补贴',
      dataIndex: 'subsidy',
      key: 'subsidy',
      width: 70,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '利润总额',
      dataIndex: 'profitTotal',
      key: 'profitTotal',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => <Text strong>{fmt(v, 4)}</Text>,
    },
    {
      title: '所得税',
      dataIndex: 'incomeTax',
      key: 'incomeTax',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 4),
    },
    {
      title: '净利润',
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => <Text style={{ color: '#52c41a' }}>{fmt(v, 4)}</Text>,
    },
    {
      title: 'EBITDA',
      dataIndex: 'ebitda',
      key: 'ebitda',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 4),
    },
  ];

  const cfColumns: ColumnsType<CalcCashflowRow> = [
    {
      title: '年份',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      width: 65,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
    },
    {
      title: '现金流入',
      dataIndex: 'cashInflow',
      key: 'cashInflow',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '现金流出',
      dataIndex: 'cashOutflow',
      key: 'cashOutflow',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '净现金流',
      dataIndex: 'netCashflow',
      key: 'netCashflow',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => <Text strong>{fmt(v, 2)}</Text>,
    },
    {
      title: '折现现金流',
      dataIndex: 'discountedCashflow',
      key: 'discountedCashflow',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
    {
      title: '累计折现',
      dataIndex: 'cumulativeDiscounted',
      key: 'cumulativeDiscounted',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'right' as const } }),
      onCell: () => ({ style: { textAlign: 'right' as const } }),
      render: (v: number) => fmt(v, 2),
    },
  ];

  const sharedTableProps = {
    pagination: false as const,
    size: 'small' as const,
    bordered: true as const,
    components: {
      header: {
        cell: (props: any) => (
          <th
            {...props}
            style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 12 }}
          />
        ),
      },
      body: {
        cell: (props: any) => (
          <td
            {...props}
            style={{ ...props.style, whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: 12 }}
          />
        ),
      },
    },
  };

  const tabItems = [
    {
      key: 'base',
      label: '基础项目数据',
      children: (
        <Table
          dataSource={baseData}
          columns={baseColumns}
          rowKey="key"
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 500 }}
          components={{
            header: {
              cell: (props: any) => (
                <th
                  {...props}
                  style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 12 }}
                />
              ),
            },
            body: {
              cell: (props: any) => (
                <td
                  {...props}
                  style={{
                    ...props.style,
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                    fontSize: 12,
                  }}
                />
              ),
            },
          }}
        />
      ),
    },
    {
      key: 'summary',
      label: '经济指标汇总',
      children: (
        <Table
          dataSource={results.summary}
          columns={summaryColumns.map((col) => ({
            ...col,
            onCell: (record: any, rowIndex?: number) => {
              const base = col.onCell ? col.onCell(record, rowIndex)?.style : undefined;
              const highlight = (record as CalcSummaryRow).highlighted
                ? { background: '#fffbe6' }
                : undefined;
              return { style: { ...base, ...highlight } };
            },
          }))}
          rowKey="seq"
          {...sharedTableProps}
          scroll={{ x: 700 }}
          rowClassName={(record) =>
            (record as CalcSummaryRow).highlighted ? 'ant-table-row-highlight' : ''
          }
        />
      ),
    },
    {
      key: 'boundary',
      label: '测算边界',
      children: (
        <div style={{ padding: '8px 4px' }}>
          {boundarySections.map((section) => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 10,
                  paddingLeft: 8,
                  borderLeft: '3px solid #1677ff',
                  lineHeight: '13px',
                }}
              >
                {section.title}
              </div>
              <Row gutter={[16, 8]}>
                {section.items.map((item) => (
                  <Col span={8} key={item.label}>
                    <div
                      style={{
                        display: 'flex',
                        background: '#fafafa',
                        borderRadius: 4,
                        padding: '6px 12px',
                        border: '1px solid #f0f0f0',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: '#595959', minWidth: 80 }}>{item.label}</span>
                      <span style={{ color: '#1a1a1a', fontWeight: 500, marginLeft: 8 }}>
                        {item.value}
                      </span>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'loan',
      label: '借款还本付息表',
      children: (
        <Table
          dataSource={results.loanSchedule}
          columns={loanColumns}
          rowKey="year"
          {...sharedTableProps}
          scroll={{ x: 700 }}
        />
      ),
    },
    {
      key: 'cost',
      label: '总成本费用表',
      children: (
        <Table
          dataSource={results.totalCost}
          columns={costColumns}
          rowKey="year"
          {...sharedTableProps}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'profit',
      label: '利润及利润分配表',
      children: (
        <Table
          dataSource={results.profit}
          columns={profitColumns}
          rowKey="year"
          {...sharedTableProps}
          scroll={{ x: 850 }}
        />
      ),
    },
    {
      key: 'projectCF',
      label: '项目投资现金流量表',
      children: (
        <Table
          dataSource={results.projectCashflow}
          columns={cfColumns}
          rowKey="year"
          {...sharedTableProps}
          scroll={{ x: 700 }}
        />
      ),
    },
  ];

  // ── 每个 Tab 下方展示 4 个代表性指标，随 Tab 切换变化 ──
  const sumBy = <T,>(arr: T[] | undefined, key: keyof T) =>
    (arr ?? []).reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const dd = decisionData as any;

  type TabMetric = { label: string; value: string; unit?: string; tone?: 'good' | 'warn' | 'bad' };
  const tabMetricsMap: Record<string, TabMetric[]> = {
    base: [
      { label: '总固定投资', value: fmt(dd.totalFixedInvestment ?? 0, 2), unit: '万元' },
      { label: '初投资', value: fmt(dd.initialInvestment ?? 0, 2), unit: '万元' },
      { label: '年节能收益', value: fmt(dd.annualEnergySaving ?? 0, 2), unit: '万元/年' },
      { label: '运营期', value: fmt(dd.operatingPeriod ?? 0, 0), unit: '年' },
    ],
    summary: [
      {
        label: 'NPV',
        value: fmt(results.npv, 2),
        unit: '万元',
        tone: results.npv >= 0 ? 'good' : 'bad',
      },
      {
        label: 'IRR(税后)',
        value: fmt(results.irrPostTax, 2),
        unit: '%',
        tone: results.irrPostTax >= 10 ? 'good' : 'warn',
      },
      {
        label: '静态回收期',
        value: fmt(results.staticPayback, 2),
        unit: '年',
        tone: results.staticPayback <= 5 ? 'good' : 'warn',
      },
      {
        label: '投资收益率',
        value: fmt(results.roi, 2),
        unit: '%',
        tone: results.roi >= 15 ? 'good' : 'warn',
      },
    ],
    boundary: [
      {
        label: '投资模式',
        value: decisionData.investmentMode
          ? decisionData.investmentMode === 'EMC'
            ? 'EMC'
            : 'BOT'
          : '-',
      },
      { label: '建设期', value: `${decisionData.constructionMonths ?? 0}`, unit: '月' },
      { label: '资金比例', value: `${decisionData.fundingRatio ?? 0}`, unit: '%' },
      { label: '贷款利率', value: `${decisionData.loanRate ?? 0}`, unit: '%' },
    ],
    loan: [
      { label: '借款总额', value: fmt(sumBy(results.loanSchedule, 'newLoan'), 2), unit: '万元' },
      {
        label: '应计利息合计',
        value: fmt(sumBy(results.loanSchedule, 'accruedInterest'), 2),
        unit: '万元',
      },
      {
        label: '还本合计',
        value: fmt(sumBy(results.loanSchedule, 'principalRepayment'), 2),
        unit: '万元',
      },
      {
        label: '付息合计',
        value: fmt(sumBy(results.loanSchedule, 'interestPayment'), 2),
        unit: '万元',
      },
    ],
    cost: [
      { label: '能源费合计', value: fmt(sumBy(results.totalCost, 'energyCost'), 2), unit: '万元' },
      {
        label: '维保费合计',
        value: fmt(sumBy(results.totalCost, 'maintenanceCost'), 2),
        unit: '万元',
      },
      { label: '折旧合计', value: fmt(sumBy(results.totalCost, 'depreciation'), 2), unit: '万元' },
      { label: '总成本合计', value: fmt(sumBy(results.totalCost, 'totalCost'), 2), unit: '万元' },
    ],
    profit: [
      { label: '营业收入合计', value: fmt(sumBy(results.profit, 'revenue'), 2), unit: '万元' },
      { label: '利润总额合计', value: fmt(sumBy(results.profit, 'profitTotal'), 2), unit: '万元' },
      {
        label: '净利润合计',
        value: fmt(sumBy(results.profit, 'netProfit'), 2),
        unit: '万元',
        tone: 'good',
      },
      { label: '所得税合计', value: fmt(sumBy(results.profit, 'incomeTax'), 2), unit: '万元' },
    ],
    projectCF: [
      {
        label: '现金流入合计',
        value: fmt(sumBy(results.projectCashflow, 'cashInflow'), 2),
        unit: '万元',
      },
      {
        label: '现金流出合计',
        value: fmt(sumBy(results.projectCashflow, 'cashOutflow'), 2),
        unit: '万元',
      },
      {
        label: '净现金流合计',
        value: fmt(sumBy(results.projectCashflow, 'netCashflow'), 2),
        unit: '万元',
      },
      {
        label: '累计折现净额',
        value: fmt((results.projectCashflow ?? []).at(-1)?.cumulativeDiscounted ?? 0, 2),
        unit: '万元',
      },
    ],
  };
  const TONE_COLOR: Record<string, string> = { good: '#52c41a', warn: '#fa8c16', bad: '#ff4d4f' };
  const activeMetrics = tabMetricsMap[activeTab] ?? tabMetricsMap.base;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          {projectName} — 计算结果
        </Text>
      </div>

      <Card
        size="small"
        style={{ border: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '8px 16px' }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 当前表格的代表性指标，随 Tab 切换变化 */}
      <Row gutter={[12, 8]} style={{ marginTop: 12 }}>
        {activeMetrics.map((m) => (
          <Col span={6} key={m.label}>
            <Card
              size="small"
              style={{ textAlign: 'center', border: '1px solid #e8ecf0' }}
              bodyStyle={{ padding: '10px 8px' }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                {m.label}
              </Text>
              <div>
                <Text
                  strong
                  style={{ color: m.tone ? TONE_COLOR[m.tone] : '#1a1a1a', fontSize: 15 }}
                >
                  {m.value}
                </Text>
                {m.unit && <Text style={{ fontSize: 11, color: '#8c8c8c' }}> {m.unit}</Text>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 底部按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #e8ecf0',
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          上一步
        </Button>
        <Button type="primary" icon={<StarOutlined />} onClick={onScore}>
          投资评分建议
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// InvestmentScoreView — 投资评分建议
// ═══════════════════════════════════════════════════════════════════════

function InvestmentScoreView({
  projectName,
  scoreResult,
  calculationResults,
  onBack,
  onReport,
}: {
  projectName: string;
  scoreResult: ScoreResult;
  calculationResults: DecisionCalculationResults;
  onBack: () => void;
  onReport?: () => void;
}) {
  const fmt = (v: number, d = 2) => v.toFixed(d);
  const { dimensions, totalScore, grade, gradeLabel, gradeColor, suggestion } = scoreResult;

  const maxScore = (w: number) => Math.round(w * 100);

  // 根据等级生成优化建议
  const optimizationTips =
    grade === 'A' || grade === 'B'
      ? [
          {
            icon: <ThunderboltOutlined />,
            text: '建议尽早启动项目招标与合同签署，锁定当前有利条件',
          },
          {
            icon: <BarChartOutlined />,
            text: '建立能效监控平台，持续跟踪节能效果，确保达到预期节能率',
          },
          { icon: <DollarOutlined />, text: '关注绿色金融政策补贴申请，进一步降低实际投资成本' },
        ]
      : [
          { icon: <SyncOutlined />, text: '考虑优化技术方案组合，提升综合节能率指标' },
          { icon: <FileTextOutlined />, text: '重新评估投资模式（EMC/BOT），减少初期资金压力' },
          { icon: <DollarOutlined />, text: '关注绿色金融政策补贴申请，进一步降低投资成本' },
          { icon: <ClockCircleOutlined />, text: '可考虑分阶段实施，优先改造回报率最高的子系统' },
        ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          {projectName} — 投资评分建议
        </Text>
      </div>

      {/* 综合评估结果 */}
      <Card
        size="small"
        style={{ border: '1px solid #e8ecf0', marginBottom: 20 }}
        bodyStyle={{ padding: '40px 24px 24px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 56,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          {/* 综合得分 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                position: 'relative',
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}55)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              {/* 光晕 */}
              <div
                style={{
                  position: 'absolute',
                  inset: -12,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${gradeColor}30 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: `1.5px solid ${gradeColor}20`,
                }}
              />
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: `0 2px 12px rgba(0,0,0,0.2)`,
                }}
              >
                {totalScore}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>综合得分</div>
          </div>
          {/* 推荐等级 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                position: 'relative',
                width: 140,
                height: 140,
                borderRadius: '50%',
                background:
                  grade === 'A'
                    ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 60%, #b7eb8f 100%)'
                    : grade === 'B'
                      ? 'linear-gradient(135deg, #1677ff 0%, #4096ff 60%, #91caff 100%)'
                      : grade === 'C'
                        ? 'linear-gradient(135deg, #fa8c16 0%, #ffa940 60%, #ffd591 100%)'
                        : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 60%, #ffa39e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              {/* 光晕 */}
              <div
                style={{
                  position: 'absolute',
                  inset: -12,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${gradeColor}30 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: `1.5px solid ${gradeColor}20`,
                }}
              />
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: `0 2px 12px rgba(0,0,0,0.2)`,
                }}
              >
                {grade}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>推荐等级</div>
          </div>
        </div>

        {/* 各维度得分 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dimensions.map((d) => (
            <div key={d.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: 500, color: '#595959' }}>{d.label}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      d.status === 'good'
                        ? '#52c41a'
                        : d.status === 'warning'
                          ? '#fa8c16'
                          : '#ff4d4f',
                  }}
                >
                  {d.score} 分 / 满分 {maxScore(d.weight)}
                </Text>
              </div>
              <Progress
                percent={d.score}
                strokeColor={
                  d.status === 'good' ? '#52c41a' : d.status === 'warning' ? '#fa8c16' : '#ff4d4f'
                }
                showInfo={false}
                size="small"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 评估维度指标 */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>评估维度指标</span>}
        style={{ border: '1px solid #e8ecf0', marginBottom: 20 }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[16, 12]}>
          <Col span={8}>
            <div
              style={{
                background: '#f6ffed',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #b7eb8f',
              }}
            >
              <Text style={{ fontSize: 12, color: '#52c41a' }}>节能率指标</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>
                {fmt(calculationResults.comprehensiveRate ?? 0, 1)}%
              </div>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>综合节能率</Text>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                background: '#fff7e6',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #ffd591',
              }}
            >
              <Text style={{ fontSize: 12, color: '#fa8c16' }}>投资成本</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>
                {fmt(calculationResults.staticPayback, 1)}年
              </div>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>静态回收期</Text>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                background: '#e6f4ff',
                borderRadius: 6,
                padding: '12px 16px',
                border: '1px solid #91caff',
              }}
            >
              <Text style={{ fontSize: 12, color: '#1677ff' }}>总投资收益率</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>
                {fmt(calculationResults.roi, 1)}%
              </div>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>ROI</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 投资建议 */}
      <Card
        style={{ border: `1px solid ${gradeColor}40`, marginBottom: 16 }}
        bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}
      >
        {/* 推荐横幅 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}dd)`,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {grade}
          </div>
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{gradeLabel}</div>
            <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.6 }}>{suggestion}</div>
          </div>
        </div>
        {/* 优化建议 */}
        <div style={{ padding: '16px 24px', background: '#fafafa' }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#595959',
              display: 'block',
              marginBottom: 12,
            }}
          >
            {grade === 'A' || grade === 'B' ? '行动建议' : '优化建议'}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {optimizationTips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#595959',
                }}
              >
                <span style={{ color: gradeColor, fontSize: 14 }}>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onBack}>返回计算结果</Button>
        {onReport && (
          <Button type="primary" icon={<FileTextOutlined />} onClick={onReport}>
            生成报告
          </Button>
        )}
      </div>
    </div>
  );
}
