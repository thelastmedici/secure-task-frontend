import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
  onCreateTask: (payload?: Partial<Task>) => void;
}) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const filtered = useMemo(() => tasks.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
  }), [tasks, query]);

  const submitCreate = () => {
    if (!title.trim()) return;
    onCreateTask({ title: title.trim(), description: description.trim() });
    setTitle(''); setDescription(''); setCreating(false);
  };

  return (
    <>
      <PageHeader title="Tasks" description="Create, assign, track, and audit work across your team." action={<button className="primary-button" onClick={() => setCreating((c) => !c)}><Plus size={16}/> Create Task</button>} />
      {creating && (
        <section className="card">
          <h3>Create Task</h3>
          <div className="form-row"><input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="form-row"><input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="form-row"><button className="primary-button" onClick={submitCreate}>Create</button> <button onClick={() => setCreating(false)}>Cancel</button></div>
        </section>
      )}

      <div className="toolbar"><input placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} /><select><option>All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></div>
      <section className="card table-card">
        <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th /></tr></thead><tbody>
          {filtered.map((task) => <tr key={task.id}><td><strong>{task.title}</strong><span>{task.description}</span></td><td><StatusBadge status={task.status}/></td><td>{task.priority}</td><td>{task.assignee}</td><td>{task.dueDate}</td><td><button onClick={() => onOpenTask(task.id)}>Open</button></td></tr>)}
        </tbody></table>
      </section>
    </>
  );
}
