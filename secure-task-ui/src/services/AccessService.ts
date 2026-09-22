import type { Task, User } from '../domain/models';
import type { RouteName } from '../types';

export class AccessService {
  // Role => allowed routes (whitelist). If role not present, falls back to conservative defaults.
  private rolePermissions: Record<string, RouteName[]> = {
    Admin: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications', 'audit-logs', 'users', 'roles', 'settings'],
    Manager: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications', 'settings'],
    Member: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications'],
  };

  canAccessRoute(route: RouteName, user: User): boolean {
    const allowed = this.rolePermissions[user.role] ?? ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications'];
    return allowed.includes(route);
  }

  deniedReason(route: RouteName, user: User): string | null {
    if (this.canAccessRoute(route, user)) return null;
    return `User role ${user.role} is not permitted to access ${route}`;
  }

  canCreateTask(user: User): boolean {
    return user.role === 'Admin' || user.role === 'Manager';
  }

  canCompleteTask(user: User, task: Task): boolean {
    return user.role === 'Admin' || user.role === 'Manager' || task.assignee === user.name;
  }

  canUploadDocument(user: User): boolean {
    return ['Admin', 'Manager', 'Member'].includes(user.role);
  }
}
