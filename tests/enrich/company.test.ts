import { describe, it, expect } from 'vitest';
import {
  inferCompanyDomain,
  sourceQuality,
  buildCompanyLinks,
  companySearchUrls,
} from '../../src/enrich/company.js';

describe('inferCompanyDomain', () => {
  it('uses the base domain when the URL is the company site', () => {
    expect(inferCompanyDomain('https://careers.stripe.com/jobs/1', 'Stripe')).toBe('stripe.com');
  });

  it('falls back to a company slug when the URL is an ATS board', () => {
    expect(inferCompanyDomain('https://boards.greenhouse.io/stripe/jobs/1', 'Stripe')).toBe(
      'stripe.com',
    );
  });

  it('uses the company slug when the URL is unparseable', () => {
    expect(inferCompanyDomain('not-a-url', 'Acme Labs')).toBe('acme.com');
  });

  it('returns empty when the URL is an ATS board and there is no company', () => {
    expect(inferCompanyDomain('https://jobs.lever.co/x/1', '')).toBe('');
  });
});

describe('sourceQuality', () => {
  it.each([
    ['gh:stripe', '', 'direct_ats_board'],
    ['lever:netflix', '', 'direct_ats_board'],
    ['ashby:linear', '', 'direct_ats_board'],
    ['remoteok', '', 'remote_board'],
    ['adzuna', '', 'aggregator'],
    ['jooble', '', 'aggregator'],
    ['serpapi', '', 'aggregator'],
    ['sgai:google-careers', '', 'ai_scraped_company_page'],
    ['mystery', 'https://x.greenhouse.io/a', 'direct_ats_board'],
    ['mystery', 'https://acme.com/a', 'unknown'],
  ])('classifies source %s / url %s as %s', (source, url, expected) => {
    expect(sourceQuality(source, url)).toBe(expected);
  });
});

describe('buildCompanyLinks', () => {
  it('builds page URLs from a domain', () => {
    expect(buildCompanyLinks('stripe.com')).toEqual({
      homepage: 'https://stripe.com',
      careers: 'https://stripe.com/careers',
      jobs: 'https://stripe.com/jobs',
      contact: 'https://stripe.com/contact',
    });
  });

  it('returns empty links for an empty domain', () => {
    expect(buildCompanyLinks('')).toEqual({ homepage: '', careers: '', jobs: '', contact: '' });
  });
});

describe('companySearchUrls', () => {
  it('encodes the company and title into search URLs', () => {
    const { linkedin, googleJobs } = companySearchUrls('Acme & Co', 'Backend Engineer');
    expect(linkedin).toContain('keywords=Acme%20%26%20Co');
    expect(googleJobs).toContain('Acme%20%26%20Co%20careers%20Backend%20Engineer');
  });

  it('tolerates missing company/title', () => {
    expect(() => companySearchUrls(null, null)).not.toThrow();
  });
});
