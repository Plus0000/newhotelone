import { supabase } from '@/shared/lib/supabase';
import type {
  Project,
  Step1Data,
  TechInvestment,
  Step4ProjectData,
} from '@/shared/stores/projectStore';

export interface StepData {
  step1Data: Step1Data;
  step2SelectedTechs: string[];
  step2RateCompleted: boolean;
  step2DependentBindings: Record<string, string[]>;
  step3Data: Record<string, TechInvestment>;
  step3SelectedTechs: string[];
  step4Data: Step4ProjectData;
}

// ── Projects ────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapProjectFromDb);
}

export async function upsertProject(project: Project & { userId: string }): Promise<void> {
  const { error } = await supabase.from('projects').upsert(
    {
      id: project.id,
      user_id: project.userId,
      project_name: project.projectName,
      hospital_name: project.hospitalName,
      location: project.location,
      project_stage: project.projectStage,
      building_type: project.buildingType,
      hospital_level: project.hospitalLevel,
      hospital_nature: project.hospitalNature,
      hospital_scale: project.hospitalScale,
      total_area: project.totalArea,
      author: project.author,
      fill_date: project.fillDate,
      department: project.department,
      current_step: project.currentStep,
      audit_status: project.auditStatus,
      created_at: project.createdAt || new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function deleteProjectById(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

export async function fetchAllProjectSteps(
  projectIds: string[],
): Promise<Record<string, StepData>> {
  if (projectIds.length === 0) return {};

  const { data, error } = await supabase
    .from('project_steps')
    .select('*')
    .in('project_id', projectIds);

  if (error) throw error;

  const map: Record<string, StepData> = {};
  const migrations: { projectId: string; step3Data: Record<string, TechInvestment>; step3SelectedTechs: string[] }[] = [];
  for (const row of data || []) {
    const { step3Data, step3SelectedTechs, migrated } = migrateStep3(row);
    map[row.project_id] = {
      step1Data: row.step1_data ?? {},
      step2SelectedTechs: row.step2_selected_techs ?? [],
      step2RateCompleted: row.step2_rate_completed ?? false,
      step2DependentBindings: (row.step2_dependent_bindings as Record<string, string[]>) ?? {},
      step3Data,
      step3SelectedTechs,
      step4Data: row.step4_data ?? ({} as Step4ProjectData),
    };
    if (migrated) {
      migrations.push({ projectId: row.project_id, step3Data, step3SelectedTechs });
    }
  }
  // 后台异步把老格式数据写回 Supabase 升级，不阻塞当前加载
  migrations.forEach(({ projectId, step3Data, step3SelectedTechs }) => {
    upsertProjectSteps(projectId, { step3Data, step3SelectedTechs }).catch((err) =>
      console.error('[migrateStep3] writeback failed for', projectId, err),
    );
  });
  return map;
}

// ── Project Steps ───────────────────────────────────────────────────

export async function fetchProjectSteps(projectId: string): Promise<StepData> {
  const { data, error } = await supabase
    .from('project_steps')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return {
      step1Data: {},
      step2SelectedTechs: [],
      step2RateCompleted: false,
      step2DependentBindings: {},
      step3Data: {},
      step3SelectedTechs: [],
      step4Data: {} as Step4ProjectData,
    };
  }

  const { step3Data, step3SelectedTechs, migrated } = migrateStep3(data);
  if (migrated) {
    upsertProjectSteps(projectId, { step3Data, step3SelectedTechs }).catch((err) =>
      console.error('[migrateStep3] writeback failed for', projectId, err),
    );
  }

  return {
    step1Data: data.step1_data ?? {},
    step2SelectedTechs: data.step2_selected_techs ?? [],
    step2RateCompleted: data.step2_rate_completed ?? false,
    step2DependentBindings: (data.step2_dependent_bindings as Record<string, string[]>) ?? {},
    step3Data,
    step3SelectedTechs,
    step4Data: data.step4_data ?? ({} as Step4ProjectData),
  };
}

export async function upsertProjectSteps(
  projectId: string,
  steps: Partial<StepData>,
): Promise<void> {
  const row: Record<string, unknown> = { project_id: projectId };
  if (steps.step1Data !== undefined) row.step1_data = steps.step1Data;
  if (steps.step2SelectedTechs !== undefined) row.step2_selected_techs = steps.step2SelectedTechs;
  if (steps.step2RateCompleted !== undefined) row.step2_rate_completed = steps.step2RateCompleted;
  if (steps.step2DependentBindings !== undefined)
    row.step2_dependent_bindings = steps.step2DependentBindings;
  if (steps.step3Data !== undefined) row.step3_data = steps.step3Data;
  if (steps.step3SelectedTechs !== undefined) row.step3_selected_techs = steps.step3SelectedTechs;
  if (steps.step4Data !== undefined) row.step4_data = steps.step4Data;

  const { error } = await supabase.from('project_steps').upsert(row, { onConflict: 'project_id' });
  if (error) throw error;
}

// ── Step 3 Schema Migration ────────────────────────────────────────
// 2026-06-10 commit f3179cb 把 Step 3 数据从单字段 { techInvestments, selectedTechIds }
// 拆成两字段 projectsStep3Data + projectsStep3SelectedTechs。
// 老项目 Supabase JSON 仍是旧格式，这里在读的时候自动迁移，并把升级后的数据写回。
function migrateStep3(row: {
  step3_data?: unknown;
  step3_selected_techs?: unknown;
}): {
  step3Data: Record<string, TechInvestment>;
  step3SelectedTechs: string[];
  migrated: boolean;
} {
  const raw = row.step3_data;
  const legacySelectedTechs = Array.isArray(row.step3_selected_techs)
    ? (row.step3_selected_techs as string[])
    : [];

  // 老格式：{ techInvestments: {...}, selectedTechIds: [...] }
  if (raw && typeof raw === 'object' && 'techInvestments' in raw) {
    const obj = raw as { techInvestments?: unknown; selectedTechIds?: unknown };
    return {
      step3Data: (obj.techInvestments as Record<string, TechInvestment>) ?? {},
      step3SelectedTechs: Array.isArray(obj.selectedTechIds)
        ? (obj.selectedTechIds as string[])
        : legacySelectedTechs,
      migrated: true,
    };
  }

  // 新格式：step3_data 是 Record<string, TechInvestment>
  return {
    step3Data: (raw as Record<string, TechInvestment>) ?? {},
    step3SelectedTechs: legacySelectedTechs,
    migrated: false,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  user_id: string;
  project_name: string;
  hospital_name: string;
  location: unknown;
  project_stage: string;
  building_type: string;
  hospital_level: string;
  hospital_nature: string;
  hospital_scale: string;
  total_area: number;
  author: string;
  fill_date: string;
  department: string;
  current_step: number;
  audit_status: string;
  created_at: string;
}

function mapProjectFromDb(row: ProjectRow): Project {
  return {
    id: row.id,
    projectName: row.project_name,
    hospitalName: row.hospital_name,
    location: Array.isArray(row.location) ? row.location : [],
    projectStage: row.project_stage,
    buildingType: row.building_type,
    hospitalLevel: row.hospital_level,
    hospitalNature: row.hospital_nature,
    hospitalScale: row.hospital_scale,
    totalArea: row.total_area,
    author: row.author,
    fillDate: row.fill_date,
    department: row.department,
    currentStep: row.current_step,
    auditStatus: (row.audit_status as 'pending' | 'completed') ?? 'pending',
    createdAt: row.created_at,
  };
}
