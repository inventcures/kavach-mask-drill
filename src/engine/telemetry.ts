import { cleanContext, type RunContext } from './context';
import type { Scenario, Track } from './scenario';
import { teamProtection } from './scoring';
import { quizResult, teamMembers, type QuizResult, type SessionState } from './session';

/**
 * What is stored on the phone and exported for one finished run (spec 6.4).
 * No names, no device ids, no location. The only typed text is the trainer code,
 * and that is cut down to capitals, digits and hyphens.
 */
export interface SessionResult {
  v: 1;
  game: 'mask-drill';
  scenario: string;
  track: Track;
  /** ISO 8601, UTC. */
  finishedAt: string;
  durationSec: number;
  lang: string;
  teamLeakage: number;
  teamPF: number;
  contaminationEvents: number;
  leakageByMember: Record<string, number>;
  pre: { confidence: number; score: number; max: number } | null;
  post: QuizResult | null;
  /** Mistake codes only, never the notes. */
  mistakes: string[];
  context?: RunContext;
}

const round = (n: number, places: number) => Number(n.toFixed(places));

/** The record for a finished run. `lang` is the language on screen when the drill ended. */
export function buildResult(scenario: Scenario, state: SessionState, lang: string): SessionResult {
  const members = teamMembers(scenario, state);
  const team = teamProtection(members);
  const end = state.finishedAt ?? state.startedAt;
  const context = cleanContext(state.context);
  const result: SessionResult = {
    v: 1,
    game: 'mask-drill',
    scenario: scenario.id,
    track: scenario.track,
    finishedAt: new Date(end).toISOString(),
    durationSec: Math.max(0, Math.round((end - state.startedAt) / 1000)),
    lang,
    // Nobody masked up at all means no protection.
    teamLeakage: round(team?.leakage ?? 1, 3),
    teamPF: round(team?.pf ?? 1, 1),
    contaminationEvents: state.contaminationEvents,
    leakageByMember: Object.fromEntries(members.flatMap((m) => (m.leakage === null ? [] : [[m.id, round(m.leakage, 3)]]))),
    pre: quizResult(scenario, state, 'pre'),
    post: quizResult(scenario, state, 'post'),
    mistakes: state.mistakes.map((m) => m.code),
  };
  if (Object.keys(context).length > 0) result.context = context;
  return result;
}

/** The part of `localStorage` this module needs. Any call may throw (private browsing, storage full). */
export interface RunStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const RUNS_KEY = 'md_runs';
export const MAX_RUNS = 50;

/** Runs saved on this phone, oldest first. Empty when there are none or storage cannot be read. */
export function loadRuns(store: RunStore | null): SessionResult[] {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(RUNS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as SessionResult[]) : [];
  } catch {
    return [];
  }
}

/** Adds a run, keeping the last 50. Returns false when it could not be saved; the game carries on either way. */
export function saveRun(store: RunStore | null, result: SessionResult): boolean {
  if (!store) return false;
  try {
    store.setItem(RUNS_KEY, JSON.stringify([...loadRuns(store), result].slice(-MAX_RUNS)));
    return true;
  } catch {
    return false;
  }
}

/** Removes every saved run from this phone. */
export function deleteRuns(store: RunStore | null): boolean {
  if (!store) return false;
  try {
    store.removeItem(RUNS_KEY);
    return true;
  } catch {
    return false;
  }
}

/** The file a player downloads: every run saved on this phone, or just `current` when saving was not possible. */
export function exportJson(store: RunStore | null, current: SessionResult): string {
  const runs = loadRuns(store);
  return JSON.stringify(runs.length > 0 ? runs : [current], null, 2);
}
