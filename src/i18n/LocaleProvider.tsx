import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IntlProvider } from "react-intl";

import { DEFAULT_LOCALE, LOCALE_META, guessLocale, isLocale, type Locale } from "./locales";
import { MESSAGES } from "./messages";
import { setRuntimeLocale } from "./runtime";

const STORAGE_KEY = "growcast.locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) return saved;
    }
    return guessLocale();
  });

  // keep <html lang> + the context-free runtime store (used inside the 3D
  // <Canvas>) in sync with the active locale
  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].code;
    setRuntimeLocale(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={LOCALE_META[locale].code} defaultLocale={LOCALE_META[DEFAULT_LOCALE].code} messages={MESSAGES[locale]}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
