import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Steps, Form, Card, message } from 'antd';
import dayjs from 'dayjs';
import { useProjectStore } from '@/shared/stores/projectStore';
import SubStep1Author from './components/SubStep1Author';
import SubStep2Client from './components/SubStep2Client';
import SubStep3Hospital from './components/SubStep3Hospital';
import SubStep4MEP from './components/SubStep4MEP';
import SubStep5Policy from './components/SubStep5Policy';

/** 聚焦到第一个有错误的 Form.Item（滚动到视野 + 聚焦 input/textarea） */
function focusFirstErrorField() {
  const errorItem = document.querySelector('.ant-form-item-has-error');
  if (!errorItem) return;
  errorItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // input/textarea 可以直接 focus；Select/Radio/Checkbox 无可 focus 的 input，靠滚动定位
  const input = errorItem.querySelector(
    'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), textarea',
  ) as HTMLInputElement | null;
  if (input) {
    input.focus({ preventScroll: true });
  }
}

const SUB_STEPS = [
  { title: '填写人信息' },
  { title: '客户信息' },
  { title: '医院基本信息' },
  { title: '机电系统信息' },
  { title: '市政能源与政策' },
];

/** 每个子步骤需要校验的必填字段路径（只校验当前页，不跨步骤） */
const SUBSTEP_FIELDS: Record<number, (string | string[])[]> = {
  0: [['author'], ['department'], ['phone'], ['fillDate']],
  1: [['hospitalName'], ['unitNature'], ['clientIdentity'], ['contactLevel'], ['projectSource']],
  2: [
    ['projectName'],
    ['location'],
    ['projectStage'],
    ['projectProperty'],
    ['buildingType'],
    ['totalArea'],
    ['aboveGroundArea'],
    ['cleanArea'],
    ['hospitalType'],
    ['hospitalNature'],
    ['hospitalLevel'],
    ['hospitalScale'],
    ['normalBeds'],
    ['icuBeds'],
    ['operatingRooms'],
  ],
  // subStep 3 (MEP) 和 4 (市政能源) 由 SubStep4MEP / SubStep5Policy 自行处理
};

export default function Step1BasicInfo() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const flatStepIndex = useProjectStore((s) => s.flatStepIndex);
  const flatStepCompleted = useProjectStore((s) => s.flatStepCompleted);
  const step1ValidateTrigger = useProjectStore((s) => s.step1ValidateTrigger);
  const step1Data = useProjectStore((s) => s.step1Data);
  const projects = useProjectStore((s) => s.projects);
  const updateStep1Data = useProjectStore((s) => s.updateStep1Data);
  const saveProjectStep1Data = useProjectStore((s) => s.saveProjectStep1Data);
  const addProject = useProjectStore((s) => s.addProject);
  const setFlatStepCompleted = useProjectStore((s) => s.setFlatStepCompleted);
  const setFlatStepIndex = useProjectStore((s) => s.setFlatStepIndex);
  const confirmStep1Validate = useProjectStore((s) => s.confirmStep1Validate);

  // Local substep index tracked from flatStepIndex (0-4)
  const subStep = flatStepIndex; // flatStepIndex 0-4 maps directly to Step1 substeps

  // subStepCompleted derived from flatStepCompleted[0-4]
  const subStepCompleted: boolean[] = [
    flatStepCompleted[0],
    flatStepCompleted[1],
    flatStepCompleted[2],
    flatStepCompleted[3],
    flatStepCompleted[4],
  ];

  const prevTriggerRef = useRef(step1ValidateTrigger);

  // ── 响应 StepperContainer 的验证信号 ──
  useEffect(() => {
    if (step1ValidateTrigger > prevTriggerRef.current) {
      prevTriggerRef.current = step1ValidateTrigger;
      // MEP 子步骤：逐 Tab 校验，而非一次校验全部
      if (subStep === 3) {
        const store = useProjectStore.getState();
        if (!store.mepAllTabsDone) {
          store.triggerMepTabAdvance();
          return;
        }
      }
      // 市政能源子步骤：无必填项，直接通过
      if (subStep === 4) {
        const values = form.getFieldsValue();
        updateStep1Data(values);
        if (id) saveProjectStep1Data(id, { ...step1Data, ...values });
        setFlatStepCompleted(subStep, true);
        confirmStep1Validate();
        return;
      }
      // 其他子步骤：只校验当前页的必填字段
      const fields = SUBSTEP_FIELDS[subStep] || [];
      form
        .validateFields(fields)
        .then(() => {
          // Save current substep data
          const values = form.getFieldsValue();
          updateStep1Data(values);
          if (id) saveProjectStep1Data(id, { ...step1Data, ...values });

          // Sync project info into projects array for list display
          if (id) {
            const merged = { ...step1Data, ...values } as Record<string, unknown>;
            const existing = projects.find((p) => p.id === id);
            addProject({
              id,
              projectName: (merged.projectName as string) || existing?.projectName || '新建项目',
              hospitalName: (merged.hospitalName as string) || existing?.hospitalName || '',
              location: Array.isArray(merged.location)
                ? (merged.location as string[])
                : typeof merged.location === 'string'
                  ? [merged.location]
                  : (existing?.location ?? []),
              projectStage: (merged.projectStage as string) || existing?.projectStage || '',
              buildingType: (merged.buildingType as string) || existing?.buildingType || '',
              hospitalLevel: (merged.hospitalLevel as string) || existing?.hospitalLevel || '',
              hospitalNature: (merged.hospitalNature as string) || existing?.hospitalNature || '',
              hospitalScale: (merged.hospitalScale as string) || existing?.hospitalScale || '',
              totalArea: Number(merged.totalArea) || existing?.totalArea || 0,
              author: (merged.author as string) || existing?.author || '',
              fillDate:
                typeof merged.fillDate === 'string'
                  ? (merged.fillDate as string)
                  : (merged.fillDate as dayjs.Dayjs)?.format?.('YYYY-MM-DD') ||
                    existing?.fillDate ||
                    new Date().toISOString().slice(0, 10),
              department: (merged.department as string) || existing?.department || '',
              currentStep: existing?.currentStep ?? 0,
              auditStatus: existing?.auditStatus ?? 'pending',
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            });
          }

          // Mark this flat step as completed
          setFlatStepCompleted(subStep, true);
          // Signal success to StepperContainer
          confirmStep1Validate();
        })
        .catch(() => {
          // antd 会在对应 Form.Item 上自动显示红色错误提示
          message.warning('请填写当前步骤的必填项');
          // 光标聚焦到第一个未填写的字段（等 antd 渲染错误状态）
          setTimeout(() => {
            focusFirstErrorField();
          }, 50);
        });
    }
  }, [
    step1ValidateTrigger,
    form,
    subStep,
    id,
    step1Data,
    projects,
    updateStep1Data,
    saveProjectStep1Data,
    addProject,
    setFlatStepCompleted,
    confirmStep1Validate,
  ]);

  // ── 数据回显 ──
  // Sanitize dirty localStorage data & migrate old mep field paths
  useEffect(() => {
    if (!id) return;
    const raw = useProjectStore.getState().step1Data;
    let changed = false;
    const sanitized: Record<string, unknown> = { ...raw };

    if (
      (raw.energyPolicies !== undefined && !Array.isArray(raw.energyPolicies)) ||
      (raw.renewableSubsidies !== undefined && !Array.isArray(raw.renewableSubsidies))
    ) {
      if (!Array.isArray(sanitized.energyPolicies)) sanitized.energyPolicies = [];
      if (!Array.isArray(sanitized.renewableSubsidies)) sanitized.renewableSubsidies = [];
      changed = true;
    }

    // Migrate old mep fields (flat coldSource/heatSource/waterPartition) → mep.hvac.*
    const oldMep = raw.mep as Record<string, unknown> | undefined;
    if (oldMep && !oldMep.hvac) {
      const newMep: Record<string, unknown> = { ...oldMep };
      const hvac: Record<string, unknown> = {};

      // Map old flat coldSource → new centralized/decentralized/regional
      const oldCold = oldMep.coldSource as string[] | undefined;
      if (Array.isArray(oldCold) && oldCold.length > 0) {
        hvac.coldSourceCentralized = oldCold.filter((s) =>
          [
            '传统电制冷冷水机组',
            '地源热泵',
            '空气源热泵',
            '风冷热泵',
            '能源塔',
            '溴化锂吸收式冷水机组',
            '冰蓄冷',
            '水蓄冷',
            '直燃机',
            '三联供',
          ].includes(s),
        );
        hvac.coldSourceDecentralized = oldCold.filter((s) =>
          ['分体空调', 'VRV空调', 'VRV 空调', '恒温恒湿空调'].includes(s),
        );
        hvac.coldSourceRegional = oldCold.filter((s) => ['DCS区域制冷站', '区域供冷'].includes(s));
      }

      // Map old flat heatSource → new centralized/decentralized/regional
      const oldHeat = oldMep.heatSource as string[] | undefined;
      if (Array.isArray(oldHeat) && oldHeat.length > 0) {
        hvac.heatSourceCentralized = oldHeat.filter((s) =>
          [
            '燃气锅炉',
            '燃气热水锅炉',
            '燃油锅炉',
            '燃油热水锅炉',
            '电锅炉',
            '电热水锅炉',
            '地源热泵',
            '空气源热泵',
            '能源塔',
            '相变储热',
            '直燃机',
            '三联供',
          ].includes(s),
        );
        hvac.heatSourceDecentralized = oldHeat.filter((s) =>
          ['分体空调', 'VRV空调', 'VRV 空调', '恒温恒湿空调', '风冷热泵'].includes(s),
        );
        hvac.heatSourceRegional = oldHeat.filter((s) => ['市政热力'].includes(s));
      }

      // Map old waterPartition
      const oldPartition = oldMep.waterPartition as string | undefined;
      if (oldPartition) {
        hvac.waterPartition = oldPartition === '已分区' ? '已按医疗区域分区' : '未分区';
      }

      newMep.hvac = hvac;
      delete newMep.coldSource;
      delete newMep.heatSource;
      delete newMep.waterPartition;
      sanitized.mep = newMep;
      changed = true;
    }

    // Clean up old flat plumbing fields (waterSupply/drainage/hotWater) -> replaced by mep.plumbing.*
    if (
      oldMep &&
      (oldMep.waterSupply !== undefined ||
        oldMep.drainage !== undefined ||
        oldMep.hotWater !== undefined)
    ) {
      const newMep = { ...(sanitized.mep as Record<string, unknown>) };
      delete newMep.waterSupply;
      delete newMep.drainage;
      delete newMep.hotWater;
      sanitized.mep = newMep;
      changed = true;
    }

    // Clean up old flat smart/medical fields (smartLevel/vfd/medGas/vacuum) -> replaced by mep.smart.* / mep.medicalPower.*
    if (
      oldMep &&
      (oldMep.smartLevel !== undefined ||
        oldMep.vfd !== undefined ||
        oldMep.medGas !== undefined ||
        oldMep.vacuum !== undefined)
    ) {
      const newMep = { ...(sanitized.mep as Record<string, unknown>) };
      delete newMep.smartLevel;
      delete newMep.vfd;
      delete newMep.medGas;
      delete newMep.vacuum;
      sanitized.mep = newMep;
      changed = true;
    }

    // Clean up old flat install fields (gridExpansion/outdoorSpace/outdoorSpaceArea/autoControl) -> replaced by mep.install.*
    if (
      oldMep &&
      (oldMep.gridExpansion !== undefined ||
        oldMep.outdoorSpace !== undefined ||
        oldMep.outdoorSpaceArea !== undefined ||
        oldMep.autoControl !== undefined)
    ) {
      const newMep = { ...(sanitized.mep as Record<string, unknown>) };
      delete newMep.gridExpansion;
      delete newMep.outdoorSpace;
      delete newMep.outdoorSpaceArea;
      delete newMep.autoControl;
      sanitized.mep = newMep;
      changed = true;
    }

    // Migrate boolean vfd/heatRecovery/coolingTower/has -> string ('是'/'否'/'有'/'无')
    const curMep = sanitized.mep as Record<string, unknown> | undefined;
    if (curMep) {
      let mepChanged = false;
      const newMep: Record<string, unknown> = { ...curMep };
      const boolToYesNo = (v: unknown) => (v === true ? '是' : v === false ? '否' : v);
      const boolToHasNo = (v: unknown) => (v === true ? '有' : v === false ? '无' : v);

      const plumbing = newMep.plumbing as Record<string, unknown> | undefined;
      if (plumbing) {
        const waterPump = plumbing.waterPump as Record<string, unknown> | undefined;
        if (waterPump && (waterPump.vfd === true || waterPump.vfd === false)) {
          newMep.plumbing = {
            ...plumbing,
            waterPump: { ...waterPump, vfd: boolToYesNo(waterPump.vfd) },
          };
          mepChanged = true;
        }
        const sewage = plumbing.sewage as Record<string, unknown> | undefined;
        if (sewage && (sewage.has === true || sewage.has === false)) {
          newMep.plumbing = { ...plumbing, sewage: { ...sewage, has: boolToHasNo(sewage.has) } };
          mepChanged = true;
        }
      }

      const hvac = newMep.hvac as Record<string, unknown> | undefined;
      if (hvac?.coldSourceMeta) {
        const meta = hvac.coldSourceMeta as Record<string, Record<string, unknown>>;
        let metaChanged = false;
        const newMeta: Record<string, Record<string, unknown>> = { ...meta };
        for (const [name, m] of Object.entries(meta)) {
          if (
            m?.vfd === true ||
            m?.vfd === false ||
            m?.heatRecovery === true ||
            m?.heatRecovery === false ||
            m?.coolingTower === true ||
            m?.coolingTower === false
          ) {
            const nm = { ...m };
            if (nm.vfd === true || nm.vfd === false) nm.vfd = boolToYesNo(nm.vfd);
            if (nm.heatRecovery === true || nm.heatRecovery === false)
              nm.heatRecovery = boolToHasNo(nm.heatRecovery);
            if (nm.coolingTower === true || nm.coolingTower === false)
              nm.coolingTower = boolToHasNo(nm.coolingTower);
            newMeta[name] = nm;
            metaChanged = true;
          }
        }
        if (metaChanged) {
          newMep.hvac = { ...hvac, coldSourceMeta: newMeta };
          mepChanged = true;
        }
      }

      if (
        hvac &&
        (hvac.cleanZoneVfd === true ||
          hvac.cleanZoneVfd === false ||
          hvac.cleanZoneHeatRecovery === true ||
          hvac.cleanZoneHeatRecovery === false)
      ) {
        const newHvac = { ...hvac };
        if (newHvac.cleanZoneVfd === true || newHvac.cleanZoneVfd === false)
          newHvac.cleanZoneVfd = boolToYesNo(newHvac.cleanZoneVfd);
        if (newHvac.cleanZoneHeatRecovery === true || newHvac.cleanZoneHeatRecovery === false)
          newHvac.cleanZoneHeatRecovery = boolToHasNo(newHvac.cleanZoneHeatRecovery);
        newMep.hvac = newHvac;
        mepChanged = true;
      }

      if (mepChanged) {
        sanitized.mep = newMep;
        changed = true;
      }
    }

    if (changed) {
      updateStep1Data(sanitized);
    }
  }, [id]);

  // Force form reset when navigating between projects
  const prevIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevIdRef.current && prevIdRef.current !== id) {
      form.resetFields();
    }
    prevIdRef.current = id || null;
  }, [id, form]);

  // Echo form fields from loaded project data (run only when project loads, not on every input)
  // 用 getState() 拿最新 step1Data，确保迁移 effect（line 181）同步更新 store 后，回显能拿到迁移后的数据
  useEffect(() => {
    if (!id) return;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const values: Record<string, unknown> = {
      ...useProjectStore.getState().step1Data,
      projectName: project.projectName,
      hospitalName: project.hospitalName,
      location: project.location,
      projectStage: project.projectStage,
      buildingType: project.buildingType,
      hospitalLevel: project.hospitalLevel,
      hospitalNature: project.hospitalNature,
      hospitalScale: project.hospitalScale,
      totalArea: project.totalArea,
      author: project.author,
      department: project.department,
      ...(project.fillDate ? { fillDate: dayjs(project.fillDate) } : {}),
    };
    form.setFieldsValue(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, projects, form]);

  const handleSubStepClick = (target: number) => {
    // Can click completed substeps or earlier ones
    if (target <= subStep || subStepCompleted[target]) {
      setFlatStepIndex(target);
    }
  };

  const renderSubContent = () => {
    switch (subStep) {
      case 0:
        return <SubStep1Author />;
      case 1:
        return <SubStep2Client />;
      case 2:
        return <SubStep3Hospital />;
      case 3:
        return <SubStep4MEP />;
      case 4:
        return <SubStep5Policy />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Steps 导航 — 仅展示 + 点击已完成的子步骤回溯 */}
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
          current={subStep}
          size="small"
          onChange={handleSubStepClick}
          style={{ maxWidth: 700, margin: '0 auto' }}
          items={SUB_STEPS.map((item, i) => ({
            ...item,
            disabled: i > subStep && !subStepCompleted[i],
            title: (
              <span
                style={{
                  fontSize: 13,
                  color: i === subStep ? '#1677ff' : i < subStep ? '#1a1a1a' : '#8c8c8c',
                  fontWeight: i === subStep ? 600 : 400,
                }}
              >
                {item.title}
              </span>
            ),
          }))}
        />
      </div>

      {/* 表单内容 */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            energyPolicies: [],
            renewableSubsidies: [],
            ...step1Data,
            fillDate: step1Data.fillDate ? dayjs(step1Data.fillDate as string) : dayjs(),
          }}
          onValuesChange={() => {
            updateStep1Data(form.getFieldsValue());
          }}
          style={{ maxWidth: subStep === 3 || subStep === 4 ? '100%' : 600 }}
        >
          {renderSubContent()}
        </Form>
      </Card>
    </div>
  );
}
