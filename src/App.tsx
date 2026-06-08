import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '@/shared/stores/authStore';
import LoginPage from '@/pages/LoginPage';
import ProjectListPage from '@/pages/ProjectListPage';
import StepperContainer from '@/pages/StepperContainer';
import Step1BasicInfo from '@/steps/step1-basic-info';
import Step2Solution from '@/steps/step2-solution';
import Step3Twins from '@/steps/step3-twins';
import Step4Energy from '@/steps/step4-energy';
import Step5Decision from '@/steps/step5-decision';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
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
            <Button key="clear" type="primary" danger onClick={() => { localStorage.clear(); window.location.reload(); }}>
              清除缓存并刷新
            </Button>,
          ]}
        >
          <pre style={{ textAlign: 'left', fontSize: 12, color: '#999', maxHeight: 200, overflow: 'auto' }}>
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
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}
