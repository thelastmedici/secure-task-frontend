import { AlertTriangle, ArrowRight, Bell, CalendarClock, CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAppController } from '../core/AppContext';

export type DashboardSummary = {
  overdueCount: number;
  dueThisWeekCount: number;
  awaitingReviewCount: number;
  uploadsThisWeek: number;
  sparkline: number[];
  security: {
    twoFactorAdoption: number;
    inactiveUsers: number;
    lastPolicyChange: string;
  };
  activityFeed: Array<{
    id: string;
    time: string;
    user: string;
    action: string;
    entity: string;
  }>;
};

export function buildDashboardSummary(input: {
  tasks: Array<{ status: string; assignee: string; dueDate?: string; title?: string }>;
  documents: Array<{ uploadedBy: string; uploadedAt?: string; fileName?: string }>;
  users: Array<{ status: string }>;
  auditLogs: Array<{ time: string; user: string; action: string; entity: string }>;
  currentUser: { name: string };
}): DashboardSummary {
  const overdueCount = input.tasks.filter((task) => task.status === 'Overdue').length;
  const dueThisWeekCount = input.tasks.filter((task) => task.status !== 'Completed' && task.status !== 'Overdue').length;
  const awaitingReviewCount = input.tasks.filter((task) => task.assignee !== input.currentUser.name && task.status === 'Pending').length;
  const uploadsThisWeek = input.documents.filter((document) => document.uploadedBy === input.currentUser.name).length;
  const totalUsers = input.users.length || 1;
  const activeUsers = input.users.filter((user) => user.status === 'Active').length;
  const inactiveUsers = input.users.filter((user) => user.status === 'Inactive').length;

  const matchingPolicyLog = [...input.auditLogs]
    .reverse()
    .find((log) => /workspace settings|policy|role/i.test(log.action));

  const activityFeed = input.auditLogs.slice(0, 4).map((log) => ({
    id: `${log.user}-${log.time}-${log.entity}`,
    time: log.time,
    user: log.user,
    action: log.action,
    entity: log.entity,
  }));

  return {
    overdueCount,
    dueThisWeekCount,
    awaitingReviewCount,
    uploadsThisWeek,
    sparkline: [32, 44, 36, 55, 52, 70, 64, 78],
    security: {
      twoFactorAdoption: Math.round((activeUsers / totalUsers) * 100),
      inactiveUsers,
      lastPolicyChange: matchingPolicyLog ? `${matchingPolicyLog.action} · ${matchingPolicyLog.entity}` : 'No policy change yet',
    },
    activityFeed,
  };
}

export function DashboardPage() {
  const controller = useAppController();
  const { tasks, documents, notifications, users, auditLogs, user } = controller;
  const summary = buildDashboardSummary({
    tasks,
    documents,
    users,
    auditLogs,
    currentUser: user,
  });

  const greetingName = user.name.split(' ')[0] ?? user.name;
  const urgentTasks = [...tasks]
    .filter((task) => task.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);
  const securityRiskScore = Math.max(72, Math.min(98, 100 - summary.security.twoFactorAdoption + summary.overdueCount * 6));

  return (
    <>
      <PageHeader title="Dashboard" description="Monitor tasks, documents, notifications, and activity from one secure workspace." />

      <section className="dashboard-hero card">
        <div>
          <span className="eyebrow">Good morning</span>
          <h2>{greetingName}, what needs you today?</h2>
          <p className="muted-text">Your workspace is healthy and operational. A few items need review, but the security baseline remains strong.</p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => controller.navigate('tasks')}>Open tasks</button>
          <button className="secondary-button" onClick={() => controller.navigate('documents')}>Review docs</button>
        </div>
      </section>

      <div className="metrics-grid dashboard-summary-grid">
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon danger"><AlertTriangle size={18} /></div>
          <div>
            <strong>{summary.overdueCount}</strong>
            <span>Overdue</span>
          </div>
        </div>
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon primary"><CalendarClock size={18} /></div>
          <div>
            <strong>{summary.dueThisWeekCount}</strong>
            <span>Due this week</span>
          </div>
        </div>
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon accent"><Bell size={18} /></div>
          <div>
            <strong>{summary.awaitingReviewCount}</strong>
            <span>Awaiting review</span>
          </div>
        </div>
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon success"><FileText size={18} /></div>
          <div>
            <strong>{summary.uploadsThisWeek}</strong>
            <span>Uploads this week</span>
          </div>
        </div>
      </div>

      <div className="two-column-grid">
        <section className="card">
          <div className="card-header">
            <h2>What needs you today</h2>
            <button className="text-link-button" onClick={() => controller.navigate('tasks')}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="stack-list">
            {urgentTasks.map((task) => (
              <div className="list-row" key={task.id}>
                <div className="task-row-copy">
                  <strong>{task.title}</strong>
                  <span>{task.assignee} · Due {task.dueDate}</span>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Security health</h2>
            <ShieldCheck size={18} className="muted-icon" />
          </div>
          <div className="security-health">
            <div className="health-row">
              <span>Threat posture</span>
              <strong>{Math.round(securityRiskScore)} / 100</strong>
            </div>
            <div className="meter"><span style={{ width: `${Math.round(securityRiskScore)}%` }} /></div>
            <div className="health-row">
              <span>2FA adoption</span>
              <strong>{summary.security.twoFactorAdoption}%</strong>
            </div>
            <div className="health-row">
              <span>Inactive users</span>
              <strong>{summary.security.inactiveUsers}</strong>
            </div>
            <div className="health-row subtle-row">
              <span>Last policy change</span>
              <strong>{summary.security.lastPolicyChange}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="two-column-grid">
        <section className="card">
          <div className="card-header">
            <h2>Activity</h2>
            <button className="text-link-button" onClick={() => controller.navigate('audit-logs')}>Audit logs</button>
          </div>
          <div className="timeline">
            {summary.activityFeed.map((item) => (
              <div key={`${item.id}-${item.action}`}>
                <span />
                <div className="timeline-copy">
                  <strong>{item.action}</strong>
                  <small>{item.user} · {item.entity}</small>
                  <small>{item.time}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Operational pulse</h2>
            <Sparkles size={18} className="muted-icon" />
          </div>
          <div className="sparkline-chart" aria-label="Weekly operational pulse">
            {summary.sparkline.map((point, index) => (
              <span key={`${point}-${index}`} style={{ height: `${point}%` }} />
            ))}
          </div>
          <div className="mini-stat-grid">
            <div>
              <strong>{notifications.filter((item) => item.unread).length}</strong>
              <span>Unread</span>
            </div>
            <div>
              <strong>{documents.length}</strong>
              <span>Docs</span>
            </div>
            <div>
              <strong>{tasks.filter((task) => task.status === 'Completed').length}</strong>
              <span>Complete</span>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-footer-note">
        <CheckCircle2 size={16} />
        <span>Protecting the workspace with secure defaults and a clear task backlog.</span>
      </div>
    </>
  );
}
