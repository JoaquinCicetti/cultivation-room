import { Link } from "react-router-dom";

import {
  CONSUMPTION,
  HEADLINES,
  INTRO,
  NOTIFICATIONS,
  regRef,
  TEMP_SERIES,
  TIMELINE,
  TRACE_METRICS,
  YIELD_SERIES,
} from "../scroll/story";
import { Qr } from "./Qr";
import { MetricChart } from "./MetricChart";

const WHATSAPP = "https://wa.me/5491100000000?text=Hola%20Growcast";

export function Overlay() {
  return (
    <div className="overlay">
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* INTRO — smooth opening */}
      <div className="intro" ref={regRef("intro")}>
        <img className="intro-logo" src="/logo.svg" alt="Growcast" width={56} height={56} />
        <h1 className="intro-brand">{INTRO.brand}</h1>
        <p className="intro-tag">{INTRO.tagline}</p>
      </div>

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

      {/* TRACEABILITY — full-screen dashboard */}
      <div className="trace-dash" ref={regRef("traceWrap")} style={{ opacity: 0 }}>
        <div className="dash-head">
          <span className="kicker">Trazabilidad</span>
          <h2>Historial verificable del cultivo</h2>
        </div>
        <div className="dash-grid">
          <div className="card card-qr" ref={regRef("qr")} style={{ opacity: 0 }}>
            <div className="card-cap">Registro del cultivo</div>
            <Qr size={116} />
            <div className="card-meta">Planta #2481 · Lote A-204</div>
          </div>

          <div className="card card-timeline" ref={regRef("subwindow")} style={{ opacity: 0 }}>
            <div className="card-cap">Historial del ciclo</div>
            <div className="timeline">
              {TIMELINE.map((it, i) => (
                <div key={i} className="tl-item" ref={regRef(`tl${i}`)} style={{ opacity: 0 }}>
                  <span className="tl-day">{it.day}</span>
                  <span className="tl-dot" />
                  <span className="tl-label">{it.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-chart" ref={regRef("chartYield")} style={{ opacity: 0 }}>
            <div className="card-cap">Rendimiento por ciclo</div>
            <MetricChart data={YIELD_SERIES} color="#c8e06a" />
          </div>

          <div className="card card-chart" ref={regRef("chartTemp")} style={{ opacity: 0 }}>
            <div className="card-cap">Temperatura ambiente · 9 días</div>
            <MetricChart data={TEMP_SERIES} color="#9c6cff" />
          </div>

          <div className="card card-consumption" ref={regRef("consumption")} style={{ opacity: 0 }}>
            <div className="card-cap">Consumo de insumos</div>
            <div className="bars">
              {CONSUMPTION.map((c) => (
                <div key={c.label} className="bar-row">
                  <span className="bar-label">{c.label}</span>
                  <span className="bar">
                    <i style={{ width: `${Math.round(c.pct * 100)}%` }} />
                  </span>
                  <strong className="bar-value">{c.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-metrics" ref={regRef("metricsCard")} style={{ opacity: 0 }}>
            {TRACE_METRICS.map((m) => (
              <div key={m.label} className="tm">
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ENDING */}
      <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
        <div className="final-grid">
          <div className="final-main">
            <img className="final-logo" src="/logo.svg" alt="Growcast" width={58} height={58} />
            <h2 className="final-word">Growcast</h2>
            <p className="final-tagline">Monitoreo, control y trazabilidad.</p>
            <Link className="cta" to="/catalog">
              Solicitar demo →
            </Link>
          </div>
          <nav className="final-nav" aria-label="Secciones">
            <span className="nav-label">Explorar</span>
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
            <Link to="/privacidad">Política de privacidad</Link>
            <Link to="/terminos">Términos y condiciones</Link>
            <span className="foot-copy">© {new Date().getFullYear()} Growcast</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
