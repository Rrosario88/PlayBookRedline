import { useEffect, useState } from 'react';
import type { User } from '../types';

interface AuthPanelProps {
  user: User | null;
  error: string | null;
  loading: boolean;
  initialInviteToken?: string;
  initialResetToken?: string;
  onLogin: (email: string, password: string) => Promise<any> | void;
  onRegister: (email: string, password: string, inviteToken?: string) => Promise<any> | void;
  onLogout: () => Promise<void> | void;
  onRequestPasswordReset: (email: string) => Promise<any>;
  onResetPassword: (token: string, password: string) => Promise<any>;
  onRequestVerification: () => Promise<any>;
  onVerifyEmail: (token: string) => Promise<any>;
}

export const AuthPanel = ({ user, error, loading, initialInviteToken, initialResetToken, onLogin, onRegister, onLogout, onRequestPasswordReset, onResetPassword, onRequestVerification, onVerifyEmail }: AuthPanelProps) => {
  const [mode, setMode] = useState<'login' | 'register' | 'requestReset' | 'resetPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState(initialInviteToken || '');
  const [resetToken, setResetToken] = useState(initialResetToken || '');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  useEffect(() => {
    if (initialInviteToken) setMode('register');
    if (initialResetToken) setMode('resetPassword');
  }, [initialInviteToken, initialResetToken]);

  if (user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Account</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{user.email}</h3>
        <p className="mt-2 text-sm text-slate-600">Role: {user.role}</p>
        <p className="mt-1 text-sm text-slate-600">Email verified: {user.emailVerifiedAt ? 'Yes' : 'No'}</p>
        {!user.emailVerifiedAt && (
          <div className="mt-4 space-y-3">
            <button type="button" onClick={async () => { const payload = await onRequestVerification(); setVerificationLink(payload.verifyLink); setActionMessage('Verification link generated.'); }} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Generate verification link</button>
            {verificationLink && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 break-all">
                {verificationLink}
                <button type="button" onClick={() => void onVerifyEmail(verificationLink.split('verify=').pop() || '')} className="mt-3 block rounded-full bg-emerald-600 px-3 py-1 text-white">Verify now</button>
              </div>
            )}
          </div>
        )}
        {actionMessage && <p className="mt-3 text-sm text-slate-600">{actionMessage}</p>}
        <button type="button" onClick={() => void onLogout()} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Sign out</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Account</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Sign in to save matters</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {(['login', 'register', 'requestReset', 'resetPassword'] as const).map((entry) => (
            <button key={entry} type="button" onClick={() => setMode(entry)} className={`rounded-full px-3 py-1 ${mode === entry ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {entry === 'login' ? 'Login' : entry === 'register' ? 'Register' : entry === 'requestReset' ? 'Forgot password' : 'Reset password'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-xl border border-slate-300 px-4 py-3" />
        {(mode === 'login' || mode === 'register' || mode === 'resetPassword') && <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password (10+ chars)" className="rounded-xl border border-slate-300 px-4 py-3" />}
        {mode === 'register' && <input value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} placeholder="Invite token" className="rounded-xl border border-slate-300 px-4 py-3" />}
        {mode === 'resetPassword' && <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Reset token" className="rounded-xl border border-slate-300 px-4 py-3" />}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {actionMessage && <p className="text-sm text-slate-600 whitespace-pre-wrap break-all">{actionMessage}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            if (mode === 'login') await onLogin(email, password);
            if (mode === 'register') {
              const payload = await onRegister(email, password, inviteToken);
              if (payload?.verificationLink) setActionMessage(`Account created. Verification link:
${payload.verificationLink}`);
            }
            if (mode === 'requestReset') {
              const payload = await onRequestPasswordReset(email);
              setActionMessage(payload.resetLink ? `Reset link:
${payload.resetLink}` : payload.message);
            }
            if (mode === 'resetPassword') {
              await onResetPassword(resetToken, password);
              setActionMessage('Password updated. You can now log in.');
            }
          }}
          className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {loading ? 'Working…' : mode === 'login' ? 'Login' : mode === 'register' ? 'Create account from invite' : mode === 'requestReset' ? 'Generate reset link' : 'Set new password'}
        </button>
      </div>
    </div>
  );
};
