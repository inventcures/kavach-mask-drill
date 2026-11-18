import { useEffect, useState } from 'preact/hooks';
import { LangToggle } from './ui/components/LangToggle';
import { loadLang, saveLang, t, type Lang } from './ui/i18n';
import { Home } from './ui/screens/Home';

/** Wires the engine to the screens. For now there is only the home screen. */
export function App() {
  const [lang, setLang] = useState<Lang>(loadLang);

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
      <main>
        <Home lang={lang} />
      </main>
    </>
  );
}
