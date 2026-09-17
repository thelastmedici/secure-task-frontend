import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppController } from './core/AppController';
import { AppProvider } from './core/AppContext';
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
import type { Task, DocumentItem } from './types';
import '/home/asiwaju/Documents/secure-task-frontend/secure-task-ui/src/styles.css';

function App() {
  const controller = useMemo(() => new AppController(), []);
  const [route, setRoute] = useState(controller.route);
  const [tasks, setTasks] = useState<Task[]>(controller.tasks);
  const [documents, setDocuments] = useState<DocumentItem[]>(controller.documents);
  const [notifications, setNotifications] = useState(controller.notifications);

  const selectedTask = useMemo(() => tasks.find((task) => task.id === controller.selectedTaskId) ?? tasks[0], [tasks, controller.selectedTaskId]);
  const selectedDocument = useMemo(() => documents.find((doc) => doc.id === controller.selectedDocumentId) ?? documents[0], [documents, controller.selectedDocumentId]);

  const handleCreateTask = (payload?: Partial<Task>) => {
    controller.createTask(payload);
  };

  const handleUploadDocument = (payload?: Partial<DocumentItem>) => {
    controller.uploadDocument(payload);
  };

  const handleMarkAllRead = () => {
    controller.markAllNotificationsRead();
  };

  const syncState = () => {
    setTasks(controller.tasks);
    setDocuments(controller.documents);
    setNotifications(controller.notifications);
    setRoute(controller.route);
  };

  React.useEffect(() => {
    const unsub = controller.subscribe(() => syncState());
    return unsub;
  }, [controller]);

  const onNavigate = (nextRoute: typeof route) => {
    controller.navigate(nextRoute);
  };

  if (route === 'login') {
    return <LoginPage />;
  }

  return (
    <AppProvider controller={controller}>
      <AppLayout>
        {route === 'dashboard' && <DashboardPage tasks={tasks} documents={documents} onNavigate={onNavigate} />}
        {route === 'tasks' && <TasksPage />}
        {route === 'task-detail' && <TaskDetailPage documents={documents} task={selectedTask} onBack={() => { controller.navigate('tasks'); syncState(); }} />}
        {route === 'documents' && <DocumentsPage />}
        {route === 'document-detail' && <DocumentDetailPage document={selectedDocument} onBack={() => { controller.navigate('documents'); syncState(); }} />}
        {route === 'notifications' && <NotificationsPage notifications={notifications} onMarkAllRead={handleMarkAllRead} />}
        {route === 'audit-logs' && <AuditLogsPage />}
        {route === 'users' && <UsersPage />}
        {route === 'roles' && <RolesPage />}
        {route === 'settings' && <SettingsPage />}
      </AppLayout>
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
