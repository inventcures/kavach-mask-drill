import type { ChoiceScreen } from '../../engine/scenario';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import { t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: ChoiceScreen;
  /** Option id picked for each answered task. */
  picks: Readonly<Record<string, string>>;
  onPick: (taskId: string, optionId: string) => void;
}

/** Several tasks, the same options for each. One pick per task, with the reason shown at once. */
export function Choice({ lang, screen, picks, onPick }: Props) {
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.tasks.map((task) => {
        const picked = picks[task.id];
        const right = picked !== undefined && task.correct.includes(picked);
        return (
          <fieldset class="item" key={task.id} data-testid={`task-${task.id}`}>
            <legend class="t">{inLang(task.prompt, lang)}</legend>
            {screen.options.map((o) => {
              const isPicked = picked === o.id;
              const showBest = picked !== undefined && !right && o.id === task.best;
              const cls = isPicked ? (right ? 'ok' : 'no') : showBest ? 'ok' : '';
              return (
                <button type="button" class={`btn ${cls}`} disabled={picked !== undefined} onClick={() => onPick(task.id, o.id)}>
                  {isPicked && <Mark lang={lang} kind={right ? 'good' : 'bad'} />}
                  {showBest && (
                    <span class="mark good" role="img" aria-label={t(lang, 'choice.best')}>
                      ✓
                    </span>
                  )}
                  {inLang(o.label, lang)}
                </button>
              );
            })}
            {picked !== undefined && (
              <Feedback lang={lang} kind={right ? 'good' : 'bad'}>
                {inLang(task.explain, lang)}
              </Feedback>
            )}
          </fieldset>
        );
      })}
    </>
  );
}
