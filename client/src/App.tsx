import { FileStack, LoaderCircle, Scale, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AnalysisTable } from './components/AnalysisTable';
import { AuthPanel } from './components/AuthPanel';
import { ExportButton } from './components/ExportButton';
import { LegalModal } from './components/LegalModal';
import { PrivacyNotice } from './components/PrivacyNotice';
import { RiskDashboard } from './components/RiskDashboard';
import { SavedMattersPanel } from './components/SavedMattersPanel';
import { UploadZone } from './components/UploadZone';
import { useAnalysis } from './hooks/useAnalysis';
import { useAuth } from './hooks/useAuth';
import type { LegalDoc } from './types';

function App() {
  const { contractName, playbookName, clauses, results, progress, isAnalyzing, error, demo, useDemo, setContractFile, setPlaybookFile, setContractName, setPlaybookName, updateRedline, analyze, exportDocx, loadDemo, resetDemo, hydrateMatter } = useAnalysis();
  const { user, authError, authLoading, login, register, logout, requestPasswordReset, resetPassword, requestVerification, verifyEmail } = useAuth();
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const inviteToken = params.get('invite') || '';
  const resetToken = params.get('reset') || '';
  const verifyToken = params.get('verify') || '';

  const openLegal = async (kind: 'privacy' | 'terms') => {
    const response = await fetch(`/api/legal/${kind}`, { credentials: 'include' });
    const payload = await response.json();
    if (response.ok) setLegalDoc(payload);
  };

  useEffect(() => {
    document.title = 'PlayBookRedline';
  }, []);

  useEffect(() => {
    if (verifyToken) {
      void verifyEmail(verifyToken).finally(() => {
        params.delete('verify');
        const next = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
      });
    }
  }, [verifyToken]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10 xl:px-8">
        <header className="rounded-3xl bg-[#0f172a] px-8 py-10 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"><Scale size={16} /> AI contract review for legal teams</div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight">PlayBookRedline</h1>
              <p className="mt-4 text-lg leading-8 text-slate-300">Upload a contract and your negotiation playbook to generate clause-by-clause risk analysis, negotiation-ready redlines, tracked-change DOCX exports, and optional saved matters with explicit retention controls.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void loadDemo()} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">Sample Demo</button>
              <button type="button" onClick={() => void analyze()} disabled={isAnalyzing} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300">{isAnalyzing ? 'Analyzing…' : 'Analyze'}</button>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          <PrivacyNotice onOpenPrivacy={() => void openLegal('privacy')} onOpenTerms={() => void openLegal('terms')} />

          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="grid gap-6 xl:grid-cols-2">
              <UploadZone label="Contract" fileName={contractName} disabled={isAnalyzing} helperText={useDemo ? 'Sample NDA loaded. Upload a new file to replace it.' : undefined} onChange={(file) => { resetDemo(); setContractFile(file); setContractName(file?.name || ''); }} />
              <UploadZone label="Playbook" fileName={playbookName} disabled={isAnalyzing} helperText={useDemo ? 'Sample playbook loaded. Upload a new file to replace it.' : undefined} onChange={(file) => { resetDemo(); setPlaybookFile(file); setPlaybookName(file?.name || ''); }} />
            </div>
            <AuthPanel user={user} error={authError} loading={authLoading} initialInviteToken={inviteToken} initialResetToken={resetToken} onLogin={login} onRegister={register} onLogout={logout} onRequestPasswordReset={requestPasswordReset} onResetPassword={resetPassword} onRequestVerification={requestVerification} onVerifyEmail={verifyEmail} />
          </section>

          {demo && useDemo && <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2"><div><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500"><FileStack size={16} />Sample contract preview</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{demo.contractPreview}</p></div><div><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500"><ShieldAlert size={16} />Sample playbook preview</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{demo.playbookPreview}</p></div></section>}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">{error}</div>}
          {progress && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-slate-700"><LoaderCircle className={`animate-spin ${isAnalyzing ? 'opacity-100' : 'opacity-0'}`} size={18} /><div><p className="font-semibold text-slate-950">{progress.message}</p><p className="text-sm text-slate-500">{progress.completed} of {progress.total} clauses complete</p></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }} /></div></section>}
          <SavedMattersPanel user={user} contractName={contractName} playbookName={playbookName} clauses={clauses} analyses={results} onLoadMatter={hydrateMatter} />
          <AdminPanel user={user} />

          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold text-slate-950">Analysis results</h2><p className="mt-1 text-sm text-slate-600">Review the AI output, refine redlines, export tracked changes, or save the matter with an explicit retention window.</p></div><ExportButton onClick={exportDocx} disabled={!results.length} /></div>
              <RiskDashboard results={results} />
              <AnalysisTable clauses={clauses} results={results} onRedlineChange={updateRedline} />
            </>
          )}
        </main>
      </div>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}

export default App;
