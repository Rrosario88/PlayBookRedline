import { ChevronDown, FileText, FolderOpen, Grid3x3, List, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { SavedMatter, SavedMatterSummary, User } from '../types';

interface SavedMattersPanelProps {
  user: User | null;
  contractName: string;
  playbookName: string;
  clauses: SavedMatter['clauses'];
  analyses: SavedMatter['analyses'];
  onLoadMatter: (matter: SavedMatter) => void;
}

const retentionLabel = (days: number) => `${days} days`;

type SortOption = 'recent' | 'name' | 'expiring';
type ViewMode = 'detailed' | 'compact';

export const SavedMattersPanel = ({ user, contractName, playbookName, clauses, analyses, onLoadMatter }: SavedMattersPanelProps) => {
  const [matters, setMatters] = useState<SavedMatterSummary[]>([]);
  const [name, setName] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [retentionFilter, setRetentionFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [displayCount, setDisplayCount] = useState(10);

  const loadMatters = async () => {
    if (!user) return setMatters([]);
    try {
      const payload = await apiFetch('/api/matters', { method: 'GET' });
      setMatters(payload.matters || []);
    } catch {
      setMatters([]);
    }
  };

  useEffect(() => {
    void loadMatters();
  }, [user]);

  const filteredAndSortedMatters = useMemo(() => {
    let filtered = matters;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.contract_name?.toLowerCase().includes(query) ||
          m.playbook_name?.toLowerCase().includes(query)
      );
    }

    // Retention filter
    if (retentionFilter !== 'all') {
      filtered = filtered.filter((m) => m.retention_days === retentionFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'expiring') return new Date(a.delete_after).getTime() - new Date(b.delete_after).getTime();
      // Default: recent (newest first by ID)
      return b.id - a.id;
    });

    return sorted;
  }, [matters, searchQuery, retentionFilter, sortBy]);

  const displayedMatters = useMemo(() => filteredAndSortedMatters.slice(0, displayCount), [filteredAndSortedMatters, displayCount]);
  const hasMore = filteredAndSortedMatters.length > displayCount;

  const matterCountLabel = useMemo(() => `${matters.length} saved matter${matters.length === 1 ? '' : 's'}`, [matters.length]);

  const retentionStats = useMemo(() => {
    const stats = { 7: 0, 30: 0, 90: 0 };
    matters.forEach((m) => {
      if (m.retention_days in stats) stats[m.retention_days as keyof typeof stats]++;
    });
    return stats;
  }, [matters]);

  const saveMatter = async () => {
    if (!user || !analyses.length) return;
    try {
      const payload = await apiFetch('/api/matters', {
        method: 'POST',
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
      setMessage(`Matter saved. Scheduled deletion: ${payload.deleteAfter}`);
      setName('');
      void loadMatters();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    }
  };

  const openMatter = async (id: number) => {
    const payload = await apiFetch(`/api/matters/${id}`, { method: 'GET' });
    onLoadMatter(payload.matter);
  };

  const deleteMatter = async (id: number) => {
    await apiFetch(`/api/matters/${id}`, { method: 'DELETE' });
    void loadMatters();
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[32px] border border-slate-200/80 bg-white px-7 py-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Library</p>
            <h2 className="mt-3 text-[36px] font-semibold tracking-tight text-slate-950">Saved matters</h2>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600">Store finished reviews, reopen them when needed, and keep retention explicit.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-[#f7f4ee] px-4 py-2 text-sm font-medium text-slate-700">{matterCountLabel}</div>
              {user ? <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Signed in as {user.email}</div> : null}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#faf8f5] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm"><Sparkles size={18} /></div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Retention</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Save finished reviews without clutter.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">Only analysis output is saved here. Source files remain transient by default.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[30px] border-2 border-slate-950 bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#f7f4ee] p-3 text-slate-700"><Sparkles size={18} /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Create new matter</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Save current review</h3>
            </div>
          </div>
          {!user ? (
            <div className="mt-5 rounded-[24px] bg-[#faf8f5] px-5 py-5 text-sm leading-7 text-slate-600">
              Sign in from the menu to save and reopen matters.
            </div>
          ) : !analyses.length ? (
            <div className="mt-5 rounded-[24px] bg-[#faf8f5] px-5 py-5 text-sm leading-7 text-slate-600">
              Complete an analysis in the workspace first, then return here to save it as a matter.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Matter name (optional)</label>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={contractName || 'Untitled matter'} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Retention period</label>
                <select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300">
                  <option value={7}>Delete after 7 days</option>
                  <option value={30}>Delete after 30 days</option>
                  <option value={90}>Delete after 90 days</option>
                </select>
              </div>
              <button type="button" disabled={!analyses.length} onClick={() => void saveMatter()} className="w-full rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300">
                Create matter
              </button>
            </div>
          )}
          {message ? <div className="mt-4 rounded-[20px] bg-[#f7f4ee] px-4 py-3 text-sm leading-7 text-slate-700">{message}</div> : null}
        </div>

        <div className="space-y-4">
          {matters.length ? (
            <>
              <div className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search matters by name, contract, or playbook..."
                      className="w-full rounded-[22px] border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={retentionFilter}
                        onChange={(e) => setRetentionFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition hover:border-slate-300"
                      >
                        <option value="all">All retention ({matters.length})</option>
                        <option value={7}>7 days ({retentionStats[7]})</option>
                        <option value={30}>30 days ({retentionStats[30]})</option>
                        <option value={90}>90 days ({retentionStats[90]})</option>
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition hover:border-slate-300"
                      >
                        <option value="recent">Most recent</option>
                        <option value="name">Name A-Z</option>
                        <option value="expiring">Expiring soon</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('detailed')}
                        className={`rounded-full p-2 transition ${viewMode === 'detailed' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <List size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('compact')}
                        className={`rounded-full p-2 transition ${viewMode === 'compact' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <Grid3x3 size={16} />
                      </button>
                    </div>
                  </div>

                  {searchQuery || retentionFilter !== 'all' ? (
                    <p className="text-sm text-slate-500">
                      Showing {filteredAndSortedMatters.length} of {matters.length} matters
                    </p>
                  ) : null}
                </div>
              </div>

              {displayedMatters.map((matter) =>
                viewMode === 'detailed' ? (
                  <article key={matter.id} className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-2xl bg-[#f7f4ee] p-3 text-slate-700">
                            <FolderOpen size={18} />
                          </div>
                          <div>
                            <h3 className="text-[24px] font-semibold tracking-tight text-slate-950">{matter.name}</h3>
                            <p className="mt-1 text-sm leading-7 text-slate-500">Delete after {new Date(matter.delete_after).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                          <span className="rounded-full bg-slate-100 px-3 py-1">{retentionLabel(matter.retention_days)}</span>
                          {matter.contract_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{matter.contract_name}</span> : null}
                          {matter.playbook_name ? <span className="rounded-full bg-slate-100 px-3 py-1">{matter.playbook_name}</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => void openMatter(matter.id)} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                          <FileText size={16} />
                          Open
                        </button>
                        <button type="button" onClick={() => void deleteMatter(matter.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article key={matter.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FolderOpen className="shrink-0 text-slate-600" size={16} />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-slate-950">{matter.name}</h4>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{matter.contract_name || 'No contract name'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{retentionLabel(matter.retention_days)}</span>
                        <button type="button" onClick={() => void openMatter(matter.id)} className="rounded-full bg-slate-950 p-2 text-white transition hover:bg-slate-800">
                          <FileText size={14} />
                        </button>
                        <button type="button" onClick={() => void deleteMatter(matter.id)} className="rounded-full border border-rose-200 bg-white p-2 text-rose-700 transition hover:bg-rose-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDisplayCount((prev) => prev + 10)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <ChevronDown size={16} />
                    Load more ({filteredAndSortedMatters.length - displayCount} remaining)
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <section className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-8 text-center shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f4ee] text-slate-700">
                <FolderOpen size={22} />
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">No saved matters yet.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Finish a review in the workspace, then save the output here when you want a retained reference.</p>
            </section>
          )}
        </div>
      </section>
    </section>
  );
};
