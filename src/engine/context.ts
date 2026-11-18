/**
 * The only things a player can tell us about themselves: a role picked from a fixed
 * list, and a session code typed by the trainer. Neither identifies a person.
 */
export const ROLES = ['ert', 'nurse', 'doctor', 'volunteer', 'asha', 'store', 'other'] as const;
export type Role = (typeof ROLES)[number];

export const TRAINER_CODE_MAX = 16;

export interface RunContext {
  role?: Role;
  /** Always matches `[A-Z0-9-]{1,16}`. */
  trainerCode?: string;
}

export function isRole(v: unknown): v is Role {
  return (ROLES as readonly unknown[]).includes(v);
}

/** Whatever was typed, cut down to capitals, digits and hyphens, e.g. `KZD-ERT-1125`. Names and sentences do not survive. */
export function cleanTrainerCode(typed: string): string {
  return typed.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, TRAINER_CODE_MAX);
}

/** A context with nothing in it but a known role and a clean code. */
export function cleanContext(context: { role?: unknown; trainerCode?: unknown }): RunContext {
  const out: RunContext = {};
  if (isRole(context.role)) out.role = context.role;
  const code = typeof context.trainerCode === 'string' ? cleanTrainerCode(context.trainerCode) : '';
  if (code) out.trainerCode = code;
  return out;
}
