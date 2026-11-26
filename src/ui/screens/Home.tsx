import { t, type Lang } from '../i18n';

/** Landing screen: what the drill is, why it exists, and the button that starts it. */
export function Home({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  return (
    <main>
      <section class="card">
        <h2>{t(lang, 'home.heading')}</h2>
        <p class="lede">{t(lang, 'home.tagline')}</p>
      </section>
      <section class="card">
        <h3>{t(lang, 'home.what')}</h3>
        <p>{t(lang, 'home.intro')}</p>
        <p>{t(lang, 'home.score')}</p>
      </section>
      <section class="card">
        <h3>{t(lang, 'home.why')}</h3>
        <p>{t(lang, 'home.why1')}</p>
        <p>{t(lang, 'home.why2')}</p>
        <p>{t(lang, 'home.why3')}</p>
      </section>
      <p class="muted">{t(lang, 'home.disclaimer')}</p>
      <div class="foot">
        <button type="button" class="btn primary" onClick={onStart}>
          {t(lang, 'home.start')}
        </button>
      </div>
    </main>
  );
}
