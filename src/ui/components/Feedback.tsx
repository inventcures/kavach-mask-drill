import type { ComponentChildren } from 'preact';
import { t, type Lang } from '../i18n';

export type FeedbackKind = 'good' | 'bad' | 'warn';

const ICON: Record<FeedbackKind, string> = { good: '✓', bad: '✗', warn: '⚠' };

/** The tick, cross or warning sign on its own, with a spoken label. Never rely on colour alone. */
export function Mark({ lang, kind }: { lang: Lang; kind: FeedbackKind }) {
  return (
    <span class={`mark ${kind}`} role="img" aria-label={t(lang, `fb.${kind}`)}>
      {ICON[kind]}
    </span>
  );
}

/** Immediate feedback after a choice: icon plus one or two plain sentences. */
export function Feedback({ lang, kind, children }: { lang: Lang; kind: FeedbackKind; children: ComponentChildren }) {
  return (
    <div class={`fb ${kind}`} role="status" data-testid="feedback">
      <Mark lang={lang} kind={kind} />
      <span>{children}</span>
    </div>
  );
}
