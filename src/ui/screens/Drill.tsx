import { useEffect } from 'preact/hooks';
import type { Scenario } from '../../engine/scenario';
import { canAdvance, currentScreen, drillStep, teamMembers, type Action, type SessionState } from '../../engine/session';
import { Meter } from '../components/Meter';
import { t, type Lang } from '../i18n';
import { Bins } from './Bins';
import { Briefing } from './Briefing';
import { Buddy } from './Buddy';
import { Choice } from './Choice';
import { Quiz } from './Quiz';
import { Results } from './Results';
import { Seal } from './Seal';
import { Sequence } from './Sequence';
import { StockCheck } from './StockCheck';

interface Props {
  lang: Lang;
  scenario: Scenario;
  session: SessionState;
  dispatch: (action: Action) => void;
}

/** Shows whichever screen the session is on. All state lives in the session, so a language switch loses nothing. */
export function Drill({ lang, scenario, session, dispatch }: Props) {
  const screen = currentScreen(scenario, session);
  const team = teamMembers(scenario, session);

  // A new screen starts at the top and takes the focus, so screen-reader and keyboard users are not left on the old Next button.
  useEffect(() => {
    document.querySelector('main')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }, [session.index, session.finished]);

  if (!screen) return <Results lang={lang} scenario={scenario} session={session} onRestart={() => dispatch({ type: 'restart' })} />;

  const progress = session.progress[screen.id];
  const at = drillStep(scenario, session);
  const isLast = session.index === scenario.screens.length - 1;
  return (
    <>
      <Meter lang={lang} members={team} />
      <main tabIndex={-1}>
        <section class="card" data-testid={`screen-${screen.id}`}>
          {at && <div class="step">{t(lang, 'drill.step', at)}</div>}
          {screen.kind === 'briefing' && <Briefing lang={lang} screen={screen} team={team} />}
          {screen.kind === 'choice' && progress?.kind === 'choice' && (
            <Choice lang={lang} screen={screen} picks={progress.picks} onPick={(taskId, optionId) => dispatch({ type: 'pickOption', taskId, optionId })} />
          )}
          {screen.kind === 'stock' && progress?.kind === 'stock' && (
            <StockCheck lang={lang} screen={screen} decisions={progress.decisions} onDecide={(itemId, use) => dispatch({ type: 'decideStock', itemId, use })} />
          )}
          {screen.kind === 'sequence' && progress?.kind === 'sequence' && (
            <Sequence lang={lang} screen={screen} progress={progress} onTap={(cardId) => dispatch({ type: 'tapCard', cardId })} />
          )}
          {screen.kind === 'seal' && progress?.kind === 'seal' && (
            <Seal
              lang={lang}
              screen={screen}
              open={progress.open}
              harmDone={progress.harmDone}
              last={progress.last}
              badStock={session.fits.you?.faults.includes('badStock') ?? false}
              onAction={(actionId) => dispatch({ type: 'sealAction', actionId })}
            />
          )}
          {screen.kind === 'buddy' && progress?.kind === 'buddy' && (
            <Buddy
              lang={lang}
              screen={screen}
              names={Object.fromEntries(scenario.team.map((m) => [m.id, m.name]))}
              picks={progress.picks}
              onPick={(memberId, optionId) => dispatch({ type: 'buddyPick', memberId, optionId })}
            />
          )}
          {screen.kind === 'bins' && progress?.kind === 'bins' && (
            <Bins
              lang={lang}
              screen={screen}
              placed={progress.placed}
              logAnswer={progress.logAnswer}
              onPlace={(itemId, binId) => dispatch({ type: 'binItem', itemId, binId })}
              onLog={(value) => dispatch({ type: 'answerLog', value })}
            />
          )}
          {screen.kind === 'quiz' && progress?.kind === 'quiz' && scenario.quiz && (
            <Quiz lang={lang} screen={screen} quiz={scenario.quiz} progress={progress} context={session.context} dispatch={dispatch} />
          )}
          {at && (
            <p class="muted protocol" data-testid="protocol-note">
              {t(lang, 'drill.protocol')}
            </p>
          )}
        </section>
      </main>
      {canAdvance(scenario, session) && (
        <div class="foot">
          <button type="button" class="btn primary" onClick={() => dispatch({ type: 'next' })}>
            {t(lang, isLast ? 'quiz.finish' : 'drill.next')}
          </button>
        </div>
      )}
    </>
  );
}
