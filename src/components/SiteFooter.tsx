import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { LangSwitcher } from "../i18n/LangSwitcher";

const WHATSAPP = "https://wa.me/5491100000000?text=Hola%20Growcast";
const APP_URL = "https://app.growcast.io";
const REGRET_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSecyGXGnPCrV0e5L7ULzq8oa2k89-BocTqWi8ngT0GlMtgqLQ/viewform";

// Single footer shared by every route (and the landing's ending). `variant` only
// changes positioning (the landing overlays it on the 3D scene); the content and
// look are identical everywhere. The app link sits among the footer links — it is
// a link, not a CTA button.
export function SiteFooter({ variant }: { variant?: "landing" }) {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  return (
    <footer className={`site-footer${variant === "landing" ? " site-footer--landing" : ""}`}>
      <div className="sf-row">
        <a className="wa-cta" href={WHATSAPP} target="_blank" rel="noreferrer">
          <span className="wa-dot" /> {t("footer.whatsapp")}
        </a>
        <nav className="sf-links" aria-label="Growcast">
          <a className="sf-app" href={APP_URL} target="_blank" rel="noreferrer">
            {t("cta.app")} →
          </a>
          <Link to="/faqs">{t("nav.faqs")}</Link>
          <Link to="/testimonios">{t("nav.testimonials")}</Link>
          <Link to="/catalog">{t("nav.catalog")}</Link>
        </nav>
      </div>
      <div className="sf-row sf-meta">
        <div className="sf-legal">
          <a href={REGRET_FORM} target="_blank" rel="noreferrer">
            {t("footer.regret")}
          </a>
          <Link to="/privacidad">{t("footer.privacy")}</Link>
          <Link to="/terminos">{t("footer.terms")}</Link>
          <span className="foot-copy">
            {intl.formatMessage({ id: "footer.copy" }, { year: new Date().getFullYear() })}
          </span>
        </div>
        <LangSwitcher />
      </div>
    </footer>
  );
}
