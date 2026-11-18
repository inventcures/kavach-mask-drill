import type { Text } from './text';

/** A wrong card mixed in with the real steps. */
export interface Trap {
  label: Text;
  /** What goes wrong physically if you do this. */
  explain: Text;
}

/** An ordered task such as donning or doffing. */
export interface SequenceDef {
  steps: readonly Text[];
  traps?: readonly Trap[];
  /** Doffing: traps and out-of-order taps after the first step are contamination events. */
  countsContamination?: boolean;
}

/** One tappable card. Ids are `s<step index>` for steps and `t<trap index>` for traps. */
export interface SequenceCard {
  id: string;
  label: Text;
  trap: boolean;
}

export interface SequenceState {
  /** Step card ids in the order they were correctly placed. */
  placed: readonly string[];
  /** Trap card ids already tapped (now disabled). */
  sprung: readonly string[];
  errors: number;
  contamination: number;
}

export type TapOutcome =
  | { kind: 'correct'; complete: boolean }
  /** `expectedStep` is the 0-based index of the step that should have been tapped. */
  | { kind: 'outOfOrder'; expectedStep: number }
  | { kind: 'trap'; trap: number }
  | { kind: 'ignored' };

export function startSequence(): SequenceState {
  return { placed: [], sprung: [], errors: 0, contamination: 0 };
}

export function sequenceCards(def: SequenceDef): SequenceCard[] {
  return [
    ...def.steps.map((label, i) => ({ id: `s${i}`, label, trap: false })),
    ...(def.traps ?? []).map((trap, i) => ({ id: `t${i}`, label: trap.label, trap: true })),
  ];
}

export function isSequenceComplete(def: SequenceDef, state: SequenceState): boolean {
  return state.placed.length >= def.steps.length;
}

/**
 * Applies one tap. Steps that share an English label (two "Hand hygiene") are
 * interchangeable. A tap that cannot count (card already used, sequence finished) is ignored.
 */
export function tapCard(def: SequenceDef, state: SequenceState, cardId: string): { state: SequenceState; outcome: TapOutcome } {
  const ignored = { state, outcome: { kind: 'ignored' } as const };
  if (isSequenceComplete(def, state)) return ignored;
  if (state.placed.includes(cardId) || state.sprung.includes(cardId)) return ignored;
  const index = Number(cardId.slice(1));
  const contaminates = def.countsContamination === true;

  if (cardId.startsWith('t') && def.traps?.[index]) {
    return {
      state: { ...state, sprung: [...state.sprung, cardId], errors: state.errors + 1, contamination: state.contamination + (contaminates ? 1 : 0) },
      outcome: { kind: 'trap', trap: index },
    };
  }

  const tapped = cardId.startsWith('s') ? def.steps[index] : undefined;
  const expectedStep = state.placed.length;
  const expected = def.steps[expectedStep];
  if (!tapped || !expected) return ignored;

  if (tapped.en === expected.en) {
    const placed = [...state.placed, cardId];
    return { state: { ...state, placed }, outcome: { kind: 'correct', complete: placed.length === def.steps.length } };
  }
  return {
    state: { ...state, errors: state.errors + 1, contamination: state.contamination + (contaminates && expectedStep >= 1 ? 1 : 0) },
    outcome: { kind: 'outOfOrder', expectedStep },
  };
}
