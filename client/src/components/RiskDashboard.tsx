import type { AnalysisResult } from '../types';

const riskWeight = { green: 0, yellow: 50, red: 100 };

export const RiskDashboard = ({ results }: { results: AnalysisResult[] }) => {
  const totals = {
    green: results.filter((item) => item.riskLevel === 'green').length,
    yellow: results.filter((item) => item.riskLevel === 'yellow').length,
    red: results.filter((item) => item.riskLevel === 'red').length,
  };

  const overallRiskScore = results.length
    ? Math.round(results.reduce((sum, item) => sum + riskWeight[item.riskLevel], 0) / results.length)
    : 0;

  const scoreLabel = overallRiskScore >= 70 ? 'Elevated' : overallRiskScore >= 40 ? 'Moderate' : 'Low';
  const distribution = results.length
    ? [
        { label: 'Green', value: totals.green, tone: 'bg-emerald-500' },
        { label: 'Yellow', value: totals.yellow, tone: 'bg-amber-400' },
        { label: 'Red', value: totals.red, tone: 'bg-rose-500' },
      ]
    : [];

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Risk profile</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[28px] bg-[#f7f4ee] px-6 py-6">
            <p className="text-sm text-slate-500">Overall score</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight text-slate-950">{overallRiskScore}</span>
              <span className="pb-1 text-sm text-slate-500">/100</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{scoreLabel} risk posture</p>
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Clauses reviewed', value: results.length },
                { label: 'Red clauses', value: totals.red },
                { label: 'Yellow clauses', value: totals.yellow },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Distribution</p>
                <p className="text-sm text-slate-500">{results.length ? `${results.length} total clauses` : 'Run an analysis to populate this view.'}</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                {distribution.length ? (
                  <div className="flex h-full w-full overflow-hidden rounded-full">
                    {distribution.map((segment) => (
                      <div
                        key={segment.label}
                        className={segment.tone}
                        style={{ width: `${(segment.value / results.length) * 100}%` }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {distribution.map((segment) => (
                  <div key={segment.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${segment.tone}`} />
                      <p className="text-sm font-medium text-slate-700">{segment.label}</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{segment.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Interpretation</p>
        <div className="mt-5 space-y-4">
          {[
            { title: 'Red clauses', body: 'These need the most attention before sharing with counterparties.', value: totals.red },
            { title: 'Yellow clauses', body: 'These may be acceptable with fallback language or narrower edits.', value: totals.yellow },
            { title: 'Green clauses', body: 'These align more closely with preferred playbook positions.', value: totals.green },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] bg-[#faf8f5] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
