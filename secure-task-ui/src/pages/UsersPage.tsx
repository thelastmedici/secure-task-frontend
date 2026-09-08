import { UserPlus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { users } from '../data/mockData';

export function UsersPage() {
  return <><PageHeader title="Users" description="Invite, deactivate, and manage user roles." action={<button className="primary-button"><UserPlus size={16}/> Invite User</button>} /><section className="card table-card"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.role}</td><td><span className={`badge ${user.status === 'Active' ? 'success' : 'neutral'}`}>{user.status}</span></td><td><button>Manage</button></td></tr>)}</tbody></table></section></>;
}
