import { AuditLog, DocumentItem, NotificationItem, Task, User } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Joshua',
  email: 'joshua@example.com',
  role: 'Admin',
  status: 'Active',
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Manager', status: 'Active' },
  { id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' },
  { id: 'u4', name: 'Amara Stone', email: 'amara@example.com', role: 'Member', status: 'Inactive' },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Build audit trail API', description: 'Capture user actions across tasks and documents.', status: 'In Progress', priority: 'High', assignee: 'Joshua', dueDate: '2026-06-20' },
  { id: 't2', title: 'Review document permissions', description: 'Validate RBAC rules for private and team files.', status: 'Pending', priority: 'Medium', assignee: 'Sarah Connor', dueDate: '2026-06-22' },
  { id: 't3', title: 'Finish notification service', description: 'Send notifications for assignment and document activity.', status: 'Completed', priority: 'High', assignee: 'Daniel Kim', dueDate: '2026-06-10' },
  { id: 't4', title: 'Clean old document versions', description: 'Apply retention policy to expired versions.', status: 'Overdue', priority: 'Low', assignee: 'Amara Stone', dueDate: '2026-06-05' },
];

export const documents: DocumentItem[] = [
  { id: 'd1', fileName: 'audit-design.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Joshua', uploadedAt: '2026-06-12', linkedTask: 'Build audit trail API' },
  { id: 'd2', fileName: 'permissions-matrix.xlsx', type: 'XLSX', size: '840 KB', uploadedBy: 'Sarah Connor', uploadedAt: '2026-06-11', linkedTask: 'Review document permissions' },
  { id: 'd3', fileName: 'notification-spec.docx', type: 'DOCX', size: '1.1 MB', uploadedBy: 'Daniel Kim', uploadedAt: '2026-06-09', linkedTask: 'Finish notification service' },
];

export const auditLogs: AuditLog[] = [
  { id: 'a1', time: '2026-06-13 10:30', user: 'Joshua', action: 'Uploaded Document', entity: 'audit-design.pdf', ipAddress: '192.168.1.10' },
  { id: 'a2', time: '2026-06-13 10:45', user: 'Sarah Connor', action: 'Updated Task', entity: 'Review document permissions', ipAddress: '192.168.1.21' },
  { id: 'a3', time: '2026-06-13 11:00', user: 'Admin', action: 'Changed Role', entity: 'Daniel Kim', ipAddress: '192.168.1.99' },
];

export const notifications: NotificationItem[] = [
  { id: 'n1', message: 'You were assigned to Build audit trail API.', type: 'Task', unread: true, createdAt: '5 minutes ago' },
  { id: 'n2', message: 'Sarah uploaded permissions-matrix.xlsx.', type: 'Document', unread: true, createdAt: '1 hour ago' },
  { id: 'n3', message: 'Daniel Kim role was updated.', type: 'Security', unread: false, createdAt: 'Yesterday' },
];
