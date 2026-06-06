import { describe, it, expect } from 'vitest';
import { buildDigest, escapeHtml, type DigestJob } from '../../src/delivery/digest.js';

describe('escapeHtml', () => {
  it('escapes &, < and >', () => {
    expect(escapeHtml('a & b <c> d')).toBe('a &amp; b &lt;c&gt; d');
  });
  it('handles non-strings', () => {
    expect(escapeHtml(null)).toBe('');
  });
});

const job = (over: Partial<DigestJob> = {}): DigestJob => ({
  rank: 1,
  score: 88,
  company: 'Stripe',
  title: 'Backend Engineer',
  location: 'Dublin',
  reason: 'verified live link',
  link_status: 'live',
  apply_ready_score: 90,
  source_quality: 'direct_ats_board',
  url: 'https://boards.greenhouse.io/stripe/1',
  final_url: 'https://stripe.com/jobs/1',
  company_domain: 'stripe.com',
  crm_status: 'ready_to_review',
  company_careers_url: 'https://stripe.com/careers',
  ...over,
});

describe('buildDigest', () => {
  it('renders a header and a job entry', () => {
    const { text } = buildDigest({
      top: [job()],
      domain: 'AI/ML',
      country: 'IE',
      date: '2026-06-06',
    });
    expect(text).toContain('TOP 1 - AI/ML - IE - 2026-06-06');
    expect(text).toContain('1. [88] Stripe - Backend Engineer');
    expect(text).toContain('Dublin | verified live link');
    expect(text).toContain('live | ready 90/100 | direct_ats_board');
    expect(text).toContain('stripe.com | ready_to_review');
  });

  it('prefers the resolved final URL for the apply link', () => {
    const { text } = buildDigest({ top: [job()], domain: 'x', country: 'IE', date: 'd' });
    expect(text).toContain('Apply: https://stripe.com/jobs/1');
  });

  it('omits company-domain and careers lines when absent', () => {
    const { text } = buildDigest({
      top: [job({ company_domain: undefined, company_careers_url: undefined })],
      domain: 'x',
      country: 'IE',
      date: 'd',
    });
    expect(text).not.toContain('Careers:');
    expect(text).not.toContain('ready_to_review');
  });

  it('truncates the Telegram form when it exceeds the limit', () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      job({ rank: i + 1, title: 'Engineer '.repeat(10) }),
    );
    const { text, telegramText } = buildDigest({
      top: many,
      domain: 'x',
      country: 'IE',
      date: 'd',
    });
    expect(text.length).toBeGreaterThan(3900);
    expect(telegramText.length).toBeLessThan(text.length);
    expect(telegramText).toContain('truncated');
  });

  it('falls back gracefully for sparse jobs', () => {
    const { text } = buildDigest({
      top: [{ rank: 1, score: 0, url: 'https://a/1' }],
      domain: 'x',
      country: 'IE',
      date: 'd',
    });
    expect(text).toContain('1. [0] Unknown -');
    expect(text).toContain('- | ranked match');
    expect(text).toContain('unchecked | ready 0/100 | unknown source');
  });
});
