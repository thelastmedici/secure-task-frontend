import type { User } from '../domain/models';
import type { RouteName } from '../types';

export class AccessService {
  canAccessRoute(route: RouteName, user: User): boolean {
    const adminRoutes: RouteName[] = ['audit-logs', 'users', 'roles'];
    return !adminRoutes.includes(route) || user.isAdmin();
  }

  canCreateTask(user: User): boolean {
    return user.role === 'Admin' || user.role === 'Manager';
  }

  canUploadDocument(user: User): boolean {
    return user.role === 'Admin' || user.role === 'Manager' || user.role === 'Member';
  }
}
