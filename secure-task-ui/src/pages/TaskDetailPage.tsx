import { Paperclip } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAppController } from '../core/AppContext';

export function TaskDetailPage() {
  const controller = useAppController();
  const task = controller.selectedTask;
  const documents = controller.documents;
  const linkedDocuments = documents.filter((doc) => doc.linkedTask === task.title || !doc.linkedTask);
  const isCompleted = task.status === 'Completed';
  const canComplete = controller.accessService.canCompleteTask(controller.user, task);

  return (
    <>
      <PageHeader title={task.title} description="Task overview, linked documents, comments, and activity history." action={<button onClick={() => controller.navigate('tasks')}>Back</button>} />
      <div className="detail-grid">
        <section className="card"><h2>Overview</h2><p>{task.description}</p><div className="detail-list"><div><span>Status</span><StatusBadge status={task.status}/></div><div><span>Priority</span><strong>{task.priority}</strong></div><div><span>Assignee</span><strong>{task.assignee}</strong></div><div><span>Due Date</span><strong>{task.dueDate}</strong></div></div><button className="primary-button" type="button" disabled={isCompleted || !canComplete} title={!canComplete ? 'You do not have permission to complete this task.' : undefined} onClick={() => controller.completeTask(task.id)}>{isCompleted ? 'Completed' : 'Mark Complete'}</button></section>
        <section className="card"><h2>Linked Documents</h2>{linkedDocuments.map((doc) => <div className="list-row" key={doc.id}><div><strong>{doc.fileName}</strong><span>{doc.size} · {doc.uploadedBy}</span></div><Paperclip size={18}/></div>)}<button onClick={() => controller.navigate('documents')}>Attach Document</button></section>
      </div>
      <section className="card"><h2>Activity</h2><div className="timeline"><div><span />Task created</div><div><span />{task.assignee} assigned</div><div><span />Document attached</div></div></section>
    </>
  );
}
