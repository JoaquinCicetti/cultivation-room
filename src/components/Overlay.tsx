import { Link } from "react-router-dom";

import { HEADLINES, INTRO, NOTIFICATIONS, regRef } from "../scroll/story";
import { ContactButton } from "./contact/ContactButton";
import { LogoReveal } from "./LogoReveal";
import { MetricCards } from "./MetricCards";
import { Traceability } from "./Traceability";

const WHATSAPP = "https://wa.me/5491100000000?text=Hola%20Growcast";
const REGRET_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSecyGXGnPCrV0e5L7ULzq8oa2k89-BocTqWi8ngT0GlMtgqLQ/viewform";

export function Overlay() {
  return (
    <div className="overlay">
      {/* opening fade-from-dark */}
      <div className="boot" ref={regRef("boot")} />
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* Brand mark — starts as the hero, morphs into the top-left header on scroll */}
      <Link className="brandmark" to="/" ref={regRef("brandmark")}>
        <img src="/logo.svg" alt="Growcast" width={88} height={88} />
        <span className="bm-word">{INTRO.brand}</span>
      </Link>
      <p className="intro-tag" ref={regRef("introTag")}>
        {INTRO.tagline}
      </p>

      {/* LEFT — section storytelling */}
      <div className="text-col">
        {HEADLINES.map((h, i) => (
          <div key={i} className="headline" ref={regRef(`hl${i}`)} style={{ opacity: 0 }}>
            <span className="kicker">{h.k}</span>
            <h1>{h.h}</h1>
            <p className="sub">{h.s}</p>
            <p className="lead">{h.lead}</p>
          </div>
        ))}
      </div>

      {/* scroll indicator */}
      <div className="scroll-hint" ref={regRef("scrollHint")}>
        <span>Desplazá para explorar</span>
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
              <strong>{n.title}</strong>
              <span>{n.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TRACEABILITY — room exits, wall tablet detaches into the report */}
      <Traceability />

      {/* ENDING */}
      <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
        {/* the brand mark (logo + Growcast) lands here as the single logo */}
        <div className="final-main">
          <LogoReveal className="final-logo" size={240} />
          <p className="final-tagline">Monitoreo, control y trazabilidad.</p>
          <div className="final-cta-row">
            <Link className="cta" to="/catalog">
              Solicitar demo →
            </Link>
            <ContactButton label="Contacto" className="cta-ghost" />
          </div>
          <nav className="final-nav" aria-label="Secciones">
            <Link to="/catalog">Catálogo</Link>
            <Link to="/faqs">Preguntas frecuentes</Link>
            <Link to="/testimonios">Testimonios</Link>
          </nav>
        </div>
        <footer className="final-footer">
          <a className="wa-cta" href={WHATSAPP} target="_blank" rel="noreferrer">
            <span className="wa-dot" /> Escribinos por WhatsApp
          </a>
          <div className="foot-links">
            <a href={REGRET_FORM} target="_blank" rel="noreferrer">
              Botón de arrepentimiento
            </a>
            <Link to="/privacidad">Política de privacidad</Link>
            <Link to="/terminos">Términos y condiciones</Link>
            <span className="foot-copy">© {new Date().getFullYear()} Growcast</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
