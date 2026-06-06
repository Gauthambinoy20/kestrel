import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from './JobCard.js';
import type { RankedJob } from '../types.js';

const job: RankedJob = {
  rank: 1,
  score: 88,
  reason: 'verified live link',
  domain_slug: 'ai_ml_genai',
  domain_label: 'AI, Machine Learning and GenAI',
  matched_role: 'Machine Learning Engineer',
  company: 'Stripe',
  title: 'Machine Learning Engineer',
  location: 'Dublin',
  url: 'https://boards.greenhouse.io/stripe/1',
  final_url: 'https://stripe.com/jobs/1',
  link_ok: true,
  link_status: 'live',
  apply_ready_score: 90,
  source_quality: 'direct_ats_board',
  company_domain: 'stripe.com',
  company_careers_url: 'https://stripe.com/careers',
  annotations: {
    visa: { sponsorshipOffered: true, sponsorshipDenied: false, graduateFriendly: false, signals: [] },
    salary: { found: true, currency: 'EUR', min: 60000, max: 80000, period: 'year' },
    workMode: 'remote',
    ageDays: 2,
    freshnessDecay: 0.9,
  },
};

describe('JobCard', () => {
  it('renders the title, company and score', () => {
    render(<JobCard job={job} />);
    expect(screen.getByText('Machine Learning Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Stripe/)).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });

  it('shows feature chips (sponsorship, salary, live, remote)', () => {
    render(<JobCard job={job} />);
    expect(screen.getByText('Sponsorship')).toBeInTheDocument();
    expect(screen.getByText('€60k–€80k/year')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('links Apply to the resolved final URL in a new tab', () => {
    render(<JobCard job={job} />);
    const link = screen.getByRole('link', { name: /apply/i });
    expect(link).toHaveAttribute('href', 'https://stripe.com/jobs/1');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
