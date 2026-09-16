import { type ReactNode } from 'react';
import { Bell, FileText, History, LayoutDashboard, LogOut, Search, Settings, Shield, Users, CheckSquare } from 'lucide-react';
import { useAppController } from '../core/AppContext';
import type { RouteName } from '../types';

type NavigationItem = {
  route: RouteName;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
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

        <button type="button" className="nav-item logout" onClick={() => controller.navigate('login')}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <label className="search-box">
            <span className="sr-only">Search tasks, documents, and users</span>
            <Search size={18} />
            <input type="search" placeholder="Search tasks, documents, users..." />
          </label>
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
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
