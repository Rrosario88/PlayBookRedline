import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import type { AnalysisResult, Clause } from '../types';

const badgeStyles = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="grid w-full grid-cols-[minmax(0,1.2fr)_140px_minmax(0,1fr)_minmax(0,1fr)_36px] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div>
          <p className="font-semibold text-slate-950">{clause.clauseTitle}</p>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{clause.clauseText}</p>
        </div>
        <div>
          <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1', badgeStyles[risk])}>
            {risk}
          </span>
        </div>
        <p className="text-sm text-slate-700">{result?.issue || 'Pending analysis…'}</p>
        <p className="text-sm text-slate-700 line-clamp-2">{result?.suggestedRedline || '—'}</p>
        <div className="text-slate-400">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </button>

      {expanded && (
        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 px-5 py-5 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Clause text</h4>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{clause.clauseText}</p>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Playbook reference</h4>
              <p className="mt-3 text-sm leading-7 text-slate-800">{result?.playbookReference || 'Awaiting analysis.'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Editable redline</h4>
              <textarea
                value={result?.suggestedRedline || ''}
                onChange={(event) => result && onRedlineChange(result.id, event.target.value)}
                className="mt-3 min-h-40 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                placeholder="AI-suggested redline will appear here."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
