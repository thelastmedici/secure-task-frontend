import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppController } from './AppController';
import { User } from '../domain/models';
import { StorageService } from '../services/StorageService';
import { AppProvider } from './AppContext';
import { TaskDetailPage } from '../pages/TaskDetailPage';

let serverPassword = 'password';

describe('AppController navigation and auth gating', () => {
  beforeEach(() => {
    new StorageService().clear();
    serverPassword = 'password';
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) as { email?: string; password?: string; currentPassword?: string; newPassword?: string } : {};
      if (url.endsWith('/auth/login') && method === 'POST') {
        if (body.email?.toLowerCase() !== 'joshua@example.com' || body.password !== serverPassword) {
          return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          user: { id: 'u1', name: 'Joshua Carter', email: 'joshua@example.com', role: 'Admin', status: 'Active' },
          accessToken: 'server-access-token',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.endsWith('/auth/password') && method === 'PATCH') {
        if (body.currentPassword !== serverPassword) {
          return new Response(JSON.stringify({ message: 'Your current password is incorrect.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        serverPassword = body.newPassword ?? serverPassword;
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.endsWith('/auth/logout') && method === 'POST') {
        return new Response('', { status: 204 });
      }
      if (url.endsWith('/auth/me') && method === 'GET') {
        return new Response(JSON.stringify({ user: null }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
  });
  it('redirects non-admin from audit-logs to dashboard', () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    c.user = User.fromSeed({ id: 'uX', name: 'Member', email: 'm@example.com', role: 'Member', status: 'Active' });
    c.navigate('audit-logs');
    expect(locations).toEqual(['/']);
    expect(c.lastError).toContain('not permitted');
  });

  it('allows admin to access audit-logs', () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    c.user = User.fromSeed({ id: 'u1', name: 'Admin', email: 'a@example.com', role: 'Admin', status: 'Active' });
    c.navigate('audit-logs');
    expect(locations).toEqual(['/audit-logs']);
    expect(c.lastError).toBeNull();
  });

  it('notifies subscribers on navigation changes', () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    const events: number[] = [];
    const unsub = c.subscribe(() => events.push(1));
    c.navigate('tasks');
    c.navigate('documents');
    unsub();
    c.navigate('dashboard');
    expect(locations).toEqual(['/tasks', '/documents', '/']);
    expect(events).toEqual([1, 1]);
  });

  it('login succeeds through the backend without persisting a session token', async () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    const ok = await c.login('joshua@example.com', 'password');
    expect(ok).toBe(true);
    const storage = new StorageService();
    expect(storage.load<string | null>('sessionToken', null)).toBeNull();
    expect(locations).toEqual(['/']);
    expect(c.isAuthenticated).toBe(true);
  });

  it('login fails with wrong credentials and sets error', async () => {
    const c = new AppController();
    const ok = await c.login('noone@example.com', 'bad');
    expect(ok).toBe(false);
    expect(c.isAuthenticated).toBe(false);
    expect(c.lastError).toBe('Invalid credentials');
  });

  it('creates a task for authorized users and records notifications/audit entries', () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    c.user = User.fromSeed({ id: 'u2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Manager', status: 'Active' });
    const created = c.createTask({ title: 'Security review', description: 'Assess the new workflow' });

    expect(created.title).toBe('Security review');
    expect(c.tasks[0].id).toBe(created.id);
    expect(c.notifications[0].message).toContain('Security review');
    expect(c.auditLogs[0].action).toBe('Created Task');
    expect(locations).toEqual([`/tasks/${created.id}`]);
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

  it('opens the linked document when its row is clicked', () => {
    const c = new AppController();
    const task = c.tasks.find((candidate) => candidate.status !== 'Completed')!;
    const linkedDocument = c.documents.find((document) => document.linkedTask === task.title)!;
    c.selectedTaskId = task.id;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/tasks/${task.id}`] },
        React.createElement(
          AppProvider,
          { controller: c },
          React.createElement(TaskDetailPage),
        ),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: new RegExp(linkedDocument.fileName, 'i') }));

    expect(c.selectedDocumentId).toBe(linkedDocument.id);
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
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    const document = c.documents[0];

    expect(c.deleteDocument(document.id)).toBe(true);
    expect(c.documents.some((candidate) => candidate.id === document.id)).toBe(false);
    expect(c.auditLogs[0].action).toBe('Deleted Document');
    expect(locations).toEqual(['/documents']);
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

  it('allows admins to invite a new user and records the invitation locally', async () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u1', name: 'Admin', email: 'a@example.com', role: 'Admin', status: 'Active' });

    const invited = await c.inviteUser({ name: 'Ava Patel', email: 'ava@example.com', role: 'Member' });

    expect(invited?.email).toBe('ava@example.com');
    expect(c.users.some((user) => user.email === 'ava@example.com')).toBe(true);
    expect(c.users.find((user) => user.email === 'ava@example.com')?.status).toBe('Invited');
  });

  it('blocks non-admins from inviting users and denies invalid password reset requests', async () => {
    const c = new AppController();
    c.user = User.fromSeed({ id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' });

    expect(await c.inviteUser({ name: 'Nope', email: 'nope@example.com', role: 'Member' })).toBeNull();
    expect(c.lastError).toContain('administrator');

    expect(await c.requestPasswordReset('not-an-email')).toBe(false);
    expect(c.lastError).toContain('valid email');
  });

  it('sends a generic password reset request for valid email addresses', async () => {
    const c = new AppController();

    expect(await c.requestPasswordReset('joshua@example.com')).toBe(true);
    expect(c.lastSuccess).toContain('Password reset');
  });

  it('logout clears the persisted session and resets route to login', async () => {
    const c = new AppController();
    const locations: string[] = [];
    c.setRouterNavigator((to) => locations.push(to));
    await c.login('joshua@example.com', 'password');
    await c.logout();
    expect(locations.at(-1)).toBe('/login');
    expect(c.isAuthenticated).toBe(false);
  });
});
