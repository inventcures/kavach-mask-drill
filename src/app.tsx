import { useEffect, useState } from 'preact/hooks';
import { LangToggle } from './ui/components/LangToggle';
import { loadLang, saveLang, t, type Lang } from './ui/i18n';
import { MeterDemo } from './ui/dev/MeterDemo';
import { Home } from './ui/screens/Home';

const DEV_METER_ROUTE = '#/dev/meter';

/** Wires the engine to the screens. For now: the home screen, plus a story page for the meter. */
export function App() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const [route, setRoute] = useState(() => location.hash);

  useEffect(() => {
    const onHash = () => setRoute(location.hash);
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(lang, 'app.title');
  }, [lang]);

  const changeLang = (next: Lang) => {
    saveLang(next);
    setLang(next);
  };

  return (
    <>
      <header>
        <h1>{t(lang, 'app.title')}</h1>
        <LangToggle lang={lang} onChange={changeLang} />
      </header>
      {route === DEV_METER_ROUTE ? (
        <MeterDemo lang={lang} />
      ) : (
        <main>
          <Home lang={lang} />
        </main>
      )}
    </>
  );
}
