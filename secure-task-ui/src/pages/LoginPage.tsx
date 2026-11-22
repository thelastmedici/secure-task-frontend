import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, FileCheck2, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppController } from '../core/AppContext';

type LoginStep = 'credentials' | 'two-factor' | 'reset-password';

export function LoginPage() {
  const controller = useAppController();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true); setNotice(null);
    const didLogin = await controller.login(email.trim(), password);
    if (didLogin) {
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
      return;
    }
    if (!didLogin && controller.lastError === 'Enter a valid authenticator or recovery code.') {
      controller.clearError(); setVerificationCode(''); setStep('two-factor');
    }
    setIsSubmitting(false);
  };

  const submitTwoFactor = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const didLogin = await controller.login(email.trim(), password, verificationCode);
    if (didLogin) navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
    setIsSubmitting(false);
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true); setNotice(null);
    const requested = await controller.requestPasswordReset(resetEmail.trim());
    if (requested) setNotice(controller.lastSuccess ?? 'Password reset request sent.');
    setIsSubmitting(false);
  };

  const startSso = (provider: 'google' | 'microsoft') => {
    window.location.assign(controller.apiClient.ssoUrl(provider));
  };

  const returnToCredentials = () => {
    controller.clearError(); setNotice(null); setStep('credentials'); setVerificationCode('');
  };

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-card login-form-panel" aria-labelledby="login-title">
          <div className="brand login-brand">
            <div className="brand-mark">S</div>
            <div><strong>SecureFlow</strong><span>Task & Document Manager</span></div>
          </div>

          {step === 'credentials' && <>
            <div className="login-heading"><span className="login-eyebrow">Welcome back</span><h1 id="login-title">Sign in to your workspace</h1><p>Use your work account to continue to SecureFlow.</p></div>
            {(controller.lastError || notice) && <div className={controller.lastError ? 'form-error' : 'form-success'} role={controller.lastError ? 'alert' : 'status'}>{controller.lastError ?? notice}</div>}
            <div className="sso-buttons"><button type="button" className="sso-button" onClick={() => startSso('google')}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</button><button type="button" className="sso-button" onClick={() => startSso('microsoft')}><span className="microsoft-mark" aria-hidden="true"><i/><i/><i/><i/></span>Continue with Microsoft</button></div>
            <div className="login-divider"><span>or sign in with email</span></div>
            <form className="login-form" onSubmit={(event) => void submitCredentials(event)}>
              <label htmlFor="login-email">Work email</label><input id="login-email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(event) => { setEmail(event.target.value); if (controller.lastError) controller.clearError(); }} required />
              <div className="login-label-row"><label htmlFor="login-password">Password</label><button type="button" className="text-link-button" onClick={() => { controller.clearError(); setNotice(null); setResetEmail(email); setStep('reset-password'); }}>Forgot password?</button></div>
              <div className="password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); if (controller.lastError) controller.clearError(); }} required /><button type="button" className="password-visibility" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
              <button className="primary-button login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}<ArrowRight size={16}/></button>
            </form>
            <p className="login-footer-note"><LockKeyhole size={14}/> Protected with secure, encrypted sign-in</p>
          </>}

          {step === 'two-factor' && <>
            <button type="button" className="login-back-button" onClick={returnToCredentials}><ArrowLeft size={15}/> Back to sign in</button>
            <div className="login-step-indicator"><span className="complete"><Check size={12}/></span><i/><span className="current">2</span><small>Step 2 of 2</small></div>
            <div className="login-heading"><span className="login-eyebrow">Two-step verification</span><h1 id="login-title">Verify it’s you</h1><p>Enter the current code from your authenticator app, or use one of your recovery codes.</p></div>
            {controller.lastError && <div className="form-error" role="alert">{controller.lastError}</div>}
            <form className="login-form two-factor-form" onSubmit={(event) => void submitTwoFactor(event)}>
              <label htmlFor="verification-code">Authenticator or recovery code</label><input id="verification-code" autoFocus autoComplete="one-time-code" inputMode="text" placeholder="6-digit code or recovery code" maxLength={17} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.toUpperCase().replace(/[^A-Z2-7-]/g, ''))} required />
              <button className="primary-button login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Verifying…' : 'Verify and sign in'}<ArrowRight size={16}/></button>
            </form>
            <p className="login-footer-note"><LockKeyhole size={14}/> Your code is checked securely for this sign-in</p>
          </>}

          {step === 'reset-password' && <>
            <button type="button" className="login-back-button" onClick={returnToCredentials}><ArrowLeft size={15}/> Back to sign in</button>
            <div className="login-heading"><span className="login-eyebrow">Account recovery</span><h1 id="login-title">Reset your password</h1><p>Enter your work email and we’ll send a reset link if an account exists.</p></div>
            {(controller.lastError || notice) && <div className={controller.lastError ? 'form-error' : 'form-success'} role={controller.lastError ? 'alert' : 'status'}>{controller.lastError ?? notice}</div>}
            <form className="login-form" onSubmit={(event) => void submitReset(event)}><label htmlFor="reset-email">Work email</label><input id="reset-email" type="email" autoComplete="email" placeholder="you@company.com" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} required /><button className="primary-button login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}<ArrowRight size={16}/></button></form>
            <p className="login-footer-note"><LockKeyhole size={14}/> For your security, responses don’t reveal whether an account exists</p>
          </>}
        </section>

        <aside className="login-value-panel" aria-label="SecureFlow product benefits">
          <div className="value-panel-top"><span className="value-shield"><ShieldCheck size={17}/></span><span>SECURE WORKSPACE OPERATIONS</span></div>
          <div className="value-panel-content"><p className="value-overline">One workspace. Clear accountability.</p><h2>Move work forward with confidence.</h2><p className="value-description">Keep tasks, sensitive documents, and audit trails connected in one workspace built for teams that take security seriously.</p>
            <div className="value-feature-list"><div><span><Check size={15}/></span><span><strong>Know what changed</strong><small>Traceable activity across tasks and documents.</small></span></div><div><span><Check size={15}/></span><span><strong>Protect every file</strong><small>Workspace policy and access controls in one place.</small></span></div><div><span><Check size={15}/></span><span><strong>Keep teams aligned</strong><small>Owners, deadlines, and approvals stay connected.</small></span></div></div>
          </div>
          <div className="value-panel-footer"><div className="value-stat"><ShieldCheck size={17}/><span><strong>Security-first</strong><small>Access with accountability</small></span></div><div className="value-stat"><FileCheck2 size={17}/><span><strong>Work, in context</strong><small>Tasks and files together</small></span></div><div className="value-stat"><UsersRound size={17}/><span><strong>Team-ready</strong><small>Clear roles and ownership</small></span></div></div>
        </aside>
      </div>
      <footer className="login-page-footer"><span>© {new Date().getFullYear()} SecureFlow</span><span>Privacy · Terms · Help</span></footer>
    </main>
  );
}
