import { describe, expect, it } from 'vitest';
import { buildDashboardSummary } from './DashboardPage';

describe('DashboardPage summary builder', () => {
  it('aggregates the key items a dashboard needs to surface', () => {
    const summary = buildDashboardSummary({
      tasks: [
        { id: 't1', title: 'Build audit trail API', description: '', status: 'In Progress', priority: 'High', assignee: 'Joshua', dueDate: '2026-06-20' },
        { id: 't2', title: 'Review document permissions', description: '', status: 'Pending', priority: 'Medium', assignee: 'Sarah Connor', dueDate: '2026-06-22' },
        { id: 't3', title: 'Finish notification service', description: '', status: 'Completed', priority: 'High', assignee: 'Daniel Kim', dueDate: '2026-06-10' },
        { id: 't4', title: 'Clean old document versions', description: '', status: 'Overdue', priority: 'Low', assignee: 'Amara Stone', dueDate: '2026-06-05' },
      ],
      documents: [
        { id: 'd1', fileName: 'audit-design.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Joshua', uploadedAt: '2026-06-12' },
        { id: 'd2', fileName: 'permissions-matrix.xlsx', type: 'XLSX', size: '840 KB', uploadedBy: 'Sarah Connor', uploadedAt: '2026-06-11' },
      ],
      users: [
        { id: 'u1', name: 'Joshua', email: 'joshua@example.com', role: 'Admin', status: 'Active' },
        { id: 'u2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Manager', status: 'Active' },
        { id: 'u3', name: 'Daniel Kim', email: 'daniel@example.com', role: 'Member', status: 'Active' },
        { id: 'u4', name: 'Amara Stone', email: 'amara@example.com', role: 'Member', status: 'Inactive' },
      ],
      auditLogs: [
        { id: 'a1', time: '2026-06-13 10:30', user: 'Joshua', action: 'Uploaded Document', entity: 'audit-design.pdf', ipAddress: '192.168.1.10' },
        { id: 'a2', time: '2026-06-13 10:45', user: 'Sarah Connor', action: 'Updated Task', entity: 'Review document permissions', ipAddress: '192.168.1.21' },
        { id: 'a3', time: '2026-06-13 11:00', user: 'Admin', action: 'Changed Role', entity: 'Daniel Kim', ipAddress: '192.168.1.99' },
      ],
      currentUser: { id: 'u1', name: 'Joshua', email: 'joshua@example.com', role: 'Admin', status: 'Active' },
    });

    expect(summary.overdueCount).toBe(1);
    expect(summary.dueThisWeekCount).toBe(2);
    expect(summary.awaitingReviewCount).toBe(1);
    expect(summary.uploadsThisWeek).toBe(1);
    expect(summary.security.twoFactorAdoption).toBe(75);
    expect(summary.security.inactiveUsers).toBe(1);
  });
});
