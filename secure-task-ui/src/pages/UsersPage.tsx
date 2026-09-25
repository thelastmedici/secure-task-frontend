import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';
import type { Role, User } from '../types';

export function UsersPage() {
  const controller = useAppController();
  const canManageUsers = controller.accessService.canManageUsers(controller.user);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Member' as Role });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [manageForm, setManageForm] = useState({ name: '', role: 'Member' as Role, status: 'Active' as User['status'] });

  const selectedUser = controller.users.find((user) => user.id === selectedUserId) ?? null;

  const openManageUser = (user: User) => {
    setSelectedUserId(user.id);
    setManageForm({ name: user.name, role: user.role, status: user.status });
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
  };

  return (
    <>
      <PageHeader title="Users" description="Invite, deactivate, and manage user roles." action={<button type="button" className="primary-button" disabled={!canManageUsers} onClick={() => setIsInviteOpen(true)}><UserPlus size={16}/> Invite User</button>} />
      {isInviteOpen && (
        <section className="card">
          <div className="card-header"><h2>Invite new user</h2><button type="button" onClick={() => setIsInviteOpen(false)}>Close</button></div>
          <div className="settings-form">
            <label>Name<input value={inviteForm.name} onChange={(event) => setInviteForm((form) => ({ ...form, name: event.target.value }))} /></label>
            <label>Email<input type="email" value={inviteForm.email} onChange={(event) => setInviteForm((form) => ({ ...form, email: event.target.value }))} /></label>
            <label>Role<select value={inviteForm.role} onChange={(event) => setInviteForm((form) => ({ ...form, role: event.target.value as Role }))}><option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Member">Member</option></select></label>
            <div className="dialog-actions"><button type="button" onClick={() => setIsInviteOpen(false)}>Cancel</button><button type="button" className="primary-button" onClick={() => void submitInvite()}>Send invite</button></div>
          </div>
        </section>
      )}
      {selectedUser && (
        <section className="card">
          <div className="card-header"><h2>Manage {selectedUser.name}</h2><button type="button" onClick={() => setSelectedUserId(null)}>Close</button></div>
          <div className="settings-form">
            <label>Name<input value={manageForm.name} onChange={(event) => setManageForm((form) => ({ ...form, name: event.target.value }))} /></label>
            <label>Role<select value={manageForm.role} onChange={(event) => setManageForm((form) => ({ ...form, role: event.target.value as Role }))}><option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Member">Member</option></select></label>
            <label>Status<select value={manageForm.status} onChange={(event) => setManageForm((form) => ({ ...form, status: event.target.value as User['status'] }))}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Invited">Invited</option></select></label>
            <div className="dialog-actions"><button type="button" onClick={() => setSelectedUserId(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => void submitManage()}>Save changes</button></div>
          </div>
        </section>
      )}
      <section className="card table-card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody>
            {controller.users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td><span className={`badge ${user.status === 'Active' ? 'success' : user.status === 'Invited' ? 'primary' : 'neutral'}`}>{user.status}</span></td>
                <td><button type="button" disabled={!canManageUsers} onClick={() => openManageUser(user)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
