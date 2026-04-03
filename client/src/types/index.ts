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
