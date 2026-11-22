import { MessageSquareText, Paperclip } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { PermissionButton } from '../components/PermissionButton';
import { DetailTabs, type DetailTab } from '../components/DetailTabs';
import { HistoryPanel } from '../components/HistoryPanel';
import { useAppController } from '../core/AppContext';
import { useParams } from 'react-router-dom';

export function TaskDetailPage() {
  const controller = useAppController();
  const { taskId } = useParams();
  const task = controller.tasks.find((candidate) => candidate.id === taskId) ?? controller.selectedTask;
  const documents = controller.documents;
  const linkedDocuments = documents.filter((doc) => doc.linkedTask === task.title);
  const isCompleted = task.status === 'Completed';
  const canComplete = controller.accessService.canCompleteTask(controller.user, task);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const taskActivity = controller.auditLogs.filter((log) => {
    return log.entity.toLowerCase() === task.title.toLowerCase();
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
      <DetailTabs active={activeTab} onChange={setActiveTab}/>
      {activeTab === 'history' ? <section className="card"><div><h2>Task history</h2><p className="muted-text">Audit events recorded for this task.</p></div><HistoryPanel logs={taskActivity} emptyMessage="Task changes will be recorded here as your team works." emptyAction={<button type="button" onClick={() => setActiveTab('overview')}>Return to overview</button>}/></section> :
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
              <PermissionButton className="primary-button" type="button" allowed={!isCompleted && canComplete} reason="Only the assignee, managers, or admins can complete this task." onClick={() => controller.completeTask(task.id)}>
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </PermissionButton>
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
      </div>}
    </>
  );
}
