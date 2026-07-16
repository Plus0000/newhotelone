import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Button, Space, message, Badge, Dropdown, Modal, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useAuthStore } from '@/shared/stores/authStore';

const STEP_ITEMS = [
  { title: '建筑基本信息' },
  { title: '节能方案筛选' },
  { title: '机电系统投资概算' },
  { title: '能耗分析与节能计算' },
  { title: '数据分析与辅助决策' },
];

// Flat step → main step mapping (0-based)
const FLAT_MAIN_STEP = [0, 0, 0, 0, 0, 1, 2, 3, 4];
const TOTAL_FLAT = FLAT_MAIN_STEP.length; // 9
const STEP1_FLAT_COUNT = 5;

const CONTENT_MAX_WIDTH = 1200;
const SIDE_SPACING = 24;

export default function StepperContainer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const currentStep = useProjectStore((s) => s.currentStep);
  const stepCompleted = useProjectStore((s) => s.stepCompleted);
  const flatStepIndex = useProjectStore((s) => s.flatStepIndex);
  const step2Data = useProjectStore((s) => s.step2Data);
  const step1ValidateDone = useProjectStore((s) => s.step1ValidateDone);
  const step3Editing = useProjectStore((s) => s.step3Editing);
  const step4Editing = useProjectStore((s) => s.step4Editing);
  const step5Editing = useProjectStore((s) => s.step5Editing);
  const loadingSteps = useProjectStore((s) => s.loadingSteps);

  const triggerStep5ShowReport = useProjectStore((s) => s.triggerStep5ShowReport);
  const triggerMepTabBack = useProjectStore((s) => s.triggerMepTabBack);

  const setFlatStepIndex = useProjectStore((s) => s.setFlatStepIndex);
  const setFlatStepCompleted = useProjectStore((s) => s.setFlatStepCompleted);
  const triggerStep1Validate = useProjectStore((s) => s.triggerStep1Validate);
  const setCurrentStep = useProjectStore((s) => s.setCurrentStep);
  const setProjectId = useProjectStore((s) => s.setProjectId);
  const completeStep = useProjectStore((s) => s.completeStep);
  const updateProjectStep = useProjectStore((s) => s.updateProjectStep);
  const loadProject = useProjectStore((s) => s.loadProject);

  const logout = useAuthStore((s) => s.logout);
  const userName = useAuthStore((s) => s.user) || '管理员';

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      Modal.confirm({
        title: '确认退出',
        content: '确定要退出登录吗？',
        okText: '退出',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          logout();
          message.success('已退出登录');
        },
      });
    }
  };

  const initialized = useRef(false);
  const prevValidateDoneRef = useRef(0);

  // Set project ID on mount and load persisted data
  useEffect(() => {
    if (!id) return;
    setProjectId(id);
    loadProject(id);
  }, [id, setProjectId, loadProject]);

  // Init flatStepIndex from URL on first mount
  useEffect(() => {
    if (!id) return;
    const urlStep = parseInt(location.pathname.split('/').pop() || '1', 10) - 1;
    if (!isNaN(urlStep) && !initialized.current) {
      // Find the first flat index for this main step
      const flatIdx = FLAT_MAIN_STEP.indexOf(urlStep);
      if (flatIdx >= 0) {
        setFlatStepIndex(flatIdx);
      }
      setCurrentStep(urlStep);
      initialized.current = true;
    }
  }, [id, location.pathname, setCurrentStep, setFlatStepIndex]);

  // ── 当 Step1BasicInfo 验证成功后自动推进 ──
  useEffect(() => {
    if (step1ValidateDone > prevValidateDoneRef.current) {
      prevValidateDoneRef.current = step1ValidateDone;
      // Validation succeeded, advance to next flat step
      const prevMainStep = FLAT_MAIN_STEP[flatStepIndex];
      const nextIdx = flatStepIndex + 1;
      if (nextIdx < TOTAL_FLAT) {
        const nextMainStep = FLAT_MAIN_STEP[nextIdx];
        setFlatStepIndex(nextIdx);
        // Cross main step boundary → mark previous complete + navigate
        if (nextMainStep !== prevMainStep) {
          completeStep(prevMainStep);
          setCurrentStep(nextMainStep);
          if (id) {
            updateProjectStep(id, nextMainStep);
            navigate(`/projects/${id}/stepper/${nextMainStep + 1}`);
          }
        }
      }
    }
  }, [step1ValidateDone, flatStepIndex, id, navigate, setFlatStepIndex, setCurrentStep, completeStep, updateProjectStep]);

  // ── 当 flatStepIndex 被外部直接改变时（Step 2+ 或上一步）同步路由 ──
  const prevFlatRef = useRef(flatStepIndex);
  useEffect(() => {
    if (flatStepIndex !== prevFlatRef.current) {
      prevFlatRef.current = flatStepIndex;
      const ms = FLAT_MAIN_STEP[flatStepIndex];
      if (ms !== currentStep) {
        setCurrentStep(ms);
        if (id) {
          updateProjectStep(id, ms);
          navigate(`/projects/${id}/stepper/${ms + 1}`, { replace: true });
        }
      }
    }
  }, [flatStepIndex, currentStep, id, navigate, setCurrentStep, updateProjectStep]);

  const stepStaleFlags = useProjectStore((s) => s.stepStaleFlags);
  const clearStepStaleFlag = useProjectStore((s) => s.clearStepStaleFlag);
  const currentMainStep = FLAT_MAIN_STEP[flatStepIndex];
  const isLastFlat = flatStepIndex === TOTAL_FLAT - 1;

  // ── Stale step warning ──
  useEffect(() => {
    if (stepStaleFlags[currentMainStep]) {
      Modal.warning({
        title: '数据可能已过期',
        content: `此步骤的上游数据已变更，请重新确认所有数据是否正确。`,
        okText: '我知道了',
        onOk: () => clearStepStaleFlag(currentMainStep),
      });
    }
  }, [currentMainStep, stepStaleFlags, clearStepStaleFlag]);

  // ── 上一步 ──
  const handlePrev = () => {
    if (flatStepIndex === 3) {
      // MEP substep: always trigger internal tab back; SubStep4MEP handles boundary
      triggerMepTabBack();
      return;
    }
    if (flatStepIndex > 0) {
      setFlatStepIndex(flatStepIndex - 1);
    } else {
      navigate('/projects');
    }
  };

  // ── 下一步 ──
  const handleNext = () => {
    if (flatStepIndex < STEP1_FLAT_COUNT) {
      // Step 1 substeps: trigger validation via signal
      triggerStep1Validate();
    } else if (flatStepIndex === STEP1_FLAT_COUNT) {
      // Step 2: must select techs + complete comprehensive rate
      if (step2Data.selectedTechs.length === 0) {
        message.warning('请至少选择一项节能技术');
      } else if (step2Data.comprehensiveRateCompleted) {
        setFlatStepCompleted(flatStepIndex, true);
        completeStep(currentMainStep);
        setFlatStepIndex(flatStepIndex + 1);
      } else {
        message.warning('请先完成综合节能率估算');
      }
    } else if (flatStepIndex < TOTAL_FLAT - 1) {
      // Step 3, early Step 4: advance directly
      setFlatStepCompleted(flatStepIndex, true);
      setFlatStepIndex(flatStepIndex + 1);
    }
    // isLastFlat: batch generate reports for selected projects
    if (isLastFlat) {
      const store = useProjectStore.getState();
      const ids = store.step5SelectedIds;
      if (ids.length === 0) {
        message.warning('请先选择要出报告的项目');
        return;
      }
      // 校验所选项目的核算状态
      const projectsStep4Data = store.projectsStep4Data;
      const hasPending = ids.some((id) => {
        const dd = projectsStep4Data[id]?.decisionData;
        return !dd || dd.accountingStatus === 'pending';
      });
      if (hasPending) {
        message.warning('存在未完成核算的项目，请先完成核算');
        return;
      }
      triggerStep5ShowReport();
    }
  };

  const handleSave = () => {
    useProjectStore.getState().persistCurrentProject();
    message.success('草稿已保存');
  };

  // Warn on close/refresh with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const s = { maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto', padding: `0 ${SIDE_SPACING}px` };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-layout)' }}>
      {/* Top Nav Bar */}
      <div
        style={{
          background: 'var(--bg-container)',
          borderBottom: '1px solid var(--border-section)',
        }}
      >
        <div style={s}>
          <div
            style={{
              height: 56,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/images/nav-title.png" alt="节能方案助手" style={{ height: 32, objectFit: 'contain', cursor: 'pointer' }} onClick={() => navigate('/projects')} />
            </div>
            <Space size={16} align="center">
              <Badge count={0} size="small">
                <Button shape="circle" icon={<BellOutlined />} style={{ border: 'none', background: 'transparent' }} />
              </Badge>
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <Space size={8} style={{ cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, color: '#333' }}>{userName}</span>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e6f0f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserOutlined style={{ color: '#2B87C9', fontSize: 14 }} />
                  </div>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </div>
      </div>

      {/* Stepper Bar */}
      <div
        style={{
          background: 'var(--bg-container)',
          borderBottom: '1px solid var(--border-section)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={s}>
          <div style={{ padding: '16px 0 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 16,
              }}
            >
              {STEP_ITEMS.map((item, i) => {
                const isActive = i === currentMainStep;
                const isComplete = stepCompleted[i];

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (isComplete || i < currentMainStep || isActive) {
                        // Navigate to first flat step of target main step
                        const targetFlat = FLAT_MAIN_STEP.indexOf(i);
                        if (targetFlat >= 0) setFlatStepIndex(targetFlat);
                      }
                    }}
                    style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: '44px minmax(0, 1fr)',
                      alignItems: 'center',
                      gap: 12,
                      minHeight: 72,
                      padding: 12,
                      border: isActive
                        ? '1px solid rgba(47,134,210,0.28)'
                        : '1px solid transparent',
                      borderRadius: 8,
                      background: isActive ? '#eaf5ff' : 'transparent',
                      color: isComplete || isActive ? '#1e2733' : '#6b7480',
                      textAlign: 'left',
                      cursor: isActive || isComplete || i < currentMainStep ? 'pointer' : 'not-allowed',
                      opacity: i > currentMainStep && !isComplete ? 0.5 : 1,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      lineHeight: 1.5,
                    }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: -17,
                          top: '50%',
                          width: 16,
                          height: 1,
                          background: '#dfe4ea',
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    <div
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: isActive
                          ? '#2f86d2'
                          : isComplete
                          ? '#e8f7ef'
                          : '#eef0f3',
                        color: isActive
                          ? '#fff'
                          : isComplete
                          ? '#1f9a67'
                          : '#5f6974',
                        fontWeight: 820,
                        fontSize: isComplete ? 16 : 15,
                      }}
                    >
                      {isComplete ? '✓' : i + 1}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 820,
                          fontSize: 15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 3,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6b7480',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isComplete
                          ? '已完成'
                          : isActive
                          ? '进行中'
                          : '待完善'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 0 80px' }}>
        <div style={s}>
          {loadingSteps ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '120px 0' }}>
              <Spin size="large" tip="加载项目数据中..." />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      {/* Footer — 扁平导航 */}
      {!step3Editing && !step4Editing && !step5Editing && (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-container)',
          borderTop: '1px solid var(--border-section)',
          padding: '12px 0',
          zIndex: 10,
        }}
      >
        <div style={s}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button onClick={handlePrev}>
              {flatStepIndex === 0 ? '返回项目列表' : '上一步'}
            </Button>
            <Space>
              <Button onClick={handleSave}>保存</Button>
              <Button type="primary" onClick={handleNext}>
                {isLastFlat ? '生成报告' : '下一步'}
              </Button>
            </Space>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
