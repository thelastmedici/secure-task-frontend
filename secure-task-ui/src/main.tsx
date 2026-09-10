import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
import { tasks, documents } from './data/mockData';
import type { RouteName } from './types';
import '/home/asiwaju/Documents/secure-task-frontend/secure-task-ui/src/styles.css';

function App() {
  const [route, setRoute] = useState<RouteName>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState('t1');
  const [selectedDocumentId, setSelectedDocumentId] = useState('d1');

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0], [selectedTaskId]);
  const selectedDocument = useMemo(() => documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0], [selectedDocumentId]);

  if (route === 'login') {
    return <LoginPage onLogin={() => setRoute('dashboard')} />;
  }

  return (
    <AppLayout route={route} onNavigate={setRoute}>
      {route === 'dashboard' && <DashboardPage onNavigate={setRoute} />}
      {route === 'tasks' && <TasksPage onOpenTask={(id) => { setSelectedTaskId(id); setRoute('task-detail'); }} />}
      {route === 'task-detail' && <TaskDetailPage task={selectedTask} onBack={() => setRoute('tasks')} />}
      {route === 'documents' && <DocumentsPage onOpenDocument={(id) => { setSelectedDocumentId(id); setRoute('document-detail'); }} />}
      {route === 'document-detail' && <DocumentDetailPage document={selectedDocument} onBack={() => setRoute('documents')} />}
      {route === 'notifications' && <NotificationsPage />}
      {route === 'audit-logs' && <AuditLogsPage />}
      {route === 'users' && <UsersPage />}
      {route === 'roles' && <RolesPage />}
      {route === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
