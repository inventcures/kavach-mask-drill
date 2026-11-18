import { describe, expect, it } from 'vitest';
import nipah from '../content/scenarios/nipah-kerala-01.json';
import { ROLES } from './context';
import type { Scenario } from './scenario';
import { startSession, step, type Action, type SessionState } from './session';
import { buildResult, deleteRuns, exportJson, loadRuns, MAX_RUNS, saveRun, type RunStore, type SessionResult } from './telemetry';

const scenario = nipah as unknown as Scenario;
const START = Date.UTC(2026, 10, 18, 8, 10, 0);

const next: Action = { type: 'next' };
const rate = (scale: 'confidence' | 'comfort' | 'willingToWear', value: number): Action => ({ type: 'rate', scale, value });
const answer = (itemId: string, optionId: string): Action => ({ type: 'answerQuiz', itemId, optionId });
const tap = (cardId: string): Action => ({ type: 'tapCard', cardId });

/** A whole drill with no mistakes: two quiz answers wrong before, all four right after. */
const perfectRun: Action[] = [
  { type: 'setContext', role: 'nurse', trainerCode: 'KZD-ERT-1125' },
  rate('confidence', 2), answer('seal_vs_fit', 'true'), answer('doff_hold', 'straps'), answer('weakest_seal', 'good'), answer('valve', 'false'), next,
  next,
  ...(['triage', 'surgical', 'transfer', 'n95eye', 'agp', 'n95eye'].reduce<Action[]>((a, _, i, all) => (i % 2 ? a : [...a, { type: 'pickOption', taskId: all[i]!, optionId: all[i + 1]! }]), [])), next,
  ...(['A', 'E'].map((itemId): Action => ({ type: 'decideStock', itemId, use: true }))),
  ...(['B', 'C', 'D', 'F'].map((itemId): Action => ({ type: 'decideStock', itemId, use: false }))), next,
  ...['s0', 's1', 's2', 's3', 's4', 's5'].map(tap), next,
  ...['mould', 'straps', 'chin'].map((actionId): Action => ({ type: 'sealAction', actionId })), next,
  { type: 'buddyPick', memberId: 'ravi', optionId: 'reassign' }, { type: 'buddyPick', memberId: 'anjali', optionId: 'adjust' }, { type: 'buddyPick', memberId: 'faiz', optionId: 'praise' }, next,
  ...['s0', 's1', 's2', 's3', 's4', 's5', 's6'].map(tap), next,
  ...(['n95', 'yellow', 'gown', 'yellow', 'gloves', 'red', 'goggles', 'disinfect'].reduce<Action[]>((a, _, i, all) => (i % 2 ? a : [...a, { type: 'binItem', itemId: all[i]!, binId: all[i + 1]! }]), [])),
  { type: 'answerLog', value: 36 }, next,
  rate('confidence', 4), answer('seal_vs_fit', 'false'), answer('doff_hold', 'straps'), answer('weakest_seal', 'bad'), answer('valve', 'false'), rate('comfort', 3), rate('willingToWear', 5),
];

function finished(actions: Action[] = perfectRun, tookMs = 600_000): SessionState {
  const state = actions.reduce((s, a) => step(scenario, s, a), startSession(scenario, Math.random, () => START));
  return step(scenario, state, next, Math.random, () => START + tookMs);
}

function memoryStore(initial: Record<string, string> = {}): RunStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}
const brokenStore: RunStore = {
  getItem: () => { throw new Error('private browsing'); },
  setItem: () => { throw new Error('private browsing'); },
  removeItem: () => { throw new Error('private browsing'); },
};
const run = (n: number): SessionResult => ({ ...buildResult(scenario, finished(), 'en'), durationSec: n });

describe('telemetry: the result record', () => {
  it('a perfect run gives the record in spec 6.4', () => {
    expect(buildResult(scenario, finished(), 'hi')).toEqual({
      v: 1,
      game: 'mask-drill',
      scenario: 'nipah-kerala-01',
      track: 'ert',
      finishedAt: '2026-11-18T08:20:00.000Z',
      durationSec: 600,
      lang: 'hi',
      teamLeakage: 0.04,
      teamPF: 25,
      contaminationEvents: 0,
      leakageByMember: { you: 0.03, ravi: 0.05, anjali: 0.04, faiz: 0.04 },
      pre: { confidence: 2, score: 2, max: 4 },
      post: { confidence: 4, score: 4, max: 4, comfort: 3, willingToWear: 5 },
      mistakes: [],
      context: { role: 'nurse', trainerCode: 'KZD-ERT-1125' },
    });
  });

  it('lists mistakes as codes only, and counts contamination', () => {
    let firstSteps = 0;
    const withMistakes = perfectRun.flatMap((a): Action[] => {
      if (a.type === 'buddyPick' && a.memberId === 'ravi') return [{ ...a, optionId: 'tighten' }];
      // The second "s0" is the first doffing step: tap a trap card straight after it.
      if (a.type === 'tapCard' && a.cardId === 's0' && ++firstSteps === 2) return [a, tap('t0')];
      return [a];
    });
    const r = buildResult(scenario, finished(withMistakes), 'en');
    expect(r.mistakes).toEqual(['buddy_ravi', 'doff_order_trap']);
    expect(r.contaminationEvents).toBe(1);
    expect(r.leakageByMember.ravi).toBe(0.25);
  });

  it('leaves out context when the player gave none', () => {
    const r = buildResult(scenario, finished(perfectRun.slice(1)), 'en');
    expect('context' in r).toBe(false);
  });

  it('holds no free text: a typed trainer code is cut down to capitals, digits and hyphens, 16 at most', () => {
    const typed: Action = { type: 'setContext', trainerCode: 'kzd ert <b>Ravi Kumar 98470-12345</b>' };
    const state = finished([typed, ...perfectRun.slice(1)]);
    // Even a state that did not come through the session cannot smuggle text out.
    const forged = { ...state, context: { role: 'my name is Ravi' as never, trainerCode: 'call me on 98470 12345, Ravi' } };
    for (const r of [buildResult(scenario, state, 'en'), buildResult(scenario, forged, 'en')]) {
      expect(r.context?.trainerCode).toMatch(/^[A-Z0-9-]{1,16}$/);
      const strings: string[] = [];
      JSON.stringify(r, (key, value) => {
        if (typeof value === 'string' && key !== 'trainerCode') strings.push(value);
        return value;
      });
      const allowed = (s: string) =>
        ['mask-drill', 'nipah-kerala-01', 'ert', 'en', ...ROLES].includes(s) || /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(s) || /^[a-z0-9_]+$/i.test(s);
      expect(strings.filter((s) => !allowed(s))).toEqual([]);
      expect(JSON.stringify(r)).not.toMatch(/ravi kumar|my name|call me/i);
    }
    expect(buildResult(scenario, state, 'en').context).toEqual({ trainerCode: 'KZDERTBRAVIKUMAR' });
    expect(buildResult(scenario, forged, 'en').context).toEqual({ trainerCode: 'CALLMEON9847012' + '3' });
  });
});

describe('telemetry: results kept on the phone', () => {
  it('saves a run and reads it back', () => {
    const store = memoryStore();
    expect(saveRun(store, run(1))).toBe(true);
    expect(loadRuns(store).map((r) => r.durationSec)).toEqual([1]);
  });

  it('keeps only the last 50 runs', () => {
    const store = memoryStore();
    for (let n = 1; n <= 53; n++) saveRun(store, run(n));
    const kept = loadRuns(store).map((r) => r.durationSec);
    expect(MAX_RUNS).toBe(50);
    expect(kept).toHaveLength(50);
    expect([kept[0], kept[49]]).toEqual([4, 53]);
  });

  it('carries on when storage is blocked, missing or holds rubbish', () => {
    expect(saveRun(brokenStore, run(1))).toBe(false);
    expect(loadRuns(brokenStore)).toEqual([]);
    expect(deleteRuns(brokenStore)).toBe(false);
    expect(saveRun(null, run(1))).toBe(false);
    expect(loadRuns(null)).toEqual([]);
    const rubbish = memoryStore({ md_runs: '{not json' });
    expect(loadRuns(rubbish)).toEqual([]);
    expect(saveRun(rubbish, run(7))).toBe(true);
    expect(loadRuns(rubbish).map((r) => r.durationSec)).toEqual([7]);
  });

  it('exports every saved run as JSON, or just this run when nothing could be saved', () => {
    const store = memoryStore();
    saveRun(store, run(1));
    saveRun(store, run(2));
    expect((JSON.parse(exportJson(store, run(2))) as SessionResult[]).map((r) => r.durationSec)).toEqual([1, 2]);
    expect((JSON.parse(exportJson(brokenStore, run(9))) as SessionResult[]).map((r) => r.durationSec)).toEqual([9]);
  });

  it('deleting removes every saved run', () => {
    const store = memoryStore();
    saveRun(store, run(1));
    expect(deleteRuns(store)).toBe(true);
    expect(loadRuns(store)).toEqual([]);
    expect(store.data).toEqual({});
  });
});
