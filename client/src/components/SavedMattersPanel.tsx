import { useEffect, useState } from 'react';
import type { SavedMatter, SavedMatterSummary, User } from '../types';

interface SavedMattersPanelProps {
  user: User | null;
  contractName: string;
  playbookName: string;
  clauses: SavedMatter['clauses'];
  analyses: SavedMatter['analyses'];
  onLoadMatter: (matter: SavedMatter) => void;
}

export const SavedMattersPanel = ({ user, contractName, playbookName, clauses, analyses, onLoadMatter }: SavedMattersPanelProps) => {
  const [matters, setMatters] = useState<SavedMatterSummary[]>([]);
  const [name, setName] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);
  const [message, setMessage] = useState<string | null>(null);

  const loadMatters = async () => {
    if (!user) return setMatters([]);
    const response = await fetch('/api/matters', { credentials: 'include' });
    const payload = await response.json().catch(() => ({ matters: [] }));
    if (response.ok) setMatters(payload.matters || []);
  };

  useEffect(() => { void loadMatters(); }, [user]);

  const saveMatter = async () => {
    if (!user || !analyses.length) return;
    const response = await fetch('/api/matters', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || contractName || 'Untitled matter',
        contractName,
        playbookName,
        clauses,
        analyses,
        retentionDays,
        retainSourceFiles: false,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Matter saved. Scheduled deletion: ${payload.deleteAfter}` : payload.message || 'Save failed.');
    if (response.ok) {
      setName('');
      void loadMatters();
    }
  };

  const openMatter = async (id: number) => {
    const response = await fetch(`/api/matters/${id}`, { credentials: 'include' });
    const payload = await response.json();
    if (response.ok) onLoadMatter(payload.matter);
  };

  const deleteMatter = async (id: number) => {
    await fetch(`/api/matters/${id}`, { method: 'DELETE', credentials: 'include' });
    void loadMatters();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-950">Saved matters</h2>
          <p className="mt-1 text-sm text-slate-600">Save analysis results with an explicit retention window. Raw uploaded files are still not stored by default.</p>
          {!user && <p className="mt-3 text-sm text-amber-700">Sign in to save and reopen matters.</p>}

          {user && (
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Matter name" className="rounded-xl border border-slate-300 px-4 py-3" />
              <select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} className="rounded-xl border border-slate-300 px-4 py-3">
                <option value={7}>Retain 7 days</option>
                <option value={30}>Retain 30 days</option>
                <option value={90}>Retain 90 days</option>
              </select>
              <button type="button" disabled={!analyses.length} onClick={() => void saveMatter()} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">Save matter</button>
            </div>
          )}
          {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {matters.map((matter) => (
          <div key={matter.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{matter.name}</p>
              <p className="text-sm text-slate-500">Delete after: {new Date(matter.delete_after).toLocaleString()} • Retention: {matter.retention_days} days</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void openMatter(matter.id)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Open</button>
              <button type="button" onClick={() => void deleteMatter(matter.id)} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Delete</button>
            </div>
          </div>
        ))}
        {user && matters.length === 0 && <p className="text-sm text-slate-500">No saved matters yet.</p>}
      </div>
    </section>
  );
};
