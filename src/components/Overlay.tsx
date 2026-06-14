import { Link } from "react-router-dom";

import { HEADLINES, NOTIFICATIONS, regRef, TIMELINE, TRACE_METRICS } from "../scroll/story";
import { Qr } from "./Qr";

// 2D layer: headlines LEFT, notification toasts BOTTOM-RIGHT, a traceability
// sequence (QR → line → timeline → metrics), and a left-aligned ending.
// All data readings live on the room as holograms (see Holograms.tsx).
export function Overlay() {
  return (
    <div className="overlay">
      <div className="story-scrim" ref={regRef("scrim")} style={{ opacity: 0 }} />

      {/* LEFT — section headlines */}
      <div className="text-col">
        {HEADLINES.map((h, i) => (
          <div key={i} className="headline" ref={regRef(`hl${i}`)} style={{ opacity: 0 }}>
            <h1>{h.h}</h1>
            <p>{h.s}</p>
          </div>
        ))}
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

      {/* TRACEABILITY — qr first, line to subwindow timeline, then metrics */}
      <div className="trace-wrap" ref={regRef("traceWrap")} style={{ opacity: 0 }}>
        <div className="trace-stage">
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

          <span className="trace-line" ref={regRef("traceLine")} style={{ opacity: 0 }} />

          <div className="qr-card" ref={regRef("qr")} style={{ opacity: 0 }}>
            <div className="qr-cap">Pasaporte del cultivo</div>
            <Qr size={146} />
            <div className="qr-meta">Planta #2481 · Lote A-204</div>
          </div>
        </div>

        <div className="trace-metrics">
          {TRACE_METRICS.map((m, i) => (
            <div key={i} className="tm" ref={regRef(`tm${i}`)} style={{ opacity: 0 }}>
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL — left-aligned */}
      <div className="final" ref={regRef("final")} style={{ opacity: 0 }}>
        <img className="final-logo" src="/logo.svg" alt="Growcast" width={60} height={60} />
        <h2 className="final-word">Growcast</h2>
        <p className="final-tagline">Monitoreo, control y trazabilidad.</p>
        <Link className="cta" to="/catalog">
          Explorar Growcast →
        </Link>
      </div>
    </div>
  );
}
