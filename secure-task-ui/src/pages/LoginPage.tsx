import React, { useState } from 'react';
import { useAppController } from '../core/AppContext';

export function LoginPage() {
  const controller = useAppController();
  const [email, setEmail] = useState('joshua@example.com');
  const [password, setPassword] = useState('password');
  const [verificationCode, setVerificationCode] = useState('');
  const [requiresVerificationCode, setRequiresVerificationCode] = useState(false);

  const submit = async () => {
    const didLogin = await controller.login(email.trim(), password, verificationCode);
    setRequiresVerificationCode(!didLogin && controller.lastError === 'Enter the six-digit verification code.');
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
        {requiresVerificationCode && <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} /></label>}
        <button className="primary-button" onClick={submit}>Login</button>
        <a>Forgot password?</a>
      </section>
    </main>
  );
}
