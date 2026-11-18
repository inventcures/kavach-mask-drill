import { t, type Lang } from '../i18n';

/** Landing screen: what the drill is, and the button that starts it. */
export function Home({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  return (
    <main>
      <section class="card">
        <h2>{t(lang, 'home.heading')}</h2>
        <p>{t(lang, 'home.intro')}</p>
        <p>{t(lang, 'home.score')}</p>
        <p class="muted">{t(lang, 'home.disclaimer')}</p>
      </section>
      <div class="foot">
        <button type="button" class="btn primary" onClick={onStart}>
          {t(lang, 'home.start')}
        </button>
      </div>
    </main>
  );
}
