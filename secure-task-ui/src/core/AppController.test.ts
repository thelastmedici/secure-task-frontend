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

  it('login succeeds with correct credentials and persists token', async () => {
    const c = new AppController();
    const ok = await c.login('joshua@example.com', 'password');
    expect(ok).toBe(true);
    const storage = new StorageService();
    const raw = storage.load<string | null>('sessionToken', null);
    expect(raw).toBeTruthy();
    expect(c.route).toBe('dashboard');
  });

  it('login fails with wrong credentials and sets error', async () => {
    const c = new AppController();
    const ok = await c.login('noone@example.com', 'bad');
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

  it('records document previews and downloads in the audit history', () => {
    const c = new AppController();
    const document = c.documents[0];

    expect(c.recordDocumentAction(document.id, 'Previewed Document')).toBe(true);
    expect(c.recordDocumentAction(document.id, 'Downloaded Document')).toBe(true);
    expect(c.auditLogs[0].action).toBe('Downloaded Document');
    expect(c.auditLogs[1].action).toBe('Previewed Document');
  });

  it('deletes an authorized document and preserves an audit record', () => {
    const c = new AppController();
    const document = c.documents[0];

    expect(c.deleteDocument(document.id)).toBe(true);
    expect(c.documents.some((candidate) => candidate.id === document.id)).toBe(false);
    expect(c.auditLogs[0].action).toBe('Deleted Document');
    expect(c.route).toBe('documents');
  });

  it("does not let a member delete another user's document", () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' });
    const document = c.documents.find((candidate) => candidate.uploadedBy !== c.user.name)!;

    expect(c.deleteDocument(document.id)).toBe(false);
    expect(c.documents.some((candidate) => candidate.id === document.id)).toBe(true);
    expect(c.lastError).toContain('permission');
  });

  it('persists profile and workspace settings changes', () => {
    const c = new AppController();

    expect(c.updateProfile('Joshua Carter', 'joshua.carter@example.com')).toBe(true);
    expect(c.updateWorkspaceSettings(50, ['pdf', '.png', 'PDF'])).toBe(true);
    expect(c.user.name).toBe('Joshua Carter');
    expect(c.workspaceSettings).toEqual({ maxUploadSizeMb: 50, allowedFileTypes: ['PDF', 'PNG'] });
  });

  it('enforces the saved document upload policy', () => {
    const c = new AppController();
    c.updateWorkspaceSettings(1, ['pdf']);

    expect(c.uploadDocument({ fileName: 'oversize.pdf', type: 'PDF', size: '1.1 MB' })).toBeNull();
    expect(c.lastError).toContain('exceeds');
    expect(c.uploadDocument({ fileName: 'unsupported.docx', type: 'DOCX', size: '0.5 MB' })).toBeNull();
    expect(c.lastError).toContain('not allowed');
  });

  it('requires the current password before changing it', async () => {
    const c = new AppController();

    expect(await c.changePassword('wrong-password', 'NewPassword123')).toBe(false);
    expect(await c.changePassword('password', 'NewPassword123')).toBe(true);
    expect(await c.login('joshua@example.com', 'NewPassword123')).toBe(true);
  });

  it('logout clears the persisted session and resets route to login', async () => {
    const c = new AppController();
    await c.login('joshua@example.com', 'password');
    c.logout();
    expect(c.route).toBe('login');
    const storage = new StorageService();
    expect(storage.load<string | null>('sessionToken', null)).toBeNull();
  });
});
