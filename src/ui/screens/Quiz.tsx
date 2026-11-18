import { cleanTrainerCode, isRole, ROLES, TRAINER_CODE_MAX, type RunContext } from '../../engine/context';
import type { QuizDef, QuizScreen, RatingQuestion } from '../../engine/scenario';
import type { Action, RatingScale, ScreenProgress } from '../../engine/session';
import { inLang } from '../../engine/text';
import { t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: QuizScreen;
  quiz: QuizDef;
  progress: Extract<ScreenProgress, { kind: 'quiz' }>;
  context: RunContext;
  dispatch: (action: Action) => void;
}

/** A 1 to 5 scale. The chosen number stays pressed and can be changed. */
function Rating({ lang, id, question, value, onRate }: { lang: Lang; id: string; question: RatingQuestion; value: number | null; onRate: (v: number) => void }) {
  return (
    <fieldset class="q" data-testid={`quiz-${id}`}>
      <legend>{inLang(question.prompt, lang)}</legend>
      <div class="likert">
        {[1, 2, 3, 4, 5].map((v) => (
          <button type="button" class="btn" aria-pressed={value === v} onClick={() => onRate(v)}>
            {v}
          </button>
        ))}
      </div>
      <div class="scale-ends muted">
        <span>{inLang(question.low, lang)}</span>
        <span>{inLang(question.high, lang)}</span>
      </div>
    </fieldset>
  );
}

/** The pre-check or post-check: confidence, the quiz, and (after the drill) comfort and willingness. No answers are marked here. */
export function Quiz({ lang, screen, quiz, progress, context, dispatch }: Props) {
  const rate = (scale: RatingScale) => (value: number) => dispatch({ type: 'rate', scale, value });
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.note && <p class="muted">{inLang(screen.note, lang)}</p>}
      <Rating lang={lang} id="confidence" question={quiz.confidence} value={progress.confidence} onRate={rate('confidence')} />
      {quiz.items.map((item, i) => (
        <fieldset class="q" key={item.id} data-testid={`quiz-${item.id}`}>
          <legend>
            {i + 1}. {inLang(item.prompt, lang)}
          </legend>
          {item.options.map((o) => (
            <button type="button" class="btn" aria-pressed={progress.answers[item.id] === o.id} onClick={() => dispatch({ type: 'answerQuiz', itemId: item.id, optionId: o.id })}>
              {inLang(o.label, lang)}
            </button>
          ))}
        </fieldset>
      ))}
      {screen.phase === 'post' && (
        <>
          <Rating lang={lang} id="comfort" question={quiz.comfort} value={progress.comfort} onRate={rate('comfort')} />
          <Rating lang={lang} id="willing" question={quiz.willingToWear} value={progress.willingToWear} onRate={rate('willingToWear')} />
        </>
      )}
      {screen.phase === 'pre' && (
        <>
          <label class="field">
            <span>{t(lang, 'quiz.role.label')}</span>
            <select
              data-testid="role"
              value={context.role ?? ''}
              onChange={(e) => dispatch({ type: 'setContext', role: isRole(e.currentTarget.value) ? e.currentTarget.value : null })}
            >
              <option value="">{t(lang, 'quiz.role.none')}</option>
              {ROLES.map((r) => (
                <option value={r}>{t(lang, `role.${r}`)}</option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>{t(lang, 'quiz.trainer.label')}</span>
            <input
              type="text"
              data-testid="trainer-code"
              value={context.trainerCode ?? ''}
              maxLength={TRAINER_CODE_MAX}
              autocomplete="off"
              autocapitalize="characters"
              spellcheck={false}
              aria-describedby="trainer-hint"
              onInput={(e) => {
                // Show only what will be kept, so nobody thinks a name was accepted.
                const code = cleanTrainerCode(e.currentTarget.value);
                e.currentTarget.value = code;
                dispatch({ type: 'setContext', trainerCode: code });
              }}
            />
          </label>
          <p class="muted" id="trainer-hint">
            {t(lang, 'quiz.trainer.hint')}
          </p>
        </>
      )}
    </>
  );
}
