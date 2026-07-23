import { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Typography, Empty, Select, Tag, InputNumber, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { InfoCircleOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import {
  calcCoalSaving,
  calcCarbonSavingByType,
  calcCarbonEmissionByType,
  calcInvestCoalEfficiency,
  calcAreaBenefit,
  calcAverageLine,
  calcGrossIncome,
  calcNetIncome,
  calcPaybackPeriod,
  calcNetReturnRate,
  calcMaintenanceRatio,
  calcScenarioSaving,
  calcRelativeAdvantageRate,
  calcRemainingReductionByType,
  calcCarbonRevenue,
  classifyPayback,
  classifyMaintenance,
  migrateTechEnergyByType,
} from './helpers';
import type { EnergyByType } from '@/shared/stores/projectStore';
import { DEFAULT_CARBON_PRICE, CARBON_PRICE_UPDATE_DATE } from '@/data/carbonPrice';

const { Text } = Typography;

// ── Constants ────────────────────────────────────────────────────────

const PRICE_SCENARIOS = [-0.2, -0.1, 0, 0.1, 0.2];
const SCENARIO_LABELS = ['-20%', '-10%', '基准', '+10%', '+20%'];
const PAYBACK_LABELS: Record<string, string> = {
  short: '优先落地',
  mid: 'EMC分成',
  long: '智慧配套',
};
const PAYBACK_COLORS: Record<string, string> = {
  short: '#52c41a',
  mid: '#1677ff',
  long: '#fa8c16',
};

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  projectId?: string;
}

// ── Types ────────────────────────────────────────────────────────────

interface TechAgg {
  techId: string;
  techName: string;
  energyType: string;
  // 基础口径
  fixedInvestment: number; // 万元
  maintenanceCost: number; // 万元/年
  grossIncome: number; // 万元/年（年度毛收益）
  netIncome: number; // 万元/年（年度净收益）
  originalEnergyRun: number; // 万kWh/年
  savingEnergyRun: number; // 万kWh/年
  originalEnergyByType: EnergyByType; // 按能源类型拆分（碳排计算用）
  savingEnergyByType: EnergyByType;
  originalCostRun: number; // 万元/年
  savingCostRun: number; // 万元/年
  gasCostSaving: number; // 万元/年（气费节省，用于气价敏感性）
  elecCostSaving: number; // 万元/年（电费节省，= 总费用节省 - 气费节省）
  // 节能效率
  coalSaving: number; // tce/年
  investCoalEff: number | null; // tce/万元
  areaBenefit: number | null; // 元/㎡/年
  // 经济性回报
  paybackPeriod: number | null; // 年
  netReturnRate: number | null; // %
  maintenanceRatio: number | null; // %
  paybackClass: 'short' | 'mid' | 'long';
  maintClass: 'good' | 'normal' | 'drag' | 'unknown';
  // 碳资产
  originalCarbon: number; // tCO₂/年
  savingCarbon: number; // tCO₂/年
  carbonSaving: number; // tCO₂/年
  remainingReduction: number; // tCO₂/年
  carbonRevenue: number; // 元/年（用当前碳价算）
  // 敏感性
  elecScenarios: number[]; // 各情景节省收益（万元）
  elecAdvantageRates: (number | null)[]; // 相对优势变化率 %
  gasScenarios: number[];
  // 上下文
  totalArea: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, digits = 2, suffix = ''): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  return `${v.toFixed(digits)}${suffix}`;
}

function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  return Math.round(v).toLocaleString();
}

// 维度标题：左侧色条 + 标题文字
function dimTitle(idx: string, title: string, color: string) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          display: 'inline-block',
          width: 4,
          height: 16,
          background: color,
          borderRadius: 2,
        }}
      />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>
        {idx}、{title}
      </span>
    </span>
  );
}

// 图表标题：左侧细色条 + 标题
function chartTitle(text: string, color: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span
        style={{
          display: 'inline-block',
          width: 3,
          height: 12,
          background: color,
          borderRadius: 2,
        }}
      />
      <Text style={{ fontSize: 12, fontWeight: 600, color: '#595959' }}>{text}</Text>
    </div>
  );
}

// 维度主色
const DIM_COLORS = {
  basic: '#8c8c8c',
  efficiency: '#52c41a',
  economic: '#fa8c16',
  sensitivity: '#13c2c2',
  carbon: '#389e0d',
};

// KPI 卡片基础样式
function kpiCard(background: string, border: string) {
  return {
    padding: '14px 18px',
    background,
    borderRadius: 10,
    border: `1px solid ${border}`,
    height: '100%',
  };
}

// ── Component ────────────────────────────────────────────────────────

export default function DataAnalysis({ projectId: lockedProjectId }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const saveProjectStep4Data = useProjectStore((s) => s.saveProjectStep4Data);
  const techEntries = useMergedTechEntries();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(lockedProjectId ?? 'all');

  const effectiveProjectId = lockedProjectId ?? selectedProjectId;

  // ── 碳价：从 store 读取，未配置用默认值 ──
  const targetProjectForCarbon =
    effectiveProjectId === 'all' ? projects[0] : projects.find((p) => p.id === effectiveProjectId);
  const storedCarbonPrice = targetProjectForCarbon
    ? projectsStep4Data[targetProjectForCarbon.id]?.carbonPrice
    : undefined;
  const [carbonPrice, setCarbonPrice] = useState<number>(storedCarbonPrice ?? DEFAULT_CARBON_PRICE);

  // 切换项目时同步 carbonPrice state（storedCarbonPrice 是 derived 值，useState 只在 mount 时读一次）
  useEffect(() => {
    setCarbonPrice(storedCarbonPrice ?? DEFAULT_CARBON_PRICE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProjectId]);

  const handleCarbonPriceChange = (val: number | null) => {
    const v = val ?? DEFAULT_CARBON_PRICE;
    setCarbonPrice(v);
    // 保存到当前项目（非"全部项目"模式）
    if (targetProjectForCarbon) {
      const existing = projectsStep4Data[targetProjectForCarbon.id] ?? {
        investmentMode: '' as const,
        custodyYears: 0,
        techs: {},
        accountingStatus: 'pending' as const,
        author: '',
        fillDate: '',
      };
      saveProjectStep4Data(targetProjectForCarbon.id, { ...existing, carbonPrice: v });
    }
  };

  // ── 项目选择器选项 ──
  const projectOptions = useMemo(() => {
    if (lockedProjectId) return [];
    const valid = projects.filter(
      (p) =>
        projectsStep4Data[p.id]?.techs && Object.keys(projectsStep4Data[p.id].techs!).length > 0,
    );
    return [
      { value: 'all', label: '全部项目' },
      ...valid.map((p) => ({ value: p.id, label: p.projectName || p.hospitalName })),
    ];
  }, [lockedProjectId, projects, projectsStep4Data]);

  // ── 聚合技术数据 ──
  const techData: TechAgg[] = useMemo(() => {
    const targetProjects =
      effectiveProjectId === 'all' ? projects : projects.filter((p) => p.id === effectiveProjectId);

    const techMap: Record<string, TechAgg> = {};

    for (const p of targetProjects) {
      const step4 = projectsStep4Data[p.id];
      const step3 = projectsStep3Data[p.id];
      if (!step4?.techs) continue;
      const totalArea = p.totalArea ?? 0;
      const province = p.location?.[0];

      for (const [techId, tdRaw] of Object.entries(step4.techs)) {
        const td = migrateTechEnergyByType(tdRaw);
        const tech = techEntries.find((t) => t.id === techId);
        const name = tech?.name ?? techId;
        const inv = step3?.[techId];
        const fixedInvestment = inv?.fixedInvestment ?? 0;
        const maintenanceCost = inv?.maintenanceCost ?? 0;
        const grossIncome = calcGrossIncome(td.originalCostRun, td.savingCostRun);
        const netIncome = calcNetIncome(grossIncome, maintenanceCost);
        const coalSaving = calcCoalSaving(td.originalEnergyRun, td.savingEnergyRun);
        const originalCarbon = calcCarbonEmissionByType(td.originalEnergyByType, province);
        const savingCarbon = calcCarbonEmissionByType(td.savingEnergyByType, province);
        const carbonSaving = calcCarbonSavingByType(
          td.originalEnergyByType,
          td.savingEnergyByType,
          province,
        );
        const remainingReduction = calcRemainingReductionByType(td.savingEnergyByType, province);
        const carbonRevenue = calcCarbonRevenue(carbonSaving, carbonPrice);
        // 气费/电费节省拆分：gasCostSaving = 气量差 × 10000 × 气价；电费节省 = 总费用节省 - 气费节省
        const gasPrice = step4?.energyPrices?.gasPrice ?? 0;
        const totalCostSaving = td.originalCostRun - td.savingCostRun;
        const gasCostSaving =
          (td.originalEnergyByType.gas - td.savingEnergyByType.gas) * 10000 * gasPrice;
        const elecCostSaving = totalCostSaving - gasCostSaving;

        if (!techMap[techId]) {
          techMap[techId] = {
            techId,
            techName: name,
            energyType: tech?.energyType ?? '电耗',
            fixedInvestment: 0,
            maintenanceCost: 0,
            grossIncome: 0,
            netIncome: 0,
            originalEnergyRun: 0,
            savingEnergyRun: 0,
            originalEnergyByType: { electric: 0, gas: 0, heat: 0 },
            savingEnergyByType: { electric: 0, gas: 0, heat: 0 },
            originalCostRun: 0,
            savingCostRun: 0,
            gasCostSaving: 0,
            elecCostSaving: 0,
            coalSaving: 0,
            investCoalEff: null,
            areaBenefit: null,
            paybackPeriod: null,
            netReturnRate: null,
            maintenanceRatio: null,
            paybackClass: 'long',
            maintClass: 'unknown',
            originalCarbon: 0,
            savingCarbon: 0,
            carbonSaving: 0,
            remainingReduction: 0,
            carbonRevenue: 0,
            elecScenarios: [],
            elecAdvantageRates: [],
            gasScenarios: [],
            totalArea: 0,
          };
        }
        const agg = techMap[techId];
        agg.fixedInvestment += fixedInvestment;
        agg.maintenanceCost += maintenanceCost;
        agg.grossIncome += grossIncome;
        agg.netIncome += netIncome;
        agg.originalEnergyRun += td.originalEnergyRun;
        agg.savingEnergyRun += td.savingEnergyRun;
        agg.originalEnergyByType.electric += td.originalEnergyByType.electric;
        agg.originalEnergyByType.gas += td.originalEnergyByType.gas;
        agg.originalEnergyByType.heat += td.originalEnergyByType.heat;
        agg.savingEnergyByType.electric += td.savingEnergyByType.electric;
        agg.savingEnergyByType.gas += td.savingEnergyByType.gas;
        agg.savingEnergyByType.heat += td.savingEnergyByType.heat;
        agg.originalCostRun += td.originalCostRun;
        agg.savingCostRun += td.savingCostRun;
        agg.gasCostSaving += gasCostSaving;
        agg.elecCostSaving += elecCostSaving;
        agg.coalSaving += coalSaving;
        agg.originalCarbon += originalCarbon;
        agg.savingCarbon += savingCarbon;
        agg.carbonSaving += carbonSaving;
        agg.remainingReduction += remainingReduction;
        agg.carbonRevenue += carbonRevenue;
        agg.totalArea += totalArea;
      }
    }

    // 重新计算聚合后的派生指标（含敏感性分析，用聚合后的 originalCostRun/savingCostRun）
    return Object.values(techMap).map((t) => {
      const paybackPeriod = calcPaybackPeriod(t.fixedInvestment, t.netIncome);
      const netReturnRate = calcNetReturnRate(t.netIncome, t.fixedInvestment);
      const maintenanceRatio = calcMaintenanceRatio(t.maintenanceCost, t.grossIncome);
      // 敏感性分析：用聚合后的能耗费用重算，避免单项目数据被覆盖
      const baselineSaving = calcScenarioSaving(t.originalCostRun, t.savingCostRun, 0);
      const elecScenarios = PRICE_SCENARIOS.map((s) =>
        calcScenarioSaving(t.originalCostRun, t.savingCostRun, s),
      );
      const elecAdvantageRates = elecScenarios.map((s) =>
        calcRelativeAdvantageRate(s, baselineSaving),
      );
      // 气价敏感性：用真实的气费节省（气价波动只影响气费部分，电费不变）
      const gasScenarios = PRICE_SCENARIOS.map(
        (s) => t.elecCostSaving + t.gasCostSaving * (1 + s),
      );
      return {
        ...t,
        investCoalEff: calcInvestCoalEfficiency(t.coalSaving, t.fixedInvestment),
        areaBenefit: calcAreaBenefit(t.netIncome, t.totalArea),
        paybackPeriod,
        netReturnRate,
        maintenanceRatio,
        elecScenarios,
        elecAdvantageRates,
        gasScenarios,
        paybackClass: classifyPayback(paybackPeriod),
        maintClass: classifyMaintenance(maintenanceRatio),
      };
    });
  }, [
    effectiveProjectId,
    projects,
    projectsStep4Data,
    projectsStep3Data,
    techEntries,
    carbonPrice,
  ]);

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
  function makeBarOption(
    values: (number | null)[],
    unit: string,
    barColor: string,
    avgVal?: number | null,
  ) {
    const ml: any[] = [{ type: 'average' as const, name: '平均值' }];
    if (avgVal !== undefined && avgVal !== null) {
      ml.push({
        yAxis: avgVal,
        name: '平均线',
        lineStyle: { color: '#fa8c16', type: 'dashed' as const, width: 2 },
        label: { formatter: `平均 ${avgVal.toFixed(2)}`, fontSize: 10 },
      });
    }
    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: { name: string; value: number | null }[]) => {
          const p = params[0];
          return `${p.name}<br/>${p.value === null ? '-' : p.value.toFixed(2)} ${unit}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: techNames,
        axisLabel: { fontSize: 11, rotate: 15 },
      },
      yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 11 } },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
          barWidth: 28,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#595959',
            formatter: (p: { value: number | null }) =>
              p.value === null ? '-' : p.value.toFixed(1),
          },
          markLine: {
            silent: true,
            data: ml,
            lineStyle: { type: 'dashed' as const, color: '#fa8c16', width: 2 },
            label: { formatter: '{b}', fontSize: 10 },
          },
        },
      ],
    };
  }

  // ── 电价敏感性分组柱状图 ──
  function makeSensitivityBar(values: number[][], unit: string) {
    const colors = ['#91caff', '#69b1ff', '#1677ff', '#fa8c16', '#ff4d4f'];
    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: any[]) => {
          let s = params[0]?.name ?? '';
          for (const p of params)
            s += `<br/>${p.marker}${p.seriesName}: ${p.value.toFixed(2)} ${unit}`;
          return s;
        },
      },
      legend: { data: SCENARIO_LABELS, bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: techNames,
        axisLabel: { fontSize: 11, rotate: 15 },
      },
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
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: any[]) => {
          let s = params[0]?.name ?? '';
          for (const p of params)
            s += `<br/>${p.marker}${p.seriesName}: ${p.value.toFixed(1)} tCO₂/年`;
          return s;
        },
      },
      legend: { data: ['新方案排放', '已节碳量'], bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: techNames,
        axisLabel: { fontSize: 11, rotate: 15 },
      },
      yAxis: { type: 'value' as const, name: 'tCO₂/年', nameTextStyle: { fontSize: 11 } },
      series: [
        {
          name: '新方案排放',
          type: 'bar' as const,
          stack: 'total',
          data: techData.map((t) => t.savingCarbon),
          itemStyle: { color: '#faad14', borderRadius: [0, 0, 0, 0] },
          barWidth: 32,
          label: {
            show: true,
            fontSize: 10,
            formatter: (p: { value: number }) => (p.value > 0 ? p.value.toFixed(0) : ''),
          },
        },
        {
          name: '已节碳量',
          type: 'bar' as const,
          stack: 'total',
          data: techData.map((t) => t.carbonSaving),
          itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
          label: {
            show: true,
            fontSize: 10,
            position: 'top',
            formatter: (p: { value: number }) => (p.value > 0 ? p.value.toFixed(0) : ''),
          },
        },
      ],
    };
  }

  // ── 计算各维度汇总 ──
  const avgInvestCoal = calcAverageLine(techData.map((t) => t.investCoalEff));
  const avgAreaBenefit = calcAverageLine(techData.map((t) => t.areaBenefit));
  const avgPayback = calcAverageLine(techData.map((t) => t.paybackPeriod));
  const avgNetReturnRate = calcAverageLine(techData.map((t) => t.netReturnRate));
  const avgMaintenanceRatio = calcAverageLine(techData.map((t) => t.maintenanceRatio));

  const sortedByInvestCoal = [...techData].sort(
    (a, b) => (b.investCoalEff ?? -Infinity) - (a.investCoalEff ?? -Infinity),
  );
  const sortedByAreaBenefit = [...techData].sort(
    (a, b) => (b.areaBenefit ?? -Infinity) - (a.areaBenefit ?? -Infinity),
  );
  const bestInvestCoal = sortedByInvestCoal[0];
  const bestAreaBenefit = sortedByAreaBenefit[0];

  const paybackGroups = {
    short: techData.filter((t) => t.paybackClass === 'short'),
    mid: techData.filter((t) => t.paybackClass === 'mid'),
    long: techData.filter((t) => t.paybackClass === 'long'),
  };
  const bestNetReturn = [...techData].sort(
    (a, b) => (b.netReturnRate ?? -Infinity) - (a.netReturnRate ?? -Infinity),
  )[0];
  const dragTechs = techData.filter((t) => t.maintClass === 'drag');

  const totalCarbonSaving = techData.reduce((s, t) => s + t.carbonSaving, 0);
  const totalRemainingReduction = techData.reduce((s, t) => s + t.remainingReduction, 0);
  const totalCarbonRevenue = techData.reduce((s, t) => s + t.carbonRevenue, 0);
  const totalNetIncome = techData.reduce((s, t) => s + t.netIncome, 0);

  // ── 基础口径表格列 ──
  const basicColumns: ColumnsType<TechAgg> = [
    { title: '技术', dataIndex: 'techName', key: 'techName', width: 160 },
    {
      title: '固定资产投资(万元)',
      dataIndex: 'fixedInvestment',
      key: 'fixedInvestment',
      width: 130,
      align: 'right',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '年度运维费(万元/年)',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      width: 140,
      align: 'right',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '年度毛收益(万元/年)',
      dataIndex: 'grossIncome',
      key: 'grossIncome',
      width: 140,
      align: 'right',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '年度净收益(万元/年)',
      dataIndex: 'netIncome',
      key: 'netIncome',
      width: 140,
      align: 'right',
      render: (v: number) => v.toFixed(1),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 项目选择器 + 碳价 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card
          size="small"
          style={{ border: '1px solid #e8ecf0' }}
          bodyStyle={{ padding: '14px 20px' }}
        >
          <Row align="middle" gutter={32}>
            {!lockedProjectId && (
              <Col>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 32,
                    fontSize: 13,
                    color: '#595959',
                    fontWeight: 500,
                    marginRight: 8,
                    verticalAlign: 'middle',
                  }}
                >
                  分析项目
                </span>
                <Select
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                  options={projectOptions}
                  style={{ width: 280, verticalAlign: 'middle' }}
                  variant="filled"
                />
              </Col>
            )}
            <Col flex="auto">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                  fontSize: 13,
                  color: '#595959',
                  fontWeight: 500,
                  marginRight: 8,
                  verticalAlign: 'middle',
                }}
              >
                碳价
              </span>
              <InputNumber
                value={carbonPrice}
                onChange={handleCarbonPriceChange}
                min={0}
                step={1}
                addonAfter="元/tCO₂"
                style={{ width: 180, verticalAlign: 'middle' }}
              />
            </Col>
          </Row>
        </Card>
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid #d6e4ff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <InfoCircleOutlined
            style={{ color: '#1677ff', fontSize: 14, flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text style={{ fontSize: 12, color: '#595959' }}>
              <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>
                📅 当前默认碳价：
              </Text>
              <Text strong style={{ fontSize: 12, color: '#262626' }}>
                {DEFAULT_CARBON_PRICE} 元/tCO₂
              </Text>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                （更新于 {CARBON_PRICE_UPDATE_DATE}）
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#595959' }}>
              <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>🔗 数据来源：</Text>
              <a
                href="https://www.ccer.com.cn/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: '#1677ff',
                  textDecoration: 'none',
                  borderBottom: '1px dashed #1677ff',
                }}
              >
                ccer.com.cn
              </a>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                （全国碳市场 · 近一个月成交均价最大值）
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#595959' }}>
              <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>💡 更新方法：</Text>
              <Text style={{ fontSize: 12, color: '#595959' }}>
                访问上方链接 → 进入「行情信息」→ 选近一个月日期范围 → 取成交均价最大值 →
                填入上方输入框
              </Text>
            </Text>
            <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
              建议每季度人工核查更新一次；修改后仅对当前项目生效，未配置的项目仍使用默认值。
            </Text>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度一：统一基础口径 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={dimTitle('一', '统一基础口径', DIM_COLORS.basic)}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{
          background: 'linear-gradient(to right, #fafafa, transparent)',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 16px',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <Table
          rowKey="techId"
          dataSource={techData}
          columns={basicColumns}
          size="small"
          pagination={false}
          scroll={{ x: 720 }}
          summary={(data) => {
            const total = data.reduce(
              (acc, t) => ({
                fixedInvestment: acc.fixedInvestment + t.fixedInvestment,
                maintenanceCost: acc.maintenanceCost + t.maintenanceCost,
                grossIncome: acc.grossIncome + t.grossIncome,
                netIncome: acc.netIncome + t.netIncome,
              }),
              { fixedInvestment: 0, maintenanceCost: 0, grossIncome: 0, netIncome: 0 },
            );
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ fontWeight: 600, background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    {total.fixedInvestment.toFixed(1)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    {total.maintenanceCost.toFixed(1)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    {total.grossIncome.toFixed(1)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {total.netIncome.toFixed(1)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度二：节能效率维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={dimTitle('二', '节能效率维度', DIM_COLORS.efficiency)}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{
          background: 'linear-gradient(to right, #f0f5ff, transparent)',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 16px',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <div style={kpiCard('#f6ffed', '#d9f7be')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>万元投资节能量</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#52c41a' }}>
                  {fmtNum(bestInvestCoal?.investCoalEff)}
                </Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>tce/万元</Text>
                {avgInvestCoal !== null && (
                  <Text style={{ fontSize: 11, color: '#fa8c16', marginLeft: 12 }}>
                    平均线 {avgInvestCoal.toFixed(2)}
                  </Text>
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag color="success" style={{ fontSize: 11 }}>
                  {bestInvestCoal?.techName}
                </Tag>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  性价比最高，同等花钱省能源最多
                </Text>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={kpiCard('#f0f5ff', '#d6e4ff')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>单位面积节能收益 · 收益梯队</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#1677ff' }}>
                  {fmtNum(bestAreaBenefit?.areaBenefit, 1)}
                </Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>元/㎡/年</Text>
                {avgAreaBenefit !== null && (
                  <Text style={{ fontSize: 11, color: '#fa8c16', marginLeft: 12 }}>
                    平均线 {avgAreaBenefit.toFixed(1)}
                  </Text>
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                {sortedByAreaBenefit.slice(0, 3).map((t, i) => (
                  <Tag
                    key={t.techId}
                    color={i === 0 ? 'blue' : i === 1 ? 'processing' : 'default'}
                    style={{ fontSize: 11 }}
                  >
                    {t.techName}: {fmtNum(t.areaBenefit, 1)}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            {chartTitle('万元投资节能量对比 (tce/万元)', DIM_COLORS.efficiency)}
            <ReactEChartsCore
              option={makeBarOption(
                techData.map((t) => t.investCoalEff),
                'tce/万元',
                '#52c41a',
                avgInvestCoal,
              )}
              style={{ height: 300 }}
            />
          </Col>
          <Col span={12}>
            {chartTitle('单位面积节能收益对比 (元/㎡/年)', '#1677ff')}
            <ReactEChartsCore
              option={makeBarOption(
                techData.map((t) => t.areaBenefit),
                '元/㎡/年',
                '#1677ff',
                avgAreaBenefit,
              )}
              style={{ height: 300 }}
            />
          </Col>
        </Row>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度三：经济性回报维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={dimTitle('三', '经济性回报维度', DIM_COLORS.economic)}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{
          background: 'linear-gradient(to right, #fff7e6, transparent)',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 16px',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <div style={kpiCard('#fff7e6', '#ffd591')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>投资回收期分布</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['short', 'mid', 'long'] as const).map((cls) =>
                  paybackGroups[cls].length > 0 ? (
                    <Tag key={cls} color={PAYBACK_COLORS[cls]} style={{ fontSize: 11 }}>
                      {PAYBACK_LABELS[cls]}: {paybackGroups[cls].map((t) => t.techName).join('、')}
                    </Tag>
                  ) : null,
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  {paybackGroups.short.length}项优先落地 · {paybackGroups.mid.length}项EMC分成
                  {paybackGroups.long.length > 0 ? ` · ${paybackGroups.long.length}项智慧配套` : ''}
                  {avgPayback !== null && ` · 平均线 ${avgPayback.toFixed(1)}年`}
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={kpiCard('#f6ffed', '#d9f7be')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>年均净收益率</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 22, color: '#52c41a' }}>
                  {fmtNum(bestNetReturn?.netReturnRate, 1)}%
                </Text>
                {avgNetReturnRate !== null && (
                  <Text style={{ fontSize: 11, color: '#fa8c16', marginLeft: 12 }}>
                    平均线 {avgNetReturnRate.toFixed(1)}%
                  </Text>
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag color="success" style={{ fontSize: 11 }}>
                  {bestNetReturn?.techName}
                </Tag>
                <Text style={{ fontSize: 12, color: '#595959' }}>盈利最强</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={kpiCard(
                dragTechs.length > 0 ? '#fff2f0' : '#f6ffed',
                dragTechs.length > 0 ? '#ffccc7' : '#d9f7be',
              )}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>运维成本占比</Text>
                {avgMaintenanceRatio !== null && (
                  <Text style={{ fontSize: 11, color: '#fa8c16' }}>
                    平均线 {avgMaintenanceRatio.toFixed(1)}%
                  </Text>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                {techData.map((t) => (
                  <div
                    key={t.techId}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                  >
                    <Tag
                      color={
                        t.maintClass === 'drag'
                          ? 'error'
                          : t.maintClass === 'normal'
                            ? 'warning'
                            : t.maintClass === 'unknown'
                              ? 'default'
                              : 'success'
                      }
                      style={{ fontSize: 11 }}
                    >
                      {t.techName}: {fmtNum(t.maintenanceRatio, 1)}%
                    </Tag>
                    {t.maintClass === 'drag' && (
                      <Text style={{ fontSize: 11, color: '#ff4d4f' }}>高运维拖累</Text>
                    )}
                    {t.maintClass === 'unknown' && (
                      <Text style={{ fontSize: 11, color: '#8c8c8c' }}>毛收益≤0，无法评估</Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            {chartTitle('静态投资回收期 (年)', DIM_COLORS.economic)}
            <ReactEChartsCore
              option={{
                tooltip: {
                  trigger: 'axis' as const,
                  formatter: (params: { name: string; value: number | null }[]) => {
                    const p = params[0];
                    return `${p.name}<br/>${p.value === null ? '无回收期' : p.value.toFixed(1) + ' 年'}`;
                  },
                },
                grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
                xAxis: {
                  type: 'category' as const,
                  data: techNames,
                  axisLabel: { fontSize: 11, rotate: 15 },
                },
                yAxis: { type: 'value' as const, name: '年', nameTextStyle: { fontSize: 11 } },
                visualMap: {
                  show: false,
                  dimension: 1,
                  pieces: [
                    { lte: 3, color: '#52c41a' },
                    { gt: 3, lte: 6, color: '#1677ff' },
                    { gt: 6, color: '#fa8c16' },
                  ],
                },
                series: [
                  {
                    type: 'bar',
                    data: techData.map((t) => t.paybackPeriod),
                    itemStyle: { borderRadius: [4, 4, 0, 0] },
                    barWidth: 28,
                    label: {
                      show: true,
                      position: 'top',
                      fontSize: 10,
                      formatter: (p: { value: number | null }) =>
                        p.value === null ? '无回收期' : p.value.toFixed(1) + '年',
                    },
                    markLine: {
                      silent: true,
                      data: [
                        {
                          yAxis: 3,
                          name: '3年',
                          lineStyle: { color: '#52c41a', type: 'dashed' as const },
                        },
                        {
                          yAxis: 6,
                          name: '6年',
                          lineStyle: { color: '#1677ff', type: 'dashed' as const },
                        },
                      ],
                      label: { fontSize: 10 },
                    },
                  },
                ],
              }}
              style={{ height: 280 }}
            />
          </Col>
          <Col span={8}>
            {chartTitle('年均净收益率对比 (%)', '#fa8c16')}
            <ReactEChartsCore
              option={makeBarOption(
                techData.map((t) => t.netReturnRate),
                '%',
                '#fa8c16',
                avgNetReturnRate,
              )}
              style={{ height: 280 }}
            />
          </Col>
          <Col span={8}>
            {chartTitle('运维成本占比对比 (%)', '#eb2f96')}
            <ReactEChartsCore
              option={makeBarOption(
                techData.map((t) => t.maintenanceRatio),
                '%',
                '#eb2f96',
                avgMaintenanceRatio,
              )}
              style={{ height: 280 }}
            />
          </Col>
        </Row>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度四：能源价格敏感性分析 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={dimTitle('四', '能源价格敏感性分析', DIM_COLORS.sensitivity)}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{
          background: 'linear-gradient(to right, #e6fffb, transparent)',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 16px',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            {chartTitle('电价浮动 · 情景节省收益 (万元/年)', DIM_COLORS.sensitivity)}
            <ReactEChartsCore
              option={makeSensitivityBar(
                techData.map((t) => t.elecScenarios),
                '万元/年',
              )}
              style={{ height: 320 }}
            />
          </Col>
          <Col span={12}>
            {chartTitle('气价浮动 · 情景节省收益 (万元/年)', '#1677ff')}
            <ReactEChartsCore
              option={makeSensitivityBar(
                techData.map((t) => t.gasScenarios),
                '万元/年',
              )}
              style={{ height: 320 }}
            />
            <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
              注：气价波动只影响气费节省部分，电费节省不变
            </Text>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            {chartTitle('相对优势变化率 (%)', '#fa8c16')}
            <ReactEChartsCore
              option={{
                tooltip: {
                  trigger: 'axis' as const,
                  formatter: (params: any[]) => {
                    let s = params[0]?.name ?? '';
                    for (const p of params)
                      s += `<br/>${p.marker}${p.seriesName}: ${p.value === null ? '-' : p.value.toFixed(1) + '%'}`;
                    return s;
                  },
                },
                legend: {
                  data: SCENARIO_LABELS.filter((_, i) => i !== 2),
                  bottom: 0,
                  textStyle: { fontSize: 11 },
                },
                grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
                xAxis: {
                  type: 'category' as const,
                  data: techNames,
                  axisLabel: { fontSize: 11, rotate: 15 },
                },
                yAxis: { type: 'value' as const, name: '%', nameTextStyle: { fontSize: 11 } },
                series: SCENARIO_LABELS.map((label, i) =>
                  i === 2
                    ? null
                    : {
                        name: label,
                        type: 'bar' as const,
                        data: techData.map((t) => t.elecAdvantageRates[i]),
                        itemStyle: {
                          color: ['#91caff', '#69b1ff', '#fa8c16', '#ff4d4f'][i < 2 ? i : i - 1],
                          borderRadius: [3, 3, 0, 0],
                        },
                        barWidth: 16,
                      },
                ).filter(Boolean),
              }}
              style={{ height: 280 }}
            />
            <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
              相对优势变化率 = (情景节省收益 − 基准节省收益) ÷ |基准节省收益| × 100%；基准节省为 0
              时不计算
            </Text>
          </Col>
        </Row>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 维度五：碳资产潜力维度 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card
        size="small"
        title={dimTitle('五', '碳资产潜力维度', DIM_COLORS.carbon)}
        style={{ border: '1px solid #e8ecf0' }}
        headStyle={{
          background: 'linear-gradient(to right, #f6ffed, transparent)',
          borderBottom: '1px solid #e8ecf0',
          padding: '12px 16px',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <div style={kpiCard('#fff7e6', '#ffd591')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>年度节碳量合计</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                  {fmtInt(totalCarbonSaving)}
                </Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>tCO₂/年</Text>
              </div>
              <Text style={{ fontSize: 11, color: '#595959', marginTop: 4, display: 'block' }}>
                {totalCarbonSaving < 0 ? '碳排放增加，未形成减排' : '已实现减排'}
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={kpiCard('#f0f5ff', '#d6e4ff')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>剩余减排潜力</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
                  {fmtInt(totalRemainingReduction)}
                </Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>tCO₂/年</Text>
              </div>
              <Text style={{ fontSize: 11, color: '#595959', marginTop: 4, display: 'block' }}>
                = 新方案年度碳排放量
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={kpiCard('#e6fffb', '#b5f5ec')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>年度碳收益</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 20, color: '#13c2c2' }}>
                  {fmtInt(totalCarbonRevenue)}
                </Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>元/年</Text>
              </div>
              <Text style={{ fontSize: 11, color: '#595959', marginTop: 4, display: 'block' }}>
                ≈ {(totalCarbonRevenue / 10000).toFixed(2)} 万元/年（碳价 {carbonPrice} 元/tCO₂）
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={kpiCard('#f6ffed', '#d9f7be')}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>碳收益占比（占净收益）</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                  {totalNetIncome > 0
                    ? ((totalCarbonRevenue / 10000 / totalNetIncome) * 100).toFixed(1)
                    : '-'}
                  %
                </Text>
              </div>
              <Text style={{ fontSize: 11, color: '#595959', marginTop: 4, display: 'block' }}>
                净收益 {totalNetIncome.toFixed(1)} 万元/年
              </Text>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            {chartTitle('碳资产潜力对比 (tCO₂/年)', DIM_COLORS.carbon)}
            <ReactEChartsCore option={makeCarbonStackOption()} style={{ height: 320 }} />
            <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
              注：当前只算电力碳排放（省级电网因子），天然气/热力待 Step4 能耗分能源类型后扩展
            </Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
