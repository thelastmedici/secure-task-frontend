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
import { currentUser, tasks as initialTasks, documents as initialDocuments, notifications as initialNotifications } from './data/mockData';
import type { RouteName, Task, DocumentItem, NotificationItem } from './types';
import '/home/asiwaju/Documents/secure-task-frontend/secure-task-ui/src/styles.css';

function App() {
  const [route, setRoute] = useState<RouteName>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem('tasks');
      return raw ? JSON.parse(raw) as Task[] : initialTasks;
    } catch {
      return initialTasks;
    }
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const raw = localStorage.getItem('documents');
      return raw ? JSON.parse(raw) as DocumentItem[] : initialDocuments;
    } catch {
      return initialDocuments;
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const raw = localStorage.getItem('notifications');
      return raw ? JSON.parse(raw) as NotificationItem[] : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [selectedTaskId, setSelectedTaskId] = useState('t1');
  const [selectedDocumentId, setSelectedDocumentId] = useState('d1');

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0], [tasks, selectedTaskId]);
  const selectedDocument = useMemo(() => documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0], [documents, selectedDocumentId]);

  const handleCreateTask = (payload?: Partial<Task>) => {
    const createdAt = new Date();
    const newTask: Task = {
      id: `t${createdAt.getTime()}`,
      title: payload?.title ?? 'New security review task',
      description: payload?.description ?? 'A newly created task for the secure workflow pipeline.',
      status: 'Pending',
      priority: 'Medium',
      assignee: payload?.assignee ?? currentUser.name,
      dueDate: payload?.dueDate ?? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };

    setTasks((previous) => [newTask, ...previous]);
    setSelectedTaskId(newTask.id);
    setRoute('task-detail');
  };

  const handleUploadDocument = () => {
    const createdAt = new Date();
    const newDocument: DocumentItem = {
      id: `d${createdAt.getTime()}`,
      fileName: `new-upload-${documents.length + 1}.pdf`,
      type: 'PDF',
      size: '1.2 MB',
      uploadedBy: currentUser.name,
      uploadedAt: createdAt.toISOString().slice(0, 10),
      linkedTask: 'New security review task',
    };

    setDocuments((previous) => [newDocument, ...previous]);
    setSelectedDocumentId(newDocument.id);
    setRoute('document-detail');
  };

  const handleUploadDocumentWith = (payload?: Partial<DocumentItem>) => {
    const createdAt = new Date();
    const newDocument: DocumentItem = {
      id: `d${createdAt.getTime()}`,
      fileName: payload?.fileName ?? `new-upload-${documents.length + 1}.pdf`,
      type: payload?.type ?? 'PDF',
      size: payload?.size ?? '1.2 MB',
      uploadedBy: payload?.uploadedBy ?? currentUser.name,
      uploadedAt: payload?.uploadedAt ?? createdAt.toISOString().slice(0, 10),
      linkedTask: payload?.linkedTask,
    };

    setDocuments((previous) => [newDocument, ...previous]);
    setSelectedDocumentId(newDocument.id);
    setRoute('document-detail');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  React.useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('documents', JSON.stringify(documents));
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [tasks, documents, notifications]);

  if (route === 'login') {
    return <LoginPage onLogin={() => setRoute('dashboard')} />;
  }

  return (
    <AppLayout route={route} onNavigate={setRoute} notifications={notifications} onMarkAllRead={handleMarkAllRead}>
      {route === 'dashboard' && <DashboardPage tasks={tasks} documents={documents} onNavigate={setRoute} />}
      {route === 'tasks' && <TasksPage tasks={tasks} onOpenTask={(id) => { setSelectedTaskId(id); setRoute('task-detail'); }} onCreateTask={handleCreateTask} />}
      {route === 'task-detail' && <TaskDetailPage documents={documents} task={selectedTask} onBack={() => setRoute('tasks')} />}
      {route === 'documents' && <DocumentsPage documents={documents} onOpenDocument={(id) => { setSelectedDocumentId(id); setRoute('document-detail'); }} onUploadDocument={handleUploadDocumentWith} />}
      {route === 'document-detail' && <DocumentDetailPage document={selectedDocument} onBack={() => setRoute('documents')} />}
      {route === 'notifications' && <NotificationsPage notifications={notifications} onMarkAllRead={handleMarkAllRead} />}
      {route === 'audit-logs' && <AuditLogsPage />}
      {route === 'users' && <UsersPage />}
      {route === 'roles' && <RolesPage />}
      {route === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
