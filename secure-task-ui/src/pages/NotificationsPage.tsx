import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function NotificationsPage() {
  const controller = useAppController();
  const notifications = controller.notifications;

  return (
    <>
      <PageHeader title="Notifications" description="Task, document, and security updates in one inbox." action={<button onClick={() => controller.markAllNotificationsRead()}>Mark all as read</button>} />
      <section className="card stack-list">
        {notifications.map((item) => (
          <div className={`list-row ${item.unread ? 'unread' : ''}`} key={item.id}>
            <div>
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
