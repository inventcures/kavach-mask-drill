import { describe, expect, it } from 'vitest';
import nipah from '../content/scenarios/nipah-kerala-01.json';
import type { Scenario } from './scenario';
import { canAdvance, currentScreen, startSession, step, teamMembers, type Action, type SessionState } from './session';

const scenario = nipah as unknown as Scenario;

function play(actions: Action[], from: SessionState = startSession(scenario)): SessionState {
  return actions.reduce((s, a) => step(scenario, s, a), from);
}
const next: Action = { type: 'next' };
const pick = (taskId: string, optionId: string): Action => ({ type: 'pickOption', taskId, optionId });
const stock = (itemId: string, use: boolean): Action => ({ type: 'decideStock', itemId, use });
const tap = (cardId: string): Action => ({ type: 'tapCard', cardId });

const allTasksRight = [pick('triage', 'surgical'), pick('transfer', 'n95eye'), pick('agp', 'n95eye')];
const allStockRight = [stock('A', true), stock('B', false), stock('C', false), stock('D', false), stock('E', true), stock('F', false)];
const donInOrder = ['s0', 's1', 's2', 's3', 's4', 's5'].map(tap);
const doffInOrder = ['s0', 's1', 's2', 's3', 's4', 's5', 's6'].map(tap);
const toChoice = [next];
const toStock = [...toChoice, ...allTasksRight, next];
const toDon = [...toStock, ...allStockRight, next];
const toDoff = [...toDon, ...donInOrder, next];

const youLeakage = (s: SessionState) => teamMembers(scenario, s).find((m) => m.id === 'you')!.leakage;

describe('session: moving through the drill', () => {
  it('starts on the alert with nobody masked up and nothing recorded', () => {
    const s = startSession(scenario);
    expect(currentScreen(scenario, s)?.id).toBe('alert');
    expect(s.mistakes).toEqual([]);
    expect(s.contaminationEvents).toBe(0);
    expect(teamMembers(scenario, s).map((m) => [m.id, m.name, m.leakage])).toEqual([
      ['you', 'You', null],
      ['ravi', 'Ravi', null],
      ['anjali', 'Anjali', null],
      ['faiz', 'Faiz', null],
    ]);
  });

  it('a perfect run goes alert, choice, stock, donning, doffing, then finishes with no mistakes', () => {
    const seen: (string | undefined)[] = [];
    let s = startSession(scenario);
    for (const a of [...toDoff, ...doffInOrder, next]) {
      seen.push(currentScreen(scenario, s)?.id);
      s = step(scenario, s, a);
    }
    expect([...new Set(seen)]).toEqual(['alert', 'choose', 'stock', 'don', 'doff']);
    expect(s.finished).toBe(true);
    expect(currentScreen(scenario, s)).toBeNull();
    expect(s.mistakes).toEqual([]);
    expect(s.contaminationEvents).toBe(0);
  });

  it('does not advance until every task on the screen is answered', () => {
    const partly = play([...toChoice, pick('triage', 'surgical'), pick('agp', 'n95eye')]);
    expect(canAdvance(scenario, partly)).toBe(false);
    expect(currentScreen(scenario, step(scenario, partly, next))?.id).toBe('choose');
    const all = step(scenario, partly, pick('transfer', 'n95eye'));
    expect(canAdvance(scenario, all)).toBe(true);
    expect(currentScreen(scenario, step(scenario, all, next))?.id).toBe('stock');
  });

  it('does not advance past a sequence until it is complete', () => {
    const s = play([...toDon, tap('s0'), next]);
    expect(currentScreen(scenario, s)?.id).toBe('don');
  });

  it('ignores actions that belong to a different kind of screen', () => {
    const s = play(toChoice);
    expect(step(scenario, s, tap('s0'))).toBe(s);
    expect(step(scenario, s, stock('A', true))).toBe(s);
  });

  it('restarting clears mistakes, masks, contamination and progress', () => {
    const messy = play([...toChoice, pick('triage', 'cloth'), pick('transfer', 'cloth'), pick('agp', 'cloth'), next, stock('B', true)]);
    const fresh = step(scenario, messy, { type: 'restart' });
    expect({ ...fresh, progress: 0 }).toEqual({ ...startSession(scenario), progress: 0 });
    expect(currentScreen(scenario, fresh)?.id).toBe('alert');
    expect(canAdvance(scenario, play(toChoice, fresh))).toBe(false);
  });

  it('shows the cards of a sequence in a shuffled order that stays the same for the whole run', () => {
    const reversed = startSession(scenario, () => 0);
    const s = play(toDon, reversed);
    const p = s.progress.don;
    expect(p?.kind === 'sequence' && [...p.order].sort()).toEqual(['s0', 's1', 's2', 's3', 's4', 's5']);
    expect(p?.kind === 'sequence' && p.order).not.toEqual(['s0', 's1', 's2', 's3', 's4', 's5']);
    const later = step(scenario, s, tap('s0')).progress.don;
    expect(later?.kind === 'sequence' && later.order).toEqual(p?.kind === 'sequence' && p.order);
  });
});

describe('session: choosing protection', () => {
  it.each([
    ['surgical', 0.35],
    ['cloth', 0.6],
    ['n95', 0.03],
    ['n95eye', 0.03],
  ])('picking %s for the ambulance transfer sets the player base leakage to %f', (optionId, leakage) => {
    expect(youLeakage(play([...toChoice, pick('transfer', optionId)]))).toBe(leakage);
  });

  it('masks picked for other tasks do not change what the player wears', () => {
    expect(youLeakage(play([...toChoice, pick('triage', 'cloth'), pick('agp', 'surgical')]))).toBeNull();
  });

  it('records a wrong pick as a mistake with a translatable note', () => {
    const s = play([...toChoice, pick('agp', 'surgical')]);
    expect(s.mistakes).toEqual([
      {
        code: 'wrong_mask_agp',
        screenId: 'choose',
        note: {
          en: 'Chose Surgical mask for: Airway suctioning in the isolation room',
          hi: 'आइसोलेशन रूम में वायुमार्ग की सक्शनिंग के लिए सर्जिकल मास्क चुना',
        },
      },
    ]);
  });

  it('an acceptable but not best pick is not a mistake', () => {
    expect(play([...toChoice, pick('triage', 'n95')]).mistakes).toEqual([]);
  });

  it('a task can be answered only once, so re-sending a pick never duplicates a mistake', () => {
    const once = play([...toChoice, pick('transfer', 'cloth')]);
    const again = play([pick('transfer', 'cloth'), pick('transfer', 'n95eye')], once);
    expect(again).toBe(once);
    expect(again.mistakes).toHaveLength(1);
    expect(youLeakage(again)).toBe(0.6);
  });
});

describe('session: stock check', () => {
  it('using a bad item adds the stock penalty to the player and records a mistake', () => {
    const s = play([...toStock, stock('B', true)]);
    expect(youLeakage(s)).toBeCloseTo(0.03 + 0.15, 10);
    expect(s.mistakes).toEqual([{ code: 'stock_B', screenId: 'stock', note: { en: 'Used N95, box 2', hi: 'N95, डिब्बा 2 इस्तेमाल किया' } }]);
  });

  it('using several bad items adds the penalty only once', () => {
    const s = play([...toStock, stock('B', true), stock('D', true), stock('F', true)]);
    expect(youLeakage(s)).toBeCloseTo(0.18, 10);
    expect(s.mistakes.map((m) => m.code)).toEqual(['stock_B', 'stock_D', 'stock_F']);
  });

  it('rejecting a good item is a mistake but does not add leakage', () => {
    const s = play([...toStock, stock('A', false)]);
    expect(youLeakage(s)).toBe(0.03);
    expect(s.mistakes).toEqual([{ code: 'stock_A', screenId: 'stock', note: { en: 'Rejected N95, box 1', hi: 'N95, डिब्बा 1 हटाया' } }]);
  });

  it('an item can be decided only once', () => {
    const once = play([...toStock, stock('B', true)]);
    expect(step(scenario, once, stock('B', true))).toBe(once);
    expect(step(scenario, once, stock('B', false))).toBe(once);
  });

  it('player leakage never goes above 1', () => {
    const s = play([...toChoice, pick('triage', 'surgical'), pick('transfer', 'cloth'), pick('agp', 'n95eye'), next, stock('B', true)]);
    expect(youLeakage(s)).toBeCloseTo(0.75, 10);
    expect(youLeakage(s)!).toBeLessThanOrEqual(1);
  });
});

describe('session: donning and doffing', () => {
  it('an out-of-order tap while donning records the expected step and no contamination', () => {
    const s = play([...toDon, tap('s0'), tap('s2')]);
    expect(s.mistakes).toEqual([
      { code: 'don_order', screenId: 'don', expectedStep: 1, note: { en: 'Out of order: N95 at step 2', hi: 'गलत क्रम: चरण 2 पर N95' } },
    ]);
    expect(s.contaminationEvents).toBe(0);
    const p = s.progress.don;
    expect(p?.kind === 'sequence' && p.last).toEqual({ cardId: 's2', outcome: { kind: 'outOfOrder', expectedStep: 1 } });
  });

  it('a doffing trap records a mistake and one contamination event', () => {
    const s = play([...toDoff, tap('t0')]);
    expect(s.mistakes).toEqual([
      { code: 'doff_order_trap', screenId: 'doff', note: { en: 'Pull the N95 off by the front', hi: 'N95 को सामने से पकड़कर खींचें' } },
    ]);
    expect(s.contaminationEvents).toBe(1);
  });

  it('out-of-order doffing counts contamination only after the first step', () => {
    const wrongFirst = play([...toDoff, tap('s5')]);
    expect(wrongFirst.contaminationEvents).toBe(0);
    expect(wrongFirst.mistakes.map((m) => m.code)).toEqual(['doff_order']);
    const wrongLater = play([tap('s0'), tap('s5')], wrongFirst);
    expect(wrongLater.contaminationEvents).toBe(1);
    expect(wrongLater.mistakes.map((m) => [m.code, m.expectedStep])).toEqual([
      ['doff_order', 0],
      ['doff_order', 1],
    ]);
  });

  it('tapping a sprung trap or a placed card again records nothing more', () => {
    const s = play([...toDoff, tap('s0'), tap('t1')]);
    expect(play([tap('t1'), tap('s0')], s)).toBe(s);
  });

  it('either hand hygiene card can be used first when doffing', () => {
    const s = play([...toDoff, tap('s0'), tap('s6'), tap('s2'), tap('s3'), tap('s4'), tap('s5'), tap('s1')]);
    expect(canAdvance(scenario, s)).toBe(true);
    expect(s.mistakes).toEqual([]);
  });
});
