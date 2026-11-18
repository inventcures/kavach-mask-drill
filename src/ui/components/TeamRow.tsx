import { protectionBand, type ScoredMember } from '../../engine/scoring';
import { inLang, type Text } from '../../engine/text';
import { t, type Lang } from '../i18n';
import { formatPercent } from './Meter';

export interface TeamMember extends ScoredMember {
  /** Display name in each language. The member with id `you` is shown as "You" from the locale file. */
  name: Text;
}

/** One dot per member with their protection %, or "?" before they are masked up. */
export function TeamRow({ lang, members }: { lang: Lang; members: readonly TeamMember[] }) {
  return (
    <ul class="team" data-testid="team-row">
      {members.map((m) => {
        const band = m.leakage === null ? 'unknown' : protectionBand((1 - m.leakage) * 100);
        return (
          <li class="mem" key={m.id}>
            {m.leakage === null ? (
              <span class="dot unknown" role="img" aria-label={t(lang, 'team.unknown')}>
                ?
              </span>
            ) : (
              <span class={`dot ${band}`}>{formatPercent(m.leakage)}%</span>
            )}
            <span class="mem-name">{m.id === 'you' ? t(lang, 'team.you') : inLang(m.name, lang)}</span>
          </li>
        );
      })}
    </ul>
  );
}
