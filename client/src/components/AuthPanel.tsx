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
      <div className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Account</p>
        <h3 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-950">{user.email}</h3>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{user.role}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{user.emailVerifiedAt ? 'Verified' : 'Unverified'}</span>
        </div>

        {!user.emailVerifiedAt && (
          <div className="mt-6 rounded-[24px] bg-[#faf8f5] p-5">
            <p className="text-sm font-medium text-slate-900">Email verification</p>
            <div className="mt-4 space-y-3">
              <button type="button" onClick={async () => { const payload = await onRequestVerification(); setVerificationLink(payload.verifyLink); setActionMessage('Verification link generated.'); }} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Generate link</button>
              {verificationLink && (
                <div className="rounded-[20px] bg-white p-4 text-xs leading-6 text-slate-700 break-all shadow-sm">
                  {verificationLink}
                  <button type="button" onClick={() => void onVerifyEmail(verificationLink.split('verify=').pop() || '')} className="mt-3 block rounded-full bg-emerald-600 px-3 py-1.5 text-white">Verify now</button>
                </div>
              )}
            </div>
          </div>
        )}

        {actionMessage && <p className="mt-4 text-sm leading-7 text-slate-600">{actionMessage}</p>}
        <button type="button" onClick={() => void onLogout()} className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Sign out</button>
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Account</p>
          <h3 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-950">Access and security</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {(['login', 'register', 'requestReset', 'resetPassword'] as const).map((entry) => (
            <button key={entry} type="button" onClick={() => setMode(entry)} className={`rounded-full px-3 py-1.5 transition ${mode === entry ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
              {entry === 'login' ? 'Login' : entry === 'register' ? 'Register' : entry === 'requestReset' ? 'Forgot password' : 'Reset password'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300" />
        {(mode === 'login' || mode === 'register' || mode === 'resetPassword') && <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300" />}
        {mode === 'register' && <input value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} placeholder="Invite token" className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300" />}
        {mode === 'resetPassword' && <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Reset token" className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300" />}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {actionMessage && <p className="text-sm leading-7 text-slate-600 whitespace-pre-wrap break-all">{actionMessage}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            if (mode === 'login') await onLogin(email, password);
            if (mode === 'register') {
              const payload = await onRegister(email, password, inviteToken);
              if (payload?.verificationLink) setActionMessage(`Account created. Verification link:\n${payload.verificationLink}`);
            }
            if (mode === 'requestReset') {
              const payload = await onRequestPasswordReset(email);
              setActionMessage(payload.resetLink ? `Reset link:\n${payload.resetLink}` : payload.message);
            }
            if (mode === 'resetPassword') {
              await onResetPassword(resetToken, password);
              setActionMessage('Password updated. You can now log in.');
            }
          }}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
        >
          {loading ? 'Working…' : mode === 'login' ? 'Login' : mode === 'register' ? 'Create account from invite' : mode === 'requestReset' ? 'Generate reset link' : 'Set new password'}
        </button>
      </div>
    </div>
  );
};
