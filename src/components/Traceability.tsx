import type { ReactNode } from "react";

import {
  BATCH,
  COMPLIANCE,
  CONSUMPTION,
  ENV_SUMMARY,
  PRODUCTION,
  regRef,
  TRACE_EVENTS,
  YIELD_SERIES,
} from "../scroll/story";
import { Qr } from "./Qr";
import { MetricChart } from "./MetricChart";

// Section 04 — Traceability. The cultivation room rises out of frame while the
// wall tablet detaches, enlarges to the right 60%, and its content scrolls
// internally through a production report. Driven imperatively by StoryDirector
// (left title opacity, tablet rect, internal scroll) via the `ui` registry.
export function Traceability() {
  return (
    <div className="trace2">
      {/* LEFT — static title (stays fixed through the whole section) */}
      <div className="trace2-left" ref={regRef("trace2Left")} style={{ opacity: 0 }}>
        <span className="kicker">04 · Trazabilidad</span>
        <h2>Trazabilidad completa de cada lote.</h2>
        <p>
          Cada medición, evento, alarma y acción ejecutada queda registrada automáticamente para auditoría,
          análisis y seguimiento productivo.
        </p>
      </div>

      {/* RIGHT — the industrial control tablet */}
      <div className="tablet" ref={regRef("tablet")} style={{ display: "none" }}>
        <div className="tablet-bar">
          <span className="tb-brand">Growcast</span>
          <span className="tb-lot">Lote {BATCH.id}</span>
          <span className="tb-state">● {BATCH.state}</span>
        </div>
        <div className="tablet-screen" ref={regRef("tabletScreen")}>
          <div className="tablet-scroll" ref={regRef("tabletContent")}>
            {/* HERO — lot identification + dominant QR */}
            <div className="tab-hero">
              <div className="tab-lot">
                <span className="cap">Lote de producción</span>
                <h3>{BATCH.id}</h3>
                <dl className="lot-grid">
                  <div><dt>Variedad</dt><dd>{BATCH.cultivar}</dd></div>
                  <div><dt>Inicio</dt><dd>{BATCH.start}</dd></div>
                  <div><dt>Zona</dt><dd>{BATCH.zone}</dd></div>
                  <div><dt>Estado</dt><dd><span className="pill">{BATCH.state}</span></dd></div>
                </dl>
              </div>
              <div className="tab-qr">
                <Qr size={150} />
                <span className="cap">Pasaporte del lote</span>
              </div>
            </div>

            {/* SECTION A — Batch information */}
            <Section label="A" title="Información del lote">
              <div className="card tab-card">
                <dl className="kv">
                  <div><dt>Lote</dt><dd>{BATCH.id}</dd></div>
                  <div><dt>Cultivar</dt><dd>{BATCH.cultivar}</dd></div>
                  <div><dt>Zona de cultivo</dt><dd>{BATCH.zone}</dd></div>
                  <div><dt>Fecha de inicio</dt><dd>{BATCH.start}</dd></div>
                  <div><dt>Fecha de cosecha</dt><dd>{BATCH.harvest}</dd></div>
                  <div><dt>Operario</dt><dd>{BATCH.operator}</dd></div>
                </dl>
              </div>
            </Section>

            {/* SECTION B — Environmental history (Growcast card style) */}
            <Section label="B" title="Historial ambiental">
              <div className="tab-grid2">
                {ENV_SUMMARY.map((e) => (
                  <div className="card tab-card" key={e.label}>
                    <div className="tab-cap-row">
                      <span className="cap">{e.label}</span>
                      <span className="tab-val">{e.value}</span>
                    </div>
                    <MetricChart data={e.series} color={e.color} height={56} />
                    <div className="tab-range">Rango objetivo · {e.range}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* SECTION C — Events timeline (activity log) */}
            <Section label="C" title="Eventos">
              <div className="card tab-card log">
                {TRACE_EVENTS.map((ev, i) => (
                  <div className={`log-row log-${ev.kind}`} key={i}>
                    <span className="log-time">{ev.t}</span>
                    <span className="log-dot" />
                    <span className="log-text">{ev.text}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* SECTION D — Consumptions */}
            <Section label="D" title="Consumos">
              <div className="tab-grid2">
                <div className="card tab-card">
                  <span className="cap">Consumo acumulado</span>
                  <div className="bars">
                    {CONSUMPTION.map((c) => (
                      <div key={c.label} className="bar-row">
                        <span className="bar-label">{c.label}</span>
                        <span className="bar"><i style={{ width: `${Math.round(c.pct * 100)}%` }} /></span>
                        <strong className="bar-value">{c.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card tab-card">
                  <span className="cap">Rendimiento por ciclo</span>
                  <MetricChart data={YIELD_SERIES} color="#c8e06a" height={72} />
                </div>
              </div>
            </Section>

            {/* SECTION E — Compliance & audit */}
            <Section label="E" title="Cumplimiento y auditoría">
              <div className="tab-grid2">
                {COMPLIANCE.map((c) => (
                  <div className="card tab-card audit" key={c.label}>
                    <span className="cap">{c.label}</span>
                    <strong className="audit-val">{c.value}</strong>
                    <span className="audit-note">{c.note}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* SECTION F — Final production summary */}
            <Section label="F" title="Resumen de producción">
              <div className="card tab-card summary">
                {PRODUCTION.map((m) => (
                  <div className="sum" key={m.label}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div className="tab-foot">Registro verificable · Growcast · {BATCH.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="tab-section">
      <div className="tab-section-head">
        <span className="tab-section-tag">{label}</span>
        <h4>{title}</h4>
      </div>
      {children}
    </section>
  );
}
