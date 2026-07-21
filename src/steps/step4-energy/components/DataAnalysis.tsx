import { useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Empty, Select, Tag } from 'antd';
import ReactEChartsCore from 'echarts-for-react';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import {
  calcCoalSaving, calcCarbonSaving, calcInvestCoalEfficiency,
  calcAreaBenefit, calcPaybackPeriod, calcNetReturnRate,
  calcMaintenanceRatio, calcRemainingCarbon,
  classifyPayback, classifyMaintenance,
} from './helpers';

const { Text } = Typography;

// ── Constants ────────────────────────────────────────────────────────

const PRICE_SCENARIOS = [-0.2, -0.1, 0, 0.1, 0.2];
const SCENARIO_LABELS = ['-20%', '-10%', '基准', '+10%', '+20%'];
const PAYBACK_LABELS: Record<string, string> = { short: '优先落地', mid: 'EMC分成', long: '智慧配套' };
const PAYBACK_COLORS: Record<string, string> = { short: '#52c41a', mid: '#1677ff', long: '#fa8c16' };

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  projectId?: string;
}

// ── Types ────────────────────────────────────────────────────────────

interface TechAgg {
  techId: string;
  techName: string;
  energyType: string;            // 能耗种类（电耗/气耗/...），用于燃气敏感性判断
  originalEnergyRun: number;
  savingEnergyRun: number;
  originalCostRun: number;
  savingCostRun: number;
  annualSaving: number;          // 年节约费用 万元
  coalSaving: number;            // 年节约标煤 tce
  carbonSaving: number;          // 年节碳量 tCO₂
  remainingCarbon: number;       // 剩余排放 tCO₂
  fixedInvestment: number;       // 固定投资 万元
  initialInvestment: number;     // 初投资 万元
  maintenanceCost: number;       // 年运维费 万元
  investCoalEff: number;         // 万元投资节能量 tce/万元
  areaBenefit: number;           // 单位面积节能收益 元/㎡/年
  paybackPeriod: number;         // 静态回收期 年
  netReturnRate: number;         // 年均净收益率 %
  maintenanceRatio: number;      // 运维成本占比 %
  paybackClass: 'short' | 'mid' | 'long';
  maintClass: 'good' | 'normal' | 'drag';
  // 敏感性
  elecSensitivity: number[];     // 各电价情景下运行费用
  gasSensitivity: number[];      // 各气价情景下运行费用
  totalArea: number;
}

// ── Component ────────────────────────────────────────────────────────

export default function DataAnalysis({ projectId: lockedProjectId }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const techEntries = useMergedTechEntries();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(lockedProjectId ?? 'all');

  const effectiveProjectId = lockedProjectId ?? selectedProjectId;

  // ── 项目选择器选项 ──
  const projectOptions = useMemo(() => {
    if (lockedProjectId) return [];
    const valid = projects.filter((p) => projectsStep4Data[p.id]?.techs && Object.keys(projectsStep4Data[p.id].techs!).length > 0);
    return [
      { value: 'all', label: '全部项目' },
      ...valid.map((p) => ({ value: p.id, label: p.projectName || p.hospitalName })),
    ];
  }, [lockedProjectId, projects, projectsStep4Data]);

  // ── 聚合技术数据 ──
  const techData: TechAgg[] = useMemo(() => {
    const targetProjects = effectiveProjectId === 'all'
      ? projects
      : projects.filter((p) => p.id === effectiveProjectId);

    const techMap: Record<string, TechAgg> = {};

    for (const p of targetProjects) {
      const step4 = projectsStep4Data[p.id];
      const step3 = projectsStep3Data[p.id];
      if (!step4?.techs) continue;
      const totalArea = p.totalArea ?? 100000;
      const province = p.location?.[0];

      for (const [techId, td] of Object.entries(step4.techs)) {
        const tech = techEntries.find((t) => t.id === techId);
        const name = tech?.name ?? techId;
        const inv = step3?.[techId];

        const annualSaving = td.originalCostRun - td.savingCostRun;
        const coalSaving = calcCoalSaving(td.originalEnergyRun, td.savingEnergyRun);
        const carbonSaving = calcCarbonSaving(td.originalEnergyRun, td.savingEnergyRun, province);
        const remainingCarbon = calcRemainingCarbon(td.savingEnergyRun, province);
        const initialInvestment = inv?.initialInvestment ?? inv?.fixedInvestment ?? 0;
        const maintenanceCost = inv?.maintenanceCost ?? 0;
        const fixedInvestment = inv?.fixedInvestment ?? 0;

        if (!techMap[techId]) {
          techMap[techId] = {
            techId, techName: name,
            energyType: tech?.energyType ?? '电耗',
            originalEnergyRun: 0, savingEnergyRun: 0,
            originalCostRun: 0, savingCostRun: 0,
            annualSaving: 0, coalSaving: 0, carbonSaving: 0, remainingCarbon: 0,
            fixedInvestment: 0, initialInvestment: 0, maintenanceCost: 0,
            investCoalEff: 0, areaBenefit: 0,
            paybackPeriod: 0, netReturnRate: 0, maintenanceRatio: 0,
            paybackClass: 'long', maintClass: 'good',
            elecSensitivity: [], gasSensitivity: [],
            totalArea,
          };
        }
        const agg = techMap[techId];
        agg.originalEnergyRun += td.originalEnergyRun;
        agg.savingEnergyRun += td.savingEnergyRun;
        agg.originalCostRun += td.originalCostRun;
        agg.savingCostRun += td.savingCostRun;
        agg.annualSaving += annualSaving;
        agg.coalSaving += coalSaving;
        agg.carbonSaving += carbonSaving;
        agg.remainingCarbon += remainingCarbon;
        agg.fixedInvestment += fixedInvestment;
        agg.initialInvestment += initialInvestment;
        agg.maintenanceCost += maintenanceCost;
      }
    }

    // 重新计算聚合后的比率指标
    return Object.values(techMap).map((t) => ({
      ...t,
      investCoalEff: calcInvestCoalEfficiency(t.coalSaving, t.fixedInvestment),
      areaBenefit: calcAreaBenefit(t.annualSaving, t.totalArea),
      paybackPeriod: calcPaybackPeriod(t.initialInvestment, t.annualSaving),
      netReturnRate: calcNetReturnRate(t.annualSaving, t.maintenanceCost, t.initialInvestment),
      maintenanceRatio: calcMaintenanceRatio(t.maintenanceCost, t.annualSaving),
      paybackClass: classifyPayback(calcPaybackPeriod(t.initialInvestment, t.annualSaving)),
      maintClass: classifyMaintenance(calcMaintenanceRatio(t.maintenanceCost, t.annualSaving)),
      elecSensitivity: PRICE_SCENARIOS.map((s) => t.annualSaving * (1 + s)),
      gasSensitivity: PRICE_SCENARIOS.map((s) => {
        // 燃气敏感性：仅对能耗种类含"气"的技术生效，假设 30% 的 savingCost 受气价影响
        const isGasRelated = t.energyType.includes('气');
        return t.savingCostRun + t.savingCostRun * (isGasRelated ? 0.3 : 0) * s;
      }),
    }));
  }, [effectiveProjectId, projects, projectsStep4Data, projectsStep3Data, techEntries]);

  // ── 空状态 ──
  if (techData.length === 0) {
    return (
      <Card style={{ border: '1px solid #e8ecf0' }} bodyStyle={{ padding: '60px 0' }}>
        <Empty description="暂无能耗数据，请先在节能计算中录入数据" />
      </Card>
    );
  }

  const techNames = techData.map((t) => t.techName);

  // ── 通用柱状图 ──
  function makeBarOption(values: number[], unit: string, barColor: string, markLineVal?: number) {
    const ml: any[] = [{ type: 'average' as const, name: '平均值' }];
    if (markLineVal !== undefined) {
      ml.push({ yAxis: markLineVal, name: '阈值', lineStyle: { color: '#ff4d4f', type: 'dashed' as const, width: 2 }, label: { formatter: `阈值 ${markLineVal}`, fontSize: 10 } });
    }
    return {
      tooltip: { trigger: 'axis' as const, formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/>${p.value.toFixed(2)} ${unit}`;
      }},
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category' as const, data: techNames, axisLabel: { fontSize: 11, rotate: 15 } },
      yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 11 } },
      series: [{
        type: 'bar', data: values,
        itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
        barWidth: 28,
        label: { show: true, position: 'top', fontSize: 10, color: '#595959', formatter: (p: { value: number }) => p.value.toFixed(1) },
        markLine: { silent: true, data: ml, lineStyle: { type: 'dashed' as const, color: '#ff4d4f', width: 2 }, label: { formatter: '{b}', fontSize: 10 } },
      }],
    };
  }

  // ── 电价敏感性分组柱状图 ──
  function makeSensitivityBar(values: number[][], unit: string) {
    const colors = ['#91caff', '#69b1ff', '#1677ff', '#fa8c16', '#ff4d4f'];
    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: SCENARIO_LABELS, bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
      xAxis: { type: 'category' as const, data: techNames, axisLabel: { fontSize: 11, rotate: 15 } },
      yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 11 } },
      series: SCENARIO_LABELS.map((label, i) => ({
        name: label,
        type: 'bar' as const,
        data: values.map((v) => v[i]),
        itemStyle: { color: colors[i], borderRadius: [3, 3, 0, 0] },
        barWidth: 16,
      })),
    };
  }

  // ── 碳资产堆叠柱状图 ──
  function makeCarbonStackOption() {
    return {
      tooltip: { trigger: 'axis' as const, formatter: (params: any[]) => {
        let s = params[0].name;
        for (const p of params) s += `<br/>${p.marker}${p.seriesName}: ${p.value.toFixed(1)} tCO₂/年`;
        return s;
      }},
      legend: { data: ['已节碳量', '剩余排放'], bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
      xAxis: { type: 'category' as const, data: techNames, axisLabel: { fontSize: 11, rotate: 15 } },
      yAxis: { type: 'value' as const, name: 'tCO₂/年', nameTextStyle: { fontSize: 11 } },
      series: [
        { name: '已节碳量', type: 'bar' as const, stack: 'total', data: techData.map((t) => t.carbonSaving), itemStyle: { color: '#52c41a', borderRadius: [0, 0, 0, 0] }, barWidth: 32, label: { show: true, fontSize: 10, formatter: (p: { value: number }) => p.value > 0 ? p.value.toFixed(0) : '' } },
        { name: '剩余排放', type: 'bar' as const, stack: 'total', data: techData.map((t) => t.remainingCarbon), itemStyle: { color: '#d9d9d9', borderRadius: [4, 4, 0, 0] }, label: { show: true, fontSize: 10, position: 'top', formatter: (p: { value: number }) => p.value > 0 ? (p.value + (techData.find((tt) => tt.remainingCarbon + tt.carbonSaving === p.value + (techData.find((t2) => t2.techId === tt.techId)?.carbonSaving ?? 0))?.carbonSaving ?? 0)).toFixed(0) : '' } },
      ],
    };
  }

  // ── 计算各维度汇总 ──
  const sortedByInvestCoal = [...techData].sort((a, b) => b.investCoalEff - a.investCoalEff);
  const sortedByAreaBenefit = [...techData].sort((a, b) => b.areaBenefit - a.areaBenefit);
  const bestInvestCoal = sortedByInvestCoal[0];
  const bestAreaBenefit = sortedByAreaBenefit[0];

  const paybackGroups = { short: techData.filter((t) => t.paybackClass === 'short'), mid: techData.filter((t) => t.paybackClass === 'mid'), long: techData.filter((t) => t.paybackClass === 'long') };
  const bestNetReturn = [...techData].sort((a, b) => b.netReturnRate - a.netReturnRate)[0];
  const dragTechs = techData.filter((t) => t.maintClass === 'drag');

  const totalCarbonSaving = techData.reduce((s, t) => s + t.carbonSaving, 0);
  const totalRemainingCarbon = techData.reduce((s, t) => s + t.remainingCarbon, 0);

  // 补贴估算：政策绿融库已重构为政策名称+摘要+链接形式，不再提供结构化补贴金额字段。
  // 后续如需补贴估算，可改为读取用户在 Step 3 填写的 subsidyAmount 汇总。
  const subsidyEstimate = useMemo(() => 0, []);

  // 电/气敏感性结论
  const elecSensitivityConclusion = useMemo(() => {
    const bestTech = [...techData].sort((a, b) => {
      const aGain = a.elecSensitivity[4] - a.elecSensitivity[2]; // +20% - base
      const bGain = b.elecSensitivity[4] - b.elecSensitivity[2];
      return bGain - aGain;
    })[0];
    if (!bestTech) return '';
    const gain = bestTech.elecSensitivity[4] - bestTech.elecSensitivity[2];
    return `电价+20%时，${bestTech.techName}年节约费用增加 ${gain.toFixed(1)} 万元/年`;
  }, [techData]);

  const gasSensitivityConclusion = useMemo(() => {
    const gasRelated = techData.filter((t) => t.energyType.includes('气'));
    if (gasRelated.length === 0) return '当前项目无燃气关联技术';
    const best = [...gasRelated].sort((a, b) => {
      const aGain = a.gasSensitivity[4] - a.gasSensitivity[2];
      const bGain = b.gasSensitivity[4] - b.gasSensitivity[2];
      return bGain - aGain;
    })[0];
    const gain = best.gasSensitivity[4] - best.gasSensitivity[2];
    return `气价+20%时，${best.techName}年节约费用增加 ${gain.toFixed(1)} 万元/年`;
  }, [techData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 项目选择器 ── */}
      {!lockedProjectId && (
        <Card size="small" style={{ border: '1px solid #e8ecf0' }} bodyStyle={{ padding: '12px 20px' }}>
          <Row align="middle" gutter={16}>
            <Col><Text style={{ fontSize: 13, color: '#595959', fontWeight: 500 }}>分析项目</Text></Col>
            <Col><Select value={selectedProjectId} onChange={setSelectedProjectId} options={projectOptions} style={{ width: 280 }} variant="filled" /></Col>
          </Row>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度一：节能效率维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>节能效率维度</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#f0f5ff', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        {/* KPI 判断卡片 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #d9f7be', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>万元投资节能量</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#52c41a' }}>{bestInvestCoal?.investCoalEff.toFixed(2)}</Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>tce/万元</Text>
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag color="success" style={{ fontSize: 11 }}>{bestInvestCoal?.techName}</Tag>
                <Text style={{ fontSize: 12, color: '#595959' }}>性价比最高，同等花钱省能源最多</Text>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px 16px', background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>单位面积节能收益 · 收益梯队</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#1677ff' }}>{bestAreaBenefit?.areaBenefit.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>元/㎡/年</Text>
              </div>
              <div style={{ marginTop: 6 }}>
                {sortedByAreaBenefit.slice(0, 3).map((t, i) => (
                  <Tag key={t.techId} color={i === 0 ? 'blue' : i === 1 ? 'processing' : 'default'} style={{ fontSize: 11 }}>
                    {t.techName}: {t.areaBenefit.toFixed(1)}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* 柱状图 ×2 */}
        <Row gutter={16}>
          <Col span={12}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>万元投资节能量对比 (tce/万元)</Text>
            <ReactEChartsCore option={makeBarOption(techData.map((t) => t.investCoalEff), 'tce/万元', '#52c41a')} style={{ height: 300 }} />
          </Col>
          <Col span={12}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>单位面积节能收益对比 (元/㎡/年)</Text>
            <ReactEChartsCore option={makeBarOption(techData.map((t) => t.areaBenefit), '元/㎡/年', '#1677ff')} style={{ height: 300 }} />
          </Col>
        </Row>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度二：经济性回报维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>经济性回报维度</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#fff7e6', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        {/* KPI 判断卡片 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>投资回收期分布</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['short', 'mid', 'long'] as const).map((cls) =>
                  paybackGroups[cls].length > 0 ? (
                    <Tag key={cls} color={PAYBACK_COLORS[cls]} style={{ fontSize: 11 }}>
                      {PAYBACK_LABELS[cls]}: {paybackGroups[cls].map((t) => t.techName).join('、')}
                    </Tag>
                  ) : null
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  {paybackGroups.short.length}项优先落地 · {paybackGroups.mid.length}项EMC分成{paybackGroups.long.length > 0 ? ` · ${paybackGroups.long.length}项智慧配套` : ''}
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #d9f7be', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>年均净收益率</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#52c41a' }}>{bestNetReturn?.netReturnRate.toFixed(1)}%</Text>
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag color="success" style={{ fontSize: 11 }}>{bestNetReturn?.techName}</Tag>
                <Text style={{ fontSize: 12, color: '#595959' }}>盈利最强</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: dragTechs.length > 0 ? '#fff2f0' : '#f6ffed', borderRadius: 8, border: dragTechs.length > 0 ? '1px solid #ffccc7' : '1px solid #d9f7be', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>运维成本占比</Text>
              <div style={{ marginTop: 8 }}>
                {techData.map((t) => (
                  <div key={t.techId} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Tag color={t.maintClass === 'drag' ? 'error' : t.maintClass === 'normal' ? 'warning' : 'success'} style={{ fontSize: 11 }}>
                      {t.techName}: {t.maintenanceRatio.toFixed(1)}%
                    </Tag>
                    {t.maintClass === 'drag' && <Text style={{ fontSize: 11, color: '#ff4d4f' }}>高运维拖累</Text>}
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* 柱状图 ×3 */}
        <Row gutter={16}>
          <Col span={8}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>静态投资回收期 (年)</Text>
            <ReactEChartsCore option={{
              tooltip: { trigger: 'axis' as const },
              grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
              xAxis: { type: 'category' as const, data: techNames, axisLabel: { fontSize: 11, rotate: 15 } },
              yAxis: { type: 'value' as const, name: '年', nameTextStyle: { fontSize: 11 } },
              visualMap: { show: false, dimension: 1, pieces: [{ lte: 3, color: '#52c41a' }, { gt: 3, lte: 6, color: '#1677ff' }, { gt: 6, color: '#fa8c16' }] },
              series: [{
                type: 'bar', data: techData.map((t) => t.paybackPeriod),
                itemStyle: { borderRadius: [4, 4, 0, 0] },
                barWidth: 28,
                label: { show: true, position: 'top', fontSize: 10, formatter: (p: { value: number }) => p.value >= 999 ? '-' : p.value.toFixed(1) + '年' },
                markLine: { silent: true, data: [{ yAxis: 3, name: '3年', lineStyle: { color: '#52c41a', type: 'dashed' as const } }, { yAxis: 6, name: '6年', lineStyle: { color: '#1677ff', type: 'dashed' as const } }], label: { fontSize: 10 } },
              }],
            }} style={{ height: 280 }} />
          </Col>
          <Col span={8}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>年均净收益率对比 (%)</Text>
            <ReactEChartsCore option={makeBarOption(techData.map((t) => t.netReturnRate), '%', '#fa8c16')} style={{ height: 280 }} />
          </Col>
          <Col span={8}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>运维成本占比对比 (%)</Text>
            <ReactEChartsCore option={makeBarOption(techData.map((t) => t.maintenanceRatio), '%', '#eb2f96', 20)} style={{ height: 280 }} />
          </Col>
        </Row>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度三：能源政策成本维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 600 }}>能源政策成本维度</span>}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{ background: '#e6fffb', borderBottom: '1px solid #e8ecf0' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        {/* KPI 判断卡片 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>电价浮动敏感性</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: '#595959' }}>{elecSensitivityConclusion || '暂无数据'}</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>储热类技术谷电蓄热，峰谷价差扩大利好</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>天然气价格敏感性</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: '#595959' }}>{gasSensitivityConclusion || '暂无数据'}</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>天然气涨价利好热泵替代燃气锅炉</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px 16px', background: '#e6fffb', borderRadius: 8, border: '1px solid #b5f5ec', height: '100%' }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>碳资产潜力</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 20, color: '#13c2c2' }}>{totalCarbonSaving.toFixed(0)}</Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>tCO₂/年 已节碳</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  剩余可挖掘 {totalRemainingCarbon.toFixed(0)} tCO₂/年
                  {subsidyEstimate > 0 && ` · 预计可申报补贴 ${subsidyEstimate.toFixed(1)} 万元`}
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        {/* 柱状图 ×2 */}
        <Row gutter={16}>
          <Col span={12}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>电价浮动敏感性 (年节约费用 万元/年)</Text>
            <ReactEChartsCore option={makeSensitivityBar(techData.map((t) => t.elecSensitivity), '万元/年')} style={{ height: 320 }} />
          </Col>
          <Col span={12}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959', display: 'block', marginBottom: 8 }}>碳资产潜力 (tCO₂/年)</Text>
            <ReactEChartsCore option={makeCarbonStackOption()} style={{ height: 320 }} />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
