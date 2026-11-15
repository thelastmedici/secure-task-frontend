import type { DocumentItem, Task, User } from '../domain/models';
import type { Role, RouteName } from '../types';

export type PermissionKey = 'createTask' | 'assignTask' | 'completeTask' | 'uploadDocument' | 'deleteAnyDocument' | 'viewAuditLogs' | 'manageUsers';
export interface PermissionRule {
  key: PermissionKey;
  label: string;
  description: string;
  roles: Role[];
}

/** Single source of truth for the role rules used by both the UI and guards. */
export class AccessService {
  readonly roles: Role[] = ['Admin', 'Manager', 'Member'];
  readonly permissionRules: PermissionRule[] = [
    { key: 'createTask', label: 'Create tasks', description: 'Create new workspace tasks.', roles: ['Admin', 'Manager'] },
    { key: 'assignTask', label: 'Assign tasks', description: 'Assign and reassign tasks to workspace users.', roles: ['Admin', 'Manager'] },
    { key: 'completeTask', label: 'Complete tasks', description: 'Admin and Manager can complete any task; Members can complete their assigned tasks.', roles: ['Admin', 'Manager', 'Member'] },
    { key: 'uploadDocument', label: 'Upload documents', description: 'Upload files that meet the workspace document policy.', roles: ['Admin', 'Manager', 'Member'] },
    { key: 'deleteAnyDocument', label: 'Delete any document', description: 'Admin and Manager can delete any document. Other roles can delete their own uploads.', roles: ['Admin', 'Manager'] },
    { key: 'viewAuditLogs', label: 'View audit logs', description: 'Open the immutable workspace audit history.', roles: ['Admin'] },
    { key: 'manageUsers', label: 'Manage users', description: 'Invite users and change roles or account status.', roles: ['Admin'] },
  ];

  private roleRoutes: Record<Role, RouteName[]> = {
    Admin: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications', 'audit-logs', 'users', 'roles', 'settings'],
    Manager: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications', 'settings'],
    Member: ['dashboard', 'tasks', 'task-detail', 'documents', 'document-detail', 'notifications'],
  };

  roleCan(role: Role, permission: PermissionKey): boolean {
    return this.permissionRules.find((rule) => rule.key === permission)?.roles.includes(role) ?? false;
  }

  permissionsForRole(role: Role): PermissionRule[] {
    return this.permissionRules.filter((rule) => this.roleCan(role, rule.key));
  }

  routesForRole(role: Role): RouteName[] {
    return [...this.roleRoutes[role]];
  }

  canAccessRoute(route: RouteName, user: User): boolean {
    return this.routesForRole(user.role).includes(route);
  }

  deniedReason(route: RouteName, user: User): string | null {
    if (this.canAccessRoute(route, user)) return null;
    return `User role ${user.role} is not permitted to access ${route}`;
  }

  canCreateTask(user: User): boolean {
    return this.roleCan(user.role, 'createTask');
  }

  canAssignTask(user: User): boolean {
    return this.roleCan(user.role, 'assignTask');
  }

  canManageUsers(user: User): boolean {
    return this.roleCan(user.role, 'manageUsers');
  }

  canCompleteTask(user: User, task: Task): boolean {
    return this.roleCan(user.role, 'completeTask') && (user.role !== 'Member' || task.assignee === user.name);
  }

  canUploadDocument(user: User): boolean {
    return this.roleCan(user.role, 'uploadDocument');
  }

  canDeleteDocument(user: User, document: DocumentItem): boolean {
    return this.roleCan(user.role, 'deleteAnyDocument') || document.uploadedBy === user.name;
  }
}
