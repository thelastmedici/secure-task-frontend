import { Bell, CheckCircle, Clock, FileText } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { notifications } from '../data/mockData';
import type { DocumentItem, RouteName, Task } from '../types';

export function DashboardPage({
  tasks,
  documents,
  onNavigate,
}: {
  tasks: Task[];
  documents: DocumentItem[];
  onNavigate: (route: RouteName) => void;
}) {
  return (
    <>
      <PageHeader title="Dashboard" description="Monitor tasks, documents, notifications, and activity from one secure workspace." />
      <div className="metrics-grid">
        <MetricCard label="Total Tasks" value={tasks.length} icon={<CheckCircle />} />
        <MetricCard label="Pending" value={tasks.filter((task) => task.status !== 'Completed').length} icon={<Clock />} />
        <MetricCard label="Documents" value={documents.length} icon={<FileText />} />
        <MetricCard label="Unread Alerts" value={notifications.filter((n) => n.unread).length} icon={<Bell />} />
      </div>

      <div className="two-column-grid">
        <section className="card">
          <div className="card-header"><h2>Recent Tasks</h2><button onClick={() => onNavigate('tasks')}>View all</button></div>
          <div className="stack-list">
            {tasks.slice(0, 3).map((task) => (
              <div className="list-row" key={task.id}>
                <div><strong>{task.title}</strong><span>{task.assignee} · Due {task.dueDate}</span></div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header"><h2>Recent Activity</h2><button onClick={() => onNavigate('audit-logs')}>Audit logs</button></div>
          <div className="timeline">
            <div><span />Joshua uploaded audit-design.pdf</div>
            <div><span />Sarah updated permissions task</div>
            <div><span />Admin changed Daniel Kim role</div>
          </div>
        </section>
      </div>
    </>
  );
}
