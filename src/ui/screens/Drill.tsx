import { useEffect } from 'preact/hooks';
import type { Scenario } from '../../engine/scenario';
import { canAdvance, currentScreen, teamMembers, type Action, type SessionState } from '../../engine/session';
import { Meter } from '../components/Meter';
import { t, type Lang } from '../i18n';
import { Briefing } from './Briefing';
import { Choice } from './Choice';
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

  useEffect(() => {
    scrollTo(0, 0);
  }, [session.index, session.finished]);

  if (!screen) {
    return (
      <>
        <Meter lang={lang} members={team} />
        <main>
          <section class="card" data-testid="drill-end">
            <h2>{t(lang, 'drill.end.heading')}</h2>
            <p>{t(lang, 'drill.end.body')}</p>
            <button type="button" class="btn" disabled>
              {t(lang, 'drill.end.continue')}
            </button>
          </section>
        </main>
        <div class="foot">
          <button type="button" class="btn primary" onClick={() => dispatch({ type: 'restart' })}>
            {t(lang, 'drill.restart')}
          </button>
        </div>
      </>
    );
  }

  const progress = session.progress[screen.id];
  return (
    <>
      <Meter lang={lang} members={team} />
      <main>
        <section class="card" data-testid={`screen-${screen.id}`}>
          <div class="step">{t(lang, 'drill.step', { n: session.index + 1, total: scenario.screens.length })}</div>
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
        </section>
      </main>
      {canAdvance(scenario, session) && (
        <div class="foot">
          <button type="button" class="btn primary" onClick={() => dispatch({ type: 'next' })}>
            {t(lang, 'drill.next')}
          </button>
        </div>
      )}
    </>
  );
}
