import type { WorkMode } from './types.js';

/** The dashboard's filter state. */
export interface FilterState {
  query: string;
  workMode: WorkMode | 'all';
  sponsorshipOnly: boolean;
  liveOnly: boolean;
}

/** No-op filter state (show everything). */
export const EMPTY_FILTERS: FilterState = {
  query: '',
  workMode: 'all',
  sponsorshipOnly: false,
  liveOnly: false,
};

/** Minimal job shape the filter reads. */
export interface FilterableJob {
  title: string;
  company: string;
  link_ok: boolean;
  annotations: { workMode: WorkMode; visa: { sponsorshipOffered: boolean } };
}

/** Apply a filter state to a job list. Pure. */
export function applyFilters<T extends FilterableJob>(jobs: readonly T[], f: FilterState): T[] {
  const q = f.query.trim().toLowerCase();
  return jobs.filter((job) => {
    if (q && !`${job.title} ${job.company}`.toLowerCase().includes(q)) return false;
    if (f.workMode !== 'all' && job.annotations.workMode !== f.workMode) return false;
    if (f.sponsorshipOnly && !job.annotations.visa.sponsorshipOffered) return false;
    if (f.liveOnly && !job.link_ok) return false;
    return true;
  });
}
