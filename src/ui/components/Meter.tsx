import { protectionBand, teamProtection, type ScoredMember } from '../../engine/scoring';
import { t, type Lang } from '../i18n';

/** Whole-number protection %, never below 0. */
export function formatPercent(leakage: number): string {
  return `${Math.max(0, Math.round((1 - leakage) * 100))}`;
}

/**
 * The live team protection reading, e.g. "88% · PF 8.5 · At risk".
 * Renders nothing until at least one member is masked up.
 */
export function Meter({ lang, members }: { lang: Lang; members: readonly ScoredMember[] }) {
  const p = teamProtection(members);
  if (p === null) return null;
  const percent = formatPercent(p.leakage);
  const band = protectionBand(p.percent);
  return (
    <div class={`meter ${band}`} role="status" data-testid="meter">
      <div class="meter-row">
        <span>{t(lang, 'meter.label')}</span>
        <span class="meter-val">
          <span data-testid="meter-value">
            {percent}% · PF {p.pf.toFixed(1)}
          </span>{' '}
          <span class="meter-band">{t(lang, `meter.band.${band}`)}</span>
        </span>
      </div>
      <div class="bar" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
