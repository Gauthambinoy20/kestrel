/** Visa/sponsorship signals detected in a job's text. */
export interface VisaSignals {
  /** The JD explicitly offers visa sponsorship. */
  readonly sponsorshipOffered: boolean;
  /** The JD explicitly rules out sponsorship / requires existing right to work. */
  readonly sponsorshipDenied: boolean;
  /** The JD reads as graduate / Stamp 1G friendly. */
  readonly graduateFriendly: boolean;
  /** The phrases that matched, for transparency in the digest. */
  readonly signals: string[];
}

const OFFERED = [
  /visa sponsorship/i,
  /sponsorship (is )?(available|provided|offered)/i,
  /will sponsor/i,
  /we sponsor/i,
  /sponsor(ship)? for the right candidate/i,
];

const DENIED = [
  /no (visa )?sponsorship/i,
  /not able to sponsor/i,
  /unable to sponsor/i,
  /cannot sponsor/i,
  /do(es)? not (offer|provide) sponsorship/i,
  /sponsorship is not (available|provided|offered)/i,
  /must (already )?have (the )?right to work/i,
  /without (the need for )?sponsorship/i,
];

const GRADUATE = [
  /stamp ?1g/i,
  /graduate (visa|scheme|programme|program)/i,
  /recent graduate/i,
  /no visa (is )?required/i,
];

function matches(text: string, patterns: readonly RegExp[]): string[] {
  const found: string[] = [];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) found.push(m[0].toLowerCase());
  }
  return found;
}

/**
 * Detect visa/sponsorship signals in a job's combined text. Deliberately
 * conservative: only explicit phrasing flips a flag, so a job is never wrongly
 * marked as offering or denying sponsorship. Denial and offer can co-occur
 * (mixed JDs); the caller decides how to weigh them.
 */
export function detectVisaSignals(text: string | null | undefined): VisaSignals {
  const t = String(text || '');
  const offered = matches(t, OFFERED);
  const denied = matches(t, DENIED);
  const graduate = matches(t, GRADUATE);
  return {
    sponsorshipOffered: offered.length > 0,
    sponsorshipDenied: denied.length > 0,
    graduateFriendly: graduate.length > 0,
    signals: [...new Set([...offered, ...denied, ...graduate])],
  };
}
