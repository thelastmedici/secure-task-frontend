import { History } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AuditLog } from '../types';
import { EmptyState } from './EmptyState';

export function HistoryPanel({ logs, emptyMessage = 'Activity for this record will appear here.', emptyAction }: { logs: AuditLog[]; emptyMessage?: string; emptyAction?: ReactNode }) {
  return <div className="record-history-panel">
    {logs.length ? <div className="record-history-list">{logs.map((log) => <article className="record-history-item" key={log.id}><span className="record-history-marker"/><div><strong>{log.action}</strong><p>{log.user} · {new Date(log.time).toLocaleString()}</p><small>{log.ipAddress}</small></div></article>)}</div>
      : <EmptyState icon={<History size={22}/>} title="No history yet" description={emptyMessage} action={emptyAction} />}
  </div>;
}
