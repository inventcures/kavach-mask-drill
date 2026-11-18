import { useEffect, useMemo, useState } from 'preact/hooks';
import { defaultScenario } from './content/scenarios';
import { startSession, step, type Action, type SessionState } from './engine/session';
import { LangToggle } from './ui/components/LangToggle';
import { LANGS, loadLang, saveLang, t, type Lang } from './ui/i18n';
import { Drill } from './ui/screens/Drill';
import { Home } from './ui/screens/Home';

/** Wires the engine to the screens: home until the drill starts, then whatever screen the session is on. */
export function App() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const scenario = useMemo(() => defaultScenario(LANGS), []);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(lang, 'app.title');
  }, [lang]);

  const changeLang = (next: Lang) => {
    saveLang(next);
    setLang(next);
  };
  const dispatch = (action: Action) => setSession((s) => (s ? step(scenario, s, action) : s));

  return (
    <>
      <header>
        <h1>{t(lang, 'app.title')}</h1>
        <LangToggle lang={lang} onChange={changeLang} />
      </header>
      {session ? (
        <Drill lang={lang} scenario={scenario} session={session} dispatch={dispatch} />
      ) : (
        <Home lang={lang} onStart={() => setSession(startSession(scenario))} />
      )}
    </>
  );
}
