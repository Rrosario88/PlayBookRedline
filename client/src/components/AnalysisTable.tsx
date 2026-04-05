import { useMemo, useState } from 'react';
import type { AnalysisResult, Clause, RiskLevel } from '../types';
import { ClauseRow } from './ClauseRow';

interface AnalysisTableProps {
  clauses: Clause[];
  results: AnalysisResult[];
  onRedlineChange: (id: string, value: string) => void;
}

export const AnalysisTable = ({ clauses, results, onRedlineChange }: AnalysisTableProps) => {
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [sortKey, setSortKey] = useState<'index' | 'title' | 'risk'>('index');
  const resultMap = useMemo(() => new Map(results.map((result) => [result.id, result])), [results]);
  const riskOrder = { green: 0, yellow: 1, red: 2 };

  const visibleClauses = useMemo(() => {
    const filtered = clauses.filter((clause) => {
      if (riskFilter === 'all') return true;
      return resultMap.get(clause.id)?.riskLevel === riskFilter;
    });

    return filtered.sort((a, b) => {
      if (sortKey === 'title') return a.clauseTitle.localeCompare(b.clauseTitle);
      if (sortKey === 'risk') {
        const aRisk = resultMap.get(a.id)?.riskLevel ?? 'green';
        const bRisk = resultMap.get(b.id)?.riskLevel ?? 'green';
        return riskOrder[bRisk] - riskOrder[aRisk];
      }
      return a.index - b.index;
    });
  }, [clauses, riskFilter, resultMap, sortKey]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Review</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Clause-by-clause review</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Filter risk, reorder the reading list, and open each clause only when you want its details.</p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2 text-sm">
            {(['all', 'green', 'yellow', 'red'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRiskFilter(filter)}
                className={`rounded-full px-4 py-2 font-medium transition ${riskFilter === filter ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
              >
                {filter === 'all' ? 'All risks' : `${filter[0].toUpperCase()}${filter.slice(1)}`}
              </button>
            ))}
          </div>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as 'index' | 'title' | 'risk')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
          >
            <option value="index">Sort: contract order</option>
            <option value="title">Sort: clause title</option>
            <option value="risk">Sort: highest risk first</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {visibleClauses.map((clause) => (
          <ClauseRow
            key={clause.id}
            clause={clause}
            result={resultMap.get(clause.id)}
            onRedlineChange={onRedlineChange}
          />
        ))}
      </div>
    </section>
  );
};
