import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalysisResult } from '../types';

const riskWeight = { green: 0, yellow: 50, red: 100 };

export const RiskDashboard = ({ results }: { results: AnalysisResult[] }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totals = {
    green: results.filter((item) => item.riskLevel === 'green').length,
    yellow: results.filter((item) => item.riskLevel === 'yellow').length,
    red: results.filter((item) => item.riskLevel === 'red').length,
  };

  const overallRiskScore = results.length
    ? Math.round(results.reduce((sum, item) => sum + riskWeight[item.riskLevel], 0) / results.length)
    : 0;

  const chartData = [
    { name: 'Green', value: totals.green, fill: '#15803d' },
    { name: 'Yellow', value: totals.yellow, fill: '#d97706' },
    { name: 'Red', value: totals.red, fill: '#b91c1c' },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total clauses', value: results.length },
          { label: 'Green', value: totals.green },
          { label: 'Yellow', value: totals.yellow },
          { label: 'Red', value: totals.red },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Overall risk score</p>
            <p className="text-3xl font-semibold text-slate-950">{overallRiskScore}/100</p>
          </div>
        </div>
        <div className="h-52 min-w-0">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis allowDecimals={false} stroke="#475569" />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </section>
  );
};
