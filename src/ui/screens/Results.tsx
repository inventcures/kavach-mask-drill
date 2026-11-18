import { useState } from 'preact/hooks';
import { FILTER_PENETRATION } from '../../engine/constants';
import type { Scenario } from '../../engine/scenario';
import { teamProtection } from '../../engine/scoring';
import { groupMistakes, quizResult, teamMembers, type SessionState } from '../../engine/session';
import { buildResult, deleteRuns, exportJson } from '../../engine/telemetry';
import { inLang } from '../../engine/text';
import { Feedback } from '../components/Feedback';
import { formatPercent } from '../components/Meter';
import { TeamRow } from '../components/TeamRow';
import { t, type Lang } from '../i18n';
import { downloadText, phoneStore } from '../store';

interface Props {
  lang: Lang;
  scenario: Scenario;
  session: SessionState;
  onRestart: () => void;
}

/** The end of the drill: the team's score, what went wrong, before vs after, and the player's own data. */
export function Results({ lang, scenario, session, onRestart }: Props) {
  const [deleted, setDeleted] = useState(false);
  const team = teamMembers(scenario, session);
  const protection = teamProtection(team);
  const leakage = protection?.leakage ?? 1;
  const mistakes = groupMistakes(scenario, session.mistakes);
  const pre = quizResult(scenario, session, 'pre');
  const post = quizResult(scenario, session, 'post');
  const outOf = (value: number | undefined, max: number | string) => `${value ?? '–'}/${max}`;

  return (
    <>
      <main data-testid="results">
        <section class="card">
          <h2>{t(lang, 'results.heading')}</h2>
          <div class="muted">{t(lang, 'results.teamAvg')}</div>
          <div class="big" data-testid="results-percent">
            {formatPercent(leakage)}%
          </div>
          <p data-testid="results-pf">{t(lang, 'results.pf', { pf: (1 / leakage).toFixed(1), perfect: Math.round(1 / FILTER_PENETRATION.n95) })}</p>
          <p data-testid="results-contamination">{t(lang, 'results.contamination', { n: session.contaminationEvents })}</p>
          <TeamRow lang={lang} members={team} />
        </section>

        <section class="card">
          <h3>{t(lang, 'results.workOn')}</h3>
          {mistakes.length === 0 ? (
            <Feedback lang={lang} kind="good">
              {t(lang, 'results.noMistakes')}
            </Feedback>
          ) : (
            <ul class="chips" data-testid="mistakes">
              {mistakes.map((m) => (
                <li class="chip">
                  {inLang(m.label, lang)}
                  {m.count > 1 && ` ×${m.count}`}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="card">
          <h3>{t(lang, 'results.beforeAfter')}</h3>
          <table data-testid="before-after">
            <thead>
              <tr>
                <td />
                <th scope="col">{t(lang, 'results.before')}</th>
                <th scope="col">{t(lang, 'results.after')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{t(lang, 'results.quizScore')}</th>
                <td>{outOf(pre?.score, pre?.max ?? post?.max ?? '–')}</td>
                <td>{outOf(post?.score, post?.max ?? pre?.max ?? '–')}</td>
              </tr>
              <tr>
                <th scope="row">{t(lang, 'results.confidence')}</th>
                <td>{outOf(pre?.confidence, 5)}</td>
                <td>{outOf(post?.confidence, 5)}</td>
              </tr>
            </tbody>
          </table>
          <p class="muted">{t(lang, 'results.stored')}</p>
          <button type="button" class="btn" disabled={deleted} onClick={() => downloadText('mask-drill-results.json', exportJson(phoneStore(), buildResult(scenario, session, lang)), 'application/json')}>
            {t(lang, 'results.download')}
          </button>
          <button
            type="button"
            class="btn"
            disabled={deleted}
            onClick={() => {
              deleteRuns(phoneStore());
              setDeleted(true);
            }}
          >
            {t(lang, 'results.delete')}
          </button>
          {deleted && (
            <p role="status" data-testid="deleted">
              {t(lang, 'results.deleted')}
            </p>
          )}
        </section>

        <section class="card">
          <h3>{t(lang, 'results.remember.heading')}</h3>
          <ol class="remember">
            <li>{t(lang, 'results.remember.1')}</li>
            <li>{t(lang, 'results.remember.2')}</li>
            <li>{t(lang, 'results.remember.3')}</li>
          </ol>
        </section>
      </main>
      <div class="foot">
        <button type="button" class="btn primary" onClick={onRestart}>
          {t(lang, 'drill.restart')}
        </button>
      </div>
    </>
  );
}
