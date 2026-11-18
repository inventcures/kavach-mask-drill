import { LEAK_SITES, type LeakSite, type SealScreen } from '../../engine/scenario';
import { inLang } from '../../engine/text';
import { Feedback, Mark } from '../components/Feedback';
import { t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  screen: SealScreen;
  /** Leak sites still leaking. Empty means the seal check is passed. */
  open: readonly LeakSite[];
  /** Ids of the harmful actions already done. */
  harmDone: readonly string[];
  /** The action whose explanation is showing. */
  last: string | null;
  /** Bad stock reached the team, so a good seal still leaks. */
  badStock: boolean;
  onAction: (actionId: string) => void;
}

/** Where the puffs of escaping air are drawn for each leak site. */
const PUFFS: Record<LeakSite, readonly (readonly [number, number])[]> = {
  nose: [[82, 88], [112, 88]],
  side: [[32, 128], [162, 128]],
  chin: [[96, 192]],
};

/** A face in an N95 with a puff of air at every site that still leaks. */
function Face({ lang, open }: { lang: Lang; open: readonly LeakSite[] }) {
  const leaking = LEAK_SITES.filter((site) => open.includes(site));
  const label =
    leaking.length === 0
      ? t(lang, 'seal.face.sealed')
      : t(lang, 'seal.face.leaking', { sites: leaking.map((site) => t(lang, `seal.site.${site}`)).join(', ') });
  return (
    <svg class="face" viewBox="0 0 200 220" role="img" aria-label={label} data-testid="face">
      <ellipse cx="100" cy="105" rx="70" ry="90" fill="#c99a76" />
      <ellipse cx="72" cy="80" rx="8" ry="5" fill="#2b2b2b" />
      <ellipse cx="128" cy="80" rx="8" ry="5" fill="#2b2b2b" />
      <path d="M40 105 Q100 90 160 105 Q158 165 100 185 Q42 165 40 105Z" fill="#f2f2f0" stroke="#99aaaa" stroke-width="2" />
      <path d="M85 100 Q100 93 115 100" stroke="#777777" stroke-width="3" fill="none" />
      <line x1="40" y1="110" x2="20" y2="100" stroke="#3a6ea5" stroke-width="3" />
      <line x1="160" y1="110" x2="180" y2="100" stroke="#3a6ea5" stroke-width="3" />
      <line x1="48" y1="150" x2="22" y2="160" stroke="#3a6ea5" stroke-width="3" />
      <line x1="152" y1="150" x2="178" y2="160" stroke="#3a6ea5" stroke-width="3" />
      {leaking.flatMap((site) =>
        PUFFS[site].map(([x, y]) => (
          <g class="leak" key={`${site}-${x}`} data-leak={site}>
            <circle cx={x} cy={y} r="5" fill="#2f7fd6" stroke="#ffffff" stroke-width="1.5" />
            <circle cx={x + 7} cy={y - 6} r="3.5" fill="#2f7fd6" stroke="#ffffff" stroke-width="1.5" />
          </g>
        )),
      )}
    </svg>
  );
}

/**
 * The user seal check. Fixes are never used up, so whatever a harmful action
 * re-opens can be closed again and the screen cannot trap the player.
 */
export function Seal({ lang, screen, open, harmDone, last, badStock, onAction }: Props) {
  const passed = open.length === 0;
  return (
    <>
      <h2>{inLang(screen.title, lang)}</h2>
      {screen.hint && <p class="muted">{inLang(screen.hint, lang)}</p>}
      <Face lang={lang} open={open} />
      {passed ? (
        <div data-testid="seal-passed">
          <Feedback lang={lang} kind="good">
            {inLang(screen.passed, lang)}
          </Feedback>
          <Feedback lang={lang} kind="warn">
            {inLang(screen.notFitTest, lang)}
          </Feedback>
          {badStock && screen.badStockNote && (
            <Feedback lang={lang} kind="bad">
              {inLang(screen.badStockNote, lang)}
            </Feedback>
          )}
        </div>
      ) : (
        <p class="muted" aria-live="polite" data-testid="leaks-left">
          {t(lang, 'seal.leaksLeft', { n: open.length })}
        </p>
      )}
      <div data-testid="seal-actions">
        {screen.actions.map((a) => {
          const harmed = a.harmful === true && harmDone.includes(a.id);
          const fixed = a.fixes !== undefined && !open.includes(a.fixes);
          return (
            <div key={a.id}>
              <button type="button" class={`btn ${harmed ? 'no' : fixed ? 'ok' : ''}`} disabled={passed || harmed} onClick={() => onAction(a.id)}>
                {harmed && <Mark lang={lang} kind="bad" />}
                {fixed && <Mark lang={lang} kind="good" />}
                {inLang(a.label, lang)}
              </button>
              {last === a.id && (
                <Feedback lang={lang} kind={a.harmful ? 'bad' : 'good'}>
                  {inLang(a.explain, lang)}
                </Feedback>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
