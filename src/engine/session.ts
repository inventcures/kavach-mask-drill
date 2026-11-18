import noteTemplates from '../content/mistake-notes.json';
import type { ChoiceScreen, Scenario, ScreenDef, SequenceScreen, StockScreen } from './scenario';
import { memberLeakage, type LeakageFault, type MaskKind, type ScoredMember } from './scoring';
import { isSequenceComplete, sequenceCards, startSequence, tapCard, type SequenceState, type TapOutcome } from './sequence';
import { fillText, type Text } from './text';

/** Something the player got wrong. Results group these by `code`. */
export interface Mistake {
  code: string;
  screenId: string;
  note: Text;
  /** Out-of-order taps only: 0-based index of the step that should have come next. */
  expectedStep?: number;
}

/** What a member is wearing and what is wrong with it. `mask: null` means not masked up yet. */
export interface MemberFit {
  mask: MaskKind | null;
  faults: readonly LeakageFault[];
}

/** What the player has done on one screen. Later screen kinds add their own variant here. */
export type ScreenProgress =
  | { kind: 'choice'; picks: Readonly<Record<string, string>> }
  | { kind: 'stock'; decisions: Readonly<Record<string, 'use' | 'reject'>> }
  | { kind: 'sequence'; order: readonly string[]; seq: SequenceState; last: { cardId: string; outcome: TapOutcome } | null };

export interface SessionState {
  scenarioId: string;
  /** Index of the current screen in the scenario. */
  index: number;
  /** True once the player has moved past the last screen. */
  finished: boolean;
  mistakes: readonly Mistake[];
  contaminationEvents: number;
  fits: Readonly<Record<string, MemberFit>>;
  /** Keyed by screen id. Screens with nothing to answer (briefing) have no entry. */
  progress: Readonly<Record<string, ScreenProgress>>;
}

export type Action =
  | { type: 'next' }
  | { type: 'restart' }
  | { type: 'pickOption'; taskId: string; optionId: string }
  | { type: 'decideStock'; itemId: string; use: boolean }
  | { type: 'tapCard'; cardId: string };

/** Returns a number in [0, 1), like Math.random. Injected so tests can fix the card order. */
export type Rng = () => number;

const PLAYER = 'you';

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function freshProgress(screen: ScreenDef, rng: Rng): ScreenProgress | null {
  switch (screen.kind) {
    case 'choice':
      return { kind: 'choice', picks: {} };
    case 'stock':
      return { kind: 'stock', decisions: {} };
    case 'sequence':
      return { kind: 'sequence', order: shuffled(sequenceCards(screen), rng).map((c) => c.id), seq: startSequence(), last: null };
    default:
      return null;
  }
}

export function startSession(scenario: Scenario, rng: Rng = Math.random): SessionState {
  const progress: Record<string, ScreenProgress> = {};
  for (const screen of scenario.screens) {
    const p = freshProgress(screen, rng);
    if (p) progress[screen.id] = p;
  }
  const fits: Record<string, MemberFit> = {};
  for (const m of scenario.team) fits[m.id] = { mask: null, faults: [] };
  return { scenarioId: scenario.id, index: 0, finished: false, mistakes: [], contaminationEvents: 0, fits, progress };
}

/** The screen the player is on, or null once the drill is finished. */
export function currentScreen(scenario: Scenario, state: SessionState): ScreenDef | null {
  return state.finished ? null : (scenario.screens[state.index] ?? null);
}

/** True when everything on the current screen has been answered. */
export function canAdvance(scenario: Scenario, state: SessionState): boolean {
  const screen = currentScreen(scenario, state);
  if (!screen) return false;
  const p = state.progress[screen.id];
  if (screen.kind === 'choice' && p?.kind === 'choice') return screen.tasks.every((t) => t.id in p.picks);
  if (screen.kind === 'stock' && p?.kind === 'stock') return screen.items.every((it) => it.id in p.decisions);
  if (screen.kind === 'sequence' && p?.kind === 'sequence') return isSequenceComplete(screen, p.seq);
  return true;
}

/** The team as the meter and team row need it: leakage is null until a member is masked up. */
export function teamMembers(scenario: Scenario, state: SessionState): (ScoredMember & { name: string })[] {
  return scenario.team.map((m) => {
    const fit = state.fits[m.id];
    const leakage = fit && fit.mask !== null ? memberLeakage({ mask: fit.mask, faults: fit.faults }) : null;
    return { id: m.id, name: m.name, leakage };
  });
}

function withProgress(state: SessionState, screenId: string, p: ScreenProgress): SessionState {
  return { ...state, progress: { ...state.progress, [screenId]: p } };
}

function withMistake(state: SessionState, mistake: Mistake): SessionState {
  return { ...state, mistakes: [...state.mistakes, mistake] };
}

function withPlayerFit(state: SessionState, change: (fit: MemberFit) => MemberFit): SessionState {
  return { ...state, fits: { ...state.fits, [PLAYER]: change(state.fits[PLAYER] ?? { mask: null, faults: [] }) } };
}

function pickOption(screen: ChoiceScreen, state: SessionState, taskId: string, optionId: string): SessionState {
  const p = state.progress[screen.id];
  const task = screen.tasks.find((t) => t.id === taskId);
  const option = screen.options.find((o) => o.id === optionId);
  if (p?.kind !== 'choice' || !task || !option || taskId in p.picks) return state;
  let s = withProgress(state, screen.id, { kind: 'choice', picks: { ...p.picks, [taskId]: optionId } });
  if (task.setsPlayerMask) s = withPlayerFit(s, (fit) => ({ ...fit, mask: option.mask }));
  if (!task.correct.includes(optionId)) {
    s = withMistake(s, {
      code: `wrong_mask_${task.id}`,
      screenId: screen.id,
      note: fillText(noteTemplates.wrongChoice, { option: option.label, task: task.prompt }),
    });
  }
  return s;
}

function decideStock(screen: StockScreen, state: SessionState, itemId: string, use: boolean): SessionState {
  const p = state.progress[screen.id];
  const item = screen.items.find((it) => it.id === itemId);
  if (p?.kind !== 'stock' || !item || itemId in p.decisions) return state;
  let s = withProgress(state, screen.id, { kind: 'stock', decisions: { ...p.decisions, [itemId]: use ? 'use' : 'reject' } });
  if (use === item.usable) return s;
  s = withMistake(s, {
    code: `stock_${item.id}`,
    screenId: screen.id,
    note: fillText(use ? noteTemplates.usedBadStock : noteTemplates.rejectedGoodStock, { item: item.name }),
  });
  // Bad stock reaching the team costs the same however many bad boxes were let through.
  if (use) s = withPlayerFit(s, (fit) => (fit.faults.includes('badStock') ? fit : { ...fit, faults: [...fit.faults, 'badStock'] }));
  return s;
}

function tapSequenceCard(screen: SequenceScreen, state: SessionState, cardId: string): SessionState {
  const p = state.progress[screen.id];
  if (p?.kind !== 'sequence') return state;
  const { state: seq, outcome } = tapCard(screen, p.seq, cardId);
  if (outcome.kind === 'ignored') return state;
  let s = withProgress(state, screen.id, { ...p, seq, last: { cardId, outcome } });
  s = { ...s, contaminationEvents: s.contaminationEvents + (seq.contamination - p.seq.contamination) };
  if (outcome.kind === 'trap') {
    const trap = screen.traps?.[outcome.trap];
    if (trap) s = withMistake(s, { code: `${screen.mistakeCode}_trap`, screenId: screen.id, note: trap.label });
  } else if (outcome.kind === 'outOfOrder') {
    const tapped = sequenceCards(screen).find((c) => c.id === cardId);
    s = withMistake(s, {
      code: screen.mistakeCode,
      screenId: screen.id,
      expectedStep: outcome.expectedStep,
      note: fillText(noteTemplates.outOfOrder, { step: tapped?.label ?? '', n: outcome.expectedStep + 1 }),
    });
  }
  return s;
}

/**
 * The whole game as one pure function. An action that makes no sense right now
 * (wrong screen kind, already answered, not ready to advance) returns the same state,
 * so the UI can re-render or re-send freely without recording anything twice.
 */
export function step(scenario: Scenario, state: SessionState, action: Action, rng: Rng = Math.random): SessionState {
  if (action.type === 'restart') return startSession(scenario, rng);
  const screen = currentScreen(scenario, state);
  if (!screen) return state;
  switch (action.type) {
    case 'next':
      if (!canAdvance(scenario, state)) return state;
      return state.index + 1 >= scenario.screens.length ? { ...state, finished: true } : { ...state, index: state.index + 1 };
    case 'pickOption':
      return screen.kind === 'choice' ? pickOption(screen, state, action.taskId, action.optionId) : state;
    case 'decideStock':
      return screen.kind === 'stock' ? decideStock(screen, state, action.itemId, action.use) : state;
    case 'tapCard':
      return screen.kind === 'sequence' ? tapSequenceCard(screen, state, action.cardId) : state;
  }
}
