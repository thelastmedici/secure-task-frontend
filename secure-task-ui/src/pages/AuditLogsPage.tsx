import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function AuditLogsPage() {
  const controller = useAppController();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const actions = useMemo(() => [...new Set(controller.auditLogs.map((log) => log.action))], [controller.auditLogs]);
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return controller.auditLogs.filter((log) => {
      const matchesQuery = !normalizedQuery || [log.time, log.user, log.action, log.entity, log.ipAddress]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesQuery && (action === 'all' || log.action === action);
    });
  }, [action, controller.auditLogs, query]);

  return (
    <>
      <PageHeader title="Audit Logs" description="Admin-only immutable history for security and compliance." />
      <div className="toolbar">
        <input aria-label="Search audit logs" placeholder="Search logs..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter audit logs by action" value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="all">All actions</option>
          {actions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <section className="card table-card">
        <table>
          <thead>
            <tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>IP Address</th></tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => <tr key={log.id}><td>{log.time}</td><td>{log.user}</td><td>{log.action}</td><td>{log.entity}</td><td>{log.ipAddress}</td></tr>)}
            {filteredLogs.length === 0 && <tr><td colSpan={5} className="empty-table">No audit logs match the current filters.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
