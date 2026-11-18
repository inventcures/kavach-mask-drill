import type { SequenceScreen } from '../../engine/scenario';
import { isSequenceComplete, sequenceCards } from '../../engine/sequence';
import type { ScreenProgress } from '../../engine/session';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import { t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: SequenceScreen;
  progress: Extract<ScreenProgress, { kind: 'sequence' }>;
  onTap: (cardId: string) => void;
}

/** Any ordered task (donning, doffing): tap the cards in order, avoiding the traps. */
export function Sequence({ lang, screen, progress, onTap }: Props) {
  const { seq, last, order } = progress;
  const cards = new Map(sequenceCards(screen).map((c) => [c.id, c]));
  const complete = isSequenceComplete(screen, seq);
  const trap = last?.outcome.kind === 'trap' ? screen.traps?.[last.outcome.trap] : undefined;
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.hint && <p class="muted">{inLang(screen.hint, lang)}</p>}
      <ol class="seq" aria-label={t(lang, 'sequence.placed')} data-testid="placed">
        {seq.placed.map((id, i) => (
          <li class="chip">
            {i + 1}. {inLang(cards.get(id)!.label, lang)}
          </li>
        ))}
      </ol>
      {complete && (
        <Feedback lang={lang} kind={seq.errors > 0 ? 'warn' : 'good'}>
          {inLang(screen.explain, lang)}
        </Feedback>
      )}
      {!complete && trap && (
        <Feedback lang={lang} kind="bad">
          {inLang(trap.explain, lang)}
        </Feedback>
      )}
      {!complete && last?.outcome.kind === 'outOfOrder' && (
        <Feedback lang={lang} kind="bad">
          {t(lang, 'sequence.notYet', { n: last.outcome.expectedStep + 1 })}
        </Feedback>
      )}
      <div data-testid="cards">
        {order.map((id) => {
          const card = cards.get(id)!;
          const placed = seq.placed.includes(id);
          const sprung = seq.sprung.includes(id);
          const flash = !complete && last?.cardId === id && last.outcome.kind === 'outOfOrder';
          return (
            <button
              type="button"
              // A new key per error restarts the red flash when the same card is tapped wrongly twice.
              key={flash ? `${id}-${seq.errors}` : id}
              class={`btn ${placed ? 'ok' : sprung ? 'no' : flash ? 'flash' : ''}`}
              disabled={complete || placed || sprung}
              onClick={() => onTap(id)}
            >
              {placed && <Mark lang={lang} kind="good" />}
              {sprung && <Mark lang={lang} kind="bad" />}
              {inLang(card.label, lang)}
            </button>
          );
        })}
      </div>
    </>
  );
}
