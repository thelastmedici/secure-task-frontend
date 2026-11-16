import QRCode from 'qrcode';
import { Bell, Check, Download, KeyRound, LockKeyhole, Monitor, Shield, UserRound, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ThemeToggle, useThemePreference } from '../components/ThemeToggle';
import { useAppController } from '../core/AppContext';
import { totpUri } from '../services/TotpService';
import type { ActiveSession } from '../types';

type SettingsSection = 'Profile' | 'Security' | 'Notifications' | 'Workspace';
type NotificationPreferences = { taskUpdates: boolean; documentActivity: boolean; securityAlerts: boolean; weeklyDigest: boolean };
const defaultNotifications: NotificationPreferences = { taskUpdates: true, documentActivity: true, securityAlerts: true, weeklyDigest: false };

function browserName(agent: string) {
  if (/Edg\//.test(agent)) return 'Microsoft Edge';
  if (/Firefox\//.test(agent)) return 'Firefox';
  if (/Chrome\//.test(agent)) return 'Google Chrome';
  if (/Safari\//.test(agent)) return 'Safari';
  return 'Browser session';
}

export function SettingsPage() {
  const controller = useAppController();
  const [section, setSection] = useState<SettingsSection>('Profile');
  const [name, setName] = useState(controller.user.name);
  const [email, setEmail] = useState(controller.user.email);
  const [maxUploadSize, setMaxUploadSize] = useState(String(controller.workspaceSettings.maxUploadSizeMb));
  const [allowedTypes, setAllowedTypes] = useState(controller.workspaceSettings.allowedFileTypes.join(', ').toLowerCase());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>(controller.activeSessions);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => controller.storageService.load('notificationPreferences', defaultNotifications));
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [, setRefresh] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const { theme, setTheme } = useThemePreference();

  useEffect(() => {
    if (!setupSecret) { setQrCode(null); return; }
    QRCode.toDataURL(totpUri(setupSecret, controller.user.email), { width: 220, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrCode).catch(() => setMessage('Could not generate the authenticator QR code.'));
  }, [controller.user.email, setupSecret]);

  useEffect(() => {
    if (section !== 'Security') return;
    let active = true;
    controller.loadActiveSessions().then((result) => { if (active) setSessions(result); });
    return () => { active = false; };
  }, [controller, section]);

  const saveProfile = () => { if (controller.updateProfile(name, email)) setMessage('Profile saved.'); };
  const saveWorkspaceSettings = () => {
    const didSave = controller.updateWorkspaceSettings(Number(maxUploadSize), allowedTypes.split(','));
    if (didSave) { setAllowedTypes(controller.workspaceSettings.allowedFileTypes.join(', ').toLowerCase()); setMessage('Document policy saved.'); }
  };
  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setMessage('New passwords do not match.'); return; }
    if (await controller.changePassword(currentPassword, newPassword)) {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setIsPasswordFormOpen(false); setMessage('Password changed.');
    }
  };
  const beginSetup = () => {
    setMessage(null); setRecoveryCodes([]); setSetupSecret(controller.beginTwoFactorSetup()); setVerificationCode('');
  };
  const confirmSetup = async () => {
    if (!setupSecret) return;
    const codes = await controller.confirmTwoFactorSetup(setupSecret, verificationCode);
    if (codes) { setRecoveryCodes(codes); setSetupSecret(null); setMessage('Authenticator app verified. Two-factor authentication is enabled.'); setRefresh((v) => v + 1); }
  };
  const disableTwoFactor = () => {
    controller.disableTwoFactor(); setRecoveryCodes([]); setSetupSecret(null); setMessage('Two-factor authentication disabled.'); setRefresh((v) => v + 1);
  };
  const downloadRecoveryCodes = () => {
    const content = ['SecureFlow recovery codes', 'Store these codes somewhere safe. Each code can be used once.', '', ...recoveryCodes].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'secureflow-recovery-codes.txt'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const updateNotification = (key: keyof NotificationPreferences, checked: boolean) => {
    const next = { ...notificationPreferences, [key]: checked };
    setNotificationPreferences(next); controller.storageService.save('notificationPreferences', next); setMessage('Notification preferences saved.');
  };
  const signOutEverywhere = async () => {
    setConfirmSignOut(false); await controller.revokeAllSessions();
  };

  const navItems: Array<{ title: SettingsSection; icon: typeof UserRound; description: string }> = [
    { title: 'Profile', icon: UserRound, description: 'Personal details and appearance' },
    { title: 'Security', icon: Shield, description: 'Password, 2FA, and sessions' },
    { title: 'Notifications', icon: Bell, description: 'Choose what updates you receive' },
    { title: 'Workspace', icon: Users, description: 'Document policy and workspace settings' },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Manage your account, security, notifications, and workspace." />
      {(message || controller.lastError) && <div className={controller.lastError ? 'form-error' : 'form-success'} role={controller.lastError ? 'alert' : 'status'}>{controller.lastError ?? message}</div>}
      <div className="settings-layout">
        <nav className="settings-subnav" aria-label="Settings sections">{navItems.map(({ title, icon: Icon, description }) => <button type="button" key={title} className={`settings-nav-item ${section === title ? 'active' : ''}`} aria-current={section === title ? 'page' : undefined} onClick={() => { setSection(title); setMessage(null); }}><Icon size={17}/><span><strong>{title}</strong><small>{description}</small></span></button>)}</nav>
        <div className="settings-section-content">
          {section === 'Profile' && <section className="card settings-panel"><div><h2>Profile</h2><p className="muted-text">Your identity and display preferences.</p></div><label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="settings-divider"/><div className="settings-inline-heading"><span><strong>Appearance</strong><small>Choose how SecureFlow looks on this device.</small></span><ThemeToggle/></div><div className="dialog-actions settings-justify-start"><button type="button" className={theme === 'light' ? 'primary-button' : ''} onClick={() => setTheme('light')}>Light</button><button type="button" className={theme === 'dark' ? 'primary-button' : ''} onClick={() => setTheme('dark')}>Dark</button></div><button type="button" className="primary-button settings-save" onClick={saveProfile}>Save profile</button></section>}

          {section === 'Security' && <div className="settings-panel-stack">
            <section className="card settings-panel"><div><h2>Password</h2><p className="muted-text">Use a strong password you don’t use elsewhere.</p></div>{!isPasswordFormOpen ? <button type="button" className="wide-button" onClick={() => setIsPasswordFormOpen(true)}><KeyRound size={16}/> Change password</button> : <div className="settings-form"><label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><p className="muted-text">Use 12 or more characters, including uppercase, lowercase, and a number.</p><div className="dialog-actions"><button type="button" onClick={() => setIsPasswordFormOpen(false)}>Cancel</button><button type="button" className="primary-button" onClick={() => void changePassword()}>Update password</button></div></div>}</section>

            <section className="card settings-panel"><div className="security-heading"><span className="security-icon"><Shield size={19}/></span><span><h2>Authenticator app</h2><p className="muted-text">Use time-based one-time passwords (TOTP) from an authenticator app.</p></span><span className={`security-state ${controller.hasTwoFactorEnabled() ? 'enabled' : ''}`}><span/>{controller.hasTwoFactorEnabled() ? 'Enabled' : 'Not enabled'}</span></div>
              <p className="security-demo-note">This frontend demo stores the TOTP secret in this browser. Production deployments should store and verify MFA secrets on the authentication server.</p>
              {!controller.hasTwoFactorEnabled() && !setupSecret && <button type="button" className="primary-button" onClick={beginSetup}>Set up authenticator</button>}
              {setupSecret && <div className="totp-setup"><div className="totp-steps"><strong>1. Scan this QR code</strong><span>Open your authenticator app and scan the code. Or enter the setup key manually.</span>{qrCode ? <img className="totp-qr" src={qrCode} alt="Authenticator setup QR code"/> : <div className="totp-qr-loading">Preparing QR code…</div>}<code className="totp-secret">{setupSecret.match(/.{1,4}/g)?.join(' ')}</code></div><div className="totp-verify"><strong>2. Verify setup</strong><span>Enter the current 6-digit code from your authenticator app.</span><label>Authenticator code<input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}/></label><button type="button" className="primary-button" disabled={verificationCode.length !== 6} onClick={() => void confirmSetup()}><Check size={15}/> Verify and enable</button><button type="button" onClick={() => setSetupSecret(null)}>Cancel setup</button></div></div>}
              {controller.hasTwoFactorEnabled() && !recoveryCodes.length && <button type="button" className="danger-outline-button" onClick={disableTwoFactor}>Disable two-factor authentication</button>}
              {recoveryCodes.length > 0 && <div className="recovery-code"><div><strong>Save your recovery codes</strong><span>Each code works once. You won’t be able to view these again after leaving this page.</span></div><div className="recovery-code-list">{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div><button type="button" onClick={downloadRecoveryCodes}><Download size={15}/> Download recovery codes</button></div>}
            </section>

            <section className="card settings-panel"><div className="card-header settings-session-heading"><div><h2>Active sessions</h2><p className="muted-text">Devices currently signed in to your account.</p></div><button type="button" className="danger-outline-button" disabled={!sessions.length} onClick={() => setConfirmSignOut(true)}>Sign out everywhere</button></div>
              {sessions.length ? <div className="active-session-list">{sessions.map((session) => <div className="active-session" key={session.id}><span className="session-device-icon"><Monitor size={18}/></span><span className="active-session-details"><strong>{browserName(session.device)}{session.isCurrent && <span className="current-session-pill">This device</span>}</strong><small>Last active {new Date(session.lastActive).toLocaleString()} · Signed in {new Date(session.createdAt).toLocaleDateString()}</small></span><span className="session-active-dot" title="Session active"/></div>)}</div> : <div className="empty-sessions">No active sessions found.</div>}
              <p className="muted-text session-note">Signing out everywhere revokes server sessions where the configured API supports session management, then signs this device out.</p>
            </section>
          </div>}

          {section === 'Notifications' && <section className="card settings-panel"><div><h2>Notifications</h2><p className="muted-text">Choose which workspace updates appear in your notifications.</p></div><div className="notification-preference-list">{([['taskUpdates', 'Task updates', 'Assignments, due dates, and status changes.'], ['documentActivity', 'Document activity', 'Uploads, previews, and document changes.'], ['securityAlerts', 'Security alerts', 'Sign-ins, role changes, and security settings.'], ['weeklyDigest', 'Weekly digest', 'A weekly summary of workspace activity.']] as const).map(([key, title, description]) => <label className="notification-preference" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={notificationPreferences[key]} onChange={(event) => updateNotification(key, event.target.checked)}/></label>)}</div></section>}

          {section === 'Workspace' && <section className="card settings-panel"><div><h2>Document policy</h2><p className="muted-text">Set upload limits and allowed file types for this workspace.</p></div><label>Maximum upload size (MB)<input type="number" min="1" max="1024" value={maxUploadSize} onChange={(event) => setMaxUploadSize(event.target.value)} /></label><label>Allowed file types<input value={allowedTypes} onChange={(event) => setAllowedTypes(event.target.value)} /><small className="muted-text">Separate file types with commas, for example PDF, DOCX, XLSX.</small></label><div className="policy-preview"><LockKeyhole size={15}/><span>Current upload rule</span><strong>{controller.workspaceSettings.allowedFileTypes.join(', ')} up to {controller.workspaceSettings.maxUploadSizeMb} MB</strong></div><button type="button" className="primary-button settings-save" onClick={saveWorkspaceSettings}>Save document policy</button></section>}
        </div>
      </div>

      {confirmSignOut && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setConfirmSignOut(false)}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="signout-all-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="signout-all-title">Sign out everywhere?</h2><p>This will revoke available server sessions and sign you out of this device.</p><div className="dialog-actions"><button type="button" onClick={() => setConfirmSignOut(false)}>Cancel</button><button type="button" className="danger-button" onClick={() => void signOutEverywhere()}>Sign out everywhere</button></div></section></div>}
    </>
  );
}
