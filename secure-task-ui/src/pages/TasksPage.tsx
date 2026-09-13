import { Plus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Task } from '../types';

export function TasksPage({
  tasks,
  onOpenTask,
  onCreateTask,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onCreateTask: () => void;
}) {
  return (
    <>
      <PageHeader title="Tasks" description="Create, assign, track, and audit work across your team." action={<button className="primary-button" onClick={onCreateTask}><Plus size={16}/> Create Task</button>} />
      <div className="toolbar"><input placeholder="Search tasks..." /><select><option>All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></div>
      <section className="card table-card">
        <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th /></tr></thead><tbody>
          {tasks.map((task) => <tr key={task.id}><td><strong>{task.title}</strong><span>{task.description}</span></td><td><StatusBadge status={task.status}/></td><td>{task.priority}</td><td>{task.assignee}</td><td>{task.dueDate}</td><td><button onClick={() => onOpenTask(task.id)}>Open</button></td></tr>)}
        </tbody></table>
      </section>
    </>
  );
}
