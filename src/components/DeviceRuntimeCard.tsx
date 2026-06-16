import { useEffect, useRef, useState } from "react";

import { devices, deviceSetAuto, deviceSetManual, deviceSetPower, story, type DeviceDef } from "../scroll/story";

// Premium industrial runtime-analytics widget for a digital control/output.
// It summarises how long the control stayed ON over the selected period:
//   · large runtime % (share of time ON)            · ON / OFF accumulated time
//   · the automation rule operating it (badge)       · a digital state timeline
// The card is the source of truth — clicking the power tile or the badge drives
// the room (via the shared `devices` overrides). Live data is written every
// frame imperatively (refs), so the widget never re-renders over the 3D canvas;
// only the period selector (a click) updates React state. Animations are CSS.

const PERIODS = [
  { h: 1, label: "1h" },
  { h: 12, label: "12h" },
  { h: 24, label: "24h" },
];
const DEFAULT_H = 12;
const N = 60; // state-history samples
const ST = 0.22; // seconds per committed sample (gentle, slow-moving timeline)
const CW = 100;
const CH = 34;

const frac = (x: number) => x - Math.floor(x);

// Deterministic seed: a believable duty-cycle history so the runtime stats read
// realistically before live state propagates through the buffer. Runs of ON/OFF
// biased toward the device's typical duty.
function seedHistory(id: string, duty: number) {
  const a = new Float64Array(N);
  let on = false;
  let hold = 0;
  const salt = id === "lights" ? 2.7 : 5.3;
  for (let i = 0; i < N; i++) {
    if (hold <= 0) {
      on = frac(Math.sin((i + 1) * salt) * 43758.5453) < duty;
      hold = 2 + Math.floor(frac(Math.cos((i + 1) * 1.7)) * 6);
    }
    a[i] = on ? 1 : 0;
    hold--;
  }
  return a;
}

function fmtDur(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}H ${m}M`;
}

function PowerIcon() {
  return (
    <svg className="rt-power" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6.6 6.8a7.5 7.5 0 1 0 10.8 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width={11} height={11}>
      <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" fill="currentColor" />
    </svg>
  );
}

export function DeviceRuntimeCard({ d, posClass }: { d: DeviceDef; posClass: string }) {
  const [sel, setSel] = useState(DEFAULT_H);
  const selRef = useRef(DEFAULT_H);

  const cardRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const actRef = useRef<HTMLSpanElement>(null);
  const inaRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const hist = seedHistory(d.id, d.duty);
    let raf = 0;
    let last = performance.now();
    let lastClock = story.simClock; // timeline advances on scroll-driven sim time
    const stepW = CW / N;
    let dispFrac = hist.reduce((s, v) => s + v, 0) / N;
    const yOf = (v: number) => (v > 0.5 ? 3 : CH - 3);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // commit samples on the scroll-driven clock — idle scroll holds the timeline
      const clock = story.simClock;
      let steps = 0;
      while (clock - lastClock >= ST && steps < 6) {
        lastClock += ST;
        steps++;
      }
      const v = devices[d.id];
      for (let s = 0; s < steps; s++) {
        hist.copyWithin(0, 1);
        hist[N - 1] = v.on ? 1 : 0;
      }

      let sum = 0;
      for (let i = 0; i < N; i++) sum += hist[i];
      const target = sum / N;
      dispFrac += (target - dispFrac) * (1 - Math.exp(-dt * 5));

      // skip DOM writes while the card layer is hidden (cheap, but pointless)
      if (story.cards < 0.01) return;

      const pct = Math.round(dispFrac * 100);
      if (pctRef.current) pctRef.current.textContent = pct + "%";
      if (barRef.current) barRef.current.style.width = (dispFrac * 100).toFixed(1) + "%";

      const hours = selRef.current;
      if (actRef.current) actRef.current.textContent = fmtDur(dispFrac * hours * 60);
      if (inaRef.current) inaRef.current.textContent = fmtDur((1 - dispFrac) * hours * 60);

      const card = cardRef.current;
      if (card) {
        const onStr = v.on ? "true" : "false";
        if (card.dataset.on !== onStr) card.dataset.on = onStr;
        const modeStr = v.manual ? "manual" : "auto";
        if (card.dataset.mode !== modeStr) card.dataset.mode = modeStr;
      }
      if (badgeRef.current) badgeRef.current.textContent = v.manual ? "Manual" : d.automation;

      // digital state timeline (step chart): instant transitions, flat plateaus
      let line = "M 0 " + yOf(hist[0]).toFixed(1);
      for (let i = 1; i < N; i++) {
        const x = (i * stepW).toFixed(2);
        line += ` L ${x} ${yOf(hist[i - 1]).toFixed(1)} L ${x} ${yOf(hist[i]).toFixed(1)}`;
      }
      line += ` L ${CW} ${yOf(hist[N - 1]).toFixed(1)}`;
      if (lineRef.current) lineRef.current.setAttribute("d", line);
      if (areaRef.current) areaRef.current.setAttribute("d", `${line} L ${CW} ${CH} L 0 ${CH} Z`);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d]);

  const togglePower = () => deviceSetPower(d.id, !devices[d.id].on);
  const toggleMode = () => (devices[d.id].manual ? deviceSetAuto(d.id) : deviceSetManual(d.id));
  const pickPeriod = (h: number) => {
    selRef.current = h;
    setSel(h);
  };

  const gradId = `rtg-${d.id}`;
  return (
    <div className={`mcard rtcard ${posClass}`} ref={cardRef} data-on="false" data-mode="auto">
      <div className="rt-head">
        <div className="rt-id">
          <div className="rt-name">{d.name}</div>
        </div>
        <div className="rt-seg" role="tablist" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p.h}
              type="button"
              role="tab"
              aria-selected={sel === p.h}
              className={"rt-seg-btn" + (sel === p.h ? " on" : "")}
              onClick={() => pickPeriod(p.h)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rt-status">
        <button type="button" className="rt-tile" onClick={togglePower} aria-label={`Encender o apagar ${d.name}`}>
          <span className="rt-tile-dot" />
          <PowerIcon />
        </button>
        <div className="rt-readout">
          <div className="rt-pct-row">
            <span className="rt-pct" ref={pctRef}>
              0%
            </span>
            <button type="button" className="rt-badge" onClick={toggleMode} aria-label="Automatización">
              <AutoIcon />
              <span ref={badgeRef}>{d.automation}</span>
            </button>
          </div>
          <div className="rt-bar">
            <i ref={barRef} />
          </div>
        </div>
      </div>

      <div className="rt-summary">
        <div className="rt-metric rt-active">
          <span className="rt-metric-label">ACTIVO</span>
          <span className="rt-metric-val" ref={actRef}>
            0H 0M
          </span>
        </div>
        <div className="rt-metric rt-inactive">
          <span className="rt-metric-label">INACTIVO</span>
          <span className="rt-metric-val" ref={inaRef}>
            0H 0M
          </span>
        </div>
      </div>

      <div className="rt-chart">
        <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="rt-grad-top" />
              <stop offset="1" className="rt-grad-bot" />
            </linearGradient>
          </defs>
          <path className="rt-area" ref={areaRef} fill={`url(#${gradId})`} />
          <path className="rt-line" ref={lineRef} />
        </svg>
      </div>
    </div>
  );
}
