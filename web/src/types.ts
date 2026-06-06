/** The slice of the engine's scan output the dashboard consumes. */

export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'unknown';

export interface VisaSignals {
  sponsorshipOffered: boolean;
  sponsorshipDenied: boolean;
  graduateFriendly: boolean;
  signals: string[];
}

export interface SalaryInfo {
  found: boolean;
  currency: 'EUR' | 'GBP' | 'USD' | null;
  min: number | null;
  max: number | null;
  period: 'year' | 'month' | 'day' | 'hour' | null;
}

export interface JobAnnotations {
  visa: VisaSignals;
  salary: SalaryInfo;
  workMode: WorkMode;
  ageDays: number | null;
  freshnessDecay: number;
}

export interface RankedJob {
  rank: number;
  score: number;
  reason: string;
  domain_slug: string;
  domain_label: string;
  matched_role: string;
  company: string;
  title: string;
  location: string;
  url: string;
  final_url: string;
  link_ok: boolean;
  link_status: string;
  apply_ready_score: number;
  source_quality: string;
  company_domain: string;
  company_careers_url: string;
  annotations: JobAnnotations;
}

export interface SourceStat {
  name: string;
  status: 'ok' | 'empty' | 'error';
  count: number;
}

export interface ScanResult {
  ranked: RankedJob[];
  selectedDomains: string[];
  candidateCount: number;
  quarantinedCount: number;
  matchedCount: number;
  debug: string[];
}
