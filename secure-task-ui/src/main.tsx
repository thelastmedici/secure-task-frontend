import { type ReactNode, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppController } from './core/AppController';
import { AppProvider, useAppController } from './core/AppContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import type { RouteName } from './types';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function RouterBridge() {
  const controller = useAppController();
  const navigate = useNavigate();

  useEffect(() => {
    controller.setRouterNavigator((to, options) => navigate(to, options));
  }, [controller, navigate]);

  return null;
}

function ProtectedRoute({ route, children }: { route: RouteName; children: ReactNode }) {
  const controller = useAppController();
  const location = useLocation();

  if (!controller.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!controller.accessService.canAccessRoute(route, controller.user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const controller = useAppController();
  return controller.isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function WorkspaceLayout() {
  return <AppLayout><Outlet /></AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route element={<ProtectedRoute route="dashboard"><WorkspaceLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<ProtectedRoute route="tasks"><TasksPage /></ProtectedRoute>} />
        <Route path="tasks/:taskId" element={<ProtectedRoute route="task-detail"><TaskDetailPage /></ProtectedRoute>} />
        <Route path="documents" element={<ProtectedRoute route="documents"><DocumentsPage /></ProtectedRoute>} />
        <Route path="documents/:documentId" element={<ProtectedRoute route="document-detail"><DocumentDetailPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute route="notifications"><NotificationsPage /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute route="audit-logs"><AuditLogsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute route="users"><UsersPage /></ProtectedRoute>} />
        <Route path="roles" element={<ProtectedRoute route="roles"><RolesPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute route="settings"><SettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const controller = useMemo(() => new AppController(), []);

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, []);

  useEffect(() => {
    void controller.restoreSession();
  }, [controller]);

  return (
    <BrowserRouter>
      <AppProvider controller={controller}>
        <RouterBridge />
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
