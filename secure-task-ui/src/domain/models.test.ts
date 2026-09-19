import { describe, expect, it } from 'vitest';
import { AuditLog, DocumentItem, NotificationItem, Task, User } from './models';

describe('domain models', () => {
  it('creates a User model and identifies admins', () => {
    const user = new User('u1', 'Joshua', 'joshua@example.com', 'Admin', 'Active');
    expect(user.isAdmin()).toBe(true);
    expect(user.email).toBe('joshua@example.com');
  });

  it('hydrates a Task from seed data', () => {
    const task = Task.fromSeed({
      id: 't1',
      title: 'Build audit trail API',
      description: 'Capture user actions across tasks and documents.',
      status: 'In Progress',
      priority: 'High',
      assignee: 'Joshua',
      dueDate: '2026-06-20',
    });

    expect(task.title).toBe('Build audit trail API');
    expect(task.status).toBe('In Progress');
  });

  it('hydrates document, notification, and audit log records from seed data', () => {
    const document = DocumentItem.fromSeed({
      id: 'd1',
      fileName: 'audit-design.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedBy: 'Joshua',
      uploadedAt: '2026-06-12',
      linkedTask: 'Build audit trail API',
    });

    const notification = NotificationItem.fromSeed({
      id: 'n1',
      message: 'You were assigned to Build audit trail API.',
      type: 'Task',
      unread: true,
      createdAt: '5 minutes ago',
    });

    const auditLog = AuditLog.fromSeed({
      id: 'a1',
      time: '2026-06-13 10:30',
      user: 'Joshua',
      action: 'Uploaded Document',
      entity: 'audit-design.pdf',
      ipAddress: '192.168.1.10',
    });

    expect(document.fileName).toBe('audit-design.pdf');
    expect(notification.unread).toBe(true);
    expect(auditLog.entity).toBe('audit-design.pdf');
  });
});
