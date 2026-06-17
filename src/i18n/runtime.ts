import { useSyncExternalStore } from "react";

import { DEFAULT_LOCALE, guessLocale, isLocale, type Locale } from "./locales";
import { MESSAGES } from "./messages";

// Context-free locale runtime. React context (the app's <IntlProvider>) does NOT
// cross the react-three-fiber <Canvas> reconciler boundary, so any copy rendered
// inside the 3D scene (the controller screen, the traceability tablet) reads the
// locale from this module-level store instead. The app's LocaleProvider mirrors
// every change here via setRuntimeLocale().
const STORAGE_KEY = "growcast.locale";

function initialLocale(): Locale {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  }
  return guessLocale();
}

let current: Locale = initialLocale();
const subscribers = new Set<() => void>();

export function setRuntimeLocale(locale: Locale) {
  if (locale === current) return;
  current = locale;
  subscribers.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

const format = (locale: Locale, id: string) =>
  MESSAGES[locale][id] ?? MESSAGES[DEFAULT_LOCALE][id] ?? id;

// Re-renders the caller whenever the locale changes; returns a formatter bound to
// the current locale. Usable anywhere, including inside the <Canvas>.
export function useTr(): { locale: Locale; t: (id: string) => string } {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  return { locale, t: (id: string) => format(locale, id) };
}
