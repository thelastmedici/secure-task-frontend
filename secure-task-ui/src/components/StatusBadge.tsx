import { TaskStatus } from '../types';

const statusClass: Record<TaskStatus, string> = {
  Pending: 'badge neutral',
  'In Progress': 'badge primary',
  Completed: 'badge success',
  Overdue: 'badge danger',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={statusClass[status]}>{status}</span>;
}
