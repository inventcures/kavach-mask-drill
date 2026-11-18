import type { StockScreen } from '../../engine/scenario';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import { t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: StockScreen;
  decisions: Readonly<Record<string, 'use' | 'reject'>>;
  onDecide: (itemId: string, use: boolean) => void;
}

/** Use or reject each item in the store. */
export function StockCheck({ lang, screen, decisions, onDecide }: Props) {
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.hint && <p class="muted">{inLang(screen.hint, lang)}</p>}
      {screen.items.map((item) => {
        const decision = decisions[item.id];
        const right = decision !== undefined && (decision === 'use') === item.usable;
        return (
          <fieldset class="item" key={item.id} data-testid={`stock-${item.id}`}>
            <legend class="t">{inLang(item.name, lang)}</legend>
            <p class="d">{inLang(item.detail, lang)}</p>
            <div class="row2">
              {(['use', 'reject'] as const).map((d) => {
                // Once decided, the right answer is marked whether or not it was the one picked.
                const isRight = decision !== undefined && (d === 'use') === item.usable;
                const isPicked = decision === d;
                return (
                  <button type="button" class={`btn ${isRight ? 'ok' : isPicked ? 'no' : ''}`} disabled={decision !== undefined} onClick={() => onDecide(item.id, d === 'use')}>
                    {(isRight || isPicked) && <Mark lang={lang} kind={isRight ? 'good' : 'bad'} />}
                    {t(lang, `stock.${d}`)}
                  </button>
                );
              })}
            </div>
            {decision !== undefined && (
              <Feedback lang={lang} kind={right ? 'good' : 'bad'}>
                {inLang(item.explain, lang)}
              </Feedback>
            )}
          </fieldset>
        );
      })}
    </>
  );
}
