import { CalendarDays, Check, ChevronDown, KanbanSquare, ListFilter, Plus, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Priority, Task, TaskStatus } from '../types';
import { useAppController } from '../core/AppContext';

const statusOptions: Array<'all' | TaskStatus> = ['all', 'Pending', 'In Progress', 'Completed', 'Overdue'];
const priorityOptions: Array<'all' | Priority> = ['all', 'Low', 'Medium', 'High'];
const savedViewOptions = [
  { id: 'all', label: 'All tasks' },
  { id: 'mine', label: 'My tasks' },
  { id: 'due', label: 'Due this week' },
  { id: 'review', label: 'Needs review' },
] as const;

const statusColumns: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Overdue'];

const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const getTaskDueState = (task: Task) => {
  if (task.status === 'Completed') return 'complete';
  const today = new Date();
  const due = new Date(`${task.dueDate}T00:00:00`);
  return due < today ? 'overdue' : due.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000 ? 'soon' : 'upcoming';
};

export function TasksPage() {
  const controller = useAppController();
  const tasks = controller.tasks;
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [savedView, setSavedView] = useState<(typeof savedViewOptions)[number]['id']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusEditorId, setStatusEditorId] = useState<string | null>(null);
  const [priorityEditorId, setPriorityEditorId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);

  const assignees = useMemo(() => Array.from(new Set(tasks.map((task) => task.assignee))).sort(), [tasks]);

  const filtered = useMemo(() => tasks.filter((task) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [task.title, task.description, task.assignee].some((value) => value.toLowerCase().includes(q));
    const matchesSavedView = (() => {
      if (savedView === 'mine') return task.assignee === controller.user.name;
      if (savedView === 'due') {
        const due = new Date(`${task.dueDate}T00:00:00`);
        const diffDays = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return task.status !== 'Completed' && diffDays <= 7 && diffDays >= 0;
      }
      if (savedView === 'review') {
        return task.priority === 'High' || task.status === 'Pending' || task.status === 'Overdue';
      }
      return true;
    })();
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;
    return matchesQuery && matchesSavedView && matchesStatus && matchesPriority && matchesAssignee;
  }), [tasks, query, savedView, statusFilter, priorityFilter, assigneeFilter, controller.user.name]);

  useEffect(() => {
    setSelectedTaskIndex((current) => Math.min(current, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable) return;
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        setCreating(true);
      }
      if (event.key.toLowerCase() === 'j' && filtered.length > 0) {
        event.preventDefault();
        const nextIndex = Math.min(selectedTaskIndex + 1, filtered.length - 1);
        setSelectedTaskIndex(nextIndex);
        controller.openTask(filtered[nextIndex].id);
      }
      if (event.key.toLowerCase() === 'k' && filtered.length > 0) {
        event.preventDefault();
        const nextIndex = Math.max(selectedTaskIndex - 1, 0);
        setSelectedTaskIndex(nextIndex);
        controller.openTask(filtered[nextIndex].id);
      }
      if (event.key === 'Enter' && filtered[selectedTaskIndex]) {
        event.preventDefault();
        controller.openTask(filtered[selectedTaskIndex].id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, filtered, selectedTaskIndex]);

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

    setTitle(''); setDescription(''); setCreating(false); setLocalError(null); setQuery('');
  };

  const toggleSelected = (taskId: string) => {
    setSelectedIds((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  };

  const bulkComplete = () => {
    selectedIds.forEach((id) => controller.completeTask(id));
    setSelectedIds([]);
  };

  const updateStatus = (taskId: string, nextStatus: TaskStatus) => {
    controller.updateTaskStatus(taskId, nextStatus);
    setStatusEditorId(null);
  };

  const updatePriority = (taskId: string, nextPriority: Priority) => {
    controller.updateTaskPriority(taskId, nextPriority);
    setPriorityEditorId(null);
  };

  const renderTaskRow = (task: Task) => {
    const dueState = getTaskDueState(task);
    const isSelected = selectedIds.includes(task.id);
    return (
      <tr key={task.id} className={isSelected ? 'selected-row' : ''}>
        <td className="row-checkbox"><input type="checkbox" checked={isSelected} onChange={() => toggleSelected(task.id)} aria-label={`Select ${task.title}`} /></td>
        <td>
          <div className="task-title-cell">
            <div className="avatar small" aria-hidden="true">{task.assignee.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div>
              <strong>{task.title}</strong>
              <span>{task.description}</span>
            </div>
          </div>
        </td>
        <td className="cell-editor-wrap">
          <button type="button" className="inline-select" onClick={() => setStatusEditorId(statusEditorId === task.id ? null : task.id)}>
            <StatusBadge status={task.status} />
            <ChevronDown size={12} strokeWidth={2} />
          </button>
          {statusEditorId === task.id && (
            <div className="popover-menu">
              {statusOptions.filter((option) => option !== 'all').map((option) => (
                <button key={option} type="button" className="menu-option" onClick={() => updateStatus(task.id, option)}>
                  <StatusBadge status={option} />
                </button>
              ))}
            </div>
          )}
        </td>
        <td className="cell-editor-wrap">
          <button type="button" className="inline-select priority-select" onClick={() => setPriorityEditorId(priorityEditorId === task.id ? null : task.id)}>
            <span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
            <ChevronDown size={12} strokeWidth={2} />
          </button>
          {priorityEditorId === task.id && (
            <div className="popover-menu">
              {priorityOptions.filter((option) => option !== 'all').map((option) => (
                <button key={option} type="button" className="menu-option" onClick={() => updatePriority(task.id, option)}>
                  <span className={`priority-pill ${option.toLowerCase()}`}>{option}</span>
                </button>
              ))}
            </div>
          )}
        </td>
        <td>
          <div className="assignee-pill">
            <span className="avatar tiny" aria-hidden="true">{task.assignee.split(' ').map((part) => part[0]).slice(0, 1).join('').toUpperCase()}</span>
            {task.assignee}
          </div>
        </td>
        <td>
          <span className={`due-date ${dueState === 'overdue' ? 'overdue' : ''}`}>{formatDate(task.dueDate)}</span>
        </td>
        <td>
          <button className="ghost-button" onClick={() => controller.openTask(task.id)}>Open</button>
        </td>
      </tr>
    );
  };

  const renderBoard = () => (
    <div className="board-grid">
      {statusColumns.map((column) => {
        const columnTasks = filtered.filter((task) => task.status === column);
        return (
          <div key={column} className="board-column">
            <div className="board-column-header">
              <strong>{column}</strong>
              <span>{columnTasks.length}</span>
            </div>
            <div className="board-column-body">
              {columnTasks.map((task) => (
                <button key={task.id} type="button" className="task-card" onClick={() => controller.openTask(task.id)}>
                  <div className="task-card-head">
                    <span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className={`due-indicator ${getTaskDueState(task) === 'overdue' ? 'overdue' : ''}`}>{getTaskDueState(task) === 'overdue' ? 'Overdue' : formatDate(task.dueDate)}</span>
                  </div>
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                  <div className="task-card-meta">
                    <span className="avatar tiny" aria-hidden="true">{task.assignee.split(' ').map((part) => part[0]).slice(0, 1).join('').toUpperCase()}</span>
                    {task.assignee}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCalendar = () => (
    <div className="calendar-grid">
      {Array.from(new Set(filtered.map((task) => task.dueDate))).sort().map((date) => (
        <div key={date} className="calendar-day">
          <div className="calendar-day-header">{formatDate(date)}</div>
          <div className="calendar-day-body">
            {filtered.filter((task) => task.dueDate === date).map((task) => (
              <button key={task.id} type="button" className="calendar-item" onClick={() => controller.openTask(task.id)}>
                <StatusBadge status={task.status} />
                <span>{task.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Tasks"
        description="A central workspace for team execution, reviews, and ownership."
        action={<button className="primary-button" disabled={!controller.accessService.canCreateTask(controller.user)} onClick={() => setCreating(true)}><Plus size={16} /> Create Task</button>}
      />

      <div className="task-toolbar">
        <div className="toolbar-row">
          <div className="view-toggle-group">
            <button type="button" className={viewMode === 'list' ? 'view-toggle active' : 'view-toggle'} onClick={() => setViewMode('list')}><ListFilter size={15} /> List</button>
            <button type="button" className={viewMode === 'board' ? 'view-toggle active' : 'view-toggle'} onClick={() => setViewMode('board')}><KanbanSquare size={15} /> Board</button>
            <button type="button" className={viewMode === 'calendar' ? 'view-toggle active' : 'view-toggle'} onClick={() => setViewMode('calendar')}><CalendarDays size={15} /> Calendar</button>
          </div>
          <div className="saved-view-group">
            {savedViewOptions.map((view) => (
              <button key={view.id} type="button" className={savedView === view.id ? 'chip active' : 'chip'} onClick={() => setSavedView(view.id)}>{view.label}</button>
            ))}
          </div>
        </div>

        <div className="toolbar-row search-row">
          <label className="search-box tasks-search">
            <Search size={15} strokeWidth={2} />
            <input aria-label="Search tasks" placeholder="Search tasks, people, descriptions..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>

        <div className="filter-chip-row">
          <div className="chip-group">
            <span className="chip-label">Status</span>
            {statusOptions.map((option) => (
              <button key={option} type="button" className={statusFilter === option ? 'chip active' : 'chip'} onClick={() => setStatusFilter(option)}>{option === 'all' ? 'All' : option}</button>
            ))}
          </div>
          <div className="chip-group">
            <span className="chip-label">Assignee</span>
            <button type="button" className={assigneeFilter === 'all' ? 'chip active' : 'chip'} onClick={() => setAssigneeFilter('all')}>All</button>
            {assignees.slice(0, 5).map((assignee) => (
              <button key={assignee} type="button" className={assigneeFilter === assignee ? 'chip active' : 'chip'} onClick={() => setAssigneeFilter(assignee)}>{assignee}</button>
            ))}
          </div>
          <div className="chip-group">
            <span className="chip-label">Priority</span>
            {priorityOptions.map((option) => (
              <button key={option} type="button" className={priorityFilter === option ? 'chip active' : 'chip'} onClick={() => setPriorityFilter(option)}>{option === 'all' ? 'All' : option}</button>
            ))}
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div className="bulk-actions">
            <button type="button" className="primary-button" onClick={bulkComplete}><Check size={14} /> Mark complete</button>
            <button type="button" className="ghost-button" onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <section className="card table-card">
          <table>
            <thead>
              <tr>
                <th className="checkbox-col"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filtered.length} onChange={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((task) => task.id))} aria-label="Select all tasks" /></th>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(renderTaskRow)}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table">No tasks match the current rules.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {viewMode === 'board' && renderBoard()}
      {viewMode === 'calendar' && renderCalendar()}

      {creating && (
        <div className="dialog-backdrop" onClick={() => setCreating(false)}>
          <div className="dialog-card task-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="card-header">
              <div>
                <h2>Create task</h2>
                <p className="muted-text">Add a new task without disrupting the current workflow.</p>
              </div>
              <button type="button" onClick={() => setCreating(false)}>Close</button>
            </div>
            {localError && <div className="form-error">{localError}</div>}
            <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Build security review for Q4" /></label>
            <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Summarize the work, owner, and expected outcome." rows={4} /></label>
            <div className="dialog-actions">
              <button type="button" onClick={() => setCreating(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={submitCreate}>Create task</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
