import { describe, it, expect } from 'vitest';
import { AppController } from './AppController';
import { User } from '../domain/models';

describe('AppController navigation and auth gating', () => {
  it('redirects non-admin from audit-logs to dashboard', () => {
    const c = new AppController();
    // set non-admin user
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
    // token should be present in storage
    const raw = window.localStorage.getItem('sessionToken');
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
});
