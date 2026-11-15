import { Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';
import type { Role, RouteName } from '../types';

const routeLabels: Array<{ route: RouteName; label: string; description: string }> = [
  { route: 'dashboard', label: 'Dashboard', description: 'Workspace overview and metrics' },
  { route: 'tasks', label: 'Tasks', description: 'Task list, board, and calendar' },
  { route: 'task-detail', label: 'Task details', description: 'Task details and updates' },
  { route: 'documents', label: 'Documents', description: 'Document library and uploads' },
  { route: 'document-detail', label: 'Document details', description: 'Document preview and access history' },
  { route: 'notifications', label: 'Notifications', description: 'Personal workspace notifications' },
  { route: 'audit-logs', label: 'Audit logs', description: 'Immutable security and compliance history' },
  { route: 'users', label: 'Users', description: 'Invite and manage workspace users' },
  { route: 'roles', label: 'Roles & permissions', description: 'Review role rules and access' },
  { route: 'settings', label: 'Settings', description: 'Workspace and account settings' },
];

export function RolesPage() {
  const controller = useAppController();
  const access = controller.accessService;
  const roles = access.roles;
  const [previewRole, setPreviewRole] = useState<Role>('Member');
  const canPreview = access.canManageUsers(controller.user);
  const previewRoutes = access.routesForRole(previewRole);
  const allowedRules = access.permissionsForRole(previewRole);

  return (
    <>
      <PageHeader title="Roles & Permissions" description="Permission rules shown here are the same rules enforced across the workspace." />

      <div className="metrics-grid dashboard-summary-grid roles-metrics">
        <div className="metric-card dashboard-summary-card"><div className="metric-icon primary"><ShieldCheck size={19}/></div><div><strong>{roles.length}</strong><span>Role tiers</span></div></div>
        <div className="metric-card dashboard-summary-card"><div className="metric-icon success"><Check size={19}/></div><div><strong>{access.permissionRules.length}</strong><span>Permission rules</span></div></div>
        <div className="metric-card dashboard-summary-card"><div className="metric-icon accent"><LockKeyhole size={19}/></div><div><strong>{routeLabels.length}</strong><span>Workspace areas</span></div></div>
      </div>

      <section className="card permission-matrix-card">
        <div className="card-header"><div><h2>Permission matrix</h2><p className="muted-text">Role grants are driven by AccessService policy.</p></div><span className="matrix-source"><ShieldCheck size={14}/> Live policy</span></div>
        <div className="table-card matrix-scroll"><table className="permission-matrix"><thead><tr><th>Capability</th>{roles.map((role) => <th key={role}>{role}</th>)}</tr></thead><tbody>
          {access.permissionRules.map((rule) => <tr key={rule.key}><td><span className="permission-description"><strong>{rule.label}</strong><small>{rule.description}</small></span></td>{roles.map((role) => {
            const granted = access.roleCan(role, rule.key);
            return <td key={`${rule.key}-${role}`}><span className={`permission-cell ${granted ? 'granted' : 'restricted'}`} title={granted ? `Allowed for ${role}` : `Not allowed for ${role}`}>{granted ? <Check size={15}/> : <span>—</span>}</span></td>;
          })}</tr>)}
        </tbody></table></div>
        <p className="matrix-footnote"><LockKeyhole size={14}/> Task completion and document deletion also check task assignment or document ownership at the time of the action.</p>
      </section>

      <section className="card view-role-card">
        <div className="card-header"><div><h2>View as role</h2><p className="muted-text">Preview the workspace areas and capabilities another role can access.</p></div>{canPreview ? <label className="view-role-select"><span>Preview role</span><select aria-label="View workspace as role" value={previewRole} onChange={(event) => setPreviewRole(event.target.value as Role)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label> : <span className="muted-text">Admin preview</span>}</div>
        {canPreview ? <>
          <div className="role-preview-summary"><span className={`role-preview-avatar role-${previewRole.toLowerCase()}`}><Eye size={18}/></span><span><strong>{previewRole} workspace access</strong><small>{previewRoutes.length} of {routeLabels.length} workspace areas · {allowedRules.length} capabilities</small></span><span className="preview-mode-pill"><Eye size={13}/> Preview only</span></div>
          <div className="route-preview-grid">{routeLabels.map(({ route, label, description }) => {
            const visible = previewRoutes.includes(route);
            return <div className={`route-preview-item ${visible ? 'available' : 'unavailable'}`} key={route}><span className="route-preview-icon">{visible ? <Check size={15}/> : <EyeOff size={15}/>}</span><span><strong>{label}</strong><small>{description}</small></span><span className="route-state">{visible ? 'Available' : 'Restricted'}</span></div>;
          })}</div>
        </> : <div className="role-preview-denied"><LockKeyhole size={16}/> View as role is available to admins only.</div>}
      </section>
      <p className="muted-text role-current-note">Signed in as {controller.user.name} · {controller.user.role}</p>
    </>
  );
}
