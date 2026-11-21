import { Check, CircleUserRound, UserPlus, UsersRound, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { flexRender } from '@tanstack/react-table/flex-render';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useLegacyTable, type LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';
import type { Role, User } from '../types';
import { PermissionButton } from '../components/PermissionButton';
import { DetailTabs, type DetailTab } from '../components/DetailTabs';
import { HistoryPanel } from '../components/HistoryPanel';
import { EmptyState } from '../components/EmptyState';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';
}

function lastActive(value?: string) {
  if (!value) return { relative: 'Never', exact: 'No sign-in recorded' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { relative: value, exact: value };
  const elapsed = date.getTime() - Date.now();
  const seconds = Math.round(elapsed / 1000);
  const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [2629800, 'week'], [31557600, 'month']];
  let amount = seconds; let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (const [limit, nextUnit] of units) {
    if (Math.abs(amount) < limit) break;
    const divisor = nextUnit === 'minute' ? 60 : nextUnit === 'hour' ? 3600 : nextUnit === 'day' ? 86400 : nextUnit === 'week' ? 604800 : nextUnit === 'month' ? 2629800 : 31557600;
    amount = Math.round(seconds / divisor); unit = nextUnit;
  }
  return { relative: new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(amount, unit), exact: date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }) };
}

export function UsersPage() {
  const controller = useAppController();
  const canManageUsers = controller.accessService.canManageUsers(controller.user);
  const roles = controller.accessService.roles;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Member' as Role });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [manageForm, setManageForm] = useState({ name: '', role: 'Member' as Role, status: 'Active' as User['status'] });
  const [userTab, setUserTab] = useState<DetailTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([]);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const selectedUser = controller.users.find((user) => user.id === selectedUserId) ?? null;
  const inviteRules = controller.accessService.permissionsForRole(inviteForm.role);

  const openManageUser = (user: User) => {
    setSelectedUserId(user.id);
    setManageForm({ name: user.name, role: user.role, status: user.status });
    setUserTab('overview');
  };
  const submitInvite = async () => {
    if (!canManageUsers) return;
    const invited = await controller.inviteUser(inviteForm);
    if (invited) {
      setInviteForm({ name: '', email: '', role: 'Member' });
      setIsInviteOpen(false);
    }
  };
  const submitManage = async () => {
    if (!selectedUserId) return;
    await controller.updateUser(selectedUserId, manageForm);
    if (!controller.lastError) setSelectedUserId(null);
  };

  const userColumns = useMemo<LegacyColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        return <span className="user-name-cell"><span className={`user-avatar avatar-${user.role.toLowerCase()}`}>{initials(user.name)}</span><span><strong>{user.name}</strong><small>{user.id === controller.user.id ? 'You' : user.role}</small></span></span>;
      },
    },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => <span className={`role-pill role-${String(getValue()).toLowerCase()}`}>{String(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <span className={`status-pill status-${String(getValue()).toLowerCase()}`}><span />{String(getValue())}</span>,
    },
    {
      accessorKey: 'lastActive',
      header: 'Last active',
      cell: ({ getValue }) => {
        const activity = lastActive(getValue<string>());
        return <span className="last-active-cell" title={activity.exact}>{activity.relative}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => <PermissionButton type="button" allowed={canManageUsers} reason="Only admins can manage users." onClick={() => openManageUser(row.original)}>Manage</PermissionButton>,
    },
  ], [canManageUsers, controller.user.id]);

  const userTable = useLegacyTable({
    data: controller.users,
    columns: userColumns,
    state: { globalFilter: userSearch, sorting },
    onGlobalFilterChange: setUserSearch,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const virtualRows = useVirtualizer({
    count: userTable.getRowModel().rows.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  return (
    <>
      <PageHeader title="Users" description="Invite, deactivate, and manage user roles." action={<PermissionButton type="button" className="primary-button" allowed={canManageUsers} reason="Only admins can invite users." onClick={() => setIsInviteOpen(true)}><UserPlus size={16}/> Invite User</PermissionButton>} />
      {controller.lastError && <div className="form-error" role="alert">{controller.lastError}</div>}
      {controller.lastSuccess && <div className="form-success" role="status">{controller.lastSuccess}</div>}

      {isInviteOpen && <section className="card user-form-card">
        <div className="card-header"><div><h2>Invite new user</h2><p className="muted-text">Choose a role and preview its workspace access.</p></div><button type="button" aria-label="Close invite form" onClick={() => setIsInviteOpen(false)}><X size={16}/></button></div>
        <div className="user-invite-grid">
          <div className="settings-form">
            <label>Name<input autoFocus value={inviteForm.name} placeholder="Name" onChange={(event) => setInviteForm((form) => ({ ...form, name: event.target.value }))} /></label>
            <label>Email<input type="email" value={inviteForm.email} placeholder="name@company.com" onChange={(event) => setInviteForm((form) => ({ ...form, email: event.target.value }))} /></label>
            <label>Role<select value={inviteForm.role} onChange={(event) => setInviteForm((form) => ({ ...form, role: event.target.value as Role }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            <div className="dialog-actions"><button type="button" onClick={() => setIsInviteOpen(false)}>Cancel</button><button type="button" className="primary-button" onClick={() => void submitInvite()}><UserPlus size={15}/> Send invite</button></div>
          </div>
          <div className="invite-role-preview">
            <div className="invite-preview-user"><span className="user-avatar large">{inviteForm.name ? initials(inviteForm.name) : <CircleUserRound size={23}/>}</span><span><strong>{inviteForm.name || 'New workspace member'}</strong><small>{inviteForm.email || 'Invitee email'}</small></span><span className="role-pill">{inviteForm.role}</span></div>
            <div className="preview-list-heading"><strong>{inviteForm.role} access</strong><span>{inviteRules.length} capabilities</span></div>
            <ul className="role-preview-list">{inviteRules.map((rule) => <li key={rule.key}><Check size={15}/><span><strong>{rule.label}</strong><small>{rule.description}</small></span></li>)}</ul>
          </div>
        </div>
      </section>}

      {selectedUser && <section className="card user-form-card">
        <div className="card-header"><div><h2>Manage {selectedUser.name}</h2><p className="muted-text">Update account details, role, and status.</p></div><button type="button" aria-label="Close manage user form" onClick={() => setSelectedUserId(null)}><X size={16}/></button></div>
        <DetailTabs active={userTab} onChange={setUserTab} overviewLabel="Details"/>
        {userTab === 'history' ? <HistoryPanel logs={controller.auditLogs.filter((log) => log.user === selectedUser.name || log.entity === selectedUser.name || log.entity === selectedUser.email)} emptyMessage="User events such as invitations, role changes, and sign-ins will appear here." emptyAction={<button type="button" onClick={() => setUserTab('overview')}>Return to details</button>}/> :
        <div className="settings-form">
          <label>Name<input value={manageForm.name} onChange={(event) => setManageForm((form) => ({ ...form, name: event.target.value }))} /></label>
          <label>Role<select value={manageForm.role} onChange={(event) => setManageForm((form) => ({ ...form, role: event.target.value as Role }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
          <label>Status<select value={manageForm.status} onChange={(event) => setManageForm((form) => ({ ...form, status: event.target.value as User['status'] }))}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Invited">Invited</option></select></label>
          <div className="dialog-actions"><button type="button" onClick={() => setSelectedUserId(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => void submitManage()}>Save changes</button></div>
        </div>
        }
      </section>}

      {controller.users.length === 0 ? <EmptyState icon={<UsersRound size={23}/>} title="Your workspace is ready for its team" description="Invite a teammate to assign work and share secure documents." action={<PermissionButton type="button" className="primary-button" allowed={canManageUsers} reason="Only admins can invite users." onClick={() => setIsInviteOpen(true)}><UserPlus size={15}/> Invite a user</PermissionButton>}/> : <section className="card table-card users-table-card">
        <div className="table-search-bar"><input type="text" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users..." /></div>
        <div className="table-scroll-container" ref={tableScrollRef} style={{ height: '420px', overflow: 'auto' }}>
          <table>
            <thead><tr>{userTable.getFlatHeaders().map((header) => {
              const sorted = header.column.getIsSorted();
              return <th key={header.id} colSpan={header.colSpan} className={header.column.getCanSort() ? 'sortable-header' : undefined} onClick={header.column.getToggleSortingHandler()}>{header.isPlaceholder ? null : <>{flexRender(header.column.columnDef.header, header.getContext())}{sorted ? (sorted === 'asc' ? ' ↑' : ' ↓') : ''}</>}</th>;
            })}</tr></thead>
            <tbody style={{ height: `${virtualRows.getTotalSize()}px`, position: 'relative', display: 'block' }}>{virtualRows.getVirtualItems().map((virtualRow) => {
              const row = userTable.getRowModel().rows[virtualRow.index];
              return <tr key={row.id} style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)`, position: 'absolute', left: 0, width: '100%' }}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>;
            })}</tbody>
          </table>
        </div>
        <div className="table-footer">{userTable.getRowModel().rows.length} user{userTable.getRowModel().rows.length !== 1 ? 's' : ''} found.</div>
      </section>}
    </>
  );
}
