import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { INTRO, NOTIFICATIONS, regRef } from "../scroll/story";
import { ContactButton } from "./contact/ContactButton";
import { LogoReveal } from "./LogoReveal";
import { MetricCards } from "./MetricCards";
import { SiteFooter } from "./SiteFooter";
import { Traceability } from "./Traceability";
import { TraceReport } from "./TraceReport";

// hero supporting metrics — keys map to i18n ids (intro.meta.<key>.k / .v)
const INTRO_META = ["continuous", "automatic", "traceable"];
// four storytelling sections — indices map to i18n ids (hl.<i>.k/.h/.s/.lead)
const HEADLINE_IX = [0, 1, 2, 3];

export function Overlay() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  return (
    <div className="overlay">
      {/* loading screen — covers until the 3D scene is ready, then fades to the
          dark (powered-off) room before the cultivation lights come on */}
      <div className="loading-screen" ref={regRef("loader")} role="status" aria-live="polite">
        <div className="loader-lockup">
          <span className="bm-badge loader-badge">
            <img src="/logo.svg" alt="" width={52} height={52} />
          </span>
          <span className="loader-word">Growcast</span>
        </div>
        <div className="loader-bar">
          <span className="loader-bar-fill" />
        </div>
        <span className="loader-status">{t("loader.status")}</span>
      </div>

      {/* opening fade-from-dark */}
      <div className="boot" ref={regRef("boot")} />
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* Brand mark — starts as the hero, morphs into the top-left header on scroll */}
      <Link className="brandmark" to="/" ref={regRef("brandmark")}>
        <span className="bm-badge">
          <img src="/logo.svg" alt="Growcast" width={64} height={64} />
        </span>
        <span className="bm-word">{INTRO.brand}</span>
      </Link>
      {/* hero supporting block (fades out as the scroll story begins) */}
      <div className="intro-hero" ref={regRef("introTag")}>
        <span className="intro-eyebrow">{t("intro.eyebrow")}</span>
        <p className="intro-tag">{t("intro.tagline")}</p>
        <ul className="intro-meta">
          {INTRO_META.map((m) => (
            <li key={m}>
              <strong>{t(`intro.meta.${m}.k`)}</strong>
              <span>{t(`intro.meta.${m}.v`)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* LEFT — section storytelling */}
      <div className="text-col">
        {HEADLINE_IX.map((i) => (
          <div key={i} className="headline" ref={regRef(`hl${i}`)} style={{ opacity: 0 }}>
            <span className="kicker">{t(`hl.${i}.k`)}</span>
            <h1>{t(`hl.${i}.h`)}</h1>
            <p className="sub">{t(`hl.${i}.s`)}</p>
            <p className="lead">{t(`hl.${i}.lead`)}</p>
          </div>
        ))}
      </div>

      {/* scroll indicator */}
      <div className="scroll-hint" ref={regRef("scrollHint")}>
        <span>{t("scroll.hint")}</span>
        <span className="scroll-chevron" />
      </div>

      {/* live monitoring metric cards (ring the room, scenes 1-4) */}
      <MetricCards />

      {/* notification toasts */}
      <div className="toasts">
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className={`toast toast-${n.kind}`} ref={regRef(`toast${i}`)} style={{ opacity: 0 }}>
            <span className="toast-dot" />
            <div className="toast-body">
              <strong>{t(`notif.${i}.title`)}</strong>
              <span>{t(`notif.${i}.desc`)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TRACEABILITY — static left title + the report that flies, in 2D screen
          space, from the projected wall tablet to the front (driven by StoryDirector) */}
      <Traceability />
      <div className="trace-fly" ref={regRef("traceFly")} style={{ opacity: 0, display: "none" }}>
        <TraceReport />
      </div>

      {/* ENDING */}
      <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
        {/* the brand mark (logo + Growcast) lands here as the single logo */}
        <div className="final-main">
          <LogoReveal className="final-logo" size={240} />
          <p className="final-tagline">{t("final.tagline")}</p>
          <div className="final-cta-row">
            {/* primary CTA opens the contact/demo dialog form */}
            <ContactButton label={t("cta.requestDemo")} />
            <Link className="cta cta-ghost" to="/catalog">
              {t("cta.catalog")}
            </Link>
          </div>
          <nav className="final-nav" aria-label="Growcast">
            <Link to="/faqs">{t("nav.faqs")}</Link>
            <Link to="/testimonios">{t("nav.testimonials")}</Link>
          </nav>
        </div>
        <SiteFooter variant="landing" />
      </div>
    </div>
  );
}
