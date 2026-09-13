import { Paperclip } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { DocumentItem, Task } from '../types';

export function TaskDetailPage({ task, documents, onBack }: { task: Task; documents: DocumentItem[]; onBack: () => void }) {
  const linkedDocuments = documents.filter((doc) => doc.linkedTask === task.title || !doc.linkedTask);

  return (
    <>
      <PageHeader title={task.title} description="Task overview, linked documents, comments, and activity history." action={<button onClick={onBack}>Back</button>} />
      <div className="detail-grid">
        <section className="card"><h2>Overview</h2><p>{task.description}</p><div className="detail-list"><div><span>Status</span><StatusBadge status={task.status}/></div><div><span>Priority</span><strong>{task.priority}</strong></div><div><span>Assignee</span><strong>{task.assignee}</strong></div><div><span>Due Date</span><strong>{task.dueDate}</strong></div></div><button className="primary-button">Mark Complete</button></section>
        <section className="card"><h2>Linked Documents</h2>{linkedDocuments.map((doc) => <div className="list-row" key={doc.id}><div><strong>{doc.fileName}</strong><span>{doc.size} · {doc.uploadedBy}</span></div><Paperclip size={18}/></div>)}<button>Attach Document</button></section>
      </div>
      <section className="card"><h2>Activity</h2><div className="timeline"><div><span />Task created</div><div><span />{task.assignee} assigned</div><div><span />Document attached</div></div></section>
    </>
  );
}
