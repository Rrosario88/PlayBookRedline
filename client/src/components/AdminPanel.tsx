import { useEffect, useState } from 'react';
import type { SavedMatterSummary, User } from '../types';

interface AdminPanelProps {
  user: User | null;
}

interface AdminUserRow {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export const AdminPanel = ({ user }: AdminPanelProps) => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [matters, setMatters] = useState<SavedMatterSummary[]>([]);
  const [stats, setStats] = useState<{ users: number; matters: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (user?.role !== 'admin') return;
    const [usersRes, mattersRes] = await Promise.all([
      fetch('/api/admin/users', { credentials: 'include' }),
      fetch('/api/admin/matters', { credentials: 'include' }),
    ]);
    const usersPayload = await usersRes.json();
    const mattersPayload = await mattersRes.json();
    if (usersRes.ok) setUsers(usersPayload.users || []);
    if (mattersRes.ok) {
      setMatters(mattersPayload.matters || []);
      setStats(mattersPayload.stats || null);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [user?.id, user?.role]);

  if (user?.role !== 'admin') return null;

  const pruneExpired = async () => {
    const response = await fetch('/api/admin/prune-matters', { method: 'POST', credentials: 'include' });
    const payload = await response.json();
    setMessage(response.ok ? `Deleted ${payload.deleted} expired matters.` : payload.message || 'Prune failed.');
    void loadAdminData();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Admin dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Inspect registered users and saved matters, and manually prune expired records.</p>
        </div>
        <button type="button" onClick={() => void pruneExpired()} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Prune expired matters</button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      {stats && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm uppercase tracking-[0.16em] text-slate-500">Users</p><p className="mt-2 text-3xl font-semibold text-slate-950">{stats.users}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm uppercase tracking-[0.16em] text-slate-500">Saved matters</p><p className="mt-2 text-3xl font-semibold text-slate-950">{stats.matters}</p></div>
        </div>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Users</h3>
          <div className="mt-3 grid gap-3">
            {users.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{row.email}</p>
                <p className="text-sm text-slate-500">Role: {row.role} • Created: {new Date(row.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Saved matters</h3>
          <div className="mt-3 grid gap-3">
            {matters.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{row.name}</p>
                <p className="text-sm text-slate-500">Delete after: {new Date(row.delete_after).toLocaleString()} • Retention: {row.retention_days} days</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
