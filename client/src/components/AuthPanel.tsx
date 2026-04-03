import { useState } from 'react';
import type { User } from '../types';

interface AuthPanelProps {
  user: User | null;
  error: string | null;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void> | void;
  onRegister: (email: string, password: string) => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export const AuthPanel = ({ user, error, loading, onLogin, onRegister, onLogout }: AuthPanelProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Account</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{user.email}</h3>
        <p className="mt-2 text-sm text-slate-600">Role: {user.role}</p>
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
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => setMode('login')} className={`rounded-full px-3 py-1 ${mode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Login</button>
          <button type="button" onClick={() => setMode('register')} className={`rounded-full px-3 py-1 ${mode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Register</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-xl border border-slate-300 px-4 py-3" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password (10+ chars)" className="rounded-xl border border-slate-300 px-4 py-3" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={() => void (mode === 'login' ? onLogin(email, password) : onRegister(email, password))}
          className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {loading ? 'Working…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </div>
    </div>
  );
};
