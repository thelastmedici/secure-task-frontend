import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

const permissions = ['Create Task', 'Assign Task', 'Upload Document', 'Delete Any Document', 'View Audit Logs', 'Manage Users'];
const roles = ['Admin', 'Manager', 'Member'];

export function RolesPage() {
  const controller = useAppController();

  return (
    <>
      <PageHeader title="Roles & Permissions" description="Control access using clear, auditable RBAC rules." />
      <section className="card table-card">
        <table>
          <thead>
            <tr><th>Permission</th>{roles.map((role) => <th key={role}>{role}</th>)}</tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission}>
                <td><strong>{permission}</strong></td>
                {roles.map((role) => (
                  <td key={`${role}-${permission}`}>
                    <input
                      type="checkbox"
                      checked={
                        role === 'Admin' ||
                        (role === 'Manager' && !permission.includes('Audit') && !permission.includes('Users')) ||
                        (role === 'Member' && ['Create Task', 'Upload Document'].includes(permission))
                      }
                      readOnly
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p style={{ marginTop: '1rem', color: '#7d89a5' }}>Current user role: {controller.user.role}</p>
    </>
  );
}
