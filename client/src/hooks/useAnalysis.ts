import { useCallback, useMemo, useState } from 'react';
import { apiFetchRaw } from '../lib/api';
import type { AnalysisResult, Clause, DemoPayload, ProgressState, SavedMatter } from '../types';

const parseSse = (chunk: string) => {
  const blocks = chunk.split('\n\n').filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const event = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace('data:', '').trim())
        .join('\n');
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

  const hydrateMatter = useCallback((matter: SavedMatter) => {
    setClauses(matter.clauses);
    setResults(matter.analyses);
    setContractName(matter.contractName || matter.name);
    setPlaybookName(matter.playbookName || 'Saved playbook');
    setProgress(null);
    setError(null);
  }, []);

  const loadDemo = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/demo', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to load sample demo.');
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

      const response = await apiFetchRaw('/api/analyze', { method: 'POST', body: form });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({ message: 'Analysis request failed.' }));
        throw new Error(payload.message || 'Analysis request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const handleEvents = (rawChunk: string) => {
        for (const event of parseSse(rawChunk)) {
          const payload = JSON.parse(event.data);
          if (event.event === 'metadata') {
            setClauses(payload.clauses);
            setContractName(payload.contractName);
            setPlaybookName(payload.playbookName);
            setProgress({ completed: 0, total: payload.totalClauses, message: `Analyzing clause 1 of ${payload.totalClauses}…` });
          }
          if (event.event === 'progress') setProgress(payload);
          if (event.event === 'clause') {
            setResults((current) => {
              const next = current.filter((item) => item.id !== payload.id);
              next.push(payload);
              return next;
            });
          }
          if (event.event === 'complete') {
            setClauses(payload.clauses);
            setContractName(payload.contractName);
            setPlaybookName(payload.playbookName);
            if (Array.isArray(payload.results)) {
              setResults(payload.results);
              setProgress({
                completed: payload.results.length,
                total: payload.results.length,
                message: `Analysis complete — ${payload.results.length} clauses reviewed.`,
              });
            }
          }
          if (event.event === 'error') throw new Error(payload.message);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          handleEvents(`${part}\n\n`);
        }

        if (done) {
          if (buffer.trim()) {
            handleEvents(`${buffer}${buffer.endsWith('\n\n') ? '' : '\n\n'}`);
          }
          break;
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

    const response = await apiFetchRaw('/api/export', {
      method: 'POST',
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

  const resetWorkspace = useCallback(() => {
    setContractFile(null);
    setPlaybookFile(null);
    setContractName('');
    setPlaybookName('');
    setClauses([]);
    setResults([]);
    setProgress(null);
    setError(null);
    setUseDemo(false);
    setDemo(null);
  }, []);

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
    resetWorkspace,
    hydrateMatter,
  };
};
