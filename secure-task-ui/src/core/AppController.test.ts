import { beforeEach, describe, it, expect } from 'vitest';
import { AppController } from './AppController';
import { User } from '../domain/models';
import { StorageService } from '../services/StorageService';

describe('AppController navigation and auth gating', () => {
  beforeEach(() => {
    new StorageService().clear();
  });
  it('redirects non-admin from audit-logs to dashboard', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'uX', name: 'Member', email: 'm@example.com', role: 'Member', status: 'Active' });
    c.navigate('audit-logs');
    expect(c.route).toBe('dashboard');
    expect(c.lastError).toContain('not permitted');
  });

  it('allows admin to access audit-logs', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u1', name: 'Admin', email: 'a@example.com', role: 'Admin', status: 'Active' });
    c.navigate('audit-logs');
    expect(c.route).toBe('audit-logs');
    expect(c.lastError).toBeNull();
  });

  it('notifies subscribers on navigation changes', () => {
    const c = new AppController();
    const events: string[] = [];
    const unsub = c.subscribe((ctl) => events.push(ctl.route));
    c.navigate('tasks');
    c.navigate('documents');
    unsub();
    c.navigate('dashboard');
    expect(events).toEqual(['tasks', 'documents']);
  });

  it('login succeeds with correct credentials and persists token', () => {
    const c = new AppController();
    const ok = c.login('joshua@example.com', 'password');
    expect(ok).toBe(true);
    const storage = new StorageService();
    const raw = storage.load<string | null>('sessionToken', null);
    expect(raw).toBeTruthy();
    expect(c.route).toBe('dashboard');
  });

  it('login fails with wrong credentials and sets error', () => {
    const c = new AppController();
    const ok = c.login('noone@example.com', 'bad');
    expect(ok).toBe(false);
    expect(c.route).not.toBe('dashboard');
    expect(c.lastError).toBe('Invalid credentials');
  });

  it('creates a task for authorized users and records notifications/audit entries', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Manager', status: 'Active' });
    const created = c.createTask({ title: 'Security review', description: 'Assess the new workflow' });

    expect(created.title).toBe('Security review');
    expect(c.tasks[0].id).toBe(created.id);
    expect(c.notifications[0].message).toContain('Security review');
    expect(c.auditLogs[0].action).toBe('Created Task');
    expect(c.route).toBe('task-detail');
  });

  it('rejects task creation for members and keeps route stable', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' });
    const created = c.createTask({ title: 'Unauthorized task' });
    expect(created).toBeNull();
    expect(c.lastError).toContain('permission');
  });

  it('completes an authorized task and records the change', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Manager', status: 'Active' });
    const task = c.tasks.find((candidate) => candidate.status !== 'Completed')!;

    const completed = c.completeTask(task.id);

    expect(completed?.status).toBe('Completed');
    expect(c.tasks.find((candidate) => candidate.id === task.id)?.status).toBe('Completed');
    expect(c.auditLogs[0].action).toBe('Completed Task');
    expect(c.notifications[0].message).toContain(task.title);
  });

  it('does not let a member complete another user’s task', () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' });
    const task = c.tasks.find((candidate) => candidate.assignee !== c.user.name)!;

    const completed = c.completeTask(task.id);

    expect(completed).toBeNull();
    expect(task.status).not.toBe('Completed');
    expect(c.lastError).toContain('permission');
  });

  it('logout clears the persisted session and resets route to login', () => {
    const c = new AppController();
    c.login('joshua@example.com', 'password');
    c.logout();
    expect(c.route).toBe('login');
    const storage = new StorageService();
    expect(storage.load<string | null>('sessionToken', null)).toBeNull();
  });
});
