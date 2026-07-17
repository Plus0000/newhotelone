import { useCallback } from 'react';
import { Empty } from 'antd';
import { useProjectStore } from '@/shared/stores/projectStore';
import EditView from './components/EditView';

export default function Step4Energy() {
  const projectId = useProjectStore((s) => s.projectId);
  const projects = useProjectStore((s) => s.projects);
  const projectsStep3SelectedTechs = useProjectStore((s) => s.projectsStep3SelectedTechs);
  const setFlatStepIndex = useProjectStore((s) => s.setFlatStepIndex);
  const setFlatStepCompleted = useProjectStore((s) => s.setFlatStepCompleted);
  const completeStep = useProjectStore((s) => s.completeStep);

  const setProjectAuditStatus = useProjectStore((s) => s.setProjectAuditStatus);

  const handleComplete = useCallback(() => {
    if (!projectId) return;
    // 标记 Step 4 完成，推进到 Step 5（flat index 8）
    setFlatStepCompleted(7, true);
    completeStep(3);
    setProjectAuditStatus(projectId, 'completed');
    setFlatStepIndex(8);
  }, [setFlatStepCompleted, completeStep, setProjectAuditStatus, projectId, setFlatStepIndex]);

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

  const techs = projectsStep3SelectedTechs[projectId] ?? [];
  if (techs.length === 0) {
    return (
      <div style={{ padding: '60px 0' }}>
        <Empty description="请先在第三步选择需要进行节能计算的技术" />
      </div>
    );
  }

  return <EditView projectId={projectId} onComplete={handleComplete} />;
}
