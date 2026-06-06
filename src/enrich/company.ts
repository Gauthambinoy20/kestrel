import { safeUrl, baseDomain, cleanCompanySlug, looseNormalize } from './url.js';

/** Hosts that belong to ATS/aggregator platforms, not the hiring company. */
const ATS_HOSTS = [
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'workdayjobs.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'bamboohr.com',
  'jobvite.com',
  'icims.com',
  'remoteok.com',
  'adzuna.com',
  'jooble.org',
  'serpapi.com',
];

/**
 * Guess the hiring company's own domain. If the apply URL points at the
 * company's own site, use that base domain; if it points at an ATS/aggregator,
 * fall back to a `<slug>.com` guess from the company name.
 */
export function inferCompanyDomain(
  jobUrl: string | null | undefined,
  company: string | null | undefined,
): string {
  const parsed = safeUrl(jobUrl);
  const host = parsed ? baseDomain(parsed.hostname) : '';
  if (host.length > 0 && !ATS_HOSTS.some((ats) => host.endsWith(ats))) return host;
  const slug = cleanCompanySlug(company);
  return slug.length > 0 ? `${slug}.com` : '';
}

/** Source-quality tiers, best to worst, used in scoring and display. */
export type SourceQuality =
  | 'direct_ats_board'
  | 'ai_scraped_company_page'
  | 'remote_board'
  | 'aggregator'
  | 'unknown';

/** Classify a job's provenance from its source label and final URL host. */
export function sourceQuality(
  source: string | null | undefined,
  url: string | null | undefined,
): SourceQuality {
  const s = looseNormalize(source);
  const host = safeUrl(url)?.hostname ?? '';
  if (s.startsWith('gh') || s.startsWith('lever') || s.startsWith('ashby')) return 'direct_ats_board';
  if (s.includes('remoteok')) return 'remote_board';
  if (s.includes('adzuna') || s.includes('jooble') || s.includes('serpapi')) return 'aggregator';
  if (s.includes('sgai')) return 'ai_scraped_company_page';
  if (/greenhouse|lever|ashby|workday|smartrecruiters/.test(host)) return 'direct_ats_board';
  return 'unknown';
}

/** Public company pages derived from a domain. */
export interface CompanyLinks {
  homepage: string;
  careers: string;
  jobs: string;
  contact: string;
}

/** Build public company page URLs from a domain (empty domain → empty links). */
export function buildCompanyLinks(domain: string): CompanyLinks {
  const homepage = domain.length > 0 ? `https://${domain}` : '';
  return {
    homepage,
    careers: homepage ? `${homepage}/careers` : '',
    jobs: homepage ? `${homepage}/jobs` : '',
    contact: homepage ? `${homepage}/contact` : '',
  };
}

/** Public search URLs for a company (no scraping, just links a human can click). */
export function companySearchUrls(
  company: string | null | undefined,
  title: string | null | undefined,
): { linkedin: string; googleJobs: string } {
  const co = company ?? '';
  return {
    linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(co)}`,
    googleJobs: `https://www.google.com/search?q=${encodeURIComponent(`${co} careers ${title ?? ''}`)}`,
  };
}
