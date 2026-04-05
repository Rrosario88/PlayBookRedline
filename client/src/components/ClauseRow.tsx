import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import type { AnalysisResult, Clause } from '../types';

const badgeStyles = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const accentStyles = {
  green: 'border-l-emerald-300',
  yellow: 'border-l-amber-300',
  red: 'border-l-rose-300',
};

interface ClauseRowProps {
  clause: Clause;
  result?: AnalysisResult;
  onRedlineChange: (id: string, value: string) => void;
}

export const ClauseRow = ({ clause, result, onRedlineChange }: ClauseRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const risk = result?.riskLevel ?? 'green';

  return (
    <article className={clsx('overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]', accentStyles[risk])}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full px-6 py-6 text-left transition hover:bg-[#faf8f5]"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Clause {clause.index + 1}</span>
              <span className={clsx('inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1', badgeStyles[risk])}>
                {risk}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{clause.clauseTitle}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 line-clamp-3">{clause.clauseText}</p>
          </div>
          <div className="flex items-center gap-3 xl:pt-1">
            <div className="max-w-md text-sm leading-7 text-slate-500 xl:text-right">{result?.issue || 'Pending analysis…'}</div>
            <div className="rounded-full border border-slate-200 p-2 text-slate-400">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200/80 bg-[#fcfbf9] px-6 py-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Original clause</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">{clause.clauseText}</p>
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Playbook reference</p>
                <p className="mt-3 text-sm leading-8 text-slate-700">{result?.playbookReference || 'Awaiting analysis.'}</p>
              </section>
            </div>
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Suggested redline</p>
              <textarea
                value={result?.suggestedRedline || ''}
                onChange={(event) => result && onRedlineChange(result.id, event.target.value)}
                className="mt-3 min-h-48 w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm leading-8 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                placeholder="AI-suggested redline will appear here."
              />
            </section>
          </div>
        </div>
      )}
    </article>
  );
};
