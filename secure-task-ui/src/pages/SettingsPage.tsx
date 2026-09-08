import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  return <><PageHeader title="Settings" description="Manage profile, security, notifications, and system preferences." /><div className="settings-grid"><section className="card"><h2>Profile</h2><label>Name<input defaultValue="Joshua" /></label><label>Email<input defaultValue="joshua@example.com" /></label><button className="primary-button">Save Profile</button></section><section className="card"><h2>Security</h2><button className="wide-button">Change Password</button><button className="wide-button">Enable 2FA</button></section><section className="card"><h2>System</h2><label>Max Upload Size<input defaultValue="25 MB" /></label><label>Allowed Types<input defaultValue="pdf, docx, xlsx, png" /></label></section></div></>;
}
