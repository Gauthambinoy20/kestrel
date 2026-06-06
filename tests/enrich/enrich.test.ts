import { describe, it, expect, vi } from 'vitest';
import { enrichJobs, type EnrichConfig } from '../../src/enrich/enrich.js';
import type { AssembledJob } from '../../src/pipeline/assemble.js';
import type { VerifyClient } from '../../src/enrich/verify.js';

const assembled = (over: Partial<AssembledJob> = {}): AssembledJob => ({
  domain_slug: 'ai_ml_genai',
  domain_label: 'AI, Machine Learning and GenAI',
  matched_role: 'Machine Learning Engineer',
  matched_alias: 'Machine Learning Engineer',
  match_score: 90,
  keyword_hits: 'pytorch',
  alias_count: 1000,
  hash: 'a'.repeat(32),
  country: 'IE',
  telegram_chat_id: '',
  source: 'gh:acme',
  title: 'Machine Learning Engineer',
  title_normalized: 'machine learning engineer',
  company: 'Acme',
  location: 'Dublin',
  remote_type: null,
  url: 'https://boards.greenhouse.io/acme/jobs/1',
  jd_text: 'pytorch',
  raw_payload: {},
  posted_at: '2026-06-01',
  filter_status: 'passed',
  keyword_score: 0.9,
  ...over,
});

const config = (client: VerifyClient, over: Partial<EnrichConfig> = {}): EnrichConfig => ({
  verify: { client, retries: 1, timeoutMs: 1000, retryBaseMs: 10, sleep: () => Promise.resolve(), rand: () => 0 },
  concurrency: 4,
  verifyCompanyLinks: true,
  companyLinkVerifyLimit: 60,
  now: '2026-06-06T00:00:00.000Z',
  ...over,
});

const live: VerifyClient = () => Promise.resolve({ statusCode: 200, body: 'ok' });

describe('enrichJobs', () => {
  it('enriches a job with a live link', async () => {
    const [job] = await enrichJobs([assembled()], config(vi.fn(live)));
    expect(job).toMatchObject({
      link_ok: true,
      link_status: 'live',
      source_quality: 'direct_ats_board',
      company_domain: 'acme.com',
      company_homepage_url: 'https://acme.com',
      crm_status: 'ready_to_review',
      next_action: 'review_apply_page',
      discovered_at: '2026-06-06T00:00:00.000Z',
      contact_policy: 'company_pages_only_no_personal_email_scraping',
    });
    expect(job!.apply_ready_score).toBeGreaterThan(0);
    expect(job!.company_homepage_ok).toBe(true);
  });

  it('marks dead links as needing review', async () => {
    const dead: VerifyClient = () => Promise.resolve({ statusCode: 404, body: 'gone' });
    const [job] = await enrichJobs([assembled()], config(vi.fn(dead)));
    expect(job!.link_ok).toBe(false);
    expect(job!.crm_status).toBe('needs_link_review');
    expect(job!.next_action).toBe('check_or_replace_link');
  });

  it('skips company-link checks when disabled', async () => {
    const [job] = await enrichJobs(
      [assembled()],
      config(vi.fn(live), { verifyCompanyLinks: false }),
    );
    expect(job!.company_homepage_ok).toBeNull();
    expect(job!.company_homepage_status).toBe('skipped_disabled');
  });

  it('skips company-link checks when the limit is zero', async () => {
    const [job] = await enrichJobs([assembled()], config(vi.fn(live), { companyLinkVerifyLimit: 0 }));
    expect(job!.company_homepage_status).toBe('skipped_limit');
  });

  it('sorts by apply-readiness descending', async () => {
    const strong = assembled({ url: 'https://a.com/strong', match_score: 95 });
    const weak = assembled({ url: 'https://b.com/weak', match_score: 30 });
    const out = await enrichJobs([weak, strong], config(vi.fn(live)));
    expect(out[0]!.apply_ready_score).toBeGreaterThanOrEqual(out[1]!.apply_ready_score);
  });

  it('caches company-page checks across jobs (one request per distinct URL)', async () => {
    const client = vi.fn(live);
    await enrichJobs(
      [
        assembled({ url: 'https://boards.greenhouse.io/acme/jobs/1' }),
        assembled({ url: 'https://boards.greenhouse.io/acme/jobs/2' }),
      ],
      config(client),
    );
    const homepageCalls = client.mock.calls.filter(
      ([opts]) => opts.url === 'https://acme.com',
    ).length;
    expect(homepageCalls).toBe(1);
  });

  it('returns an empty array for no jobs', async () => {
    expect(await enrichJobs([], config(vi.fn(live)))).toEqual([]);
  });
});
