/**
 * Numbers behind the team protection model (spec 4.2).
 *
 * These are TEACHING APPROXIMATIONS chosen so the game shows the right relative
 * sizes (an N95 beats a surgical mask; a beard under the seal undoes most of an N95).
 * They are not laboratory measurements and must never be shown to players as such.
 * Change them here only; nothing else in the app hard-codes a leakage value.
 */

/** Fraction of outside air that passes the mask itself when it is worn with a good seal. */
export const FILTER_PENETRATION = {
  n95: 0.03,
  /** Surgical mask as worn: mostly edge leakage, not the filter material. */
  surgical: 0.35,
  cloth: 0.6,
  none: 1,
  /** Elastomeric respirator with a P100 or P2 filter. */
  elastomeric: 0.02,
} as const;

/** Extra leakage added by each thing that can go wrong with the seal or the stock. */
export const LEAKAGE_PENALTY = {
  /** Nose clip pinched to a point instead of moulded with two fingers. */
  nosePinched: 0.1,
  /** Straps crossed, or the bottom strap over the ears. */
  strapsWrong: 0.15,
  notUnderChin: 0.08,
  /** Facial hair under the sealing edge. */
  facialHair: 0.3,
  /** Expired with perished straps, damp, or damaged. */
  badStock: 0.15,
} as const;

/**
 * Extra leakage for each harmful thing the player did during the seal check
 * (pinching the clip, crossing the straps, stuffing tissue), even after the leak is fixed.
 */
export const HARMFUL_SEAL_ACTION_PENALTY = 0.03;

/** Team protection % at or above which the meter reads "good", and "warn". Below `warn` is "bad". */
export const PROTECTION_BAND_MIN = { good: 90, warn: 70 } as const;
