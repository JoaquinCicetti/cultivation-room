import { useIntl } from "react-intl";

import { LOCALES, LOCALE_META, isLocale } from "./locales";
import { useLocale } from "./LocaleProvider";

// Tiny native-select language picker. Compact by design — sized to its content,
// never full-width.
export function LangSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const intl = useIntl();

  return (
    <label className={`lang-select${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{intl.formatMessage({ id: "lang.label" })}</span>
      <select
        value={locale}
        aria-label={intl.formatMessage({ id: "lang.label" })}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_META[l].flag} {LOCALE_META[l].label}
          </option>
        ))}
      </select>
      <span className="lang-caret" aria-hidden />
    </label>
  );
}
