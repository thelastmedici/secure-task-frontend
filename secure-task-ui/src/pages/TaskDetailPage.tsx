import { MessageSquareText, Paperclip } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAppController } from '../core/AppContext';

export function TaskDetailPage() {
  const controller = useAppController();
  const task = controller.selectedTask;
  const documents = controller.documents;
  const linkedDocuments = documents.filter((doc) => doc.linkedTask === task.title);
  const isCompleted = task.status === 'Completed';
  const canComplete = controller.accessService.canCompleteTask(controller.user, task);

  const taskActivity = controller.auditLogs.filter((log) => {
    const entity = log.entity.toLowerCase();
    const title = task.title.toLowerCase();
    const assignee = task.assignee.toLowerCase();
    return entity === title || entity === assignee || linkedDocuments.some((doc) => doc.fileName.toLowerCase() === entity) || log.action.toLowerCase().includes('task');
  });

  const comments = [
    {
      id: 'c1',
      user: task.assignee,
      time: 'Today · 9:14 AM',
      message: `I’ve started the implementation for ${task.title}. I’m validating the access flow and tracking the final review points.`,
    },
    {
      id: 'c2',
      user: 'Sarah Connor',
      time: 'Yesterday · 4:18 PM',
      message: `I reviewed the requirements for ${task.title} and the scope looks aligned with the current security policy.`,
    },
  ];

  return (
    <>
      <PageHeader title={task.title} description="Task overview, comments, and activity history." action={<button onClick={() => controller.navigate('tasks')}>Back</button>} />

      <div className="task-detail-layout">
        <div className="task-detail-main">
          <section className="card">
            <div className="card-header">
              <div>
                <h2>Overview</h2>
                <p className="muted-text">Current status and execution notes.</p>
              </div>
              <StatusBadge status={task.status} />
            </div>

            <p>{task.description}</p>

            <div className="task-detail-actions">
              <button className="primary-button" type="button" disabled={isCompleted || !canComplete} title={!canComplete ? 'You do not have permission to complete this task.' : undefined} onClick={() => controller.completeTask(task.id)}>
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Comments</h2>
              <span className="muted-text"><MessageSquareText size={16} /></span>
            </div>

            <div className="comment-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-meta">
                    <strong>{comment.user}</strong>
                    <span className="muted-text">{comment.time}</span>
                  </div>
                  <p>{comment.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Activity</h2>
            <div className="timeline">
              {taskActivity.length > 0 ? (
                taskActivity.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <span />
                    <div className="timeline-copy">
                      <strong>{log.action}</strong>
                      <small>{log.user} · {log.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted-text">No related activity has been logged yet.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="task-detail-side">
          <section className="card">
            <h2>Properties</h2>

            <div className="task-property-list">
              <div className="task-property-row">
                <span>Status</span>
                <StatusBadge status={task.status} />
              </div>

              <div className="task-property-row">
                <span>Assignee</span>
                <strong>{task.assignee}</strong>
              </div>

              <div className="task-property-row">
                <span>Priority</span>
                <strong>{task.priority}</strong>
              </div>

              <div className="task-property-row">
                <span>Due date</span>
                <strong>{task.dueDate}</strong>
              </div>

              <div className="task-property-row">
                <span>Linked documents</span>
                {linkedDocuments.length > 0 ? (
                  <div className="linked-docs-list">
                    {linkedDocuments.map((doc) => (
                      <button key={doc.id} type="button" className="list-row text-link-button linked-document-button" onClick={() => controller.openDocument(doc.id)} aria-label={`Open ${doc.fileName}`}>
                        <div>
                          <strong>{doc.fileName}</strong>
                          <span>{doc.size} · {doc.uploadedBy}</span>
                        </div>
                        <Paperclip size={16} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <strong className="muted-text">No linked documents</strong>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
