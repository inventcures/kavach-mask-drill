import type { BinsScreen } from '../../engine/scenario';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: BinsScreen;
  /** Bin id chosen for each item so far. */
  placed: Readonly<Record<string, string>>;
  logAnswer: number | null;
  onPlace: (itemId: string, binId: string) => void;
  onLog: (value: number) => void;
}

/** Put each used item in the right bin, then do the stock-log sum. One go at each. */
export function Bins({ lang, screen, placed, logAnswer, onPlace, onLog }: Props) {
  const q = screen.logQuestion;
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.hint && <p class="muted">{inLang(screen.hint, lang)}</p>}
      {screen.items.map((item) => {
        const chosen = placed[item.id];
        return (
          <fieldset class="item" key={item.id} data-testid={`bin-${item.id}`}>
            <legend class="t">{inLang(item.name, lang)}</legend>
            <div class="row2">
              {screen.bins.map((bin) => {
                const isChosen = chosen === bin.id;
                const isRight = chosen !== undefined && bin.id === item.bin;
                return (
                  <button type="button" class={`btn ${isRight ? 'ok' : isChosen ? 'no' : ''}`} disabled={chosen !== undefined} onClick={() => onPlace(item.id, bin.id)}>
                    {(isChosen || isRight) && <Mark lang={lang} kind={isRight ? 'good' : 'bad'} />}
                    {inLang(bin.name, lang)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {q && (
        // A long question reads badly as a legend sitting on the border, so it is a labelled group instead.
        <div class="item" role="group" aria-labelledby="stock-log-q" data-testid="stock-log">
          <p class="t" id="stock-log-q">
            {inLang(q.prompt, lang)}
          </p>
          <div class="row2">
            {q.options.map((value) => {
              const isChosen = logAnswer === value;
              const isRight = logAnswer !== null && value === q.answer;
              return (
                <button type="button" class={`btn ${isRight ? 'ok' : isChosen ? 'no' : ''}`} disabled={logAnswer !== null} onClick={() => onLog(value)}>
                  {(isChosen || isRight) && <Mark lang={lang} kind={isRight ? 'good' : 'bad'} />}
                  {value}
                </button>
              );
            })}
          </div>
          {logAnswer !== null && (
            <Feedback lang={lang} kind={logAnswer === q.answer ? 'good' : 'bad'}>
              {inLang(q.explain, lang)}
            </Feedback>
          )}
        </div>
      )}
    </>
  );
}
