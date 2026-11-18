import { describe, expect, it } from 'vitest';
import nipah from '../content/scenarios/nipah-kerala-01.json';
import type { Scenario } from './scenario';
import { canAdvance, currentScreen, drillStep, groupMistakes, quizResult, startSession, step, teamMembers, type Action, type SessionState } from './session';

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
const rate = (scale: 'confidence' | 'comfort' | 'willingToWear', value: number): Action => ({ type: 'rate', scale, value });
const answer = (itemId: string, optionId: string): Action => ({ type: 'answerQuiz', itemId, optionId });
const bin = (itemId: string, binId: string): Action => ({ type: 'binItem', itemId, binId });
const quizAllRight = [answer('seal_vs_fit', 'false'), answer('doff_hold', 'straps'), answer('weakest_seal', 'bad'), answer('valve', 'false')];
const preCheck = [rate('confidence', 2), answer('seal_vs_fit', 'true'), answer('doff_hold', 'straps'), answer('weakest_seal', 'good'), answer('valve', 'false')];
const toAlert = [...preCheck, next];
const toChoice = [...toAlert, next];
const toStock = [...toChoice, ...allTasksRight, next];
const toDon = [...toStock, ...allStockRight, next];
const sealAct = (actionId: string): Action => ({ type: 'sealAction', actionId });
const buddy = (memberId: string, optionId: string): Action => ({ type: 'buddyPick', memberId, optionId });
const sealFixes = ['mould', 'straps', 'chin'].map(sealAct);
const buddyAllRight = [buddy('ravi', 'reassign'), buddy('anjali', 'adjust'), buddy('faiz', 'praise')];
const toSeal = [...toDon, ...donInOrder, next];
const toBuddy = [...toSeal, ...sealFixes, next];
const toDoff = [...toBuddy, ...buddyAllRight, next];
const toWaste = [...toDoff, ...doffInOrder, next];
const binsAllRight = [bin('n95', 'yellow'), bin('gown', 'yellow'), bin('gloves', 'red'), bin('goggles', 'disinfect')];
const toPost = [...toWaste, ...binsAllRight, { type: 'answerLog', value: 36 } as Action, next];
const postCheck = [rate('confidence', 4), ...quizAllRight, rate('comfort', 3), rate('willingToWear', 5)];
const toResults = [...toPost, ...postCheck, next];

const youLeakage = (s: SessionState) => teamMembers(scenario, s).find((m) => m.id === 'you')!.leakage;

describe('session: moving through the drill', () => {
  it('starts on the pre-check with nobody masked up and nothing recorded', () => {
    const s = startSession(scenario);
    expect(currentScreen(scenario, s)?.id).toBe('pre');
    expect(s.mistakes).toEqual([]);
    expect(s.contaminationEvents).toBe(0);
    expect(teamMembers(scenario, s).map((m) => [m.id, m.name.en, m.name.hi, m.leakage])).toEqual([
      ['you', 'You', 'आप', null],
      ['ravi', 'Ravi', 'रवि', null],
      ['anjali', 'Anjali', 'अंजलि', null],
      ['faiz', 'Faiz', 'फ़ैज़', null],
    ]);
  });

  it('a perfect run goes pre-check, the eight drill steps, post-check, then finishes with no mistakes', () => {
    const seen: (string | undefined)[] = [];
    let s = startSession(scenario);
    for (const a of toResults) {
      seen.push(currentScreen(scenario, s)?.id);
      s = step(scenario, s, a);
    }
    expect([...new Set(seen)]).toEqual(['pre', 'alert', 'choose', 'stock', 'don', 'seal', 'buddy', 'doff', 'waste', 'post']);
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
    const fresh = step(scenario, messy, { type: 'restart' }, Math.random, () => 5);
    expect({ ...fresh, progress: 0 }).toEqual({ ...startSession(scenario, Math.random, () => 5), progress: 0 });
    expect(currentScreen(scenario, fresh)?.id).toBe('pre');
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

describe('session: seal check', () => {
  const openLeaks = (s: SessionState) => {
    const p = s.progress.seal;
    return p?.kind === 'seal' ? [...p.open].sort() : null;
  };

  it('starts with leaks at the nose, sides and chin and cannot be passed until all are fixed', () => {
    const s = play(toSeal);
    expect(openLeaks(s)).toEqual(['chin', 'nose', 'side']);
    expect(canAdvance(scenario, s)).toBe(false);
    const two = play([sealAct('mould'), sealAct('chin')], s);
    expect(openLeaks(two)).toEqual(['side']);
    expect(canAdvance(scenario, two)).toBe(false);
    expect(play([next], two).index).toBe(two.index);
  });

  it('fixing every leak with no harmful action passes the check and leaves the player at the base leakage', () => {
    const s = play([...toSeal, ...sealFixes]);
    expect(openLeaks(s)).toEqual([]);
    expect(canAdvance(scenario, s)).toBe(true);
    expect(youLeakage(s)).toBeCloseTo(0.03, 10);
    expect(s.mistakes).toEqual([]);
  });

  it('each harmful action is a mistake and adds 0.03 to the player for the rest of the drill', () => {
    const one = play([...toSeal, sealAct('tape')]);
    expect(youLeakage(one)).toBeCloseTo(0.06, 10);
    expect(one.mistakes).toEqual([
      { code: 'seal_tape', screenId: 'seal', note: expect.objectContaining({ en: 'Stuff tissue into the gaps', hi: 'गैप में टिश्यू भर दें' }) },
    ]);
    const all = play([sealAct('pinch'), sealAct('cross'), ...sealFixes, next], one);
    expect(currentScreen(scenario, all)?.id).toBe('buddy');
    expect(youLeakage(all)).toBeCloseTo(0.12, 10);
    expect(all.mistakes.map((m) => m.code)).toEqual(['seal_tape', 'seal_pinch', 'seal_cross']);
  });

  it('harmful actions and the stock penalty add up on the player', () => {
    const s = play([...toStock, stock('B', true), stock('A', true), stock('C', false), stock('D', false), stock('E', true), stock('F', false), next, ...donInOrder, next, sealAct('pinch'), sealAct('cross'), ...sealFixes]);
    expect(youLeakage(s)).toBeCloseTo(0.03 + 0.06 + 0.15, 10);
  });

  it('a harmful action re-opens a fixed leak, and the fix can always be used again', () => {
    const reopened = play([...toSeal, ...sealFixes.slice(0, 2), sealAct('pinch'), sealAct('cross')]);
    expect(openLeaks(reopened)).toEqual(['chin', 'nose', 'side']);
    const fixed = play(sealFixes, reopened);
    expect(openLeaks(fixed)).toEqual([]);
    expect(canAdvance(scenario, fixed)).toBe(true);
  });

  it('a harmful action can be done only once, so re-sending it records nothing more', () => {
    const once = play([...toSeal, sealAct('pinch')]);
    const again = play([sealAct('pinch'), sealAct('pinch')], once);
    expect(again).toBe(once);
  });

  it('repeating a fix records nothing and changes no leakage', () => {
    const s = play([...toSeal, sealAct('mould'), sealAct('mould')]);
    expect(openLeaks(s)).toEqual(['chin', 'side']);
    expect(s.mistakes).toEqual([]);
    expect(youLeakage(s)).toBeCloseTo(0.03, 10);
  });

  it('once the seal check is passed nothing can undo it', () => {
    const passed = play([...toSeal, ...sealFixes]);
    expect(play([sealAct('pinch'), sealAct('tape'), sealAct('mould')], passed)).toBe(passed);
  });

  it('remembers the last action so its explanation can be shown', () => {
    const s = play([...toSeal, sealAct('mould'), sealAct('cross')]);
    const p = s.progress.seal;
    expect(p?.kind === 'seal' && p.last).toBe('cross');
  });

  it('every reachable mix of actions can still be finished with the three fixes', () => {
    const ids = ['pinch', 'mould', 'straps', 'cross', 'chin', 'tape'];
    // Every ordered triple of actions, then the fixes: 216 paths through the screen.
    for (const a of ids) for (const b of ids) for (const c of ids) {
      const s = play([...[a, b, c].map(sealAct), ...sealFixes], play(toSeal));
      expect(canAdvance(scenario, s), `${a}, ${b}, ${c}`).toBe(true);
    }
  });
});

describe('session: buddy check', () => {
  const leakages = (s: SessionState) => Object.fromEntries(teamMembers(scenario, s).map((m) => [m.id, m.leakage]));

  it('teammates have no reading until the player has checked them', () => {
    const s = play([...toBuddy, buddy('anjali', 'adjust')]);
    expect(leakages(s)).toEqual({ you: expect.closeTo(0.03, 10), ravi: null, anjali: 0.04, faiz: null });
    expect(canAdvance(scenario, s)).toBe(false);
  });

  it('the right calls leave Ravi at 5% and Anjali and Faiz at 4%, with no mistakes', () => {
    const s = play([...toBuddy, ...buddyAllRight]);
    expect(leakages(s)).toEqual({ you: expect.closeTo(0.03, 10), ravi: 0.05, anjali: 0.04, faiz: 0.04 });
    expect(s.mistakes).toEqual([]);
    expect(canAdvance(scenario, s)).toBe(true);
  });

  it('letting Ravi carry on with stubble leaves him at 35% and is recorded against him', () => {
    const s = play([...toBuddy, buddy('ravi', 'fine')]);
    expect(leakages(s).ravi).toBe(0.35);
    expect(s.mistakes).toEqual([
      { code: 'buddy_ravi', screenId: 'buddy', note: expect.objectContaining({ en: 'Ravi: Looks fine, carry on', hi: 'रवि: ठीक लगता है, चलने दें' }) },
    ]);
  });

  it('the other wrong calls set the leakage the scenario gives them', () => {
    expect(leakages(play([...toBuddy, buddy('ravi', 'tighten')])).ravi).toBe(0.25);
    expect(leakages(play([...toBuddy, buddy('anjali', 'leave')])).anjali).toBe(0.2);
  });

  it('making Faiz redo a good fit is a mistake that does not change his leakage', () => {
    const s = play([...toBuddy, buddy('faiz', 'redo')]);
    expect(leakages(s).faiz).toBe(0.04);
    expect(s.mistakes.map((m) => m.code)).toEqual(['buddy_faiz']);
  });

  it('each teammate can be checked only once', () => {
    const once = play([...toBuddy, buddy('ravi', 'fine')]);
    expect(play([buddy('ravi', 'fine'), buddy('ravi', 'reassign')], once)).toBe(once);
  });

  it('ignores a teammate or option the screen does not have', () => {
    const s = play(toBuddy);
    expect(play([buddy('you', 'fine'), buddy('ravi', 'nope'), buddy('nobody', 'fine')], s)).toBe(s);
  });

  it('three teammates at 4% and Ravi at 35% bring the team to about 12% leakage', () => {
    const s = play([...toChoice, ...allTasksRight, next, ...allStockRight, next, ...donInOrder, next, sealAct('tape'), ...sealFixes, next, buddy('ravi', 'fine'), buddy('anjali', 'adjust'), buddy('faiz', 'praise')]);
    const all = teamMembers(scenario, s).map((m) => m.leakage ?? 0);
    expect(all.reduce((a, b) => a + b, 0) / all.length).toBeCloseTo(0.1225, 10);
  });
});

describe('session: pre and post check', () => {
  it('does not advance until confidence and every quiz item are answered', () => {
    const partly = play(preCheck.slice(0, -1));
    expect(canAdvance(scenario, partly)).toBe(false);
    expect(currentScreen(scenario, step(scenario, partly, next))?.id).toBe('pre');
    expect(currentScreen(scenario, play(toAlert))?.id).toBe('alert');
  });

  it('scores the quiz without recording wrong answers as mistakes', () => {
    const s = play(toAlert);
    expect(quizResult(scenario, s, 'pre')).toEqual({ confidence: 2, score: 2, max: 4 });
    expect(s.mistakes).toEqual([]);
  });

  it('lets the player change an answer until they move on', () => {
    const changed = play([...preCheck, answer('seal_vs_fit', 'false'), rate('confidence', 5)]);
    expect(quizResult(scenario, changed, 'pre')).toEqual({ confidence: 5, score: 3, max: 4 });
  });

  it('ignores a rating outside 1 to 5 and an answer that is not one of the options', () => {
    const s = play([rate('confidence', 3)]);
    expect(step(scenario, s, rate('confidence', 6))).toBe(s);
    expect(step(scenario, s, rate('confidence', 2.5))).toBe(s);
    expect(step(scenario, s, answer('valve', 'maybe'))).toBe(s);
    expect(step(scenario, s, rate('comfort', 3))).toBe(s);
  });

  it('the post-check also needs comfort and willingness to wear an N95 for a full shift', () => {
    const noComfort = play([...toPost, ...postCheck.slice(0, -2)]);
    expect(currentScreen(scenario, noComfort)?.id).toBe('post');
    expect(canAdvance(scenario, noComfort)).toBe(false);
    const done = play(postCheck.slice(-2), noComfort);
    expect(canAdvance(scenario, done)).toBe(true);
    expect(quizResult(scenario, done, 'post')).toEqual({ confidence: 4, score: 4, max: 4, comfort: 3, willingToWear: 5 });
    expect(quizResult(scenario, done, 'pre')).toEqual({ confidence: 2, score: 2, max: 4 });
  });

  it('keeps a role and a cleaned-up trainer code, and lets both be cleared', () => {
    const s = play([{ type: 'setContext', role: 'asha', trainerCode: ' kzd-ert-1125 (morning batch, Meera) ' }]);
    expect(s.context).toEqual({ role: 'asha', trainerCode: 'KZD-ERT-1125MORN' });
    expect(play([{ type: 'setContext', role: null, trainerCode: '' }], s).context).toEqual({});
    expect(play([{ type: 'setContext', role: 'boss' as never }], s).context).toEqual({ trainerCode: 'KZD-ERT-1125MORN' });
  });

  it('counts the eight drill steps without the two checks', () => {
    expect(drillStep(scenario, startSession(scenario))).toBeNull();
    expect(drillStep(scenario, play(toAlert))).toEqual({ n: 1, total: 8 });
    expect(drillStep(scenario, play(toWaste))).toEqual({ n: 8, total: 8 });
    expect(drillStep(scenario, play(toPost))).toBeNull();
  });
});

describe('session: dispose and log', () => {
  it('needs every item binned and the stock log answered before moving on', () => {
    const s = play([...toWaste, ...binsAllRight]);
    expect(canAdvance(scenario, s)).toBe(false);
    const logged = step(scenario, s, { type: 'answerLog', value: 36 });
    expect(canAdvance(scenario, logged)).toBe(true);
    expect(logged.mistakes).toEqual([]);
  });

  it('records an item put in the wrong bin, once, and keeps the first decision', () => {
    const s = play([...toWaste, bin('gloves', 'general'), bin('gloves', 'red')]);
    expect(s.mistakes).toEqual([{ code: 'waste_gloves', screenId: 'waste', note: { en: 'Used gloves into General waste', hi: 'इस्तेमाल किए दस्ताने → सामान्य कचरा' } }]);
    const p = s.progress.waste;
    expect(p?.kind === 'bins' && p.placed).toEqual({ gloves: 'general' });
  });

  it('records a wrong stock-log answer with the number written', () => {
    const s = play([...toWaste, { type: 'answerLog', value: 21 }, { type: 'answerLog', value: 36 }]);
    expect(s.mistakes).toEqual([{ code: 'stock_log', screenId: 'waste', note: { en: 'Stock log wrote 21', hi: 'स्टॉक लॉग में 21 लिखा' } }]);
    expect(step(scenario, play(toWaste), { type: 'answerLog', value: 99 }).mistakes).toEqual([]);
  });
});

describe('session: finishing', () => {
  it('times the run from start to the end of the post-check', () => {
    const start = startSession(scenario, Math.random, () => 1_000);
    const before = play(toResults.slice(0, -1), start);
    expect(before.finishedAt).toBeNull();
    const done = step(scenario, before, next, Math.random, () => 61_000);
    expect([done.finished, done.startedAt, done.finishedAt]).toEqual([true, 1_000, 61_000]);
  });

  it('results are marked saved once per run, and only after the run is finished', () => {
    const midway = play(toDoff);
    expect(step(scenario, midway, { type: 'resultSaved' })).toBe(midway);
    const done = play(toResults);
    expect(done.resultSaved).toBe(false);
    const saved = step(scenario, done, { type: 'resultSaved' });
    expect(saved.resultSaved).toBe(true);
    expect(step(scenario, saved, { type: 'resultSaved' })).toBe(saved);
    expect(step(scenario, saved, { type: 'restart' }).resultSaved).toBe(false);
  });

  it('groups out-of-order mistakes under one heading and counts them; other mistakes stay separate', () => {
    const s = play([...toDoff, tap('s3'), tap('s2'), tap('s0'), tap('s4'), tap('t0'), ...doffInOrder.slice(1), next, bin('gloves', 'general'), bin('n95', 'red')]);
    expect(groupMistakes(scenario, s.mistakes).map((g) => [g.label.en, g.count])).toEqual([
      ['Took off PPE out of order', 3],
      ['Pull the N95 off by the front', 1],
      ['Used gloves into General waste', 1],
      ['Used N95 into Red bag', 1],
    ]);
    expect(groupMistakes(scenario, s.mistakes)[0]?.label.hi).toBe('PPE गलत क्रम में उतारा');
  });
});
