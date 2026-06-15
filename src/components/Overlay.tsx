import { Link } from "react-router-dom";

import { HEADLINES, NOTIFICATIONS, regRef, TIMELINE, TRACE_METRICS } from "../scroll/story";
import { LogoReveal } from "./LogoReveal";
import { ContactButton } from "./contact/ContactButton";
import { Qr } from "./Qr";
import { MetricChart } from "./MetricChart";

// 2D layer overlaid on the full-bleed scene: storytelling text LEFT, traceability
// (QR → line → timeline → metrics) LEFT, toasts bottom-right, scroll indicator,
// and a left veil for legibility. Sensor readings live on the room as holograms.
export function Overlay() {
  return (
    <div className="overlay">
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* LEFT — storytelling */}
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

      {/* BOTTOM-RIGHT — notification toasts */}
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

      {/* TRACEABILITY (left) — heading, then qr -> line -> timeline, then metrics */}
      <div className="trace-wrap" ref={regRef("traceWrap")} style={{ opacity: 0 }}>
        <div className="trace-head">
          <span className="kicker">05 · Trazabilidad</span>
          <h2>Trazabilidad total</h2>
          <p>Del dato del sensor al historial verificable de todo el ciclo.</p>
        </div>
        <div className="trace-stage">
          <div className="qr-card" ref={regRef("qr")} style={{ opacity: 0 }}>
            <div className="qr-cap">Registro del cultivo</div>
            <Qr size={138} />
            <div className="qr-meta">Planta #2481 · Lote A-204</div>
          </div>

          <span className="trace-line" ref={regRef("traceLine")} style={{ opacity: 0 }} />

          <div className="subwindow" ref={regRef("subwindow")} style={{ opacity: 0 }}>
            <div className="sub-title">Historial del ciclo</div>
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
        </div>

        <div className="trace-metrics">
          <div className="trace-chart" ref={regRef("traceChart")} style={{ opacity: 0 }}>
            <div className="chart-title">Rendimiento por ciclo</div>
            <MetricChart />
          </div>
          <div className="metric-row">
            {TRACE_METRICS.map((m, i) => (
              <div key={i} className="tm" ref={regRef(`tm${i}`)} style={{ opacity: 0 }}>
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL — left-aligned */}
      <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
        <LogoReveal className="final-logo" size={72} />
        <h2 className="final-word">Growcast</h2>
        <p className="final-tagline">Monitoreo, control y trazabilidad.</p>
        <div className="final-cta-row">
          <Link className="cta" to="/catalog">
            Explorar Growcast →
          </Link>
          <ContactButton label="Contacto" className="cta-ghost" />
        </div>
      </div>
    </div>
  );
}
