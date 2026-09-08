import React from 'react';
import { Bell, FileText, History, LayoutDashboard, LogOut, Search, Settings, Shield, Users, CheckSquare } from 'lucide-react';
import { RouteName } from '../main';
import { currentUser } from '../data/mockData';

const navItems: Array<{ route: RouteName; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { route: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
  { route: 'documents', label: 'Documents', icon: <FileText size={18} /> },
  { route: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { route: 'audit-logs', label: 'Audit Logs', icon: <History size={18} />, adminOnly: true },
  { route: 'users', label: 'Users', icon: <Users size={18} />, adminOnly: true },
  { route: 'roles', label: 'Roles', icon: <Shield size={18} />, adminOnly: true },
  { route: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function AppLayout({ children, route, onNavigate }: { children: React.ReactNode; route: RouteName; onNavigate: (route: RouteName) => void }) {
  const visibleNav = navItems.filter((item) => !item.adminOnly || currentUser.role === 'Admin');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>SecureFlow</strong>
            <span>Task & Docs</span>
          </div>
        </div>

        <nav>
          {visibleNav.map((item) => (
            <button key={item.route} className={`nav-item ${route === item.route ? 'active' : ''}`} onClick={() => onNavigate(item.route)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <button className="nav-item logout" onClick={() => onNavigate('login')}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Search tasks, documents, users..." />
          </div>
          <div className="top-actions">
            <button className="icon-button"><Bell size={18} /></button>
            <div className="profile-pill">
              <div className="avatar">J</div>
              <div>
                <strong>{currentUser.name}</strong>
                <span>{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
