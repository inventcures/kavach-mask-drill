import { FILTER_PENETRATION } from './constants';
import type { MaskKind } from './scoring';
import type { SequenceDef } from './sequence';
import type { Text } from './text';

/** One of the four people on the team. The member with id `you` is the player. */
export interface TeamMemberDef {
  id: string;
  name: string;
}

export interface ChoiceOption {
  id: string;
  label: Text;
  /** The mask this option puts on the wearer's face, for the leakage model. */
  mask: MaskKind;
}

export interface ChoiceTask {
  id: string;
  prompt: Text;
  /** Option ids that are acceptable. */
  correct: string[];
  /** The option highlighted after a wrong pick. Must be one of `correct`. */
  best: string;
  explain: Text;
  /** The mask picked here is the one the player wears for the rest of the drill. */
  setsPlayerMask?: boolean;
}

export interface StockItem {
  id: string;
  name: Text;
  detail: Text;
  usable: boolean;
  explain: Text;
}

export interface BriefingScreen {
  kind: 'briefing';
  id: string;
  /** A symbol shown before the title, e.g. a warning sign. */
  icon?: string;
  title: Text;
  body: Text[];
  showTeam?: boolean;
}
export interface ChoiceScreen {
  kind: 'choice';
  id: string;
  title: Text;
  options: ChoiceOption[];
  tasks: ChoiceTask[];
}
export interface StockScreen {
  kind: 'stock';
  id: string;
  title: Text;
  hint?: Text;
  items: StockItem[];
}
export interface SequenceScreen extends SequenceDef {
  kind: 'sequence';
  id: string;
  title: Text;
  hint?: Text;
  /** Out-of-order taps are recorded under this code; trap taps under `<code>_trap`. */
  mistakeCode: string;
  /** How these mistakes are named when grouped on the results screen. */
  mistakeGroup?: Text;
  /** Shown once the sequence is complete. */
  explain: Text;
}

/** Screen kinds whose content and behaviour arrive in later tickets. Only `kind` and `id` are checked for now. */
export const PLACEHOLDER_KINDS = ['seal', 'buddy', 'bins', 'quiz', 'results'] as const;
export interface PlaceholderScreen {
  kind: (typeof PLACEHOLDER_KINDS)[number];
  id: string;
}

export type ScreenDef = BriefingScreen | ChoiceScreen | StockScreen | SequenceScreen | PlaceholderScreen;
export type ScreenKind = ScreenDef['kind'];

export interface Scenario {
  v: 1;
  id: string;
  track: string;
  title: Text;
  team: TeamMemberDef[];
  screens: ScreenDef[];
}

export type ValidationResult = { ok: true; scenario: Scenario } | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Keys of `base` that `other` lacks or leaves empty. Used to keep locale files complete. */
export function missingKeys(base: Record<string, unknown>, other: Record<string, unknown>): string[] {
  return Object.keys(base).filter((k) => !filled(other[k]));
}

/**
 * Checks scenario JSON before the game trusts it. Every Text must have English,
 * plus each language in `langs` (pass the languages the build ships).
 */
export function validateScenario(raw: unknown, opts: { langs?: readonly string[] } = {}): ValidationResult {
  const langs = ['en', ...(opts.langs ?? []).filter((l) => l !== 'en')];
  const errors: string[] = [];
  const err = (path: string, message: string) => errors.push(`${path}: ${message}`);

  const text = (v: unknown, path: string) => {
    const missing = isObj(v) ? langs.filter((l) => !filled(v[l])) : langs;
    for (const l of missing) err(path, `missing "${l}"`);
  };
  const optionalText = (v: unknown, path: string) => v !== undefined && text(v, path);
  const id = (v: unknown, path: string) => filled(v) || err(path, 'needs a non-empty id');
  const list = (v: unknown, path: string, each: (item: Obj, path: string) => void, min = 1, noun = 'entry') => {
    const items = Array.isArray(v) ? v : [];
    if (items.length < min) err(path, `needs at least ${min} ${noun}`);
    items.forEach((item, i) => (isObj(item) ? each(item, `${path}[${i}]`) : err(`${path}[${i}]`, 'must be an object')));
  };
  const texts = (v: unknown, path: string, min: number, noun: string) => {
    const items = Array.isArray(v) ? v : [];
    if (items.length < min) err(path, `needs at least ${min} ${noun}`);
    items.forEach((item, i) => text(item, `${path}[${i}]`));
  };

  const checkScreen = (s: Obj, p: string) => {
    switch (s.kind) {
      case 'briefing':
        text(s.title, `${p}.title`);
        texts(s.body, `${p}.body`, 1, 'paragraph');
        break;
      case 'choice': {
        text(s.title, `${p}.title`);
        const optionIds: unknown[] = [];
        list(s.options, `${p}.options`, (o, op) => {
          id(o.id, `${op}.id`);
          optionIds.push(o.id);
          text(o.label, `${op}.label`);
          if (typeof o.mask !== 'string' || !(o.mask in FILTER_PENETRATION)) err(`${op}.mask`, `unknown mask "${String(o.mask)}"`);
        }, 2, 'options');
        list(s.tasks, `${p}.tasks`, (t, tp) => {
          id(t.id, `${tp}.id`);
          text(t.prompt, `${tp}.prompt`);
          text(t.explain, `${tp}.explain`);
          const correct = Array.isArray(t.correct) ? t.correct : [];
          if (correct.length === 0) err(`${tp}.correct`, 'needs at least 1 option');
          for (const c of correct) if (!optionIds.includes(c)) err(`${tp}.correct`, `unknown option "${String(c)}"`);
          if (!optionIds.includes(t.best)) err(`${tp}.best`, `unknown option "${String(t.best)}"`);
          else if (!correct.includes(t.best)) err(`${tp}.best`, `"${String(t.best)}" is not one of the correct options`);
        });
        break;
      }
      case 'stock':
        text(s.title, `${p}.title`);
        optionalText(s.hint, `${p}.hint`);
        list(s.items, `${p}.items`, (it, ip) => {
          id(it.id, `${ip}.id`);
          text(it.name, `${ip}.name`);
          text(it.detail, `${ip}.detail`);
          text(it.explain, `${ip}.explain`);
          if (typeof it.usable !== 'boolean') err(`${ip}.usable`, 'must be true or false');
        });
        break;
      case 'sequence':
        text(s.title, `${p}.title`);
        optionalText(s.hint, `${p}.hint`);
        optionalText(s.mistakeGroup, `${p}.mistakeGroup`);
        text(s.explain, `${p}.explain`);
        id(s.mistakeCode, `${p}.mistakeCode`);
        texts(s.steps, `${p}.steps`, 2, 'steps');
        if (s.traps !== undefined) {
          list(s.traps, `${p}.traps`, (t, tp) => {
            text(t.label, `${tp}.label`);
            text(t.explain, `${tp}.explain`);
          }, 0);
        }
        break;
      default:
        if (!(PLACEHOLDER_KINDS as readonly unknown[]).includes(s.kind)) err(`${p}.kind`, `unknown screen kind "${String(s.kind)}"`);
    }
  };

  if (!isObj(raw)) return { ok: false, errors: ['scenario: must be an object'] };
  id(raw.id, 'id');
  text(raw.title, 'title');
  const team = Array.isArray(raw.team) ? raw.team : [];
  team.forEach((m, i) => {
    if (!isObj(m) || !filled(m.id) || !filled(m.name)) err(`team[${i}]`, 'needs an id and a name');
  });
  if (!team.some((m) => isObj(m) && m.id === 'you')) err('team', 'needs a member with id "you"');
  const seen = new Set<unknown>();
  list(raw.screens, 'screens', (s, p) => {
    id(s.id, `${p}.id`);
    if (seen.has(s.id)) err(`${p}.id`, `duplicate screen id "${String(s.id)}"`);
    seen.add(s.id);
    checkScreen(s, p);
  }, 1, 'screen');

  return errors.length > 0 ? { ok: false, errors } : { ok: true, scenario: raw as unknown as Scenario };
}
