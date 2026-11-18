import { describe, expect, it } from 'vitest';
import en from '../content/locales/en.json';
import hi from '../content/locales/hi.json';
import noteTemplates from '../content/mistake-notes.json';
import nipah from '../content/scenarios/nipah-kerala-01.json';
import { missingKeys, validateScenario } from './scenario';

/** A deep copy of the shipped scenario that a test can break in one place. */
function broken(change: (s: any) => void): unknown {
  const copy = JSON.parse(JSON.stringify(nipah));
  change(copy);
  return copy;
}

function errorsOf(raw: unknown, langs = ['en', 'hi']): string[] {
  const r = validateScenario(raw, { langs });
  return r.ok ? [] : r.errors;
}

describe('scenario validation', () => {
  it('accepts the shipped Nipah scenario in English and Hindi', () => {
    const r = validateScenario(nipah, { langs: ['en', 'hi'] });
    expect(r.ok ? [] : r.errors).toEqual([]);
    expect(r.ok && r.scenario.screens.map((s) => s.kind)).toEqual(['quiz', 'briefing', 'choice', 'stock', 'sequence', 'seal', 'buddy', 'sequence', 'bins', 'quiz']);
  });

  it('rejects a Text without English and says where it is', () => {
    const errors = errorsOf(broken((s) => delete s.screens[2].tasks[0].explain.en));
    expect(errors).toEqual(['screens[2].tasks[0].explain: missing "en"']);
  });

  it('rejects a Text missing a required language, but only when that language is required', () => {
    const raw = broken((s) => delete s.screens[7].traps[1].label.hi);
    expect(errorsOf(raw)).toEqual(['screens[7].traps[1].label: missing "hi"']);
    expect(errorsOf(raw, ['en'])).toEqual([]);
  });

  it('rejects an empty translation', () => {
    expect(errorsOf(broken((s) => (s.screens[1].body[0].hi = ' ')))).toEqual(['screens[1].body[0]: missing "hi"']);
  });

  it('rejects an unknown screen kind', () => {
    expect(errorsOf(broken((s) => (s.screens[1].kind = 'cutscene')))).toEqual(['screens[1].kind: unknown screen kind "cutscene"']);
  });

  it('rejects two screens with the same id', () => {
    expect(errorsOf(broken((s) => (s.screens[7].id = 'don')))).toEqual(['screens[7].id: duplicate screen id "don"']);
  });

  it('rejects a choice task whose answers are not among the options', () => {
    const errors = errorsOf(
      broken((s) => {
        s.screens[2].tasks[1].correct = ['ffp3'];
        s.screens[2].tasks[1].best = 'ffp3';
      }),
    );
    expect(errors).toEqual(['screens[2].tasks[1].correct: unknown option "ffp3"', 'screens[2].tasks[1].best: unknown option "ffp3"']);
  });

  it('rejects a best answer that is not also a correct answer', () => {
    expect(errorsOf(broken((s) => (s.screens[2].tasks[0].best = 'cloth')))).toEqual(['screens[2].tasks[0].best: "cloth" is not one of the correct options']);
  });

  it('rejects an option with a mask the scoring model does not know', () => {
    expect(errorsOf(broken((s) => (s.screens[2].options[0].mask = 'bandana')))).toEqual(['screens[2].options[0].mask: unknown mask "bandana"']);
  });

  it('rejects a stock item without a usable flag and a sequence with fewer than two steps', () => {
    expect(errorsOf(broken((s) => delete s.screens[3].items[3].usable))).toEqual(['screens[3].items[3].usable: must be true or false']);
    expect(errorsOf(broken((s) => (s.screens[4].steps = [s.screens[4].steps[0]])))).toEqual(['screens[4].steps: needs at least 2 steps']);
  });

  it('requires the player to be on the team', () => {
    expect(errorsOf(broken((s) => s.team.shift()))).toEqual(['team: needs a member with id "you"']);
  });

  it('rejects a seal check that leaves a leak with no way to fix it', () => {
    const errors = errorsOf(broken((s) => (s.screens[5].actions = s.screens[5].actions.filter((a: any) => a.id !== 'straps'))));
    expect(errors).toEqual(['screens[5].actions: no action fixes the "side" leak']);
  });

  it('rejects a seal action that is neither a fix nor harmful, or that names an unknown leak site', () => {
    expect(errorsOf(broken((s) => delete s.screens[5].actions[5].harmful))).toEqual(['screens[5].actions[5]: must either fix a leak or be harmful, not both']);
    expect(errorsOf(broken((s) => (s.screens[5].actions[0].reopens = 'ear')))).toEqual(['screens[5].actions[0].reopens: unknown leak site "ear"']);
    expect(errorsOf(broken((s) => (s.screens[5].actions[1].reopens = 'chin')))).toEqual(['screens[5].actions[1].reopens: only a harmful action can re-open a leak']);
  });

  it('rejects a seal check without the passed text or the fit-test reminder', () => {
    const errors = errorsOf(
      broken((s) => {
        delete s.screens[5].passed;
        delete s.screens[5].notFitTest.hi;
      }),
    );
    expect(errors).toEqual(['screens[5].passed: missing "en"', 'screens[5].passed: missing "hi"', 'screens[5].notFitTest: missing "hi"']);
  });

  it('rejects a buddy check of someone who is not a teammate', () => {
    expect(errorsOf(broken((s) => (s.screens[6].mates[0].member = 'you')))).toEqual(['screens[6].mates[0].member: "you" is not a teammate']);
    expect(errorsOf(broken((s) => (s.screens[6].mates[1].member = 'meera')))).toEqual(['screens[6].mates[1].member: "meera" is not a teammate']);
  });

  it('rejects a buddy option with a leakage outside 0 to 1, and a teammate with no right call', () => {
    expect(errorsOf(broken((s) => (s.screens[6].mates[0].options[0].leakage = 35)))).toEqual(['screens[6].mates[0].options[0].leakage: must be a number above 0 and at most 1']);
    expect(errorsOf(broken((s) => (s.screens[6].mates[1].options[0].ok = false)))).toEqual(['screens[6].mates[1].options: needs at least 1 option that is ok']);
  });

  it('rejects a quiz item whose right answer is not one of its options, and a quiz screen with no quiz', () => {
    expect(errorsOf(broken((s) => (s.quiz.items[1].correct = 'gloves')))).toEqual(['quiz.items[1].correct: unknown option "gloves"']);
    expect(errorsOf(broken((s) => delete s.quiz.comfort.prompt.hi))).toEqual(['quiz.comfort.prompt: missing "hi"']);
    expect(errorsOf(broken((s) => (s.screens[0].phase = 'during')))).toEqual(['screens[0].phase: must be "pre" or "post"']);
    expect(errorsOf(broken((s) => delete s.quiz))).toEqual(['screens[0]: a quiz screen needs the scenario to have a quiz', 'screens[9]: a quiz screen needs the scenario to have a quiz']);
  });

  it('rejects an item that belongs in a bin that does not exist, and a stock-log answer that is not offered', () => {
    expect(errorsOf(broken((s) => (s.screens[8].items[2].bin = 'blue')))).toEqual(['screens[8].items[2].bin: unknown bin "blue"']);
    expect(errorsOf(broken((s) => (s.screens[8].logQuestion.answer = 37)))).toEqual(['screens[8].logQuestion.answer: 37 is not one of the options']);
  });

  it('rejects something that is not a scenario at all', () => {
    expect(errorsOf(null)).toEqual(['scenario: must be an object']);
  });
});

describe('translations shipped with the app', () => {
  it('Hindi has every interface string that English has', () => {
    expect(missingKeys(en, hi)).toEqual([]);
  });

  it('reports the keys a locale is missing', () => {
    expect(missingKeys({ a: 'A', b: 'B', c: 'C' }, { b: 'ख', c: '' })).toEqual(['a', 'c']);
  });

  it('every mistake-note template has English and Hindi', () => {
    for (const [name, template] of Object.entries(noteTemplates)) {
      expect(missingKeys({ en: 'x', hi: 'x' }, template), name).toEqual([]);
    }
  });
});
