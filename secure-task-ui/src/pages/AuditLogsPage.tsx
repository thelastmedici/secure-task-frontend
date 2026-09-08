import { PageHeader } from '../components/PageHeader';
import { auditLogs } from '../data/mockData';

export function AuditLogsPage() {
  return <><PageHeader title="Audit Logs" description="Admin-only immutable history for security and compliance." /><div className="toolbar"><input placeholder="Search logs..." /><select><option>All actions</option><option>Uploaded Document</option><option>Changed Role</option></select></div><section className="card table-card"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>IP Address</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.id}><td>{log.time}</td><td>{log.user}</td><td>{log.action}</td><td>{log.entity}</td><td>{log.ipAddress}</td></tr>)}</tbody></table></section></>;
}
