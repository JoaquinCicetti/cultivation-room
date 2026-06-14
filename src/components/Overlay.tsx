import { Link } from "react-router-dom";

import { HEADLINES, IMPROVE_TAGS, LOG_LINES, MEASURE_CHIPS, regRef, TRACE_ITEMS } from "../scroll/story";
import { Qr } from "./Qr";

const CATEGORY_TAGS = ["Ambiente", "Nutrición", "Riego", "Rendimiento", "Genética", "Historial de Ciclo"];

// 2D text layer for the centered floating-room layout: headline ABOVE the room,
// per-act content BELOW it. StoryDirector cross-fades everything via `ui`.
export function Overlay() {
  return (
    <div className="overlay">
      {/* light scrim that mutes the room for the traceability climax + final */}
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* ABOVE the room — section headlines */}
      <div className="head-zone">
        {HEADLINES.map((h, i) => (
          <div key={i} className="headline" ref={regRef(`hl${i}`)} style={{ opacity: 0 }}>
            <h1>{h.h}</h1>
            <p>{h.s}</p>
          </div>
        ))}
      </div>

      {/* BELOW the room — per-act content panels (cross-faded) */}
      <div className="panel-zone">
        {/* MEASURE */}
        <div className="panel metrics" ref={regRef("bMetrics")} style={{ opacity: 0 }}>
          {MEASURE_CHIPS.map((c) => (
            <div key={c.id} className="metric">
              <span className="metric-label">{c.label}</span>
              <span className="metric-value">{c.value}</span>
            </div>
          ))}
        </div>

        {/* DETECT + CONTROL */}
        <div className="panel incident" ref={regRef("bIncident")} style={{ opacity: 0 }}>
          <div className="incident-status">
            <div className="temp-chip" ref={regRef("chip.temp")}>
              <span className="temp-label">Temperatura</span>
              <span className="temp-value" ref={regRef("val.temp")}>
                24.8°C
              </span>
            </div>
            <div className="alert-chip" ref={regRef("alertChip")} style={{ opacity: 0 }}>
              <span className="alert-dot" />
              Temperatura Alta
            </div>
          </div>
          <div className="log">
            <div className="log-title">Registro de eventos</div>
            {LOG_LINES.map((l, i) => (
              <div key={i} className="log-line" ref={regRef(`log${i}`)} style={{ opacity: 0 }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* IMPROVE */}
        <div className="panel tags" ref={regRef("bImprove")} style={{ opacity: 0 }}>
          <div className="tag-row">
            {IMPROVE_TAGS.map((t) => (
              <span key={t.id} className="tag tag-primary">
                {t.label}
              </span>
            ))}
          </div>
          <div className="tag-row">
            {CATEGORY_TAGS.map((t) => (
              <span key={t} className="tag tag-ghost">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CENTERED — traceability record then final composition */}
      <div className="center-pos">
        <div className="trace" ref={regRef("tracePanel")} style={{ opacity: 0 }}>
          <div className="trace-list">
            {TRACE_ITEMS.map((it, i) => (
              <div key={i} className="trace-item" ref={regRef(`trace${i}`)} style={{ opacity: 0 }}>
                <span className="trace-tick" />
                {it}
              </div>
            ))}
          </div>
          <div className="passport" ref={regRef("passport")} style={{ opacity: 0 }}>
            <div className="passport-head">
              <span>Pasaporte Digital de Producto</span>
              <strong>Planta #2481</strong>
            </div>
            <Qr size={150} />
            <div className="passport-meta">Lote A-204 · Ciclo 5 · Blue Dream</div>
          </div>
        </div>
      </div>

      <div className="center-pos">
        <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
          <img className="final-logo" src="/logo.svg" alt="Growcast" width={64} height={64} />
          <h2 className="final-word">Growcast</h2>
          <p className="final-tagline">Monitoreo, control y trazabilidad.</p>
          <Link className="cta" to="/catalog">
            Explorar Growcast →
          </Link>
        </div>
      </div>
    </div>
  );
}
