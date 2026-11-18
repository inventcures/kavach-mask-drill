import type { BuddyScreen } from '../../engine/scenario';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: BuddyScreen;
  /** Member id to display name. */
  names: Readonly<Record<string, string>>;
  /** Option id picked for each teammate checked so far. */
  picks: Readonly<Record<string, string>>;
  onPick: (memberId: string, optionId: string) => void;
}

/** Look at each teammate and decide what to do. Each decision sets that teammate's leakage on the meter. */
export function Buddy({ lang, screen, names, picks, onPick }: Props) {
  const allChecked = screen.mates.every((m) => m.member in picks);
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.hint && <p class="muted">{inLang(screen.hint, lang)}</p>}
      {screen.mates.map((mate) => {
        const picked = mate.options.find((o) => o.id === picks[mate.member]);
        return (
          <fieldset class="item" key={mate.member} data-testid={`mate-${mate.member}`}>
            <legend class="t">{names[mate.member] ?? mate.member}</legend>
            <div class="d">{inLang(mate.detail, lang)}</div>
            {mate.options.map((o) => (
              <button
                type="button"
                key={o.id}
                class={`btn ${picked === o ? (o.ok ? 'ok' : 'no') : ''}`}
                disabled={picked !== undefined}
                onClick={() => onPick(mate.member, o.id)}
              >
                {picked === o && <Mark lang={lang} kind={o.ok ? 'good' : 'bad'} />}
                {inLang(o.label, lang)}
              </button>
            ))}
            {picked && (
              <Feedback lang={lang} kind={picked.ok ? 'good' : 'bad'}>
                {inLang(picked.explain, lang)}
              </Feedback>
            )}
          </fieldset>
        );
      })}
      {allChecked && (
        <div data-testid="buddy-explain">
          <Feedback lang={lang} kind="warn">
            {inLang(screen.explain, lang)}
          </Feedback>
        </div>
      )}
    </>
  );
}
