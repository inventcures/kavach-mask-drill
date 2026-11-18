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
    expect(r.ok && r.scenario.screens.map((s) => s.kind)).toEqual(['briefing', 'choice', 'stock', 'sequence', 'sequence']);
  });

  it('rejects a Text without English and says where it is', () => {
    const errors = errorsOf(broken((s) => delete s.screens[1].tasks[0].explain.en));
    expect(errors).toEqual(['screens[1].tasks[0].explain: missing "en"']);
  });

  it('rejects a Text missing a required language, but only when that language is required', () => {
    const raw = broken((s) => delete s.screens[4].traps[1].label.hi);
    expect(errorsOf(raw)).toEqual(['screens[4].traps[1].label: missing "hi"']);
    expect(errorsOf(raw, ['en'])).toEqual([]);
  });

  it('rejects an empty translation', () => {
    expect(errorsOf(broken((s) => (s.screens[0].body[0].hi = ' ')))).toEqual(['screens[0].body[0]: missing "hi"']);
  });

  it('rejects an unknown screen kind', () => {
    expect(errorsOf(broken((s) => (s.screens[0].kind = 'cutscene')))).toEqual(['screens[0].kind: unknown screen kind "cutscene"']);
  });

  it('rejects two screens with the same id', () => {
    expect(errorsOf(broken((s) => (s.screens[4].id = 'don')))).toEqual(['screens[4].id: duplicate screen id "don"']);
  });

  it('rejects a choice task whose answers are not among the options', () => {
    const errors = errorsOf(
      broken((s) => {
        s.screens[1].tasks[1].correct = ['ffp3'];
        s.screens[1].tasks[1].best = 'ffp3';
      }),
    );
    expect(errors).toEqual(['screens[1].tasks[1].correct: unknown option "ffp3"', 'screens[1].tasks[1].best: unknown option "ffp3"']);
  });

  it('rejects a best answer that is not also a correct answer', () => {
    expect(errorsOf(broken((s) => (s.screens[1].tasks[0].best = 'cloth')))).toEqual(['screens[1].tasks[0].best: "cloth" is not one of the correct options']);
  });

  it('rejects an option with a mask the scoring model does not know', () => {
    expect(errorsOf(broken((s) => (s.screens[1].options[0].mask = 'bandana')))).toEqual(['screens[1].options[0].mask: unknown mask "bandana"']);
  });

  it('rejects a stock item without a usable flag and a sequence with fewer than two steps', () => {
    expect(errorsOf(broken((s) => delete s.screens[2].items[3].usable))).toEqual(['screens[2].items[3].usable: must be true or false']);
    expect(errorsOf(broken((s) => (s.screens[3].steps = [s.screens[3].steps[0]])))).toEqual(['screens[3].steps: needs at least 2 steps']);
  });

  it('requires the player to be on the team', () => {
    expect(errorsOf(broken((s) => s.team.shift()))).toEqual(['team: needs a member with id "you"']);
  });

  it('accepts placeholder screens for kinds that are built in later tickets', () => {
    expect(errorsOf(broken((s) => s.screens.push({ kind: 'seal', id: 'seal' }, { kind: 'quiz', id: 'post', phase: 'post' })))).toEqual([]);
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
