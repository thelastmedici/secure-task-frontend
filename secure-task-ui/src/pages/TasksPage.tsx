import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Task, TaskStatus } from '../types';
import { useAppController } from '../core/AppContext';

export function TasksPage() {
  const controller = useAppController();
  const tasks = controller.tasks;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const filtered = useMemo(() => tasks.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    return matchesQuery && (status === 'all' || t.status === status);
  }), [tasks, query, status]);

  const submitCreate = () => {
    if (!title.trim()) {
      setLocalError('Please provide a title');
      return;
    }

    const result = controller.createTask({ title: title.trim(), description: description.trim() });
    if (!result) {
      setLocalError(controller.lastError ?? 'Unable to create task');
      return;
    }

    setTitle(''); setDescription(''); setCreating(false); setLocalError(null);
  };

  return (
    <>
      <PageHeader title="Tasks" description="Create, assign, track, and audit work across your team." action={<button className="primary-button" disabled={!controller.accessService.canCreateTask(controller.user)} onClick={() => setCreating((c) => !c)}><Plus size={16}/> Create Task</button>} />
      {creating && (
        <section className="card">
          <h3>Create Task</h3>
          {localError && <div className="form-error">{localError}</div>}
          <div className="form-row"><input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="form-row"><input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="form-row"><button className="primary-button" onClick={submitCreate}>Create</button> <button onClick={() => { setCreating(false); setLocalError(null); }}>Cancel</button></div>
        </section>
      )}

      <div className="toolbar">
        <input aria-label="Search tasks" placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Filter tasks by status" value={status} onChange={(event) => setStatus(event.target.value as 'all' | TaskStatus)}>
          <option value="all">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option><option>Overdue</option>
        </select>
      </div>
      <section className="card table-card">
        <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th /></tr></thead><tbody>
          {filtered.map((task: Task) => <tr key={task.id}><td><strong>{task.title}</strong><span>{task.description}</span></td><td><StatusBadge status={task.status}/></td><td>{task.priority}</td><td>{task.assignee}</td><td>{task.dueDate}</td><td><button onClick={() => controller.openTask(task.id)}>Open</button></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan={6} className="empty-table">No tasks match the current filters.</td></tr>}
        </tbody></table>
      </section>
    </>
  );
}
