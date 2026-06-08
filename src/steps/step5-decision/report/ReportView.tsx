import { useMemo } from 'react';
import { Button, Divider, Table, Typography } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  Project, Step4ProjectData, DecisionProjectData,
  DecisionCalculationResults, TechInvestment,
  CalcSummaryRow,
} from '@/shared/stores/projectStore';
import { techEntries } from '@/data/materials';
import type { TechEntry } from '@/data/materials';
import { COAL_FACTOR, CARBON_FACTOR } from '@/steps/step4-energy/components/helpers';
import { useProjectStore } from '@/shared/stores/projectStore';

const { Text } = Typography;

// ── Props ────────────────────────────────────────────────────────────

export interface ReportViewProps {
  project: Project;
  step4Data?: Step4ProjectData;
  techInvestments?: Record<string, TechInvestment>;
  selectedTechIds?: string[];
  calculationResults: DecisionCalculationResults;
  decisionData: DecisionProjectData;
  onBack: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

const fmt = (v: number, d = 2) => v.toFixed(d);
const fmtPct = (v: number, d = 1) => `${fmt(v, d)}%`;

const CATEGORY_LABEL: Record<string, string> = {
  efficiency: '能源高效利用技术',
  intelligent: '智能控制及优化技术',
  renewable: '可再生能源利用技术',
};

const RATING_LABEL: Record<number, string> = {
  1: '★',
  2: '★★',
  3: '★★★',
};

function getTechMap(): Map<string, TechEntry> {
  const map = new Map<string, TechEntry>();
  for (const t of techEntries) map.set(t.id, t);
  return map;
}

function getTotalInvestment(techId: string, investments?: Record<string, TechInvestment>): number {
  const inv = investments?.[techId];
  if (!inv) return 0;
  return (inv.fixedInvestment || 0) + (inv.initialInvestment || 0) + (inv.maintenanceCost || 0);
}

function getEnergySavingTotal(step4: Step4ProjectData | undefined): {
  originalEnergy: number; savingEnergy: number;
  originalCost: number; savingCost: number;
} {
  if (!step4?.techs) return { originalEnergy: 0, savingEnergy: 0, originalCost: 0, savingCost: 0 };
  const techs = Object.values(step4.techs);
  return {
    originalEnergy: techs.reduce((s, t) => s + (t.originalEnergyRun || 0), 0),
    savingEnergy: techs.reduce((s, t) => s + (t.savingEnergyRun || 0), 0),
    originalCost: techs.reduce((s, t) => s + (t.originalCostRun || 0), 0),
    savingCost: techs.reduce((s, t) => s + (t.savingCostRun || 0), 0),
  };
}

// ── Style helpers ─────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: '#1a1a1a',
  padding: '8px 0', marginBottom: 12, marginTop: 4,
  borderBottom: '3px solid #1677ff', display: 'inline-block',
};

const subTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#262626',
  margin: '16px 0 10px',
};

const subSubTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#434343',
  margin: '14px 0 8px',
};

const thStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #d9d9d9', textAlign: 'center',
  fontWeight: 600, fontSize: 12, background: '#f0f2f5',
};
const thLStyle: React.CSSProperties = { ...thStyle, textAlign: 'left' };
const thRStyle: React.CSSProperties = { ...thStyle, textAlign: 'right' };

const tdLStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #d9d9d9', fontSize: 12, textAlign: 'left',
};

const tdCStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #d9d9d9', fontSize: 12, textAlign: 'center',
};

const tdRStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #d9d9d9', fontSize: 12, textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

const infoBoxStyle: React.CSSProperties = {
  fontSize: 12, color: '#595959', lineHeight: 1.8,
  padding: '0 2px',
};

// ── Sub Components ───────────────────────────────────────────────────

function AnalysisConclusion({ text }: { text: string }) {
  return (
    <div style={{
      marginTop: 8, padding: '8px 12px', background: '#f6f8fa',
      borderLeft: '3px solid #1677ff', fontSize: 12, color: '#434343', lineHeight: 1.7,
    }}>
      <Text strong style={{ fontSize: 12 }}>分析结论：</Text>{text}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function ReportView({
  project, step4Data, techInvestments,
  selectedTechIds, calculationResults: cr, decisionData, onBack,
}: ReportViewProps) {
  const techMap = useMemo(getTechMap, []);
  const energy = useMemo(() => getEnergySavingTotal(step4Data), [step4Data]);
  const projectsStep1Data = useProjectStore((s) => s.projectsStep1Data);
  const step1Data = projectsStep1Data[project.id] || {};

  const totalInvestment = (decisionData.totalFixedInvestment || 0)
    + (decisionData.initialInvestment || 0)
    + (decisionData.installationCost || 0);

  const annualEnergySaving = energy.originalEnergy - energy.savingEnergy;
  const annualCostSaving = energy.originalCost - energy.savingCost;
  const carbonSaving = annualEnergySaving * CARBON_FACTOR;
  const totalArea = project.totalArea || 100000;

  const reportDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const energyPrices = step4Data?.energyPrices;

  // ── 综合评价得分 ──
  const overallScore = useMemo(() => {
    const efficiencyScore = cr.roi >= 15 ? 95 : cr.roi >= 10 ? 78 : 60;
    const economicScore = cr.staticPayback <= 5 ? 85 : cr.staticPayback <= 8 ? 70 : 50;
    const policyScore = cr.irrPostTax >= 12 ? 92 : cr.irrPostTax >= 8 ? 78 : 55;
    const feasibleScore = totalInvestment <= 10000 ? 85 : 70;
    const weighted = efficiencyScore * 0.3 + economicScore * 0.4 + policyScore * 0.2 + feasibleScore * 0.1;
    return { efficiencyScore, economicScore, policyScore, feasibleScore, total: Math.round(weighted) };
  }, [cr, totalInvestment]);

  // ── 分析文本（按实际数据动态生成） ──
  const analysisTexts = useMemo(() => {
    if (!selectedTechIds || selectedTechIds.length === 0) return null;

    const techData = selectedTechIds.map((id) => {
      const tech = techMap.get(id);
      const inv = techInvestments?.[id];
      const t4 = step4Data?.techs?.[id];
      const totalInv = getTotalInvestment(id, techInvestments);
      const annualSaving = t4 ? (t4.originalCostRun || 0) - (t4.savingCostRun || 0) : 0;
      const annualMaint = inv?.maintenanceCost || 0;
      const coal = annualSaving * COAL_FACTOR;
      return { id, name: tech?.name || id, category: tech?.category || '', totalInv, annualSaving, annualMaint, coal, rating: tech?.rating || 1, energySavingRate: tech?.energySavingRate || '', originalCost: t4?.originalCostRun || 0, savingCost: t4?.savingCostRun || 0 };
    });

    // Sort by payback for analysis
    const byPayback = [...techData].sort((a, b) => (a.totalInv / Math.max(a.annualSaving, 1)) - (b.totalInv / Math.max(b.annualSaving, 1)));
    const byCoalPerInv = [...techData].sort((a, b) => (b.coal / Math.max(b.totalInv, 1)) - (a.coal / Math.max(a.totalInv, 1)));
    const byAreaBenefit = [...techData].sort((a, b) => (b.annualSaving / totalArea) - (a.annualSaving / totalArea));

    return {
      techData,
      byPayback,
      byCoalPerInv,
      byAreaBenefit,
      totalInv: techData.reduce((s, t) => s + t.totalInv, 0),
      totalAnnualSaving: techData.reduce((s, t) => s + t.annualSaving, 0),
      totalCoal: techData.reduce((s, t) => s + t.coal, 0),
    };
  }, [selectedTechIds, techMap, techInvestments, step4Data, totalArea]);

  const hasTechs = selectedTechIds && selectedTechIds.length > 0;
  const hasStep4 = step4Data?.techs && Object.keys(step4Data.techs).length > 0;

  // ── Columns ──
  const summaryCols: ColumnsType<CalcSummaryRow> = [
    { title: '序号', dataIndex: 'seq', key: 'seq', width: 50, onCell: () => ({ style: tdCStyle }), onHeaderCell: () => ({ style: thStyle }) },
    { title: '指标名称', dataIndex: 'name', key: 'name', width: 200, onCell: () => ({ style: tdLStyle }), onHeaderCell: () => ({ style: thLStyle }) },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60, onCell: () => ({ style: tdCStyle }), onHeaderCell: () => ({ style: thStyle }) },
    { title: '数值', dataIndex: 'value', key: 'value', width: 100, onCell: () => ({ style: tdRStyle }), onHeaderCell: () => ({ style: thRStyle }), render: (v: number | string) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{typeof v === 'number' ? fmt(v, 4) : v || '-'}</span> },
    { title: '参考值', dataIndex: 'referenceValue', key: 'referenceValue', width: 80, onCell: () => ({ style: tdCStyle }), onHeaderCell: () => ({ style: thStyle }) },
    { title: '评价', dataIndex: 'evaluation', key: 'evaluation', width: 60, onCell: () => ({ style: tdCStyle }), onHeaderCell: () => ({ style: thStyle }) },
  ];

  // ── 经济指标汇总表 ──
  const renderSummaryTable = () => (
    <Table
      dataSource={cr.summary}
      columns={summaryCols}
      rowKey="seq"
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 600 }}
      components={{
        header: { cell: (props: any) => <th {...props} style={{ ...props.style, ...thStyle }} /> },
        body: { cell: (props: any) => <td {...props} style={{ ...props.style, whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: 12 }} /> },
      }}
      style={{ fontSize: 12 }}
    />
  );

  // ── Render ──

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* 顶部操作栏 */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, padding: '8px 0',
      }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ color: '#1677ff', padding: '4px 8px' }}>
          返回
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
          导出PDF
        </Button>
      </div>

      {/* ══════════════ 报告正文 ══════════════ */}
      <div className="report-body" style={{ background: '#fff', padding: 40, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* ═══ 封面 ═══ */}
        <div className="report-cover" style={{ textAlign: 'center', padding: '60px 0 40px', pageBreakAfter: 'always' }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 12 }}>医院建筑节能改造投资策略报告</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: 6, marginBottom: 6 }}>
            投资决策报告
          </div>
          <Divider style={{ width: 100, minWidth: 100, margin: '20px auto', borderColor: '#1677ff', borderWidth: 2.5 }} />
          <div style={{ fontSize: 16, color: '#434343', marginBottom: 4, marginTop: 8 }}>{project.projectName}</div>
          <div style={{ fontSize: 15, color: '#595959', marginBottom: 32 }}>{project.hospitalName}</div>
          <div style={{ fontSize: 14, color: '#8c8c8c', lineHeight: 2 }}>
            <div>报告编号：JN-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}{String(new Date().getDate()).padStart(2, '0')}-001</div>
            <div>项目名称：{project.projectName}</div>
            <div>委托单位：{project.hospitalName || '—'}</div>
            <div>编制单位：医院建筑节能方案助手</div>
            <div>编制日期：{reportDate}</div>
          </div>
        </div>

        {/* ═══ 目录 ═══ */}
        <div className="report-section" style={{ marginBottom: 32, pageBreakAfter: 'always' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, textAlign: 'center' }}>目 录</div>
          <div style={{ fontSize: 13, color: '#434343', lineHeight: 2.4 }}>
            <div>一、项目概况 ................................................. 1</div>
            <div style={{ paddingLeft: 24 }}>1.1 项目基本信息表</div>
            <div style={{ paddingLeft: 24 }}>1.2 项目能耗现状表</div>
            <div style={{ paddingLeft: 24 }}>1.3 项目政策环境</div>
            <div>二、推荐节能技术方案 ......................................... 2</div>
            <div style={{ paddingLeft: 24 }}>2.1 推荐技术汇总表</div>
            <div style={{ paddingLeft: 24 }}>2.2 技术组合说明</div>
            <div>三、单技术初投资与运行费用对比分析 ........................... 3</div>
            <div>四、多维度数据分析与潜力挖掘 ................................. 4</div>
            <div style={{ paddingLeft: 24 }}>4.1 节能效率维度分析</div>
            <div style={{ paddingLeft: 24 }}>4.2 经济性回报维度分析</div>
            <div style={{ paddingLeft: 24 }}>4.3 能源政策成本维度分析</div>
            <div>五、EMC合作模式投资收益测算 ................................. 5</div>
            <div style={{ paddingLeft: 24 }}>5.1 测算边界表</div>
            <div style={{ paddingLeft: 24 }}>5.2 经济指标汇总表</div>
            <div style={{ paddingLeft: 24 }}>5.3 借款还本付息表</div>
            <div style={{ paddingLeft: 24 }}>5.4 总成本费用表</div>
            <div style={{ paddingLeft: 24 }}>5.5 利润及利润分配表</div>
            <div style={{ paddingLeft: 24 }}>5.6 项目投资现金流量表</div>
            <div>六、投资建议与实施路径 ....................................... 6</div>
            <div style={{ paddingLeft: 24 }}>6.1 综合评价</div>
            <div style={{ paddingLeft: 24 }}>6.2 分阶段实施建议</div>
            <div>七、免责声明 ................................................. 7</div>
          </div>
        </div>

        {/* ════════════════ 一、项目概况 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>一、项目概况</div>

          {/* 1.1 项目基本信息表 */}
          <div style={subTitleStyle}>1.1 项目基本信息表</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ ...thLStyle, width: 180 }}>项目类别</th>
                <th style={{ ...thLStyle }}>具体参数</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['项目名称', project.projectName],
                ['项目地址', (project.location || []).join('') || '—'],
                ['医院等级', project.hospitalLevel || '—'],
                ['总建筑面积', `${fmt(totalArea, 0)} ㎡`],
                ['建筑层数', step1Data?.buildingFloors ? `${step1Data.buildingFloors}层` : '—'],
                ['建成年代', step1Data?.yearBuilt || '—'],
                ['床位数', step1Data?.normalBeds ? `${(step1Data.normalBeds as number) + ((step1Data?.icuBeds as number) || 0)}张` : '—'],
                ['日门诊量', step1Data?.dailyOutpatient ? `${step1Data.dailyOutpatient}人次` : '—'],
                ['气候分区', step1Data?.climateZone ? (step1Data.climateZone as string[]).join('、') : '—'],
                ['现有冷热源系统', step1Data?.mep ? `${(step1Data.mep as Record<string, string>)?.coldSource || ''}/${(step1Data.mep as Record<string, string>)?.heatSource || ''}` : '—'],
                ['现有照明系统', step1Data?.mep ? (step1Data.mep as Record<string, string>)?.lightingType || '—' : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label}>
                  <td style={tdLStyle}>{label}</td>
                  <td style={tdLStyle}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 1.2 项目能耗现状表 */}
          <div style={subTitleStyle}>1.2 项目能耗现状表</div>
          {hasStep4 ? (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>能源类型</th>
                    <th style={thStyle}>年消耗量</th>
                    <th style={thRStyle}>年费用（万元）</th>
                    <th style={thStyle}>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: '电力', consumption: fmt(annualEnergySaving || energy.originalEnergy), unit: '万kWh/a', cost: energy.originalCost, pct: energy.originalCost > 0 ? '—' : '—' },
                    { type: '天然气', consumption: '—', unit: '万Nm³/a', cost: '—', pct: '—' },
                    { type: '自来水', consumption: '—', unit: '万m³/a', cost: '—', pct: '—' },
                    { type: '合计', consumption: '—', unit: '—', cost: fmt(energy.originalCost, 2), pct: '100%' },
                  ].map((r) => (
                    <tr key={r.type}>
                      <td style={{ ...tdLStyle, fontWeight: r.type === '合计' ? 600 : 400 }}>{r.type}</td>
                      <td style={tdCStyle}>{r.consumption}</td>
                      <td style={tdRStyle}>{r.cost}</td>
                      <td style={tdCStyle}>{r.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={infoBoxStyle}>
                * 天然气和自来水数据需补充详细计量。以上电力数据基于系统测算，综合年运行费用为 {fmt(energy.originalCost, 2)} 万元。
              </div>
            </>
          ) : (
            <div style={infoBoxStyle}>暂无能耗数据，请先完成 Step 4 能耗分析。</div>
          )}

          {/* 1.3 项目政策环境 */}
          <div style={subTitleStyle}>1.3 项目政策环境</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr>
                <th style={{ ...thLStyle, width: 180 }}>能源政策</th>
                <th style={thLStyle}>具体内容</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdLStyle}>峰谷电价政策</td>
                <td style={tdLStyle}>
                  {energyPrices
                    ? `高峰${fmt(energyPrices.peakPrice, 4)}元/kWh，平段${fmt(energyPrices.flatPrice, 4)}元/kWh，低谷${fmt(energyPrices.valleyPrice, 4)}元/kWh`
                    : '按当地峰谷电价政策执行'}
                </td>
              </tr>
              <tr>
                <td style={tdLStyle}>天然气价格</td>
                <td style={tdLStyle}>{energyPrices?.gasPrice ? `${fmt(energyPrices.gasPrice, 2)}元/Nm³` : '按当地天然气价格执行'}</td>
              </tr>
              <tr>
                <td style={tdLStyle}>节能补贴政策</td>
                <td style={tdLStyle}>按当地节能改造补贴政策执行（约300元/吨标煤）</td>
              </tr>
              <tr>
                <td style={tdLStyle}>可再生能源利用补贴政策</td>
                <td style={tdLStyle}>按当地可再生能源补贴政策执行</td>
              </tr>
              <tr>
                <td style={tdLStyle}>双碳政策要求</td>
                <td style={tdLStyle}>2030年前实现碳达峰，单位建筑面积能耗下降20%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ════════════════ 二、推荐节能技术方案 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>二、推荐节能技术方案</div>

          {!hasTechs ? (
            <div style={infoBoxStyle}>未选择节能技术。</div>
          ) : (
            <>
              {/* 2.1 推荐技术汇总表 */}
              <div style={subTitleStyle}>2.1 推荐技术汇总表</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>序号</th>
                    <th style={{ ...thLStyle, minWidth: 140 }}>技术名称</th>
                    <th style={thStyle}>技术分类</th>
                    <th style={thStyle}>适配度得分</th>
                    <th style={thStyle}>推荐等级</th>
                    <th style={thStyle}>节能率</th>
                    <th style={thRStyle}>投资（万元）</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTechIds.map((id, idx) => {
                    const tech = techMap.get(id);
                    const inv = getTotalInvestment(id, techInvestments);
                    return (
                      <tr key={id}>
                        <td style={tdCStyle}>{idx + 1}</td>
                        <td style={tdLStyle}>{tech?.name || id}</td>
                        <td style={tdCStyle}>{tech ? CATEGORY_LABEL[tech.category] || tech.category : '—'}</td>
                        <td style={tdCStyle}>{tech?.score ?? '—'}</td>
                        <td style={tdCStyle}>{tech ? RATING_LABEL[tech.rating] || '—' : '—'}</td>
                        <td style={tdCStyle}>{tech?.energySavingRate || '—'}</td>
                        <td style={tdRStyle}>{fmt(inv, 2)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#fafafa', fontWeight: 600 }}>
                    <td style={tdCStyle}>合计</td>
                    <td style={tdLStyle}>—</td>
                    <td style={tdCStyle}>—</td>
                    <td style={tdCStyle}>—</td>
                    <td style={tdCStyle}>—</td>
                    <td style={tdCStyle}>{analysisTexts ? fmtPct(annualCostSaving / energy.originalCost * 100, 1) : '—'}</td>
                    <td style={tdRStyle}>{fmt(analysisTexts?.totalInv || 0, 2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* 2.2 技术组合说明 */}
              <div style={subTitleStyle}>2.2 技术组合说明</div>
              <div style={{
                fontSize: 13, color: '#434343', lineHeight: 1.8,
                padding: '8px 0',
              }}>
                本方案共推荐 {selectedTechIds.length} 项节能技术，覆盖供热、制冷、照明三大核心能耗系统，
                综合节能率 {fmtPct(annualCostSaving / energy.originalCost * 100, 1)}，
                年节约能源费用 {fmt(annualCostSaving, 2)} 万元，
                静态投资回收期约 {fmt(cr.staticPayback, 1)} 年。
              </div>
            </>
          )}
        </div>

        {/* ════════════════ 三、单技术初投资与运行费用对比分析 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>三、单技术初投资与运行费用对比分析</div>

          {!hasTechs ? (
            <div style={infoBoxStyle}>未选择节能技术。</div>
          ) : (
            selectedTechIds.map((id, tIdx) => {
              const tech = techMap.get(id);
              const inv = techInvestments?.[id];
              const t4 = step4Data?.techs?.[id];

              if (!tech) return null;

              const equipSum = inv?.equipment?.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0) || 0;
              const matSum = inv?.materials?.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0) || 0;
              const installSum = inv?.installation?.filter((r) => r.selected !== false).reduce((s, r) => s + r.subtotal, 0) || 0;
              const maint10Y = (inv?.maintenanceCost || 0); // 默认年化
              const subsidy = inv?.subsidyAmount || 0;
              const totalInvTech = equipSum + matSum + installSum;
              const origCost = t4?.originalCostRun || 0;
              const saveCost = t4?.savingCostRun || 0;

              return (
                <div key={id} style={{ marginBottom: 20 }}>
                  <div style={subTitleStyle}>3.{tIdx + 1} {tech.name}</div>

                  {/* 初投资对比表 */}
                  <div style={subSubTitleStyle}>3.{tIdx + 1}.1 初投资对比表</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元）</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thLStyle, width: 120 }}>对比项</th>
                        <th style={thRStyle}>节能技术</th>
                        <th style={thRStyle}>差值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '主要设备', value: equipSum, diff: equipSum },
                        { label: '主要材料', value: matSum, diff: matSum },
                        { label: '安装与调试', value: installSum, diff: installSum },
                        { label: '运营维护（年化）', value: maint10Y, diff: maint10Y },
                        { label: '能源政策补贴', value: -subsidy, diff: -subsidy },
                        { label: '总投入', value: totalInvTech, diff: totalInvTech, bold: true },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td style={{ ...tdLStyle, fontWeight: row.bold ? 600 : 400 }}>{row.label}</td>
                          <td style={tdRStyle}>{fmt(row.value, 2)}</td>
                          <td style={tdRStyle}>{row.diff >= 0 ? `+${fmt(row.diff, 2)}` : fmt(row.diff, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 运行费用对比表 */}
                  <div style={subSubTitleStyle}>3.{tIdx + 1}.2 运行费用对比表</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元/年）</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thLStyle, width: 120 }}>对比项</th>
                        <th style={thRStyle}>节能技术</th>
                        <th style={thRStyle}>现有系统</th>
                        <th style={thRStyle}>差值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '年能源费用', save: saveCost, orig: origCost, diff: saveCost - origCost },
                        { label: '年运维费用', save: maint10Y, orig: 0, diff: maint10Y },
                        { label: '年运行费用总计', save: saveCost + maint10Y, orig: origCost, diff: saveCost + maint10Y - origCost, bold: true },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td style={{ ...tdLStyle, fontWeight: row.bold ? 600 : 400 }}>{row.label}</td>
                          <td style={tdRStyle}>{fmt(row.save, 2)}</td>
                          <td style={tdRStyle}>{fmt(row.orig, 2)}</td>
                          <td style={{ ...tdRStyle, color: row.diff < 0 ? '#52c41a' : '#ff4d4f', fontWeight: row.bold ? 600 : 400 }}>
                            {row.diff < 0 ? `${fmt(row.diff, 2)}` : `+${fmt(row.diff, 2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>

        {/* ════════════════ 四、多维度数据分析与潜力挖掘 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>四、多维度数据分析与潜力挖掘</div>

          {!analysisTexts ? (
            <div style={infoBoxStyle}>暂无技术数据用于分析。</div>
          ) : (
            <>
              {/* 4.1 节能效率维度分析 */}
              <div style={subTitleStyle}>4.1 节能效率维度分析</div>

              {/* 4.1.1 万元投资节能量对比 */}
              <div style={subSubTitleStyle}>4.1.1 万元投资节能量对比</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>年节约标煤量（tCe）</th>
                    <th style={thRStyle}>总投入（万元）</th>
                    <th style={thRStyle}>万元投资节能量（tCe/万元）</th>
                    <th style={thStyle}>排名</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisTexts.byCoalPerInv.map((t, i) => (
                    <tr key={t.id}>
                      <td style={tdLStyle}>{t.name}</td>
                      <td style={tdRStyle}>{fmt(t.coal, 2)}</td>
                      <td style={tdRStyle}>{fmt(t.totalInv, 2)}</td>
                      <td style={tdRStyle}>{t.totalInv > 0 ? fmt(t.coal / t.totalInv, 3) : '—'}</td>
                      <td style={tdCStyle}>{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AnalysisConclusion text={`单位投资节能效率最高的技术是${analysisTexts.byCoalPerInv[0]?.name || '—'}和${analysisTexts.byCoalPerInv[1]?.name || '—'}，是优先落地的高性价比技术。`} />

              {/* 4.1.2 单位面积节能收益对比 */}
              <div style={subSubTitleStyle}>4.1.2 单位面积节能收益对比</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>年节约费用（万元）</th>
                    <th style={thRStyle}>总建筑面积（㎡）</th>
                    <th style={thRStyle}>单位面积节能收益（元/㎡·年）</th>
                    <th style={thStyle}>排名</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisTexts.byAreaBenefit.map((t, i) => (
                    <tr key={t.id}>
                      <td style={tdLStyle}>{t.name}</td>
                      <td style={tdRStyle}>{fmt(t.annualSaving, 2)}</td>
                      <td style={tdRStyle}>{fmt(totalArea, 0)}</td>
                      <td style={tdRStyle}>{totalArea > 0 ? fmt(t.annualSaving / totalArea * 10000, 1) : '—'}</td>
                      <td style={tdCStyle}>{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AnalysisConclusion text={`${analysisTexts.byAreaBenefit[0]?.name || '—'}和${analysisTexts.byAreaBenefit[1]?.name || '—'}的单位面积节能收益最高，适合在大规模改造项目中应用。`} />

              {/* 4.2 经济性回报维度分析 */}
              <div style={subTitleStyle}>4.2 经济性回报维度分析</div>

              {/* 4.2.1 静态投资回收期排序对比 */}
              <div style={subSubTitleStyle}>4.2.1 静态投资回收期排序对比</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>总投入（万元）</th>
                    <th style={thRStyle}>年净收益（万元）</th>
                    <th style={thRStyle}>静态投资回收期（年）</th>
                    <th style={thStyle}>推荐优先级</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisTexts.byPayback.map((t) => {
                    const payback = t.annualSaving > 0 ? t.totalInv / t.annualSaving : 999;
                    const priority = payback <= 3 ? '极高' : payback <= 5 ? '高' : payback <= 10 ? '中' : '低';
                    return (
                      <tr key={t.id}>
                        <td style={tdLStyle}>{t.name}</td>
                        <td style={tdRStyle}>{fmt(t.totalInv, 2)}</td>
                        <td style={tdRStyle}>{fmt(t.annualSaving, 2)}</td>
                        <td style={tdRStyle}>{payback < 999 ? fmt(payback, 1) : '—'}</td>
                        <td style={{ ...tdCStyle, fontWeight: priority === '极高' ? 600 : 400 }}>{priority}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <AnalysisConclusion text={`${analysisTexts.byPayback[0]?.name || '—'}的投资回收期最短，属于短期快回本技术，可优先批量推广。`} />

              {/* 4.2.2 年均净收益率对比 */}
              <div style={subSubTitleStyle}>4.2.2 年均净收益率对比</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>年均净收益（万元）</th>
                    <th style={thRStyle}>总投入（万元）</th>
                    <th style={thRStyle}>年均净收益率</th>
                    <th style={thStyle}>排名</th>
                  </tr>
                </thead>
                <tbody>
                  {[...analysisTexts.techData]
                    .sort((a, b) => (b.annualSaving / Math.max(b.totalInv, 1)) - (a.annualSaving / Math.max(a.totalInv, 1)))
                    .map((t, i) => (
                      <tr key={t.id}>
                        <td style={tdLStyle}>{t.name}</td>
                        <td style={tdRStyle}>{fmt(t.annualSaving, 2)}</td>
                        <td style={tdRStyle}>{fmt(t.totalInv, 2)}</td>
                        <td style={tdRStyle}>{t.totalInv > 0 ? fmtPct(t.annualSaving / t.totalInv * 100, 1) : '—'}</td>
                        <td style={tdCStyle}>{i + 1}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <AnalysisConclusion text={`结合静态投资回收期分析，投资回收期短年均净收益率高的技术适合快速落地，回收期较长的技术适合作为长期智慧化升级项目。`} />

              {/* 4.2.3 运维成本占比对比 */}
              <div style={subSubTitleStyle}>4.2.3 运维成本占比对比</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>年均运维费（万元）</th>
                    <th style={thRStyle}>年均节能收益（万元）</th>
                    <th style={thRStyle}>运维成本占比</th>
                    <th style={thStyle}>评价</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisTexts.techData.sort((a, b) => (a.annualMaint / Math.max(a.annualSaving, 1)) - (b.annualMaint / Math.max(b.annualSaving, 1))).map((t) => {
                    const ratio = t.annualSaving > 0 ? t.annualMaint / t.annualSaving : 1;
                    const level = ratio <= 0.05 ? '极低' : ratio <= 0.15 ? '低' : ratio <= 0.3 ? '中' : '高';
                    return (
                      <tr key={t.id}>
                        <td style={tdLStyle}>{t.name}</td>
                        <td style={tdRStyle}>{fmt(t.annualMaint, 2)}</td>
                        <td style={tdRStyle}>{fmt(t.annualSaving, 2)}</td>
                        <td style={tdRStyle}>{fmtPct(ratio * 100, 1)}</td>
                        <td style={tdCStyle}>{level}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <AnalysisConclusion text={`运维成本占比低的技术收益稳定性更高，高占比技术需在合同中明确运维责任划分。`} />

              {/* 4.3 能源政策成本维度分析 */}
              <div style={subTitleStyle}>4.3 能源政策成本维度分析</div>

              {/* 4.3.1 电价气价浮动敏感性分析 */}
              <div style={subSubTitleStyle}>4.3.1 电价气价浮动敏感性分析</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>能源价格变动幅度</th>
                    <th style={thRStyle}>综合年节约费用（万元）</th>
                    <th style={thRStyle}>综合投资回收期（年）</th>
                    <th style={thStyle}>变动率</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '能源价格上涨20%', cost: annualCostSaving * 1.2, payback: totalInvestment / (annualCostSaving * 1.2 || 1), change: '+15.9%' },
                    { label: '能源价格上涨10%', cost: annualCostSaving * 1.1, payback: totalInvestment / (annualCostSaving * 1.1 || 1), change: '+7.9%' },
                    { label: '基准价格', cost: annualCostSaving, payback: cr.staticPayback, change: '0%' },
                    { label: '能源价格下降10%', cost: annualCostSaving * 0.9, payback: totalInvestment / (annualCostSaving * 0.9 || 1), change: '-7.9%' },
                    { label: '能源价格下降20%', cost: annualCostSaving * 0.8, payback: totalInvestment / (annualCostSaving * 0.8 || 1), change: '-15.9%' },
                  ].map((r) => (
                    <tr key={r.label}>
                      <td style={tdLStyle}>{r.label}</td>
                      <td style={tdRStyle}>{fmt(r.cost, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.payback, 1)}</td>
                      <td style={tdCStyle}>{r.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AnalysisConclusion text={`项目收益对能源价格变动较为敏感，能源价格每上涨10%，综合投资回收期缩短约${fmt((cr.staticPayback - totalInvestment / (annualCostSaving * 1.1 || 1)), 1)}年，整体抗风险能力较强。`} />

              {/* 4.3.2 年节碳量对比分析 */}
              <div style={subSubTitleStyle}>4.3.2 年节碳量对比分析</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={thLStyle}>技术名称</th>
                    <th style={thRStyle}>年节电量（万kWh）</th>
                    <th style={thStyle}>年节气量（万Nm³）</th>
                    <th style={thRStyle}>年节碳量（tCO₂）</th>
                    <th style={thStyle}>占总节碳量比例</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisTexts.techData
                    .sort((a, b) => (b.coal * CARBON_FACTOR / COAL_FACTOR) - (a.coal * CARBON_FACTOR / COAL_FACTOR))
                    .map((t) => {
                      const carbon = t.coal * CARBON_FACTOR / (COAL_FACTOR || 1);
                      const totalCarbon = analysisTexts.totalCoal * CARBON_FACTOR / (COAL_FACTOR || 1);
                      return (
                        <tr key={t.id}>
                          <td style={tdLStyle}>{t.name}</td>
                          <td style={tdRStyle}>{fmt(t.annualSaving / 1, 2)}</td>
                          <td style={tdCStyle}>—</td>
                          <td style={tdRStyle}>{fmt(carbon, 2)}</td>
                          <td style={tdCStyle}>{totalCarbon > 0 ? fmtPct(carbon / totalCarbon * 100, 1) : '—'}</td>
                        </tr>
                      );
                    })}
                  <tr style={{ background: '#fafafa', fontWeight: 600 }}>
                    <td style={tdLStyle}>合计</td>
                    <td style={tdRStyle}>{fmt(annualEnergySaving, 2)}</td>
                    <td style={tdCStyle}>—</td>
                    <td style={tdRStyle}>{fmt(carbonSaving, 2)}</td>
                    <td style={tdCStyle}>100%</td>
                  </tr>
                </tbody>
              </table>
              <AnalysisConclusion text={`项目年节碳量合计 ${fmt(carbonSaving, 0)} tCO₂，符合国家双碳政策导向，可申报相关节能补贴和碳交易额度。`} />
            </>
          )}
        </div>

        {/* ════════════════ 五、EMC合作模式投资收益测算 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>五、EMC合作模式投资收益测算</div>

          {/* 5.1 测算边界表 */}
          <div style={subTitleStyle}>5.1 测算边界表</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <tbody>
              {[
                { label: '合作期限', value: `${decisionData.operatingPeriod || 8} 年` },
                { label: '节能收益分成比例', value: `甲方${fmt(decisionData.initialProfitShare1 || 30, 0)}%，乙方${fmt(decisionData.initialProfitShare2 || 70, 0)}%` },
                { label: '总投资', value: `${fmt(totalInvestment || cr.summary.find(r => r.seq === '1')?.value as number || 0, 2)} 万元` },
                { label: '银行贷款比例', value: decisionData.fundingRatio ? `${fmt(100 - decisionData.fundingRatio, 0)}%` : '—' },
                { label: '贷款利率', value: decisionData.loanRate ? `${fmt(decisionData.loanRate, 2)}%` : '—' },
                { label: '贷款期限', value: decisionData.repaymentPeriod ? `${decisionData.repaymentPeriod} 年` : '—' },
                { label: '折现率', value: '8%' },
              ].map((r) => (
                <tr key={r.label}>
                  <td style={{ ...tdLStyle, width: 200, background: '#fafafa', fontWeight: 500 }}>{r.label}</td>
                  <td style={tdLStyle}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 5.2 经济指标汇总表 */}
          <div style={subTitleStyle}>5.2 经济指标汇总表</div>
          {renderSummaryTable()}

          {/* 5.3 借款还本付息表 */}
          {cr.loanSchedule?.length > 0 && (
            <>
              <div style={subTitleStyle}>5.3 借款还本付息表</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>年份</th>
                    <th style={thRStyle}>年初借款余额</th>
                    <th style={thRStyle}>当年借款</th>
                    <th style={thRStyle}>当年还本</th>
                    <th style={thRStyle}>当年付息</th>
                    <th style={thRStyle}>年末借款余额</th>
                  </tr>
                </thead>
                <tbody>
                  {cr.loanSchedule.map((r) => (
                    <tr key={r.year}>
                      <td style={tdCStyle}>{r.periodLabel}</td>
                      <td style={tdRStyle}>{fmt(r.beginningBalance, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.newLoan, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.principalRepayment, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.interestPayment, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.endingBalance, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 5.4 总成本费用表 */}
          {cr.totalCost?.length > 0 && (
            <>
              <div style={subTitleStyle}>5.4 总成本费用表</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元/年）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>年份</th>
                    <th style={thRStyle}>能源费用</th>
                    <th style={thRStyle}>运维费用</th>
                    <th style={thRStyle}>折旧摊销</th>
                    <th style={thRStyle}>财务费用</th>
                    <th style={thRStyle}>总成本费用</th>
                  </tr>
                </thead>
                <tbody>
                  {cr.totalCost.map((r) => (
                    <tr key={r.year}>
                      <td style={tdCStyle}>{r.periodLabel}</td>
                      <td style={tdRStyle}>{fmt(r.energyCost, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.maintenanceCost + r.laborCost + r.adminCost + r.insuranceCost, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.depreciation, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.interestExpense, 2)}</td>
                      <td style={{ ...tdRStyle, fontWeight: 600 }}>{fmt(r.totalCost, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 5.5 利润及利润分配表 */}
          {cr.profit?.length > 0 && (
            <>
              <div style={subTitleStyle}>5.5 利润及利润分配表</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元/年）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>年份</th>
                    <th style={thRStyle}>年节能收益</th>
                    <th style={thRStyle}>总成本费用</th>
                    <th style={thRStyle}>利润总额</th>
                    <th style={thRStyle}>所得税</th>
                    <th style={thRStyle}>净利润</th>
                  </tr>
                </thead>
                <tbody>
                  {cr.profit.map((r) => (
                    <tr key={r.year}>
                      <td style={tdCStyle}>{r.periodLabel}</td>
                      <td style={tdRStyle}>{fmt(r.revenue, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.totalCost, 2)}</td>
                      <td style={{ ...tdRStyle, color: r.profitTotal >= 0 ? '#1a1a1a' : '#ff4d4f' }}>{fmt(r.profitTotal, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.incomeTax, 2)}</td>
                      <td style={{ ...tdRStyle, fontWeight: 600, color: r.netProfit >= 0 ? '#1a1a1a' : '#ff4d4f' }}>{fmt(r.netProfit, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 5.6 项目投资现金流量表 */}
          {cr.projectCashflow?.length > 0 && (
            <>
              <div style={subTitleStyle}>5.6 项目投资现金流量表</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>（单位：万元）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>年份</th>
                    <th style={thRStyle}>现金流入</th>
                    <th style={thRStyle}>现金流出</th>
                    <th style={thRStyle}>净现金流量</th>
                    <th style={thRStyle}>累计净现金流量</th>
                  </tr>
                </thead>
                <tbody>
                  {cr.projectCashflow.map((r) => (
                    <tr key={r.year}>
                      <td style={tdCStyle}>{r.periodLabel}</td>
                      <td style={tdRStyle}>{fmt(r.cashInflow, 2)}</td>
                      <td style={tdRStyle}>{fmt(r.cashOutflow, 2)}</td>
                      <td style={{ ...tdRStyle, color: r.netCashflow >= 0 ? '#1a1a1a' : '#ff4d4f' }}>{fmt(r.netCashflow, 2)}</td>
                      <td style={{ ...tdRStyle, color: r.cumulativeDiscounted >= 0 ? '#52c41a' : '#ff4d4f' }}>{fmt(r.cumulativeDiscounted, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ════════════════ 六、投资建议与实施路径 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>六、投资建议与实施路径</div>

          {/* 6.1 综合评价 */}
          <div style={subTitleStyle}>6.1 综合评价</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr>
                <th style={thLStyle}>评价维度</th>
                <th style={thStyle}>得分</th>
                <th style={thStyle}>权重</th>
                <th style={thRStyle}>加权得分</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '节能效率', score: overallScore.efficiencyScore, weight: '30%' },
                { label: '经济性回报', score: overallScore.economicScore, weight: '40%' },
                { label: '政策符合性', score: overallScore.policyScore, weight: '20%' },
                { label: '实施可行性', score: overallScore.feasibleScore, weight: '10%' },
              ].map((r) => (
                <tr key={r.label}>
                  <td style={tdLStyle}>{r.label}</td>
                  <td style={tdCStyle}>{r.score}</td>
                  <td style={tdCStyle}>{r.weight}</td>
                  <td style={tdRStyle}>{fmt(r.score * parseFloat(r.weight) / 100, 1)}</td>
                </tr>
              ))}
              <tr style={{ background: '#fafafa', fontWeight: 700 }}>
                <td style={tdLStyle}>综合得分</td>
                <td style={tdCStyle}>—</td>
                <td style={tdCStyle}>100%</td>
                <td style={{ ...tdRStyle, fontSize: 14 }}>{overallScore.total}</td>
              </tr>
            </tbody>
          </table>

          <div style={{
            fontSize: 13, fontWeight: 600, color: overallScore.total >= 85 ? '#52c41a' : overallScore.total >= 70 ? '#1677ff' : overallScore.total >= 55 ? '#fa8c16' : '#ff4d4f',
            marginBottom: 16,
          }}>
            推荐等级：
            {overallScore.total >= 85 ? '推荐（优秀）' : overallScore.total >= 70 ? '建议投资（良好）' : overallScore.total >= 55 ? '谨慎投资（一般）' : '不建议投资（较差）'}
          </div>

          {/* 6.2 分阶段实施建议 */}
          <div style={subTitleStyle}>6.2 分阶段实施建议</div>

          {hasTechs && analysisTexts && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1677ff',
                  padding: '6px 12px', background: '#e6f4ff', borderRadius: 4, marginBottom: 8,
                }}>
                  第一阶段（第 1 年）：快速回本项目落地
                </div>
                {analysisTexts.byPayback.filter((t) => t.annualSaving > 0 && t.totalInv / t.annualSaving <= 5).slice(0, 2).map((t) => {
                  const payback = t.totalInv / t.annualSaving;
                  return (
                    <div key={t.id} style={{
                      fontSize: 12, color: '#434343', lineHeight: 1.7,
                      padding: '4px 16px',
                    }}>
                      实施 {t.name}，投资 {fmt(t.totalInv, 2)} 万元，年节约费用 {fmt(t.annualSaving, 2)} 万元，投资回收期 {fmt(payback, 1)} 年
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1677ff',
                  padding: '6px 12px', background: '#e6f4ff', borderRadius: 4, marginBottom: 8,
                }}>
                  第二阶段（第 2-3 年）：核心系统升级
                </div>
                {analysisTexts.techData.filter((t) => {
                  const payback = t.annualSaving > 0 ? t.totalInv / t.annualSaving : 999;
                  return payback > 5 && payback <= 12;
                }).map((t) => (
                    <div key={t.id} style={{
                      fontSize: 12, color: '#434343', lineHeight: 1.7,
                      padding: '4px 16px',
                    }}>
                      实施 {t.name}，投资 {fmt(t.totalInv, 2)} 万元，年节约费用 {fmt(t.annualSaving, 2)} 万元
                    </div>
                  ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1677ff',
                  padding: '6px 12px', background: '#e6f4ff', borderRadius: 4, marginBottom: 8,
                }}>
                  第三阶段（第 3-5 年）：深度节能改造
                </div>
                {analysisTexts.techData.filter((t) => {
                  const payback = t.annualSaving > 0 ? t.totalInv / t.annualSaving : 999;
                  return payback > 12;
                }).map((t) => {
                  return (
                    <div key={t.id} style={{
                      fontSize: 12, color: '#434343', lineHeight: 1.7,
                      padding: '4px 16px',
                    }}>
                      实施 {t.name}，投资 {fmt(t.totalInv, 2)} 万元，年节约费用 {fmt(t.annualSaving, 2)} 万元
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 6.3 投资模式选择建议 */}
          <div style={subSubTitleStyle}>6.3 投资模式选择建议</div>
          <div style={{
            fontSize: 12, color: '#434343', lineHeight: 2,
            padding: '0 4px', marginBottom: 16,
          }}>
            <div>• <Text strong>资金充裕型医院：</Text>建议采用自投模式，独享全部节能收益，投资回收期 {fmt(cr.staticPayback, 1)} 年</div>
            <div>• <Text strong>资金紧张型医院：</Text>建议采用EMC模式，零投资、零风险，合作期内可获得稳定节能收益，合作期满后所有设备无偿归医院所有</div>
            <div>• <Text strong>新建医院：</Text>建议采用BOT模式，由投资方负责投资、建设、运营，合作期满后移交医院</div>
          </div>

          {/* 6.4 政策支持建议 */}
          <div style={subSubTitleStyle}>6.4 政策支持建议</div>
          <div style={{
            fontSize: 12, color: '#434343', lineHeight: 2,
            padding: '0 4px', marginBottom: 16,
          }}>
            <div>• 积极申报当地节能改造补贴，预计可获得补贴约 {fmt(carbonSaving * 300 / 10000, 0)} 万元</div>
            <div>• 申请绿色信贷，享受优惠贷款利率，降低融资成本</div>
            <div>• 参与全国碳交易市场，将年节碳量 {fmt(carbonSaving, 0)} tCO₂ 转化为碳资产收益</div>
            <div>• 争取税收优惠政策，享受节能节水专用设备投资额抵免企业所得税</div>
          </div>

          {/* 6.5 运营监控建议 */}
          <div style={subSubTitleStyle}>6.5 运营监控建议</div>
          <div style={{
            fontSize: 12, color: '#434343', lineHeight: 2,
            padding: '0 4px',
          }}>
            <div>• 建立能源管理中心，实时监控各系统能耗数据</div>
            <div>• 每季度开展能耗审计，分析节能效果，优化运行策略</div>
            <div>• 加强运维人员培训，提高系统操作和维护水平</div>
            <div>• 建立节能考核机制，将节能指标纳入科室绩效考核</div>
          </div>
        </div>

        {/* ════════════════ 七、免责声明 ════════════════ */}
        <div className="report-section" style={{ marginBottom: 16, pageBreakBefore: 'always' }}>
          <div style={sectionTitleStyle}>七、免责声明</div>
          <div style={{
            fontSize: 12, color: '#8c8c8c', lineHeight: 1.8,
            padding: '12px 16px', background: '#fafafa', borderRadius: 4,
          }}>
            本报告基于委托单位提供的项目信息和行业通用数据编制，所有测算结果均为估算值，
            实际节能效果和投资收益可能因项目实施情况、能源价格波动、政策变化等因素而有所不同。
            本报告仅供委托单位投资决策参考，不构成任何投资建议。
            编制单位不对因使用本报告而产生的任何损失承担责任。
          </div>

          <div style={{
            marginTop: 24, fontSize: 12, color: '#595959', lineHeight: 2,
            textAlign: 'center', paddingTop: 16, borderTop: '1px solid #e8e8e8',
          }}>
            <div><Text strong>项目名称：</Text>{project.projectName}</div>
            <div><Text strong>报告日期：</Text>{reportDate}</div>
          </div>
        </div>

      </div>

      {/* ═══ 打印样式 ═══ */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .no-print {
            display: none !important;
          }
          .report-body {
            box-shadow: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          .report-cover {
            padding-top: 80px !important;
          }
          .report-section {
            page-break-inside: avoid;
          }
          table, tr, td, th {
            page-break-inside: avoid;
          }
        }
        @media screen {
          .report-body {
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
        }
      `}</style>
    </div>
  );
}