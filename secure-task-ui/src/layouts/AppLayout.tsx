import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import {
  Bell,
  CheckSquare,
  ChevronDown,
  Command as CommandIcon,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAppController } from '../core/AppContext';
import type { RouteName } from '../types';

type NavigationItem = {
  route: RouteName;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type CommandItem = {
  id: string;
  label: string;
  group: string;
  description: string;
  run: () => void;
  keywords: string[];
};

const navItems: NavigationItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.75} /> },
  { route: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} strokeWidth={1.75} /> },
  { route: 'documents', label: 'Documents', icon: <FileText size={16} strokeWidth={1.75} /> },
  { route: 'notifications', label: 'Notifications', icon: <Bell size={16} strokeWidth={1.75} /> },
  { route: 'audit-logs', label: 'Audit Logs', icon: <History size={16} strokeWidth={1.75} />, adminOnly: true },
  { route: 'users', label: 'Users', icon: <Users size={16} strokeWidth={1.75} />, adminOnly: true },
  { route: 'roles', label: 'Roles', icon: <Shield size={16} strokeWidth={1.75} />, adminOnly: true },
  { route: 'settings', label: 'Settings', icon: <Settings size={16} strokeWidth={1.75} /> },
];

const routeLabels: Record<RouteName, string> = {
  login: 'Login',
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  'task-detail': 'Task detail',
  documents: 'Documents',
  'document-detail': 'Document detail',
  notifications: 'Notifications',
  'audit-logs': 'Audit logs',
  users: 'Users',
  roles: 'Roles',
  settings: 'Settings',
};

export function AppLayout({ children }: { children: ReactNode }) {
  const controller = useAppController();
  const route = controller.route;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const visibleNav = navItems.filter((item) => !item.adminOnly || controller.user.isAdmin());
  const workNav = visibleNav.filter((item) => item.route !== 'settings' && !item.adminOnly && item.route !== 'audit-logs' && item.route !== 'users' && item.route !== 'roles');
  const adminNav = visibleNav.filter((item) => item.adminOnly || item.route === 'settings');
  const unreadNotifications = controller.notifications.filter((notification) => notification.unread).length;
  const userInitial = controller.user.name.trim().charAt(0).toUpperCase();

  const commandItems = useMemo<CommandItem[]>(() => {
    const taskResults = controller.tasks.map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      group: 'Tasks',
      description: `${task.status} · ${task.assignee}`,
      keywords: ['task', 'tasks', task.title, task.assignee, task.status],
      run: () => {
        controller.openTask(task.id);
        setCommandPaletteOpen(false);
      },
    }));

    const documentResults = controller.documents.map((document) => ({
      id: `document-${document.id}`,
      label: document.fileName,
      group: 'Documents',
      description: `${document.type} · ${document.uploadedBy}`,
      keywords: ['document', 'documents', document.fileName, document.type, document.uploadedBy],
      run: () => {
        controller.openDocument(document.id);
        setCommandPaletteOpen(false);
      },
    }));

    const userResults = controller.users.map((user) => ({
      id: `user-${user.id}`,
      label: user.name,
      group: 'Users',
      description: `${user.role} · ${user.email}`,
      keywords: ['user', 'users', user.name, user.email, user.role],
      run: () => {
        controller.navigate('users');
        setCommandPaletteOpen(false);
      },
    }));

    const actionResults: CommandItem[] = [
      {
        id: 'create-task',
        label: 'Create task',
        group: 'Actions',
        description: 'Create a new task and open it immediately',
        keywords: ['task', 'create', 'new', 'action'],
        run: () => {
          controller.createTask({ title: 'New security review', description: 'Created from the command palette.' });
          setCommandPaletteOpen(false);
          showToast('Task created.', 'success');
        },
      },
      {
        id: 'upload-document',
        label: 'Upload document',
        group: 'Actions',
        description: 'Upload a new document for review',
        keywords: ['document', 'upload', 'file', 'action'],
        run: () => {
          controller.uploadDocument({ fileName: 'secure-review.pdf', type: 'PDF', size: '1.2 MB' });
          setCommandPaletteOpen(false);
          showToast('Document uploaded.', 'success');
        },
      },
      {
        id: 'go-audit-logs',
        label: 'Go to audit logs',
        group: 'Actions',
        description: 'Open the audit history view',
        keywords: ['audit', 'logs', 'history', 'security'],
        run: () => {
          controller.navigate('audit-logs');
          setCommandPaletteOpen(false);
        },
      },
      {
        id: 'invite-user',
        label: 'Invite user',
        group: 'Actions',
        description: 'Send a new workspace invite',
        keywords: ['invite', 'user', 'member', 'team'],
        run: async () => {
          await controller.inviteUser({ name: 'New teammate', email: 'new-teammate@secureflow.io', role: 'Member' });
          controller.navigate('users');
          setCommandPaletteOpen(false);
        },
      },
    ];

    return [...taskResults, ...documentResults, ...userResults, ...actionResults];
  }, [controller, showToast]);

  const filteredCommandItems = useMemo(() => {
    if (!commandQuery.trim()) return commandItems;
    const query = commandQuery.toLowerCase();
    return commandItems.filter((item) => item.label.toLowerCase().includes(query) || item.group.toLowerCase().includes(query) || item.keywords.some((keyword) => keyword.toLowerCase().includes(query)));
  }, [commandItems, commandQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (controller.lastSuccess) {
      showToast(controller.lastSuccess, 'success');
      controller.clearError();
    }
    if (controller.lastError) {
      showToast(controller.lastError, 'error');
      controller.clearError();
    }
  }, [controller, controller.lastSuccess, controller.lastError]);

  const breadcrumbs = [
    'Workspace',
    routeLabels[route] ?? 'Overview',
  ];

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Application navigation">
        <div className="sidebar-top">
          <button type="button" className="workspace-switcher" aria-label="Switch workspace">
            <span className="workspace-mark">S</span>
            {!sidebarCollapsed && (
              <span className="workspace-copy">
                <strong>SecureFlow</strong>
                <small>Ops workspace</small>
              </span>
            )}
            {!sidebarCollapsed && <ChevronDown size={14} strokeWidth={2} />}
          </button>
          {!sidebarCollapsed && (
            <button type="button" className="collapse-toggle" onClick={() => setSidebarCollapsed(true)} aria-label="Collapse sidebar">
              <PanelLeftClose size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button type="button" className="expand-toggle" onClick={() => setSidebarCollapsed(false)} aria-label="Expand sidebar">
            <PanelLeftOpen size={16} strokeWidth={2} />
          </button>
        )}

        {!sidebarCollapsed && (
          <div className="nav-group">
            <p className="nav-label">Work</p>
            {workNav.map((item) => (
              <button
                key={item.route}
                type="button"
                className={`nav-item ${route === item.route ? 'active' : ''}`}
                aria-current={route === item.route ? 'page' : undefined}
                onClick={() => controller.navigate(item.route)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {!sidebarCollapsed && adminNav.length > 0 && (
          <div className="nav-group">
            <p className="nav-label">Admin</p>
            {adminNav.map((item) => (
              <button
                key={item.route}
                type="button"
                className={`nav-item ${route === item.route ? 'active' : ''}`}
                aria-current={route === item.route ? 'page' : undefined}
                onClick={() => controller.navigate(item.route)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {sidebarCollapsed && (
          <nav className="collapsed-nav" aria-label="Collapsed navigation">
            {visibleNav.map((item) => (
              <button
                key={item.route}
                type="button"
                className={`nav-icon ${route === item.route ? 'active' : ''}`}
                aria-label={item.label}
                title={item.label}
                onClick={() => controller.navigate(item.route)}
              >
                {item.icon}
              </button>
            ))}
          </nav>
        )}

        <div className="sidebar-footer">
          <div className="user-menu">
            <div className="avatar" aria-hidden="true">{userInitial}</div>
            {!sidebarCollapsed && (
              <div className="user-copy">
                <strong>{controller.user.name}</strong>
                <span>{controller.user.role}</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-actions">
              <ThemeToggle />
              <button type="button" className="logout-button" onClick={() => controller.logout()}>
                <LogOut size={14} strokeWidth={2} />
                Logout
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="sidebar-actions collapsed-actions">
              <ThemeToggle />
              <button type="button" className="icon-button" onClick={() => controller.logout()} aria-label="Logout" title="Logout">
                <LogOut size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="palette-trigger" onClick={() => setCommandPaletteOpen(true)}>
              <CommandIcon size={15} strokeWidth={2} />
              <span>Search or type a command</span>
              <kbd>⌘K</kbd>
            </button>
          </div>

          <div className="top-actions">
            <ThemeToggle />
            <div className="notification-wrap">
              <button
                type="button"
                className="icon-button notification-button"
                aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ''}`}
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell size={16} strokeWidth={1.75} />
                {unreadNotifications > 0 && <span className="notification-count" aria-hidden="true">{unreadNotifications}</span>}
              </button>

              {notificationsOpen && (
                <div className="notification-popover" role="dialog" aria-label="Notifications">
                  <div className="popover-header">
                    <strong>Inbox</strong>
                    <button type="button" className="text-button" onClick={() => controller.markAllNotificationsRead()}>Mark all read</button>
                  </div>
                  <div className="notification-list">
                    {controller.notifications.length === 0 ? (
                      <p className="empty-state">You’re all caught up.</p>
                    ) : (
                      controller.notifications.slice(0, 6).map((notification) => (
                        <button key={notification.id} type="button" className={`notification-item ${notification.unread ? 'unread' : ''}`} onClick={() => setNotificationsOpen(false)}>
                          <span className="notification-dot" aria-hidden="true" />
                          <span className="notification-copy">
                            <strong>{notification.message}</strong>
                            <small>{notification.type} · {new Date(notification.createdAt).toLocaleDateString()}</small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-shell">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                <span>{crumb}</span>
              </span>
            ))}
          </nav>
          <section className="content">{children}</section>
        </div>
      </main>

      {commandPaletteOpen && (
        <div className="command-overlay" onClick={() => setCommandPaletteOpen(false)}>
          <div className="command-panel" onClick={(event) => event.stopPropagation()}>
            <Command value={commandQuery} onValueChange={setCommandQuery} label="Command palette">
              <div className="command-input-wrap">
                <CommandIcon size={16} strokeWidth={2} />
                <Command.Input placeholder="Search tasks, docs, users, or actions" autoFocus />
              </div>
              <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                {['Tasks', 'Documents', 'Users', 'Actions'].map((groupName) => {
                  const items = filteredCommandItems.filter((item) => item.group === groupName);
                  if (items.length === 0) return null;

                  return (
                    <Command.Group key={groupName} heading={groupName}>
                      {items.map((item) => (
                        <Command.Item key={item.id} value={`${item.group}-${item.label}`} onSelect={item.run}>
                          <span>{item.label}</span>
                          <small>{item.description}</small>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
