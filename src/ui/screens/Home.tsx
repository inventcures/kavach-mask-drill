import { useState } from 'preact/hooks';
import { t, type Lang } from '../i18n';

/** Landing screen. The drill screens arrive in later tickets. */
export function Home({ lang }: { lang: Lang }) {
  const [tapped, setTapped] = useState(false);
  return (
    <>
      <section class="card">
        <h2>{t(lang, 'home.heading')}</h2>
        <p>{t(lang, 'home.intro')}</p>
        <p>{t(lang, 'home.score')}</p>
        <p class="muted">{t(lang, 'home.disclaimer')}</p>
        {tapped && (
          <p class="fb warn" role="status">
            {t(lang, 'home.comingSoon')}
          </p>
        )}
      </section>
      <div class="foot">
        <button type="button" class="btn primary" onClick={() => setTapped(true)}>
          {t(lang, 'home.start')}
        </button>
      </div>
    </>
  );
}
