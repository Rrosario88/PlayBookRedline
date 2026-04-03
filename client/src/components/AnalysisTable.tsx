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
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Clause-by-clause review</h2>
          <p className="mt-1 text-sm text-slate-600">Expand any row to see full clause text, playbook references, and edit the proposed redline.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {(['all', 'green', 'yellow', 'red'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setRiskFilter(filter)}
              className={`rounded-full px-4 py-2 font-medium ${riskFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {filter === 'all' ? 'All risks' : `${filter[0].toUpperCase()}${filter.slice(1)}`}
            </button>
          ))}
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as 'index' | 'title' | 'risk')}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700"
          >
            <option value="index">Sort: contract order</option>
            <option value="title">Sort: clause title</option>
            <option value="risk">Sort: highest risk first</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
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
