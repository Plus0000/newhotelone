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

const SUB_STEPS = [
  { title: '填写人信息' },
  { title: '客户信息' },
  { title: '医院基本信息' },
  { title: '机电系统信息' },
  { title: '市政能源与政策' },
];

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
      form
        .validateFields()
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
              location: Array.isArray(merged.location) ? merged.location as string[] : typeof merged.location === 'string' ? [merged.location] : (existing?.location ?? []),
              projectStage: (merged.projectStage as string) || existing?.projectStage || '',
              buildingType: (merged.buildingType as string) || existing?.buildingType || '',
              hospitalLevel: (merged.hospitalLevel as string) || existing?.hospitalLevel || '',
              hospitalNature: (merged.hospitalNature as string) || existing?.hospitalNature || '',
              hospitalScale: (merged.hospitalScale as string) || existing?.hospitalScale || '',
              totalArea: Number(merged.totalArea) || existing?.totalArea || 0,
              author: (merged.author as string) || existing?.author || '',
              fillDate: typeof merged.fillDate === 'string'
                ? (merged.fillDate as string)
                : (merged.fillDate as dayjs.Dayjs)?.format?.('YYYY-MM-DD')
                  || existing?.fillDate
                  || new Date().toISOString().slice(0, 10),
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
          message.warning('请填写当前步骤的必填项');
        });
    }
  }, [step1ValidateTrigger, form, subStep, id, step1Data, projects, updateStep1Data, saveProjectStep1Data, addProject, setFlatStepCompleted, confirmStep1Validate]);

  // ── 数据回显 ──
  // Sanitize dirty localStorage data
  useEffect(() => {
    if (!id) return;
    const raw = useProjectStore.getState().step1Data;
    if (
      (raw.energyPolicies !== undefined && !Array.isArray(raw.energyPolicies)) ||
      (raw.renewableSubsidies !== undefined && !Array.isArray(raw.renewableSubsidies))
    ) {
      const sanitized: Record<string, unknown> = { ...raw };
      if (!Array.isArray(sanitized.energyPolicies)) sanitized.energyPolicies = [];
      if (!Array.isArray(sanitized.renewableSubsidies)) sanitized.renewableSubsidies = [];
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
  useEffect(() => {
    if (!id) return;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const values: Record<string, unknown> = {
      ...step1Data,
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
    // Can only click completed or current substep
    if (target <= subStep || subStepCompleted[target]) {
      setFlatStepCompleted(target, subStepCompleted[target]); // preserve existing state
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
