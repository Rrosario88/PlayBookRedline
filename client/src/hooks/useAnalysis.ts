import { useCallback, useMemo, useState } from 'react';
import type { AnalysisResult, Clause, DemoPayload, ProgressState } from '../types';

const parseSse = (chunk: string) => {
  const blocks = chunk.split('\n\n').filter(Boolean);
  return blocks
    .map((block) => {
      const event = block.split('\n').find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
      const data = block.split('\n').find((line) => line.startsWith('data:'))?.replace('data:', '').trim();
      return event && data ? { event, data } : null;
    })
    .filter(Boolean) as { event: string; data: string }[];
};

export const useAnalysis = () => {
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [playbookFile, setPlaybookFile] = useState<File | null>(null);
  const [contractName, setContractName] = useState('');
  const [playbookName, setPlaybookName] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoPayload | null>(null);
  const [useDemo, setUseDemo] = useState(false);

  const orderedResults = useMemo(() => [...results].sort((a, b) => a.index - b.index), [results]);

  const updateRedline = useCallback((id: string, value: string) => {
    setResults((current) => current.map((result) => (result.id === id ? { ...result, suggestedRedline: value } : result)));
  }, []);

  const loadDemo = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/demo');
    if (!response.ok) {
      throw new Error('Failed to load sample demo.');
    }
    const payload = (await response.json()) as DemoPayload;
    setDemo(payload);
    setUseDemo(true);
    setContractName(payload.contractName);
    setPlaybookName(payload.playbookName);
  }, []);

  const resetDemo = useCallback(() => {
    setUseDemo(false);
    setDemo(null);
  }, []);

  const analyze = useCallback(async () => {
    setError(null);
    setResults([]);
    setClauses([]);
    setProgress(null);

    if (!useDemo && (!contractFile || !playbookFile)) {
      setError('Upload both a contract and a playbook, or choose Sample Demo.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const form = new FormData();
      if (useDemo) {
        form.append('demo', 'true');
      } else {
        form.append('contract', contractFile as File);
        form.append('playbook', playbookFile as File);
      }

      const response = await fetch('/api/analyze', { method: 'POST', body: form });
      if (!response.ok || !response.body) {
        throw new Error('Analysis request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          for (const event of parseSse(`${part}\n\n`)) {
            const payload = JSON.parse(event.data);
            if (event.event === 'metadata') {
              setClauses(payload.clauses);
              setContractName(payload.contractName);
              setPlaybookName(payload.playbookName);
              setProgress({ completed: 0, total: payload.totalClauses, message: `Analyzing clause 1 of ${payload.totalClauses}…` });
            }
            if (event.event === 'progress') {
              setProgress(payload);
            }
            if (event.event === 'clause') {
              setResults((current) => {
                const next = current.filter((item) => item.id !== payload.id);
                next.push(payload);
                return next;
              });
            }
            if (event.event === 'error') {
              throw new Error(payload.message);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected analysis error.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [contractFile, playbookFile, useDemo]);

  const exportDocx = useCallback(async () => {
    if (!clauses.length || !orderedResults.length) {
      setError('Run an analysis before exporting.');
      return;
    }

    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractName, clauses, analyses: orderedResults }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Export failed.' }));
      throw new Error(payload.message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${contractName.replace(/\.(pdf|docx)$/i, '') || 'playbook-redline'}-redlined.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [clauses, orderedResults, contractName]);

  return {
    contractFile,
    playbookFile,
    contractName,
    playbookName,
    clauses,
    results: orderedResults,
    progress,
    isAnalyzing,
    error,
    demo,
    useDemo,
    setContractFile,
    setPlaybookFile,
    setContractName,
    setPlaybookName,
    updateRedline,
    analyze,
    exportDocx,
    loadDemo,
    resetDemo,
  };
};
