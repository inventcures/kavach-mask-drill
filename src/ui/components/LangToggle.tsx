import { LANG_NAMES, nextLang, t, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

/** Shows the name of the language you would switch to, in that language. */
export function LangToggle({ lang, onChange }: Props) {
  const target = nextLang(lang);
  return (
    <button type="button" class="lang-toggle" lang={target} title={t(lang, 'lang.switchLabel')} onClick={() => onChange(target)}>
      {LANG_NAMES[target]}
    </button>
  );
}
