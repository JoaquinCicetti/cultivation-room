// Supported locales for the landing. `code` is the BCP-47 tag handed to
// react-intl; `lang` is the short two-letter key the catalogs are stored under.
export const LOCALES = ["es", "en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_META: Record<Locale, { code: string; flag: string; label: string }> = {
  es: { code: "es-AR", flag: "🇦🇷", label: "ES" },
  en: { code: "en-US", flag: "🇺🇸", label: "EN" },
  pt: { code: "pt-BR", flag: "🇧🇷", label: "PT" },
};

export const isLocale = (value: string | null | undefined): value is Locale =>
  value != null && (LOCALES as readonly string[]).includes(value);

// Best-effort match of the browser language to a supported locale.
export const guessLocale = (): Locale => {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const c of candidates) {
    const lang = c.toLowerCase().split("-")[0];
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
};
