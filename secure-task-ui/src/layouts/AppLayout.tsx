import { type ReactNode, useMemo, useState } from 'react';
import { Bell, FileText, History, LayoutDashboard, LogOut, Search, Settings, Shield, Users, CheckSquare } from 'lucide-react';
import { useAppController } from '../core/AppContext';
import type { RouteName } from '../types';

type NavigationItem = {
  route: RouteName;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

type SearchResult = {
  id: string;
  title: string;
  detail: string;
  onSelect: () => void;
};

const navItems: NavigationItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { route: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
  { route: 'documents', label: 'Documents', icon: <FileText size={18} /> },
  { route: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { route: 'audit-logs', label: 'Audit Logs', icon: <History size={18} />, adminOnly: true },
  { route: 'users', label: 'Users', icon: <Users size={18} />, adminOnly: true },
  { route: 'roles', label: 'Roles', icon: <Shield size={18} />, adminOnly: true },
  { route: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const controller = useAppController();
  const route = controller.route;
  const visibleNav = navItems.filter((item) => !item.adminOnly || controller.user.isAdmin());
  const unreadNotifications = controller.notifications.filter((notification) => notification.unread).length;
  const userInitial = controller.user.name.trim().charAt(0).toUpperCase();
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!normalizedQuery) return [];

    const includesQuery = (value: string) => value.toLowerCase().includes(normalizedQuery);
    const taskResults = controller.tasks
      .filter((task) => includesQuery(task.title) || includesQuery(task.description) || includesQuery(task.assignee))
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        detail: `Task · ${task.status}`,
        onSelect: () => controller.openTask(task.id),
      }));
    const documentResults = controller.documents
      .filter((document) => includesQuery(document.fileName) || includesQuery(document.uploadedBy) || includesQuery(document.linkedTask ?? ''))
      .map((document) => ({
        id: `document-${document.id}`,
        title: document.fileName,
        detail: `Document · ${document.type}`,
        onSelect: () => controller.openDocument(document.id),
      }));
    const userResults = controller.user.isAdmin()
      ? controller.users
        .filter((user) => includesQuery(user.name) || includesQuery(user.email) || includesQuery(user.role))
        .map((user) => ({
          id: `user-${user.id}`,
          title: user.name,
          detail: `User · ${user.role}`,
          onSelect: () => controller.navigate('users'),
        }))
      : [];

    return [...taskResults, ...documentResults, ...userResults].slice(0, 8);
  }, [controller.documents, controller.tasks, controller.user, controller.users, normalizedQuery]);

  const selectSearchResult = (result: SearchResult) => {
    result.onSelect();
    setSearchQuery('');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Application navigation">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>SecureFlow</strong>
            <span>Task & Docs</span>
          </div>
        </div>

        <nav aria-label="Main navigation">
          {visibleNav.map((item) => (
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
        </nav>

        <button type="button" className="nav-item logout" onClick={() => controller.logout()}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="global-search">
          <label className="search-box">
            <span className="sr-only">Search tasks, documents, and users</span>
            <Search size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks, documents, users..."
              aria-controls="global-search-results"
              aria-expanded={normalizedQuery.length > 0}
            />
          </label>
          {normalizedQuery && (
            <div id="global-search-results" className="search-results" role="listbox" aria-label="Search results">
              {searchResults.length > 0 ? searchResults.map((result) => (
                <button key={result.id} type="button" className="search-result" role="option" onClick={() => selectSearchResult(result)}>
                  <strong>{result.title}</strong>
                  <span>{result.detail}</span>
                </button>
              )) : <p className="search-empty">No matching tasks, documents, or users.</p>}
            </div>
          )}
          </div>
          <div className="top-actions">
            <button
              type="button"
              className="icon-button notification-button"
              aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ''}`}
              onClick={() => controller.navigate('notifications')}
            >
              <Bell size={18} />
              {unreadNotifications > 0 && <span className="notification-count" aria-hidden="true">{unreadNotifications}</span>}
            </button>
            {unreadNotifications > 0 && (
              <button type="button" className="icon-button" onClick={() => controller.markAllNotificationsRead()} title="Mark all notifications as read">Mark all read</button>
            )}
            <div className="profile-pill">
              <div className="avatar" aria-hidden="true">{userInitial}</div>
              <div>
                <strong>{controller.user.name}</strong>
                <span>{controller.user.role}</span>
              </div>
            </div>
          </div>
        </header>
        {controller.lastError && <div className="error-banner" role="alert">{controller.lastError} <button onClick={() => controller.clearError()}>Dismiss</button></div>}
        {controller.lastSuccess && <div className="success-banner" role="status">{controller.lastSuccess} <button onClick={() => controller.clearError()}>Dismiss</button></div>}
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
