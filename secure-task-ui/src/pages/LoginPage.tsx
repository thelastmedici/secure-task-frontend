import React, { useState } from 'react';
import { useAppController } from '../core/AppContext';

export function LoginPage() {
  const controller = useAppController();
  const [email, setEmail] = useState('joshua@example.com');
  const [password, setPassword] = useState('password');
  const [verificationCode, setVerificationCode] = useState('');
  const [requiresVerificationCode, setRequiresVerificationCode] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState(email);

  const submit = async () => {
    const didLogin = await controller.login(email.trim(), password, verificationCode);
    setRequiresVerificationCode(!didLogin && controller.lastError === 'Enter a valid authenticator or recovery code.');
  };

  const handleResetPassword = async () => {
    const didRequest = await controller.requestPasswordReset(resetEmail);
    if (didRequest) {
      setIsPasswordResetOpen(false);
      setEmail(resetEmail);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand center">
          <div className="brand-mark">S</div>
          <div>
            <strong>SecureFlow</strong>
            <span>Task & Document Manager</span>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to manage secure tasks, files, and audit history.</p>
        {controller.lastError && <div className="form-error">{controller.lastError}</div>}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {requiresVerificationCode && <label>Authenticator or recovery code<input autoComplete="one-time-code" maxLength={17} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.toUpperCase().replace(/[^A-Z2-7-]/g, ''))} /><small className="muted-text">Enter a current 6-digit code or one unused recovery code.</small></label>}
        <button className="primary-button" type="button" onClick={submit}>Login</button>
        {!isPasswordResetOpen ? (
          <button type="button" className="text-link-button" onClick={() => { setResetEmail(email); setIsPasswordResetOpen(true); }}>Forgot password?</button>
        ) : (
          <div className="settings-form">
            <label>
              Account email
              <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" />
            </label>
            <div className="dialog-actions">
              <button type="button" onClick={() => setIsPasswordResetOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => void handleResetPassword()}>Send reset link</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
