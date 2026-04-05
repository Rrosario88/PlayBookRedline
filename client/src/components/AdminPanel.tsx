import { Activity, BadgeCheck, BrainCircuit, FolderOpen, Shield, UserRoundPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { SavedMatterSummary, User } from '../types';

interface AdminPanelProps { user: User | null; }
interface AdminUserRow { id: number; email: string; role: 'user' | 'admin'; email_verified_at: string | null; created_at: string; }
interface OpenRouterModel { id: string; label: string; provider: string; tier: string; }
type AdminSection = 'overview' | 'users' | 'invites' | 'retention' | 'model';

const sectionButton = (active: boolean) => `rounded-[24px] px-4 py-3 text-left transition ${active ? 'bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]' : 'bg-[#f7f4ee] text-slate-700 hover:bg-slate-100'}`;
const cardClass = 'rounded-[30px] border border-slate-200/80 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]';

export const AdminPanel = ({ user }: AdminPanelProps) => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [matters, setMatters] = useState<SavedMatterSummary[]>([]);
  const [stats, setStats] = useState<{ users: number; matters: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [activeModel, setActiveModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
  const [pendingModel, setPendingModel] = useState<string>('');

  const loadAdminData = async () => {
    if (user?.role !== 'admin') return;
    const [usersPayload, mattersPayload, modelPayload] = await Promise.all([
      apiFetch('/api/admin/users', { method: 'GET' }),
      apiFetch('/api/admin/matters', { method: 'GET' }),
      apiFetch('/api/admin/model', { method: 'GET' }),
    ]);
    setUsers(usersPayload.users || []);
    setMatters(mattersPayload.matters || []);
    setStats(mattersPayload.stats || null);
    setActiveModel(modelPayload.activeModel || '');
    setPendingModel(modelPayload.activeModel || '');
    setAvailableModels(modelPayload.models || []);
    setHasOpenRouterKey(modelPayload.hasOpenRouterKey || false);
  };

  useEffect(() => {
    void loadAdminData();
  }, [user?.id, user?.role]);

  const saveModel = async () => {
    const payload = await apiFetch('/api/admin/model', {
      method: 'POST',
      body: JSON.stringify({ model: pendingModel }),
    });
    setActiveModel(payload.activeModel);
    setMessage(`Model updated to: ${payload.activeModel}`);
  };

  const recentUsers = useMemo(() => users.slice(0, 5), [users]);
  const recentMatters = useMemo(() => matters.slice(0, 5), [matters]);

  if (user?.role !== 'admin') return null;

  const pruneExpired = async () => {
    const payload = await apiFetch('/api/admin/prune-matters', { method: 'POST' });
    setMessage(`Deleted ${payload.deleted} expired matters.`);
    void loadAdminData();
  };

  const createInvite = async () => {
    const payload = await apiFetch('/api/admin/invites', {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setMessage(`Invite link for ${inviteEmail}: ${payload.inviteLink}`);
    setInviteEmail('');
    setActiveSection('invites');
  };

  const createResetLink = async (id: number) => {
    const payload = await apiFetch(`/api/admin/users/${id}/reset-link`, { method: 'POST' });
    setMessage(`Password reset link: ${payload.resetLink}`);
    setActiveSection('users');
  };

  const sectionNav = [
    { id: 'overview' as const, label: 'Overview', description: 'Stats and actions', icon: Activity },
    { id: 'users' as const, label: 'Users', description: 'Access and resets', icon: Users },
    { id: 'invites' as const, label: 'Invites', description: 'Create onboarding links', icon: UserRoundPlus },
    { id: 'retention' as const, label: 'Retention', description: 'Saved work and cleanup', icon: FolderOpen },
    { id: 'model' as const, label: 'AI Model', description: 'Select analysis model', icon: BrainCircuit },
  ];

  return (
    <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Admin navigation</p>
        <div className="mt-4 space-y-2">
          {sectionNav.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className={`w-full ${sectionButton(active)}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${active ? 'bg-white/10' : 'bg-white'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{item.label}</p>
                    <p className={`mt-1 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {message ? <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600 whitespace-pre-wrap break-all">{message}</div> : null}
      </aside>

      <div className="space-y-6">
        {activeSection === 'overview' ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Users', value: stats?.users ?? users.length, icon: Users },
                { label: 'Saved matters', value: stats?.matters ?? matters.length, icon: FolderOpen },
                { label: 'Verified accounts', value: users.filter((entry) => entry.email_verified_at).length, icon: BadgeCheck },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <section key={stat.label} className={cardClass}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><Icon size={18} /></div>
                    </div>
                    <p className="mt-4 text-4xl font-semibold text-slate-950">{stat.value}</p>
                  </section>
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className={cardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Quick actions</p>
                <h3 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-950">Run the essentials.</h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setActiveSection('invites')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create invite</button>
                  <button type="button" onClick={() => setActiveSection('users')} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950">Review users</button>
                  <button type="button" onClick={() => void pruneExpired()} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950">Prune expired matters</button>
                </div>
              </section>

              <section className={cardClass}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Recent users</p>
                <div className="mt-4 space-y-3">
                  {recentUsers.length ? recentUsers.map((row) => (
                    <div key={row.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">{row.email}</p>
                          <p className="mt-1 text-sm text-slate-500">{row.role} • {row.email_verified_at ? 'Verified' : 'Unverified'}</p>
                        </div>
                        <button type="button" onClick={() => void createResetLink(row.id)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Reset link</button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No users yet.</p>}
                </div>
              </section>
            </div>
          </>
        ) : null}

        {activeSection === 'users' ? (
          <section className={cardClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Users</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Review accounts without crowding the workspace.</h3>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{users.length} total accounts</div>
            </div>
            <div className="mt-6 grid gap-4">
              {users.map((row) => (
                <article key={row.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-slate-950">{row.email}</h4>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{row.role}</span>
                        {row.email_verified_at ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Verified</span> : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-500">Created {new Date(row.created_at).toLocaleString()}</p>
                    </div>
                    <button type="button" onClick={() => void createResetLink(row.id)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Generate reset link</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'invites' ? (
          <section className={cardClass}>
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invite flow</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Create access deliberately.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">This view isolates onboarding actions from analytics and retention tasks. Compose invites here and send the generated link directly to the intended person.</p>
                <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><Shield size={16} /> Invite-only access</div>
                  <p className="mt-2">Each invite is tied to a specific email and preserves a more controlled onboarding motion than open sign-up.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Invite email" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900" />
                  <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'user' | 'admin')} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900">
                    <option value="user">Invite as user</option>
                    <option value="admin">Invite as admin</option>
                  </select>
                </div>
                <button type="button" onClick={() => void createInvite()} className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Generate invite link</button>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === 'model' ? (
          <section className={cardClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Model</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Analysis model selection.</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Choose the model used for contract clause analysis via OpenRouter. Changes take effect immediately for all new analyses.</p>
              </div>
              {!hasOpenRouterKey ? (
                <div className="mt-2 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
                  No OpenRouter API key configured.<br />Set <code className="font-mono text-xs">OPENROUTER_API_KEY</code> in your environment.
                </div>
              ) : (
                <div className="mt-2 shrink-0 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                  OpenRouter connected
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Currently active</p>
              <div className="rounded-2xl bg-[#f7f4ee] px-5 py-4">
                <p className="font-semibold text-slate-950">{availableModels.find((m) => m.id === activeModel)?.label ?? activeModel}</p>
                <p className="mt-1 text-xs text-slate-500">{activeModel}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Select model</p>
              {(['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'DeepSeek'] as const).map((provider) => {
                const providerModels = availableModels.filter((m) => m.provider === provider);
                if (!providerModels.length) return null;
                return (
                  <div key={provider}>
                    <p className="mb-2 text-xs font-semibold text-slate-400">{provider}</p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {providerModels.map((model) => {
                        const isActive = model.id === activeModel;
                        const isPending = model.id === pendingModel;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => setPendingModel(model.id)}
                            className={`rounded-2xl border-2 px-4 py-4 text-left transition ${isPending ? 'border-slate-950 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-950">{model.label}</p>
                              {isActive ? <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span> : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{model.tier}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                disabled={!hasOpenRouterKey || pendingModel === activeModel}
                onClick={() => void saveModel()}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Apply model
              </button>
              {pendingModel !== activeModel ? (
                <p className="text-sm text-slate-500">Unsaved — click Apply to confirm</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeSection === 'retention' ? (
          <section className={cardClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Retention</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Manage saved matters.</h3>
              </div>
              <button type="button" onClick={() => void pruneExpired()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Prune expired matters</button>
            </div>
            <div className="mt-6 grid gap-4">
              {recentMatters.length ? recentMatters.map((row) => (
                <article key={row.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{row.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Delete after {new Date(row.delete_after).toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                      {row.retention_days} day retention
                    </div>
                  </div>
                </article>
              )) : <p className="text-sm text-slate-500">No saved matters yet.</p>}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
};
