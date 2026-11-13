import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function NotificationsPage() {
  const controller = useAppController();
  const notifications = controller.notifications;
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Task, document, and security updates in one inbox."
        action={<button className="primary-button" onClick={() => controller.markAllNotificationsRead()}>Mark all as read</button>}
      />

      <div className="metrics-grid dashboard-summary-grid">
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon primary"><span>{unreadCount}</span></div>
          <div><strong>{unreadCount}</strong><span>Unread</span></div>
        </div>
        <div className="metric-card dashboard-summary-card">
          <div className="metric-icon success"><span>•</span></div>
          <div><strong>{notifications.length}</strong><span>Total updates</span></div>
        </div>
      </div>

      <section className="card stack-list">
        {notifications.map((item) => (
          <div className={`list-row ${item.unread ? 'unread' : ''}`} key={item.id}>
            <div className="task-row-copy">
              <strong>{item.message}</strong>
              <span>{item.type} · {item.createdAt}</span>
            </div>
            {item.unread && <span className="dot" />}
          </div>
        ))}
      </section>
    </>
  );
}
