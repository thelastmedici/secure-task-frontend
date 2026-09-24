import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function SettingsPage() {
  const controller = useAppController();
  const [name, setName] = useState(controller.user.name);
  const [email, setEmail] = useState(controller.user.email);
  const [maxUploadSize, setMaxUploadSize] = useState(String(controller.workspaceSettings.maxUploadSizeMb));
  const [allowedTypes, setAllowedTypes] = useState(controller.workspaceSettings.allowedFileTypes.join(', ').toLowerCase());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [, setSecurityVersion] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const saveProfile = () => {
    if (controller.updateProfile(name, email)) setMessage('Profile saved.');
  };

  const saveWorkspaceSettings = () => {
    const didSave = controller.updateWorkspaceSettings(Number(maxUploadSize), allowedTypes.split(','));
    if (didSave) {
      setAllowedTypes(controller.workspaceSettings.allowedFileTypes.join(', ').toLowerCase());
      setMessage('Document policy saved.');
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }
    if (await controller.changePassword(currentPassword, newPassword)) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordFormOpen(false);
      setMessage('Password changed.');
    }
  };

  const toggleTwoFactor = async () => {
    if (controller.hasTwoFactorEnabled()) {
      controller.disableTwoFactor();
      setRecoveryCode(null);
      setSecurityVersion((version) => version + 1);
      setMessage('Two-factor authentication disabled.');
      return;
    }
    setRecoveryCode(await controller.enableTwoFactor());
    setSecurityVersion((version) => version + 1);
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage profile, security, notifications, and system preferences." />
      {(message || controller.lastError) && <div className={controller.lastError ? 'form-error' : 'form-success'} role="status">{controller.lastError ?? message}</div>}
      <div className="settings-grid">
        <section className="card">
          <h2>Profile</h2>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button type="button" className="primary-button" onClick={saveProfile}>Save Profile</button>
        </section>
        <section className="card">
          <h2>Security</h2>
          {!isPasswordFormOpen ? <button type="button" className="wide-button" onClick={() => setIsPasswordFormOpen(true)}>Change Password</button> : <div className="settings-form"><label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><p className="muted-text">Use 12 or more characters, including uppercase, lowercase, and a number.</p><div className="dialog-actions"><button type="button" onClick={() => setIsPasswordFormOpen(false)}>Cancel</button><button type="button" className="primary-button" onClick={changePassword}>Update Password</button></div></div>}
          <button type="button" className="wide-button" onClick={toggleTwoFactor}>{controller.hasTwoFactorEnabled() ? 'Disable 2FA' : 'Enable 2FA'}</button>
          {recoveryCode && <div className="recovery-code"><strong>Save this verification code</strong><code>{recoveryCode}</code><span>Use it at your next sign in. It is shown only once.</span></div>}
        </section>
        <section className="card">
          <h2>Document Policy</h2>
          <label>Max Upload Size (MB)<input type="number" min="1" max="1024" value={maxUploadSize} onChange={(event) => setMaxUploadSize(event.target.value)} /></label>
          <label>Allowed Types<input value={allowedTypes} onChange={(event) => setAllowedTypes(event.target.value)} /></label>
          <button type="button" className="primary-button" onClick={saveWorkspaceSettings}>Save Policy</button>
        </section>
      </div>
    </>
  );
}
