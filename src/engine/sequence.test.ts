import { describe, expect, it } from 'vitest';
import { sequenceCards, startSequence, tapCard, type SequenceDef, type SequenceState } from './sequence';

const don: SequenceDef = {
  steps: [{ en: 'Hand hygiene' }, { en: 'Gown' }, { en: 'N95' }],
};

const doff: SequenceDef = {
  steps: [{ en: 'Remove gloves' }, { en: 'Hand hygiene' }, { en: 'Remove N95' }, { en: 'Hand hygiene' }],
  traps: [{ label: { en: 'Pull the N95 off by the front' }, explain: { en: 'The front is contaminated.' } }],
  countsContamination: true,
};

/** Taps cards one after another and returns the final state. */
function tapAll(def: SequenceDef, ids: string[], from: SequenceState = startSequence()): SequenceState {
  return ids.reduce((s, id) => tapCard(def, s, id).state, from);
}

describe('sequence', () => {
  it('offers one card per step and per trap', () => {
    expect(sequenceCards(doff).map((c) => [c.id, c.label.en, c.trap])).toEqual([
      ['s0', 'Remove gloves', false],
      ['s1', 'Hand hygiene', false],
      ['s2', 'Remove N95', false],
      ['s3', 'Hand hygiene', false],
      ['t0', 'Pull the N95 off by the front', true],
    ]);
  });

  it('completes when the steps are tapped in order', () => {
    const first = tapCard(don, startSequence(), 's0');
    expect(first.outcome).toEqual({ kind: 'correct', complete: false });
    const last = tapCard(don, tapAll(don, ['s0', 's1']), 's2');
    expect(last.outcome).toEqual({ kind: 'correct', complete: true });
    expect(last.state.placed).toEqual(['s0', 's1', 's2']);
    expect(last.state.errors).toBe(0);
  });

  it('reports an out-of-order tap with the expected step and does not advance', () => {
    const r = tapCard(don, tapAll(don, ['s0']), 's2');
    expect(r.outcome).toEqual({ kind: 'outOfOrder', expectedStep: 1 });
    expect(r.state.placed).toEqual(['s0']);
    expect(r.state.errors).toBe(1);
  });

  it('treats steps with the same label as interchangeable', () => {
    // The second "Hand hygiene" card is tapped where the first is expected.
    const r = tapCard(doff, tapAll(doff, ['s0']), 's3');
    expect(r.outcome).toEqual({ kind: 'correct', complete: false });
    const done = tapCard(doff, tapAll(doff, ['s2'], r.state), 's1');
    expect(done.outcome).toEqual({ kind: 'correct', complete: true });
  });

  it('a trap tap disables that card, counts an error and does not advance', () => {
    const r = tapCard(doff, tapAll(doff, ['s0']), 't0');
    expect(r.outcome).toEqual({ kind: 'trap', trap: 0 });
    expect(r.state.placed).toEqual(['s0']);
    expect(r.state.sprung).toEqual(['t0']);
    expect(r.state.errors).toBe(1);
    // Tapping the disabled trap again changes nothing.
    const again = tapCard(doff, r.state, 't0');
    expect(again.outcome).toEqual({ kind: 'ignored' });
    expect(again.state).toEqual(r.state);
  });

  it('counts contamination for traps and for out-of-order taps after the first step', () => {
    // Wrong first tap: nothing is contaminated yet, so no event.
    const wrongFirst = tapCard(doff, startSequence(), 's2');
    expect(wrongFirst.state.contamination).toBe(0);
    expect(wrongFirst.state.errors).toBe(1);
    const afterGloves = tapAll(doff, ['s0', 's2', 't0']);
    expect(afterGloves.contamination).toBe(2);
  });

  it('never counts contamination when the sequence does not ask for it', () => {
    const withTrap: SequenceDef = { ...doff, countsContamination: false };
    expect(tapAll(withTrap, ['s0', 's2', 't0']).contamination).toBe(0);
    expect(tapAll(withTrap, ['s0', 's2', 't0']).errors).toBe(2);
  });

  it('ignores taps on placed cards, unknown cards and anything after completion', () => {
    const one = tapAll(don, ['s0']);
    expect(tapCard(don, one, 's0').outcome).toEqual({ kind: 'ignored' });
    expect(tapCard(don, one, 'nope').outcome).toEqual({ kind: 'ignored' });
    const done = tapAll(don, ['s0', 's1', 's2']);
    expect(tapCard(don, done, 's1')).toEqual({ state: done, outcome: { kind: 'ignored' } });
  });
});
