import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './shared/styles/global.css';

// ── One-time localStorage cleanup for stale bug data ────────────────
(function sanitizeStaleData() {
  try {
    const raw = localStorage.getItem('project-storage');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const state = parsed?.state || parsed;
    if (!state) return;
    let dirty = false;

    // projectsStep2Data must be Record<string, string[]> — clean anything else
    const s2d = state.projectsStep2Data;
    if (s2d && typeof s2d === 'object') {
      for (const [id, val] of Object.entries(s2d)) {
        const isValidArray = Array.isArray(val) && val.every((v: unknown) => typeof v === 'string');
        const nested = val && typeof val === 'object' ? (val as any).selectedTechs : undefined;
        const isNestedValid = Array.isArray(nested) && nested.every((v: unknown) => typeof v === 'string');
        if (!isValidArray && !isNestedValid) {
          console.warn(`[Cleanup] Dropping stale step2 data for project "${id}"`);
          delete s2d[id];
          dirty = true;
        }
      }
    }

    if (dirty) {
      localStorage.setItem('project-storage', JSON.stringify({ state, version: 1 }));
      console.log('[Cleanup] Stale data removed. Reloading...');
      window.location.reload();
    }
  } catch { /* ignore */ }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2B87C9',
          borderRadius: 6,
          colorBgLayout: '#f0f2f5',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
        },
        components: {
          Card: {
            colorBgContainer: '#ffffff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);