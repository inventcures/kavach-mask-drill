import { inLang } from '../../engine/text';
import type { BriefingScreen } from '../../engine/scenario';
import { TeamRow, type TeamMember } from '../components/TeamRow';
import { t, type Lang } from '../i18n';

/** A screen to read: the alert, or any other block of context. */
export function Briefing({ lang, screen, team }: { lang: Lang; screen: BriefingScreen; team: readonly TeamMember[] }) {
  return (
    <>
      <h2>
        {screen.icon && <span aria-hidden="true">{screen.icon} </span>}
        {inLang(screen.title, lang)}
      </h2>
      {screen.body.map((para) => (
        <p>{inLang(para, lang)}</p>
      ))}
      {screen.showTeam && (
        <>
          <h3>{t(lang, 'team.heading')}</h3>
          <TeamRow lang={lang} members={team} />
        </>
      )}
    </>
  );
}
