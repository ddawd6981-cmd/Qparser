
export interface SearchResult {
  title: string;
  uri: string;
  snippet?: string;
  domain?: string;
}

export interface DomainStat {
  domain: string;
  count: number;
}

export interface SearchSession {
  id: string;
  query: string;
  timestamp: number;
  results: SearchResult[];
  analysis?: string;
  domainStats: DomainStat[];
}

export interface AppLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'process';
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  PARSING = 'parsing',
  ANALYZING = 'analyzing',
  ERROR = 'error'
}
