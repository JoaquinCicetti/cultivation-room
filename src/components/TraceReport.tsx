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
import { useTr } from "../i18n/runtime";
import { Qr } from "./Qr";
import { MetricChart } from "./MetricChart";

// The production-report content rendered ON the 3D tablet face (via drei <Html
// transform> in TraceTablet) — so the real, crisp report lives on the device the
// whole time and rotates/flies with it. Fixed pixel size (see .tab3d in CSS); the
// inner .tablet-scroll is translated by StoryDirector for the internal scroll.
export function TraceReport() {
  const { t } = useTr();
  const humUnit = t("card.unit.hum");
  const state = t("trace.state");

  return (
    <div className="tab3d" ref={regRef("traceShell")}>
      <div className="tablet-bar">
        <span className="tb-brand">Growcast</span>
        <span className="tb-lot">
          {t("trace.batchWord")} {BATCH.id}
        </span>
        <span className="tb-state">● {state}</span>
      </div>
      <div className="tablet-screen" ref={regRef("tabletScreen")}>
        <div className="tablet-scroll" ref={regRef("tabletContent")}>
          {/* HERO — lot identification + dominant QR */}
          <div className="tab-hero">
            <div className="tab-lot">
              <span className="cap">{t("trace.hero.cap")}</span>
              <h3>{BATCH.id}</h3>
              <dl className="lot-grid">
                <div>
                  <dt>{t("trace.field.variety")}</dt>
                  <dd>{BATCH.cultivar}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.start")}</dt>
                  <dd>{t("trace.batch.start")}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.zone")}</dt>
                  <dd>{t("trace.batch.zone")}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.state")}</dt>
                  <dd>
                    <span className="pill">{state}</span>
                  </dd>
                </div>
              </dl>
            </div>
            <div className="tab-qr">
              <Qr size={150} />
              <span className="cap">{t("trace.identifier")}</span>
            </div>
          </div>

          <Section label="A" title={t("trace.section.a")}>
            <div className="card tab-card">
              <dl className="kv">
                <div>
                  <dt>{t("trace.field.batch")}</dt>
                  <dd>{BATCH.id}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.cultivar")}</dt>
                  <dd>{BATCH.cultivar}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.growZone")}</dt>
                  <dd>{t("trace.batch.zone")}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.startDate")}</dt>
                  <dd>{t("trace.batch.start")}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.harvestDate")}</dt>
                  <dd>{t("trace.batch.harvest")}</dd>
                </div>
                <div>
                  <dt>{t("trace.field.operator")}</dt>
                  <dd>{BATCH.operator}</dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section label="B" title={t("trace.section.b")}>
            <div className="tab-grid2">
              {ENV_SUMMARY.map((e) => (
                <div className="card tab-card" key={e.id}>
                  <div className="tab-cap-row">
                    <span className="cap">{t(`trace.env.${e.id}`)}</span>
                    <span className="tab-val">{e.value.replace("%HR", humUnit)}</span>
                  </div>
                  <MetricChart data={e.series} color={e.color} height={56} />
                  <div className="tab-range">
                    {t("trace.targetRange")} · {e.range}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section label="C" title={t("trace.section.c")}>
            <div className="card tab-card log">
              {TRACE_EVENTS.map((ev, i) => (
                <div className={`log-row log-${ev.kind}`} key={i}>
                  <span className="log-time">{ev.t}</span>
                  <span className="log-dot" />
                  <span className="log-text">{t(`trace.event.${ev.key}`)}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section label="D" title={t("trace.section.d")}>
            <div className="tab-grid2">
              <div className="card tab-card">
                <span className="cap">{t("trace.cumulative")}</span>
                <div className="bars">
                  {CONSUMPTION.map((c) => (
                    <div key={c.key} className="bar-row">
                      <span className="bar-label">{t(`trace.cons.${c.key}.label`)}</span>
                      <span className="bar">
                        <i style={{ width: `${Math.round(c.pct * 100)}%` }} />
                      </span>
                      <strong className="bar-value">{t(`trace.cons.${c.key}.value`)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card tab-card">
                <span className="cap">{t("trace.yieldPerCycle")}</span>
                <MetricChart data={YIELD_SERIES} color="#c8e06a" height={72} />
              </div>
            </div>
          </Section>

          <Section label="E" title={t("trace.section.e")}>
            <div className="tab-grid2">
              {COMPLIANCE.map((c) => (
                <div className="card tab-card audit" key={c.key}>
                  <span className="cap">{t(`trace.comp.${c.key}.label`)}</span>
                  <strong className="audit-val">{c.value ?? t("trace.comp.calibration.value")}</strong>
                  <span className="audit-note">{t(`trace.comp.${c.key}.note`)}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section label="F" title={t("trace.section.f")}>
            <div className="card tab-card summary">
              {PRODUCTION.map((m) => (
                <div className="sum" key={m.key}>
                  <strong>{m.value}</strong>
                  <span>{t(`trace.prod.${m.key}`)}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="tab-foot">
            {t("trace.verifiable")} · Growcast · {BATCH.id}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
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
