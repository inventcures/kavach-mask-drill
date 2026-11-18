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

/** Where air can escape around the mask. The face drawing shows a puff at each open site. */
export const LEAK_SITES = ['nose', 'side', 'chin'] as const;
export type LeakSite = (typeof LEAK_SITES)[number];

/**
 * Something the player can do to the mask during the seal check: either a fix that
 * closes one leak site, or a harmful action that may re-open one.
 */
export interface SealAction {
  id: string;
  label: Text;
  explain: Text;
  /** The leak this closes. A fix stays usable, so a re-opened leak can always be closed again. */
  fixes?: LeakSite;
  /** Costs leakage and is recorded as a mistake. Can be done only once. */
  harmful?: boolean;
  /** Harmful actions only: the leak this opens again. */
  reopens?: LeakSite;
}

export interface SealScreen {
  kind: 'seal';
  id: string;
  title: Text;
  hint?: Text;
  actions: SealAction[];
  /** Shown once no leak is left. */
  passed: Text;
  /** The "seal check is not a fit test" reminder, shown with `passed`. */
  notFitTest: Text;
  /** Shown with `passed` when bad stock reached the team. */
  badStockNote?: Text;
}

export interface BuddyOption {
  id: string;
  label: Text;
  ok: boolean;
  /** The teammate's leakage (0 to 1) after the player chooses this. */
  leakage: number;
  explain: Text;
}

export interface BuddyMate {
  /** Team member id. Never `you`. */
  member: string;
  /** What the player sees when looking at this teammate. */
  detail: Text;
  options: BuddyOption[];
}

export interface BuddyScreen {
  kind: 'buddy';
  id: string;
  title: Text;
  hint?: Text;
  mates: BuddyMate[];
  /** Shown once every teammate is checked: why one leaky teammate matters. */
  explain: Text;
}

/** Screen kinds whose content and behaviour arrive in later tickets. Only `kind` and `id` are checked for now. */
export const PLACEHOLDER_KINDS = ['bins', 'quiz', 'results'] as const;
export interface PlaceholderScreen {
  kind: (typeof PLACEHOLDER_KINDS)[number];
  id: string;
}

export type ScreenDef = BriefingScreen | ChoiceScreen | StockScreen | SequenceScreen | SealScreen | BuddyScreen | PlaceholderScreen;
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

  const isSite = (v: unknown): v is LeakSite => (LEAK_SITES as readonly unknown[]).includes(v);

  const checkScreen = (s: Obj, p: string, memberIds: readonly unknown[]) => {
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
      case 'seal': {
        text(s.title, `${p}.title`);
        optionalText(s.hint, `${p}.hint`);
        text(s.passed, `${p}.passed`);
        text(s.notFitTest, `${p}.notFitTest`);
        optionalText(s.badStockNote, `${p}.badStockNote`);
        const fixed = new Set<unknown>();
        const ids = new Set<unknown>();
        list(s.actions, `${p}.actions`, (a, ap) => {
          id(a.id, `${ap}.id`);
          if (ids.has(a.id)) err(`${ap}.id`, `duplicate action id "${String(a.id)}"`);
          ids.add(a.id);
          text(a.label, `${ap}.label`);
          text(a.explain, `${ap}.explain`);
          const harmful = a.harmful === true;
          if (harmful === (a.fixes !== undefined)) err(ap, 'must either fix a leak or be harmful, not both');
          if (a.fixes !== undefined && !isSite(a.fixes)) err(`${ap}.fixes`, `unknown leak site "${String(a.fixes)}"`);
          if (a.reopens !== undefined && !isSite(a.reopens)) err(`${ap}.reopens`, `unknown leak site "${String(a.reopens)}"`);
          if (a.reopens !== undefined && !harmful) err(`${ap}.reopens`, 'only a harmful action can re-open a leak');
          if (!harmful) fixed.add(a.fixes);
        });
        // Without a fix for every site the player could never get past this screen.
        for (const site of LEAK_SITES) if (!fixed.has(site)) err(`${p}.actions`, `no action fixes the "${site}" leak`);
        break;
      }
      case 'buddy': {
        text(s.title, `${p}.title`);
        optionalText(s.hint, `${p}.hint`);
        text(s.explain, `${p}.explain`);
        const checked = new Set<unknown>();
        list(s.mates, `${p}.mates`, (m, mp) => {
          if (m.member === 'you' || !memberIds.includes(m.member)) err(`${mp}.member`, `"${String(m.member)}" is not a teammate`);
          if (checked.has(m.member)) err(`${mp}.member`, `"${String(m.member)}" is checked twice`);
          checked.add(m.member);
          text(m.detail, `${mp}.detail`);
          const ids = new Set<unknown>();
          let anyOk = false;
          list(m.options, `${mp}.options`, (o, op) => {
            id(o.id, `${op}.id`);
            if (ids.has(o.id)) err(`${op}.id`, `duplicate option id "${String(o.id)}"`);
            ids.add(o.id);
            text(o.label, `${op}.label`);
            text(o.explain, `${op}.explain`);
            if (typeof o.ok !== 'boolean') err(`${op}.ok`, 'must be true or false');
            if (typeof o.leakage !== 'number' || !(o.leakage > 0 && o.leakage <= 1)) err(`${op}.leakage`, 'must be a number above 0 and at most 1');
            anyOk ||= o.ok === true;
          }, 2, 'options');
          if (!anyOk) err(`${mp}.options`, 'needs at least 1 option that is ok');
        });
        break;
      }
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
  const memberIds = team.map((m) => (isObj(m) ? m.id : undefined));
  const seen = new Set<unknown>();
  list(raw.screens, 'screens', (s, p) => {
    id(s.id, `${p}.id`);
    if (seen.has(s.id)) err(`${p}.id`, `duplicate screen id "${String(s.id)}"`);
    seen.add(s.id);
    checkScreen(s, p, memberIds);
  }, 1, 'screen');

  return errors.length > 0 ? { ok: false, errors } : { ok: true, scenario: raw as unknown as Scenario };
}
