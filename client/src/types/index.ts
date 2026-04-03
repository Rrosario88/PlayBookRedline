export type RiskLevel = 'green' | 'yellow' | 'red';

export interface Clause {
  id: string;
  index: number;
  clauseTitle: string;
  clauseText: string;
  originalText: string;
}

export interface AnalysisResult {
  id: string;
  clauseTitle: string;
  clauseText: string;
  riskLevel: RiskLevel;
  issue: string;
  suggestedRedline: string;
  playbookReference: string;
  index: number;
  source: 'claude' | 'fallback';
}

export interface DemoPayload {
  contractName: string;
  playbookName: string;
  contractPreview: string;
  playbookPreview: string;
}

export interface ProgressState {
  completed: number;
  total: number;
  message: string;
}

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

export interface SavedMatterSummary {
  id: number;
  name: string;
  contract_name: string | null;
  playbook_name: string | null;
  retention_days: number;
  delete_after: string;
  retain_source_files: number;
  created_at: string;
}

export interface SavedMatter {
  id: number;
  name: string;
  contractName?: string;
  playbookName?: string;
  retentionDays: number;
  deleteAfter: string;
  retainSourceFiles: boolean;
  createdAt: string;
  clauses: Clause[];
  analyses: AnalysisResult[];
}

export interface LegalDoc {
  title: string;
  content: string;
}
