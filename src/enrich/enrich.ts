import { runLimited } from '../net/concurrency.js';
import type { AssembledJob } from '../pipeline/assemble.js';
import { safeUrl } from './url.js';
import { verifyJobUrl, type VerifyConfig, type LinkStatus } from './verify.js';
import {
  inferCompanyDomain,
  sourceQuality,
  buildCompanyLinks,
  companySearchUrls,
  type SourceQuality,
} from './company.js';
import { calcApplyReadyScore } from './score.js';

/** Result of checking a public company page (ok is null when skipped). */
interface PublicCheck {
  ok: boolean | null;
  status: string;
  status_code: number;
  final_url: string;
}

/** Configuration for {@link enrichJobs}. */
export interface EnrichConfig {
  /** Link-verification transport + retry settings. */
  readonly verify: VerifyConfig;
  /** Max jobs verified concurrently. */
  readonly concurrency: number;
  /** Whether to verify public company pages (homepage/careers/jobs/contact). */
  readonly verifyCompanyLinks: boolean;
  /** Cap on distinct company URLs verified per run (0 disables). */
  readonly companyLinkVerifyLimit: number;
  /** ISO timestamp recorded as discovered_at (injected for determinism). */
  readonly now: string;
}

/** An assembled job enriched with link status, company metadata and a score. */
export type EnrichedJob = AssembledJob &
  LinkStatus & {
    source_quality: SourceQuality;
    company_domain: string;
    company_homepage_url: string;
    company_careers_url: string;
    company_jobs_url: string;
    company_contact_url: string;
    company_homepage_ok: boolean | null;
    company_homepage_status: string;
    company_careers_ok: boolean | null;
    company_careers_status: string;
    company_jobs_ok: boolean | null;
    company_jobs_status: string;
    company_contact_ok: boolean | null;
    company_contact_status: string;
    company_linkedin_search_url: string;
    company_google_jobs_search_url: string;
    contact_policy: string;
    crm_status: 'ready_to_review' | 'needs_link_review';
    next_action: 'review_apply_page' | 'check_or_replace_link';
    discovered_at: string;
    apply_ready_score: number;
  };

const CONTACT_POLICY = 'company_pages_only_no_personal_email_scraping';

/**
 * Verify and enrich assembled jobs: confirm each apply link is live, infer the
 * company domain and public pages, classify source quality, and compute an
 * apply-readiness score — all bounded by `concurrency`. Public company-page
 * checks share a cache and a per-run cap so we never hammer a homepage, and
 * only public pages are touched (no personal-email scraping). Results are
 * sorted by apply-readiness, then match score, descending.
 */
export async function enrichJobs(
  jobs: readonly AssembledJob[],
  config: EnrichConfig,
): Promise<EnrichedJob[]> {
  const cache = new Map<string, Promise<LinkStatus>>();

  const verifyPublic = async (url: string): Promise<PublicCheck> => {
    const parsed = safeUrl(url);
    if (!parsed) return { ok: false, status: 'invalid_url', status_code: 0, final_url: url };
    if (!config.verifyCompanyLinks) {
      return { ok: null, status: 'skipped_disabled', status_code: 0, final_url: parsed.href };
    }
    const key = parsed.href;
    if (!cache.has(key)) {
      if (config.companyLinkVerifyLimit <= 0 || cache.size >= config.companyLinkVerifyLimit) {
        return { ok: null, status: 'skipped_limit', status_code: 0, final_url: key };
      }
      cache.set(key, verifyJobUrl(key, config.verify));
    }
    const v = await cache.get(key)!;
    return { ok: v.link_ok, status: v.link_status, status_code: v.link_status_code, final_url: v.final_url };
  };

  const tasks = jobs.map((job) => async (): Promise<EnrichedJob> => {
    const verify = await verifyJobUrl(job.url, config.verify);
    const finalUrl = verify.final_url || job.url;
    const companyDomain = inferCompanyDomain(finalUrl, job.company);
    const links = buildCompanyLinks(companyDomain);
    const quality = sourceQuality(job.source, finalUrl);
    const [homepage, careers, jobsPage, contact] = await Promise.all([
      verifyPublic(links.homepage),
      verifyPublic(links.careers),
      verifyPublic(links.jobs),
      verifyPublic(links.contact),
    ]);
    const search = companySearchUrls(job.company, job.title);

    return {
      ...job,
      ...verify,
      source_quality: quality,
      company_domain: companyDomain,
      company_homepage_url: links.homepage,
      company_careers_url: links.careers,
      company_jobs_url: links.jobs,
      company_contact_url: links.contact,
      company_homepage_ok: homepage.ok,
      company_homepage_status: homepage.status,
      company_careers_ok: careers.ok,
      company_careers_status: careers.status,
      company_jobs_ok: jobsPage.ok,
      company_jobs_status: jobsPage.status,
      company_contact_ok: contact.ok,
      company_contact_status: contact.status,
      company_linkedin_search_url: search.linkedin,
      company_google_jobs_search_url: search.googleJobs,
      contact_policy: CONTACT_POLICY,
      crm_status: verify.link_ok ? 'ready_to_review' : 'needs_link_review',
      next_action: verify.link_ok ? 'review_apply_page' : 'check_or_replace_link',
      discovered_at: config.now,
      apply_ready_score: calcApplyReadyScore({
        match_score: job.match_score,
        link_ok: verify.link_ok,
        source_quality: quality,
        company_domain: companyDomain,
        final_url: finalUrl,
        url: job.url,
      }),
    };
  });

  const enriched = await runLimited(tasks, config.concurrency);
  enriched.sort(
    (a, b) => b.apply_ready_score - a.apply_ready_score || b.match_score - a.match_score,
  );
  return enriched;
}
