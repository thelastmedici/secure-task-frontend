import { PageHeader } from '../components/PageHeader';
import { notifications } from '../data/mockData';

export function NotificationsPage() {
  return <><PageHeader title="Notifications" description="Task, document, and security updates in one inbox." action={<button>Mark all as read</button>} /><section className="card stack-list">{notifications.map((item) => <div className={`list-row ${item.unread ? 'unread' : ''}`} key={item.id}><div><strong>{item.message}</strong><span>{item.type} · {item.createdAt}</span></div>{item.unread && <span className="dot" />}</div>)}</section></>;
}
