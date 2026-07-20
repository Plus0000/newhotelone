import { useState, useEffect, useCallback } from 'react';
import { Steps, Button, Typography, message, Space, Modal } from 'antd';
import { LeftOutlined, RightOutlined, BarChartOutlined } from '@ant-design/icons';
import type { EnergyPrices, ZoneConfig, SavingEquipment, OriginalEquipment, Step4ProjectData, Step4TechData } from '@/shared/stores/projectStore';
import { useProjectStore } from '@/shared/stores/projectStore';
import StepBasicInfo from './StepBasicInfo';
import StepConditionSetting from './StepConditionSetting';
import StepCalculation from './StepCalculation';
import DataAnalysis from './DataAnalysis';
import { getEnergyPricesByLocation, createDefaultZoneConfig, getSimultaneousCoeff, migrateSystemNames } from './helpers';

const { Text } = Typography;

// ── Step 3 / 4 占位 ──

function StepComingSoon({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 300, color: '#8c8c8c', fontSize: 14, gap: 12,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32,
        background: 'linear-gradient(135deg, #f0f5ff, #e6f4ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: '#1677ff',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const ZONE_ORDER = ['门诊', '急诊', '医技', '病房和感染', '行政后勤', '教学科研', '健康管理'] as const;

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
      setEnergyPrices(existing.energyPrices);
    } else {
      const ref = getEnergyPricesByLocation(project.location);
      setEnergyPrices(ref ?? { peakPrice: 0, flatPrice: 0, valleyPrice: 0, comprehensivePrice: 0, gasPrice: 0, waterPrice: 0 });
    }

    if (existing?.zoneConfigs) {
      const newZoneNames = ['门诊', '急诊', '医技', '病房和感染', '行政后勤', '教学科研', '健康管理'];
      const hasOldNames = Object.keys(existing.zoneConfigs).some((k) => k === '病房' || k === '行政');
      const presentNewZones = Object.keys(existing.zoneConfigs).filter((k) => newZoneNames.includes(k)).length;
      const isOldData = hasOldNames || presentNewZones < 7;
      if (isOldData) {
        setZoneConfigs({
          '门诊': createDefaultZoneConfig('门诊'),
          '医技': createDefaultZoneConfig('医技'),
          '病房和感染': createDefaultZoneConfig('病房和感染'),
          '急诊': createDefaultZoneConfig('急诊'),
          '行政后勤': createDefaultZoneConfig('行政后勤'),
          '教学科研': createDefaultZoneConfig('教学科研'),
          '健康管理': createDefaultZoneConfig('健康管理'),
        });
      } else {
        // 补充 enabled 字段（兼容旧数据）
        const migrated = Object.fromEntries(
          Object.entries(existing.zoneConfigs).map(([k, v]) => [k, { ...v, enabled: v.enabled ?? true }])
        );
        setZoneConfigs(migrated);
      }
    } else {
      setZoneConfigs({
        '门诊': createDefaultZoneConfig('门诊'),
        '医技': createDefaultZoneConfig('医技'),
        '病房和感染': createDefaultZoneConfig('病房和感染'),
        '急诊': createDefaultZoneConfig('急诊'),
        '行政后勤': createDefaultZoneConfig('行政后勤'),
        '教学科研': createDefaultZoneConfig('教学科研'),
        '健康管理': createDefaultZoneConfig('健康管理'),
      });
    }

    // Saving equipments — sync with Step 3 main equipment
    const techIds = projectsStep3SelectedTechs[project.id] ?? [];
    const oldSaving = existing?.savingEquipments;
    const synced: Record<string, SavingEquipment[]> = {};

    for (const techId of techIds) {
      const step3 = projectsStep3Data[project.id]?.[techId];
      const mainEqs = step3?.equipment.filter((r) => r.isMainEquipment) ?? [];
      const oldList = oldSaving?.[techId] ?? [];

      if (mainEqs.length === 0) continue;

      synced[techId] = mainEqs.map((eq) => {
        // 优先用 id 匹配，回退到 name 匹配（兼容旧数据）
        const saved = oldList.find((s) => s.id === eq.id) ?? oldList.find((s) => s.equipmentName === eq.name);
        if (saved) {
          return {
            ...saved,
            id: eq.id,
            equipmentName: eq.name,
            systems: migrateSystemNames(saved.systems),
            ratedPower: saved.ratedPower ?? eq.powerKw ?? 0,
            quantity: saved.quantity ?? eq.quantity ?? 1,
          };
        }
        return {
          id: eq.id,
          techId,
          equipmentName: eq.name,
          systems: [],
          ratedPower: eq.powerKw ?? 0,
          quantity: eq.quantity ?? 1,
          serviceTargets: [],
          operatingHours: 0,
          simultaneousCoeff: getSimultaneousCoeff([]),
          energyConsumption: 0,
          operatingCost: 0,
        };
      });
    }

    setSavingEquipments(synced);

    // Original equipments — 迁移旧数据"空调"→"制冷"
    if (existing?.originalEquipments) {
      const migrated = existing.originalEquipments.map((eq) => ({
        ...eq,
        systemCategory: migrateSystemNames(Array.isArray(eq.systemCategory) ? eq.systemCategory : [eq.systemCategory]),
      }));
      setOriginalEquipments(migrated);
    } else {
      setOriginalEquipments([]);
    }

    setCurrentStep(0);
  }, [project?.id]);

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

    // Compute aggregated tech-level data from per-equipment detail
    const techIds = new Set<string>();
    for (const techId of Object.keys(savingEquipments)) techIds.add(techId);
    for (const eq of originalEquipments) techIds.add(eq.benchmarkTechId);

    // 先算分项数据
    const techStats: Record<string, { savingEnergy: number; savingCost: number; originalEnergy: number; originalCost: number; itemSavingRate: number }> = {};
    let totalOriginalEnergy = 0;
    let totalSavingEnergy = 0;

    for (const techId of techIds) {
      const eqList = savingEquipments[techId] ?? [];
      const origList = originalEquipments.filter((o) => o.benchmarkTechId === techId);
      const savingEnergy = eqList.reduce((s, e) => s + (e.energyConsumption || 0), 0);
      const savingCost = eqList.reduce((s, e) => s + (e.operatingCost || 0), 0);
      const originalEnergy = origList.reduce((s, e) => s + (e.energyConsumption || 0), 0);
      const originalCost = origList.reduce((s, e) => s + (e.operatingCost || 0), 0);
      const itemSavingRate = originalEnergy > 0 ? ((originalEnergy - savingEnergy) / originalEnergy) * 100 : 0;
      techStats[techId] = { savingEnergy, savingCost, originalEnergy, originalCost, itemSavingRate };
      totalOriginalEnergy += originalEnergy;
      totalSavingEnergy += savingEnergy;
    }

    // 综合节能率：考虑多技术作用于同一系统的重叠折减
    const techCount = techIds.size;
    const baseComprehensiveRate = totalOriginalEnergy > 0 ? ((totalOriginalEnergy - totalSavingEnergy) / totalOriginalEnergy) * 100 : 0;
    // 重叠系数：技术越多重叠越大，单技术无折减，每多一项技术折减增加
    const overlapFactor = techCount <= 1 ? 1 : Math.max(0.65, 1 - (techCount - 1) * 0.1);
    const comprehensiveRate = Math.round(baseComprehensiveRate * overlapFactor * 100) / 100;

    const computedTechs: Record<string, Step4TechData> = {};
    for (const techId of techIds) {
      const stats = techStats[techId];
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
      };
    }

    const updated: Step4ProjectData = {
      ...existing,
      techs: computedTechs,
      energyPrices: energyPrices ?? undefined,
      zoneConfigs: zoneConfigs,
      savingEquipments: savingEquipments,
      originalEquipments: originalEquipments,
    };

    saveProjectStep4Data(project.id, updated);
    message.success('保存成功');
  }, [project, energyPrices, zoneConfigs, savingEquipments, originalEquipments, projectsStep4Data, saveProjectStep4Data]);

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

    // 校验：节能计算 - 至少一个节能方案设备运行时间 > 0
    const hasRunningHours = Object.values(savingEquipments).some((list) =>
      list.some((e) => (e.operatingHours ?? 0) > 0),
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

    handleSave();
    onComplete();
  }, [zoneConfigs, savingEquipments, originalEquipments, handleSave, onComplete]);

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
        return (
          <StepConditionSetting
            zoneConfigs={zoneConfigs}
            onChange={setZoneConfigs}
          />
        );
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
          />
        );
      case 3:
        return <StepComingSoon title="辅助决策" />;
      default:
        return null;
    }
  };

  if (!project) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
        项目不存在
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Steps 导航 — 已完成步骤可点击回退 */}
      <div style={{
        marginBottom: 16,
        padding: '14px 24px',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
      }}>
        <Steps
          current={currentStep}
          size="small"
          style={{ maxWidth: 500, margin: '0 auto' }}
          items={STEP_CONFIGS.map((s, i) => ({
            title: <span style={{
              fontSize: 13,
              color: i === currentStep ? '#1677ff' : i < currentStep ? '#1677ff' : '#8c8c8c',
              fontWeight: i === currentStep ? 600 : 400,
              cursor: i < currentStep ? 'pointer' : 'default',
            }}>{s.shortTitle}</span>,
            status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
            onClick: () => { if (i < currentStep) setCurrentStep(i); },
            style: { cursor: i < currentStep ? 'pointer' : 'default' },
          }))}
        />
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderStepContent()}
      </div>

      {/* 底部操作栏 — 子步骤一站式推进 */}
      <div style={{
        padding: '16px 0 0',
        marginTop: 24,
        borderTop: '1px solid #e8ecf0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
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
            <Button icon={<BarChartOutlined />} onClick={() => setAnalysisOpen(true)}>
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
