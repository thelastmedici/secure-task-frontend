export interface SecurityScoreInput {
  users: Array<{ status: string; mfaEnabled: boolean }>;
  tasks: Array<{ status: string }>;
}

/** A transparent 0–100 index: MFA coverage 60%, active-account hygiene 20%, overdue work 20%. */
export function calculateSecurityScore({ users, tasks }: SecurityScoreInput) {
  const activeUsers = users.filter((user) => user.status === 'Active');
  const mfaCoverage = activeUsers.length ? activeUsers.filter((user) => user.mfaEnabled).length / activeUsers.length : 0;
  const activeAccountRatio = users.length ? activeUsers.length / users.length : 1;
  const openTasks = tasks.filter((task) => task.status !== 'Completed');
  const overdueRatio = openTasks.length ? openTasks.filter((task) => task.status === 'Overdue').length / openTasks.length : 0;
  const score = Math.round(mfaCoverage * 60 + activeAccountRatio * 20 + (1 - overdueRatio) * 20);
  return { score, mfaCoverage: Math.round(mfaCoverage * 100), activeAccounts: Math.round(activeAccountRatio * 100), overdueWork: Math.round((1 - overdueRatio) * 100) };
}
