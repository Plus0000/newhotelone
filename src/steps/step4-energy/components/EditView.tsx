import { useState, useEffect, useCallback } from 'react';
import { Steps, Button, Typography, message, Space, Modal } from 'antd';
import { LeftOutlined, RightOutlined, BarChartOutlined } from '@ant-design/icons';
import type {
  EnergyPrices,
  EnergyByType,
  ZoneConfig,
  SavingEquipment,
  OriginalEquipment,
  Step4ProjectData,
  Step4TechData,
} from '@/shared/stores/projectStore';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import StepBasicInfo from './StepBasicInfo';
import StepConditionSetting from './StepConditionSetting';
import StepCalculation from './StepCalculation';
import DataAnalysis from './DataAnalysis';
import {
  getEnergyPricesByLocation,
  createDefaultZoneConfig,
  getSimultaneousCoeff,
  migrateSystemNames,
  aggregateEnergyByType,
  DEFAULT_PRICES,
} from './helpers';

const { Text } = Typography;

// ── Step 3 / 4 占位 ──

function StepComingSoon({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        color: '#8c8c8c',
        fontSize: 14,
        gap: 12,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color: '#1677ff',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 13 14 20 7" />
          <polyline points="14 7 20 7 20 13" />
        </svg>
      </div>
      <Text style={{ fontSize: 16, fontWeight: 600, color: '#595959' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: '#bfbfbf' }}>即将到来，敬请期待</Text>
    </div>
  );
}

// ── Step Config ────────────────────────────────────────────────────────

const STEP_CONFIGS = [
  { key: 'basicInfo', title: '基本信息', shortTitle: '基本信息' },
  { key: 'condition', title: '条件设定', shortTitle: '条件设定' },
  { key: 'calculation', title: '节能计算', shortTitle: '节能计算' },
] as const;

// 区域顺序（与 StepConditionSetting 的 ZONES 一致），用于校验提示按页面顺序展示
const ZONE_ORDER = [
  '门诊',
  '急诊',
  '医技',
  '病房和感染',
  '行政后勤',
  '教学科研',
  '健康管理',
] as const;

// ── Props ──────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  onComplete: () => void;
}

// ── Main Component ─────────────────────────────────────────────────────

export default function EditView({ projectId, onComplete }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const projectsStep4Data = useProjectStore((s) => s.projectsStep4Data);
  const projectsStep3Data = useProjectStore((s) => s.projectsStep3Data);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const saveProjectStep4Data = useProjectStore((s) => s.saveProjectStep4Data);
  const setStep4Editing = useProjectStore((s) => s.setStep4Editing);
  const setFlatStepIndex = useProjectStore((s) => s.setFlatStepIndex);
  const techEntries = useMergedTechEntries();

  const project = projects.find((p) => p.id === projectId);

  const [currentStep, setCurrentStep] = useState(0);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  // 进入/退出编辑模式，控制主步骤底部栏显隐
  useEffect(() => {
    setStep4Editing(true);
    return () => setStep4Editing(false);
  }, [setStep4Editing]);

  // ── Form data ──
  const [energyPrices, setEnergyPrices] = useState<EnergyPrices | null>(null);
  const [zoneConfigs, setZoneConfigs] = useState<Record<string, ZoneConfig>>({});
  const [savingEquipments, setSavingEquipments] = useState<Record<string, SavingEquipment[]>>({});
  const [originalEquipments, setOriginalEquipments] = useState<OriginalEquipment[]>([]);

  // Initialize form data when project changes
  useEffect(() => {
    if (!project) return;

    const existing = projectsStep4Data[project.id];

    if (existing?.energyPrices) {
      setEnergyPrices({ ...DEFAULT_PRICES, ...existing.energyPrices });
    } else {
      const ref = getEnergyPricesByLocation(project.location);
      setEnergyPrices(ref ?? { ...DEFAULT_PRICES });
    }

    if (existing?.zoneConfigs) {
      const newZoneNames = [
        '门诊',
        '急诊',
        '医技',
        '病房和感染',
        '行政后勤',
        '教学科研',
        '健康管理',
      ];
      const hasOldNames = Object.keys(existing.zoneConfigs).some(
        (k) => k === '病房' || k === '行政',
      );
      const presentNewZones = Object.keys(existing.zoneConfigs).filter((k) =>
        newZoneNames.includes(k),
      ).length;
      const isOldData = hasOldNames || presentNewZones < 7;
      if (isOldData) {
        setZoneConfigs({
          门诊: createDefaultZoneConfig('门诊'),
          医技: createDefaultZoneConfig('医技'),
          病房和感染: createDefaultZoneConfig('病房和感染'),
          急诊: createDefaultZoneConfig('急诊'),
          行政后勤: createDefaultZoneConfig('行政后勤'),
          教学科研: createDefaultZoneConfig('教学科研'),
          健康管理: createDefaultZoneConfig('健康管理'),
        });
      } else {
        // 补充 enabled 字段（兼容旧数据）
        const migrated = Object.fromEntries(
          Object.entries(existing.zoneConfigs).map(([k, v]) => [
            k,
            { ...v, enabled: v.enabled ?? true },
          ]),
        );
        setZoneConfigs(migrated);
      }
    } else {
      setZoneConfigs({
        门诊: createDefaultZoneConfig('门诊'),
        医技: createDefaultZoneConfig('医技'),
        病房和感染: createDefaultZoneConfig('病房和感染'),
        急诊: createDefaultZoneConfig('急诊'),
        行政后勤: createDefaultZoneConfig('行政后勤'),
        教学科研: createDefaultZoneConfig('教学科研'),
        健康管理: createDefaultZoneConfig('健康管理'),
      });
    }

    // Original equipments - 迁移旧数据"空调"->"制冷"
    if (existing?.originalEquipments) {
      const migrated = existing.originalEquipments.map((eq) => ({
        ...eq,
        systemCategory: migrateSystemNames(
          Array.isArray(eq.systemCategory) ? eq.systemCategory : [eq.systemCategory],
        ),
      }));
      setOriginalEquipments(migrated);
    } else {
      setOriginalEquipments([]);
    }

    // Saving equipments - 加载已保存数据（systems/serviceTargets/operatingHours 等用户输入）
    // L150 的同步 useEffect 会基于 prev 保留这些字段，只补全 Step 3 新增/删除的设备
    if (existing?.savingEquipments) {
      const migrated: Record<string, SavingEquipment[]> = {};
      for (const [techId, list] of Object.entries(existing.savingEquipments)) {
        migrated[techId] = list.map((eq) => ({
          ...eq,
          systems: migrateSystemNames(Array.isArray(eq.systems) ? eq.systems : []),
        }));
      }
      setSavingEquipments(migrated);
    } else {
      setSavingEquipments({});
    }

    setCurrentStep(0);
  }, [project?.id]);

  // Saving equipments - sync with Step 3 main equipment
  // 单独 useEffect：Step 3 设备/技术变化时增量同步，基于 prev 保留用户未保存的修改
  useEffect(() => {
    if (!project) return;

    const techIds = projectsStep3SelectedTechs[project.id] ?? [];
    const step3Data = projectsStep3Data[project.id] ?? {};

    setSavingEquipments((prev) => {
      const updated: Record<string, SavingEquipment[]> = {};
      for (const techId of techIds) {
        const step3 = step3Data[techId];
        const mainEqs = step3?.equipment.filter((r) => r.isMainEquipment) ?? [];
        if (mainEqs.length === 0) continue;

        const oldList = prev[techId] ?? [];
        updated[techId] = mainEqs.map((eq) => {
          const saved =
            oldList.find((s) => s.id === eq.id) ?? oldList.find((s) => s.equipmentName === eq.name);
          if (saved) {
            return {
              ...saved,
              id: eq.id,
              equipmentName: eq.name,
              systems: migrateSystemNames(saved.systems),
              ratedPower: saved.ratedPower ?? eq.powerKw ?? 0,
              unit: saved.unit ?? eq.powerUnit ?? 'kW',
              quantity: saved.quantity ?? eq.quantity ?? 1,
            };
          }
          return {
            id: eq.id,
            techId,
            equipmentName: eq.name,
            systems: [],
            ratedPower: eq.powerKw ?? 0,
            unit: eq.powerUnit ?? 'kW',
            quantity: eq.quantity ?? 1,
            serviceTargets: [],
            operatingHours: 0,
            simultaneousCoeff: getSimultaneousCoeff([]),
            energyConsumption: 0,
            operatingCost: 0,
          };
        });
      }
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, projectsStep3Data, projectsStep3SelectedTechs]);

  // Step 3 取消技术时，自动清理 originalEquipments 里的孤儿数据（避免"原方案合计"包含看不见的行）
  useEffect(() => {
    if (!project) return;
    const selectedTechIds = new Set(projectsStep3SelectedTechs[project.id] ?? []);
    setOriginalEquipments((prev) => {
      const filtered = prev.filter((o) => selectedTechIds.has(o.benchmarkTechId));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [project?.id, projectsStep3SelectedTechs]);

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!project) return;

    const existing = projectsStep4Data[project.id] ?? {
      investmentMode: '' as const,
      custodyYears: 0,
      techs: {},
      accountingStatus: 'pending' as const,
      author: typeof project.author === 'string' ? project.author : '',
      fillDate: typeof project.fillDate === 'string' ? project.fillDate : '',
    };

    // Step 3 选中的技术（用于过滤孤儿原方案数据）
    const selectedTechIds = new Set(projectsStep3SelectedTechs[project.id] ?? []);

    // Compute aggregated tech-level data from per-equipment detail
    const techIds = new Set<string>();
    for (const techId of Object.keys(savingEquipments)) techIds.add(techId);
    // 只保留 Step 3 选中的技术对应的原方案，避免孤儿数据
    for (const eq of originalEquipments) {
      if (selectedTechIds.has(eq.benchmarkTechId)) techIds.add(eq.benchmarkTechId);
    }

    // 先算分项数据
    const techStats: Record<
      string,
      {
        savingEnergy: number;
        savingCost: number;
        originalEnergy: number;
        originalCost: number;
        itemSavingRate: number;
        savingEnergyByType: EnergyByType;
        originalEnergyByType: EnergyByType;
      }
    > = {};
    let totalOriginalEnergy = 0;
    let totalSavingEnergy = 0;

    for (const techId of techIds) {
      const eqList = savingEquipments[techId] ?? [];
      const origList = originalEquipments.filter((o) => o.benchmarkTechId === techId);
      const savingEnergy = eqList.reduce((s, e) => s + (e.energyConsumption || 0), 0);
      const savingCost = eqList.reduce((s, e) => s + (e.operatingCost || 0), 0);
      const originalEnergy = origList.reduce((s, e) => s + (e.energyConsumption || 0), 0);
      const originalCost = origList.reduce((s, e) => s + (e.operatingCost || 0), 0);
      const savingEnergyByType = aggregateEnergyByType(eqList);
      const originalEnergyByType = aggregateEnergyByType(origList);
      const itemSavingRate =
        originalEnergy > 0 && savingEnergy > 0
          ? Math.max(0, Math.min(100, ((originalEnergy - savingEnergy) / originalEnergy) * 100))
          : 0;
      techStats[techId] = {
        savingEnergy,
        savingCost,
        originalEnergy,
        originalCost,
        itemSavingRate,
        savingEnergyByType,
        originalEnergyByType,
      };
      // 综合节能率口径：只把有原方案的技术的 savingEnergy/originalEnergy 累加，避免没填原方案的技术稀释节能率
      if (originalEnergy > 0) {
        totalOriginalEnergy += originalEnergy;
        totalSavingEnergy += savingEnergy;
      }
    }

    // 综合节能率：直接用 baseComprehensiveRate（去除 overlapFactor 折减，避免与 itemSavingRate 不一致）
    const baseComprehensiveRate =
      totalOriginalEnergy > 0
        ? ((totalOriginalEnergy - totalSavingEnergy) / totalOriginalEnergy) * 100
        : 0;
    const comprehensiveRate = Math.round(Math.min(100, baseComprehensiveRate) * 100) / 100;

    const computedTechs: Record<string, Step4TechData> = {};
    for (const techId of techIds) {
      const stats = techStats[techId] ?? {
        savingEnergy: 0,
        savingCost: 0,
        originalEnergy: 0,
        originalCost: 0,
        itemSavingRate: 0,
        savingEnergyByType: { electric: 0, gas: 0, heat: 0 },
        originalEnergyByType: { electric: 0, gas: 0, heat: 0 },
      };
      computedTechs[techId] = {
        techId,
        investmentMode: existing.investmentMode,
        custodyYears: existing.custodyYears,
        savingEnergyRun: stats.savingEnergy,
        savingCostRun: stats.savingCost,
        originalEnergyRun: stats.originalEnergy,
        originalCostRun: stats.originalCost,
        itemSavingRate: stats.itemSavingRate,
        comprehensiveRate,
        savingEnergyByType: stats.savingEnergyByType,
        originalEnergyByType: stats.originalEnergyByType,
      };
    }

    // 保存时过滤孤儿原方案数据（Step 3 取消的技术对应的原方案）
    const filteredOriginalEquipments = originalEquipments.filter((o) =>
      selectedTechIds.has(o.benchmarkTechId),
    );

    const updated: Step4ProjectData = {
      ...existing,
      techs: computedTechs,
      energyPrices: energyPrices ?? undefined,
      zoneConfigs: zoneConfigs,
      savingEquipments: savingEquipments,
      originalEquipments: filteredOriginalEquipments,
    };

    saveProjectStep4Data(project.id, updated);
    message.success('保存成功');
  }, [
    project,
    energyPrices,
    zoneConfigs,
    savingEquipments,
    originalEquipments,
    projectsStep4Data,
    saveProjectStep4Data,
    projectsStep3SelectedTechs,
  ]);

  const handleSaveAndNext = useCallback(() => {
    // 校验：条件设定步骤 - 勾选的区域必须填建筑面积
    if (currentStep === 1) {
      const enabledZones = ZONE_ORDER.filter((k) => zoneConfigs[k]?.enabled !== false);
      if (enabledZones.length === 0) {
        message.warning('请至少勾选一个区域');
        return;
      }
      const missingAreaZones = enabledZones.filter(
        (k) => !zoneConfigs[k]?.buildingArea || zoneConfigs[k]!.buildingArea! <= 0,
      );
      if (missingAreaZones.length > 0) {
        message.warning(`请填写勾选区域的建筑面积：${missingAreaZones.join('、')}`);
        return;
      }
    }
    handleSave();
    if (currentStep < STEP_CONFIGS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [handleSave, currentStep, zoneConfigs]);

  const handleComplete = useCallback(() => {
    // 校验：条件设定 - 勾选的区域必须填建筑面积
    const enabledZones = ZONE_ORDER.filter((k) => zoneConfigs[k]?.enabled !== false);
    if (enabledZones.length === 0) {
      message.warning('请至少勾选一个区域');
      return;
    }
    const missingAreaZones = enabledZones.filter(
      (k) => !zoneConfigs[k]?.buildingArea || zoneConfigs[k]!.buildingArea! <= 0,
    );
    if (missingAreaZones.length > 0) {
      message.warning(`请填写勾选区域的建筑面积：${missingAreaZones.join('、')}`);
      return;
    }

    // 校验：节能计算 - 至少一个节能方案设备运行时间 > 0（附属技术不参与）
    const isMainTech = (tid: string) => {
      const t = techEntries.find((e) => e.id === tid);
      return !t?.isDependentTech;
    };
    const hasRunningHours = Object.entries(savingEquipments).some(
      ([tid, list]) => isMainTech(tid) && list.some((e) => (e.operatingHours ?? 0) > 0),
    );
    if (!hasRunningHours) {
      message.warning('请先在「节能计算」中为至少一个设备设置作用系统和服务对象');
      return;
    }

    // 校验：原方案表至少有一条数据
    if (originalEquipments.length === 0) {
      message.warning('请先在「节能计算」中填写原方案表');
      return;
    }

    // 校验：每个有节能方案设备的技术，原方案设备能耗必须 > 0（附属技术不参与）
    const techIdsWithSaving = Object.keys(savingEquipments).filter(
      (tid) => isMainTech(tid) && (savingEquipments[tid] ?? []).length > 0,
    );
    const techIdsIncompleteOriginal = techIdsWithSaving.filter((tid) => {
      const origs = originalEquipments.filter((o) => o.benchmarkTechId === tid);
      if (origs.length === 0) return true; // 没原方案
      const totalEnergy = origs.reduce((s, e) => s + (e.energyConsumption || 0), 0);
      return totalEnergy <= 0; // 原方案能耗 ≤ 0（设备未填功率/数量/系统）
    });
    if (techIdsIncompleteOriginal.length > 0) {
      const techNames = techIdsIncompleteOriginal.map((tid) => {
        const t = techEntries.find((e) => e.id === tid);
        return t?.name ?? tid;
      });
      message.warning(
        `以下技术原方案数据不完整（能耗为 0），请检查设备功率/数量/系统：${techNames.join('、')}`,
      );
      return;
    }

    handleSave();
    onComplete();
  }, [zoneConfigs, savingEquipments, originalEquipments, handleSave, onComplete, techEntries]);

  // ── Render step content ──
  const renderStepContent = () => {
    if (!project || !energyPrices) return null;

    switch (currentStep) {
      case 0:
        return (
          <StepBasicInfo
            author={typeof project.author === 'string' ? project.author : ''}
            fillDate={typeof project.fillDate === 'string' ? project.fillDate : ''}
            location={project.location}
            energyPrices={energyPrices}
            onChange={setEnergyPrices}
          />
        );
      case 1:
        return <StepConditionSetting zoneConfigs={zoneConfigs} onChange={setZoneConfigs} />;
      case 2:
        return (
          <StepCalculation
            projectId={project.id}
            savingEquipments={savingEquipments}
            originalEquipments={originalEquipments}
            onChangeSaving={setSavingEquipments}
            onChangeOriginal={setOriginalEquipments}
            zoneConfigs={zoneConfigs}
            comprehensivePrice={energyPrices?.comprehensivePrice ?? 0}
            gasPrice={energyPrices?.gasPrice ?? 0}
          />
        );
      case 3:
        return <StepComingSoon title="辅助决策" />;
      default:
        return null;
    }
  };

  if (!project) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>项目不存在</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Steps 导航 - 已完成步骤可点击回退 */}
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
          current={currentStep}
          size="small"
          style={{ maxWidth: 500, margin: '0 auto' }}
          items={STEP_CONFIGS.map((s, i) => ({
            title: (
              <span
                style={{
                  fontSize: 13,
                  color: i === currentStep ? '#1677ff' : i < currentStep ? '#1677ff' : '#8c8c8c',
                  fontWeight: i === currentStep ? 600 : 400,
                  cursor: i < currentStep ? 'pointer' : 'default',
                }}
              >
                {s.shortTitle}
              </span>
            ),
            status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
            onClick: () => {
              if (i < currentStep) setCurrentStep(i);
            },
            style: { cursor: i < currentStep ? 'pointer' : 'default' },
          }))}
        />
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>{renderStepContent()}</div>

      {/* 底部操作栏 - 子步骤一站式推进 */}
      <div
        style={{
          padding: '16px 0 0',
          marginTop: 24,
          borderTop: '1px solid #e8ecf0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {currentStep > 0 ? (
          <Button onClick={() => setCurrentStep((s) => s - 1)} icon={<LeftOutlined />}>
            上一步
          </Button>
        ) : (
          <Button onClick={() => setFlatStepIndex(6)} icon={<LeftOutlined />}>
            上一步
          </Button>
        )}
        {currentStep < STEP_CONFIGS.length - 1 ? (
          <Button type="primary" onClick={handleSaveAndNext}>
            下一步
            <RightOutlined />
          </Button>
        ) : (
          <Space>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => {
                handleSave();
                setAnalysisOpen(true);
              }}
            >
              数据分析
            </Button>
            <Button type="primary" onClick={handleComplete}>
              进入辅助决策
              <RightOutlined />
            </Button>
          </Space>
        )}
      </div>

      <Modal
        open={analysisOpen}
        onCancel={() => setAnalysisOpen(false)}
        footer={null}
        width="92vw"
        style={{ top: 24, maxWidth: 1400 }}
        styles={{ body: { maxHeight: '82vh', overflowY: 'auto', paddingTop: 8 } }}
        title="数据分析"
        destroyOnClose
      >
        <DataAnalysis projectId={projectId} />
      </Modal>
    </div>
  );
}
