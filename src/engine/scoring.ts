import { FILTER_PENETRATION, HARMFUL_SEAL_ACTION_PENALTY, LEAKAGE_PENALTY, PROTECTION_BAND_MIN } from './constants';

export type MaskKind = keyof typeof FILTER_PENETRATION;
export type LeakageFault = keyof typeof LEAKAGE_PENALTY;

/** A team member as the scoring model sees them. `null` leakage means "not masked up yet". */
export interface ScoredMember {
  id: string;
  leakage: number | null;
}

export interface TeamProtection {
  /** Team leakage: arithmetic mean of the members' leakage, 0 to 1. */
  leakage: number;
  /** Team protection factor: 1 / team leakage (the harmonic mean of the members' PFs). */
  pf: number;
  /** Team protection %: (1 - team leakage) x 100. */
  percent: number;
}

export function teamProtection(members: readonly ScoredMember[]): TeamProtection | null {
  const known = members.flatMap((m) => (m.leakage === null ? [] : [m.leakage]));
  if (known.length === 0) return null;
  const leakage = known.reduce((sum, l) => sum + l, 0) / known.length;
  return { leakage, pf: 1 / leakage, percent: (1 - leakage) * 100 };
}

/** What the leakage model needs to know about one masked-up member. */
export interface Fit {
  mask: MaskKind;
  faults?: readonly LeakageFault[];
  /** How many harmful things were done during the seal check. */
  harmfulSealActions?: number;
}

/** One member's leakage: filter penetration, plus a penalty per fault and per harmful seal action, capped at 1. */
export function memberLeakage(fit: Fit): number {
  const penalties = (fit.faults ?? []).reduce((sum, f) => sum + LEAKAGE_PENALTY[f], 0);
  const sealHarm = (fit.harmfulSealActions ?? 0) * HARMFUL_SEAL_ACTION_PENALTY;
  return Math.min(1, FILTER_PENETRATION[fit.mask] + penalties + sealHarm);
}

export type ProtectionBand = 'good' | 'warn' | 'bad';

/** Which band a protection % falls in. Used for the team meter and for each member. */
export function protectionBand(percent: number): ProtectionBand {
  if (percent >= PROTECTION_BAND_MIN.good) return 'good';
  if (percent >= PROTECTION_BAND_MIN.warn) return 'warn';
  return 'bad';
}
