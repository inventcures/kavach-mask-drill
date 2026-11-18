/** A translatable string: one entry per language code, always with English. */
export type Text = { en: string } & { [lang: string]: string | undefined };

/** The text in `lang`, or English when that language is missing. */
export function inLang(text: Text, lang: string): string {
  return text[lang] ?? text.en;
}

/** Fills `{name}` placeholders in every language of a template. */
export function fillText(template: Text, values: Record<string, Text | string | number>): Text {
  const out: Text = { en: '' };
  for (const lang of Object.keys(template)) {
    out[lang] = (template[lang] ?? '').replace(/\{(\w+)\}/g, (whole, name: string) => {
      const v = values[name];
      if (v === undefined) return whole;
      return typeof v === 'object' ? inLang(v, lang) : String(v);
    });
  }
  return out;
}
