import { Component, type ReactNode, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Result, Button, Spin, message, Alert } from 'antd';
import * as Sentry from '@sentry/react';
import { useAuthStore } from '@/shared/stores/authStore';
import {
  upsertProject as upsertProjectApi,
  upsertProjectSteps as upsertProjectStepsApi,
} from '@/shared/services/projectService';
import { supabase } from '@/shared/lib/supabase';
import { KnowledgeSidebar } from '@/features/knowledge-base/KnowledgeSidebar';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ProjectListPage = lazy(() => import('@/pages/ProjectListPage'));
const StepperContainer = lazy(() => import('@/pages/StepperContainer'));
const Step1BasicInfo = lazy(() => import('@/steps/step1-basic-info'));
const Step2Solution = lazy(() => import('@/steps/step2-solution'));
const Step3Twins = lazy(() => import('@/steps/step3-twins'));
const Step4Energy = lazy(() => import('@/steps/step4-energy'));
const Step5Decision = lazy(() => import('@/steps/step5-decision'));

const LOCALSTORAGE_KEY = 'project-storage';
const MIGRATION_DONE_KEY = 'migration-to-supabase-done';

async function migrateLocalStorageToSupabase() {
  if (localStorage.getItem(MIGRATION_DONE_KEY)) return;
  const raw = localStorage.getItem(LOCALSTORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state || parsed;
    if (!state) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    const userId = session.user.id;

    const projects = state.projects || [];
    for (const project of projects) {
      await upsertProjectApi({ ...project, userId });
      const steps: Record<string, unknown> = { project_id: project.id };
      if (state.projectsStep1Data?.[project.id])
        steps.step1_data = state.projectsStep1Data[project.id];
      if (state.projectsStep2Data?.[project.id])
        steps.step2_selected_techs = state.projectsStep2Data[project.id];
      if (state.projectsStep2Bindings?.[project.id])
        steps.step2_dependent_bindings = state.projectsStep2Bindings[project.id];
      if (state.projectsStep3Data?.[project.id])
        steps.step3_data = state.projectsStep3Data[project.id];
      if (state.projectsStep3SelectedTechs?.[project.id])
        steps.step3_selected_techs = state.projectsStep3SelectedTechs[project.id];
      if (state.projectsStep4Data?.[project.id])
        steps.step4_data = state.projectsStep4Data[project.id];
      if (state.projectsStep2RateCompleted?.[project.id] !== undefined)
        steps.step2_rate_completed = state.projectsStep2RateCompleted[project.id];
      await upsertProjectStepsApi(project.id, steps as any);
    }

    localStorage.removeItem(LOCALSTORAGE_KEY);
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
    if (projects.length > 0) {
      message.success(`已迁移 ${projects.length} 个项目到云端`);
    }
  } catch (err) {
    console.error('[Migration] Failed:', err);
  }
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="页面渲染出错"
          subTitle={this.state.error.message}
          extra={[
            <Button key="back" onClick={() => window.location.reload()}>
              刷新页面
            </Button>,
          ]}
        >
          <pre
            style={{
              textAlign: 'left',
              fontSize: 12,
              color: '#999',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {this.state.error.stack}
          </pre>
        </Result>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loading = useAuthStore((s) => s.loading);
  if (loading)
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    );
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setOffline = useAuthStore((s) => s.setOffline);

  useEffect(() => {
    const cleanup = initAuth();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initAuth]);

  useEffect(() => {
    if (isLoggedIn) {
      migrateLocalStorageToSupabase();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [setOffline]);

  return <>{children}</>;
}

function AppShell({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const location = useLocation();
  const showSidebar = isLoggedIn && location.pathname !== '/login';
  return (
    <>
      {showSidebar && <KnowledgeSidebar />}
      {children}
    </>
  );
}

export default function App() {
  const offline = useAuthStore((s) => s.offline);

  return (
    <ErrorBoundary>
      {offline && (
        <Alert
          message="网络连接已断开，数据可能无法保存。请检查网络后重试。"
          type="warning"
          showIcon
          closable
          banner
          style={{ textAlign: 'center' }}
        />
      )}
      <AuthInitializer>
        <BrowserRouter>
          <AppShell>
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                  }}
                >
                  <Spin size="large" />
                </div>
              }
            >
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/projects"
                  element={
                    <PrivateRoute>
                      <ProjectListPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects/:id/stepper"
                  element={
                    <PrivateRoute>
                      <StepperContainer />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="1" replace />} />
                  <Route path="1" element={<Step1BasicInfo />} />
                  <Route path="2" element={<Step2Solution />} />
                  <Route path="3" element={<Step3Twins />} />
                  <Route path="4" element={<Step4Energy />} />
                  <Route path="5" element={<Step5Decision />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </BrowserRouter>
      </AuthInitializer>
    </ErrorBoundary>
  );
}
