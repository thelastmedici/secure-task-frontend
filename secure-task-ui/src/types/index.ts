export type Role = 'Admin' | 'Manager' | 'Member';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
export type Priority = 'Low' | 'Medium' | 'High';

export type RouteName =
  | 'login'
  | 'dashboard'
  | 'tasks'
  | 'task-detail'
  | 'documents'
  | 'document-detail'
  | 'notifications'
  | 'audit-logs'
  | 'users'
  | 'roles'
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  dueDate: string;
}

export interface DocumentItem {
  id: string;
  fileName: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  linkedTask?: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  entity: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: 'Task' | 'Document' | 'Security';
  unread: boolean;
  createdAt: string;
}
