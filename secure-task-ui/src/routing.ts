import type { RouteName } from './types';

export const routePaths: Record<RouteName, string> = {
  login: '/login',
  dashboard: '/',
  tasks: '/tasks',
  'task-detail': '/tasks',
  documents: '/documents',
  'document-detail': '/documents',
  notifications: '/notifications',
  'audit-logs': '/audit-logs',
  users: '/users',
  roles: '/roles',
  settings: '/settings',
};

export function routeNameFromPath(pathname: string): RouteName {
  if (pathname === '/login') return 'login';
  if (pathname.startsWith('/tasks/')) return 'task-detail';
  if (pathname === '/tasks') return 'tasks';
  if (pathname.startsWith('/documents/')) return 'document-detail';
  if (pathname === '/documents') return 'documents';
  if (pathname === '/notifications') return 'notifications';
  if (pathname === '/audit-logs') return 'audit-logs';
  if (pathname === '/users') return 'users';
  if (pathname === '/roles') return 'roles';
  if (pathname === '/settings') return 'settings';
  return 'dashboard';
}
