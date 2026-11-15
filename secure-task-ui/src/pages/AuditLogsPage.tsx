import { Activity, ArrowDownToLine, ChevronDown, ChevronRight, Clock3, Eye, FileDown, FileUp, LockKeyhole, ShieldCheck, Trash2, UserRound, type LucideIcon } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

const dateValue = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function relativeTime(value: string) {
  const date = dateValue(value);
  if (!date) return value;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [2629800, 'week'], [31557600, 'month']];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  let amount = seconds; let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (const [limit, nextUnit] of ranges) {
    if (Math.abs(amount) < limit) break;
    amount = Math.round(seconds / (nextUnit === 'minute' ? 60 : nextUnit === 'hour' ? 3600 : nextUnit === 'day' ? 86400 : nextUnit === 'week' ? 604800 : nextUnit === 'month' ? 2629800 : nextUnit === 'year' ? 31557600 : 1));
    unit = nextUnit;
  }
  return formatter.format(amount, unit);
}

function actionStyle(action: string): { icon: LucideIcon; tone: string } {
  const normalized = action.toLowerCase();
  if (normalized.includes('upload') || normalized.includes('invite') || normalized.includes('create')) return { icon: FileUp, tone: 'success' };
  if (normalized.includes('download') || normalized.includes('export')) return { icon: ArrowDownToLine, tone: 'info' };
  if (normalized.includes('preview') || normalized.includes('view')) return { icon: Eye, tone: 'info' };
  if (normalized.includes('delete') || normalized.includes('failed') || normalized.includes('denied')) return { icon: Trash2, tone: 'danger' };
  if (normalized.includes('role') || normalized.includes('security') || normalized.includes('login')) return { icon: ShieldCheck, tone: 'warning' };
  if (normalized.includes('user')) return { icon: UserRound, tone: 'primary' };
  return { icon: Activity, tone: 'neutral' };
}

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function AuditLogsPage() {
  const controller = useAppController();
  const [query, setQuery] = useState('');
  const [user, setUser] = useState('all');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const users = useMemo(() => [...new Set(controller.auditLogs.map((log) => log.user))].sort(), [controller.auditLogs]);
  const actions = useMemo(() => [...new Set(controller.auditLogs.map((log) => log.action))].sort(), [controller.auditLogs]);
  const entities = useMemo(() => [...new Set(controller.auditLogs.map((log) => log.entity))].sort(), [controller.auditLogs]);
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    return controller.auditLogs.filter((log) => {
      const logDate = dateValue(log.time);
      const matchesQuery = !normalizedQuery || [log.time, log.user, log.action, log.entity, log.ipAddress].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesQuery && (user === 'all' || log.user === user) && (action === 'all' || log.action === action) && (entity === 'all' || log.entity === entity)
        && (!start || (logDate !== null && logDate >= start)) && (!end || (logDate !== null && logDate <= end));
    });
  }, [action, controller.auditLogs, entity, fromDate, query, toDate, user]);

  const exportCsv = () => {
    const headers = ['Event ID', 'Timestamp', 'User', 'Action', 'Entity', 'IP Address'];
    const rows = filteredLogs.map((log) => [log.id, log.time, log.user, log.action, log.entity, log.ipAddress]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <>
      <PageHeader title="Audit Logs" description="A traceable record of workspace activity for security and compliance." action={<span className="immutable-indicator"><LockKeyhole size={15}/> Immutable log</span>} />

      <div className="metrics-grid dashboard-summary-grid audit-metrics">
        <div className="metric-card dashboard-summary-card"><div className="metric-icon primary"><Activity size={19}/></div><div><strong>{controller.auditLogs.length}</strong><span>Total events</span></div></div>
        <div className="metric-card dashboard-summary-card"><div className="metric-icon accent"><ShieldCheck size={19}/></div><div><strong>{actions.length}</strong><span>Action types</span></div></div>
        <div className="metric-card dashboard-summary-card"><div className="metric-icon success"><UserRound size={19}/></div><div><strong>{users.length}</strong><span>Actors</span></div></div>
      </div>

      <div className="task-toolbar audit-toolbar">
        <div className="audit-filter-grid">
          <label className="search-box"><input aria-label="Search audit logs" placeholder="Search logs..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="audit-filter"><span>User</span><select aria-label="Filter audit logs by user" value={user} onChange={(event) => setUser(event.target.value)}><option value="all">All users</option>{users.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="audit-filter"><span>Action</span><select aria-label="Filter audit logs by action" value={action} onChange={(event) => setAction(event.target.value)}><option value="all">All actions</option>{actions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="audit-filter"><span>Entity</span><select aria-label="Filter audit logs by entity" value={entity} onChange={(event) => setEntity(event.target.value)}><option value="all">All entities</option>{entities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="audit-filter"><span>From</span><input aria-label="Audit logs from date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label className="audit-filter"><span>To</span><input aria-label="Audit logs to date" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
          <button type="button" className="audit-export-button" onClick={exportCsv} disabled={!filteredLogs.length}><FileDown size={16}/> Export CSV <span>{filteredLogs.length}</span></button>
        </div>
      </div>

      <section className="card audit-table-card">
        <div className="audit-table-heading"><span><strong>{filteredLogs.length}</strong> events</span><span className="immutable-inline"><LockKeyhole size={13}/> Immutable record</span></div>
        <div className="audit-table-scroll"><table className="audit-table"><thead><tr><th>Event</th><th>Actor</th><th>Action</th><th>Entity</th><th>Source IP</th><th aria-label="Expand details" /></tr></thead>
          <tbody>{filteredLogs.map((log) => {
            const expanded = expandedId === log.id; const appearance = actionStyle(log.action); const Icon = appearance.icon; const parsedTime = dateValue(log.time);
            const payload = { id: log.id, timestamp: log.time, actor: log.user, action: log.action, entity: log.entity, source: { ipAddress: log.ipAddress } };
            return <Fragment key={log.id}><tr className={`audit-row ${expanded ? 'expanded' : ''}`} onClick={() => setExpandedId(expanded ? null : log.id)} aria-expanded={expanded}>
              <td><span className="audit-time-cell" title={parsedTime ? parsedTime.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }) : log.time}><span className="audit-action-icon"><Clock3 size={15}/></span><span><strong>{relativeTime(log.time)}</strong><small>{parsedTime ? parsedTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : log.time}</small></span></span></td>
              <td><span className="audit-actor"><span className="audit-avatar">{log.user.slice(0, 1).toUpperCase()}</span><strong>{log.user}</strong></span></td>
              <td><span className={`audit-action-badge ${appearance.tone}`}><Icon size={14}/>{log.action}</span></td>
              <td><span className="audit-entity">{log.entity}</span></td><td><code className="ip-address">{log.ipAddress}</code></td>
              <td><button type="button" className="expand-event-button" aria-label={`${expanded ? 'Collapse' : 'Expand'} event ${log.id}`} onClick={(event) => { event.stopPropagation(); setExpandedId(expanded ? null : log.id); }}>{expanded ? <ChevronDown size={17}/> : <ChevronRight size={17}/>}</button></td>
            </tr>{expanded && <tr className="audit-payload-row"><td colSpan={6}><div className="audit-payload"><div><div className="payload-title"><Activity size={15}/><strong>Event payload</strong></div><span className="payload-source">Captured event fields</span></div><pre>{JSON.stringify(payload, null, 2)}</pre></div></td></tr>}</Fragment>;
          })}
          {filteredLogs.length === 0 && <tr><td colSpan={6} className="empty-table">No audit logs match the current filters.</td></tr>}</tbody>
        </table></div>
      </section>
    </>
  );
}
