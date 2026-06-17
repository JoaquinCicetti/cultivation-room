import { useEffect, useRef } from "react";
import { useIntl } from "react-intl";

import {
  clamp01,
  DEVICES,
  devices,
  METRICS,
  metricStatus,
  metricTarget,
  sensorScreen,
  smooth,
  story,
  type MetricDef,
} from "../scroll/story";
import { DeviceRuntimeCard } from "./DeviceRuntimeCard";

// Live monitoring layer. Two telemetry cards (Temperatura, Humedad) keep the
// premium-industrial chart treatment; the two output devices (Luces, Aire
// acondicionado) render as DeviceRuntimeCard runtime-analytics widgets. The
// telemetry motion is driven imperatively from a single rAF loop reading shared
// `story` state — no React re-renders, matching the scene.

const STATUS = ["normal", "warning", "alarm"] as const;
const STATUS_COLOR = ["#a9d36a", "#e8b34a", "#f0654a"]; // soft green · amber · red
const SEGMENTS = ["1h", "12h", "24h"];
const SEG_ON = 1; // "12h" selected
const W = 70; // chart history samples (kept in a rolling buffer)
const ST = 0.19; // seconds per committed sample (gentle, slow-moving history)
const CW = 100;
const CH = 40;

// Cards enter one-by-one sweeping anti-clockwise around the room:
//   Humedad (top-right) → Aire (top) → Temperatura (left) → Luces (bottom-left)
const REVEAL_ORDER = { hum: 0, ac: 1, temp: 2, lights: 3 } as const;
const REVEAL_STAGGER = 0.13;
const REVEAL_DUR = 0.36;
const cardReveal = (vis: number, order: number) =>
  smooth(clamp01((vis - order * REVEAL_STAGGER) / REVEAL_DUR));
function applyReveal(el: HTMLElement | null, r: number) {
  if (!el) return;
  el.style.opacity = r.toFixed(3);
  el.style.transform = `translateY(${((1 - r) * 18).toFixed(1)}px) scale(${(0.95 + 0.05 * r).toFixed(3)})`;
}

// small calm telemetry jitter in roughly [-1, 1]
function wave(x: number, seed: number) {
  return (
    Math.sin(x * 1.7 + seed) * 0.5 +
    Math.sin(x * 0.71 + seed * 2.3) * 0.3 +
    Math.sin(x * 3.13 + seed * 0.7) * 0.2
  );
}

// point on a card's border in the direction of its sensor (for leader lines)
function borderPoint(r: DOMRect, sx: number, sy: number) {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale =
    1 /
    Math.max(
      Math.abs(dx) / (r.width / 2 + 2),
      Math.abs(dy) / (r.height / 2 + 2),
    );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function fmt(v: number, d: number) {
  return d === 0 ? Math.round(v).toString() : v.toFixed(d);
}

// 0 -> 1 -> 0 pulse for the "returning to timeline" note (~2.3s total)
function returnPulse(s: number) {
  if (s < 0 || s > 2.3) return 0;
  if (s < 0.25) return s / 0.25;
  if (s < 1.5) return 1;
  return Math.max(0, 1 - (s - 1.5) / 0.8);
}

export function MetricCards() {
  const intl = useIntl();
  const rootRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const returnRef = useRef<HTMLDivElement>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const arrowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const statRefs = useRef<(HTMLElement | null)[][]>(METRICS.map(() => []));
  const areaRefs = useRef<(SVGPathElement | null)[]>([]);
  const chartRefs = useRef<(SVGPathElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);

  const cur = useRef<number[]>(METRICS.map((m) => m.base));
  const prev = useRef<number[]>(METRICS.map((m) => m.base));

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    // persistent history buffers — older samples never change, so a rising
    // value only lifts the newest points at the right edge of the chart.
    const buf = METRICS.map((m) => new Float64Array(W).fill(m.base));
    const stepN = METRICS.map(() => 0);
    let lastClock = story.simClock; // chart advances on scroll-driven sim time
    const stepW = CW / W;
    let seenReleaseSeq = devices.releaseSeq;
    let returnAt = -10;
    let acEl: HTMLElement | null = null;
    let lightsEl: HTMLElement | null = null;
    const lineReveal = [1, 1]; // per-metric card reveal, gates its leader line

    const yOf = (v: number, m: MetricDef, range: number) => {
      const ty = 1 - (v - m.disp[0]) / range;
      return 2 + Math.max(0, Math.min(1, ty)) * (CH - 4);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      const vis = story.cards;
      const root = rootRef.current;
      const lines = linesRef.current;
      const hidden = vis < 0.01;
      if (root) {
        if (hidden) {
          if (root.style.display !== "none") root.style.display = "none";
        } else {
          if (root.style.display === "none") root.style.display = "";
          root.style.opacity = "1"; // per-card reveal owns the fade now
        }
      }
      if (lines) {
        if (hidden) {
          if (lines.style.display !== "none") lines.style.display = "none";
        } else {
          if (lines.style.display === "none") lines.style.display = "";
          lines.style.opacity = "1";
        }
      }
      if (hidden) return;

      // anti-clockwise staggered entrance (each card fades + rises into place)
      if (!acEl) acEl = document.querySelector<HTMLElement>(".mc-ac");
      if (!lightsEl)
        lightsEl = document.querySelector<HTMLElement>(".mc-lights");
      const rTemp = cardReveal(vis, REVEAL_ORDER.temp);
      const rHum = cardReveal(vis, REVEAL_ORDER.hum);
      applyReveal(cardRefs.current[0], rTemp); // METRICS[0] = Temperatura
      applyReveal(cardRefs.current[1], rHum); //  METRICS[1] = Humedad
      applyReveal(acEl, cardReveal(vis, REVEAL_ORDER.ac));
      applyReveal(lightsEl, cardReveal(vis, REVEAL_ORDER.lights));
      lineReveal[0] = rTemp;
      lineReveal[1] = rHum;

      const kCount = 1 - Math.exp(-dt * 6);
      // sample cadence rides the scroll-driven sim clock: commit whole steps,
      // keep the remainder as a fractional offset so the chart glides. Idle
      // scroll → no new samples (the history holds still).
      const clock = story.simClock;
      let steps = 0;
      while (clock - lastClock >= ST && steps < 8) {
        lastClock += ST;
        steps++;
      }
      const phase = (clock - lastClock) / ST;

      for (let i = 0; i < METRICS.length; i++) {
        const m = METRICS[i];
        const range = m.disp[1] - m.disp[0];
        // value counts smoothly toward its live sim target (temp/humidity)
        const target = metricTarget(m);
        cur.current[i] += (target - cur.current[i]) * kCount;
        const val = cur.current[i];
        const status = metricStatus(m, val);
        const color = STATUS_COLOR[status];

        const card = cardRefs.current[i];
        if (card) {
          card.style.setProperty("--st", color);
          if (card.dataset.status !== STATUS[status])
            card.dataset.status = STATUS[status];
        }
        const num = numRefs.current[i];
        if (num) num.textContent = fmt(val, m.decimals);
        const arrow = arrowRefs.current[i];
        if (arrow) {
          const slope = val - prev.current[i];
          const eps = range * 0.0008;
          arrow.textContent = slope > eps ? "↑" : slope < -eps ? "↓" : "";
        }
        prev.current[i] = val;

        // commit new samples (history slides left; only the tail carries `val`)
        const jitter = range * 0.012;
        const b = buf[i];
        for (let s = 0; s < steps; s++) {
          stepN[i]++;
          b.copyWithin(0, 1);
          b[W - 1] = val + wave(stepN[i] * 0.6, i + 1) * jitter;
        }

        // draw buffer with a sub-sample scroll offset + a live incoming tip
        let line = "";
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let j = 0; j < W; j++) {
          const v = b[j];
          if (v < min) min = v;
          if (v > max) max = v;
          sum += v;
          const x = j * stepW - phase * stepW;
          line +=
            (j ? "L" : "M") +
            x.toFixed(2) +
            " " +
            yOf(v, m, range).toFixed(2) +
            " ";
        }
        // incoming sample at the right edge follows the live value smoothly
        const tipX = W * stepW - phase * stepW;
        line +=
          "L" + tipX.toFixed(2) + " " + yOf(val, m, range).toFixed(2) + " ";
        const area =
          line + "L " + tipX.toFixed(2) + " " + CH + " L 0 " + CH + " Z";
        const lp = chartRefs.current[i];
        if (lp) lp.setAttribute("d", line);
        const ap = areaRefs.current[i];
        if (ap) ap.setAttribute("d", area);

        // live MIN / PROM / MED / MAX from the visible history
        const sorted = Float64Array.from(b).sort();
        const median = sorted[W >> 1];
        const stats = [min, sum / W, median, max];
        const cells = statRefs.current[i];
        for (let s = 0; s < 4; s++)
          if (cells[s]) cells[s]!.textContent = fmt(stats[s], m.decimals);
      }

      // "returning to recorded timeline" note (pulses when an override releases)
      if (devices.releaseSeq !== seenReleaseSeq) {
        seenReleaseSeq = devices.releaseSeq;
        returnAt = t;
      }
      const rp = returnPulse(t - returnAt);
      const rEl = returnRef.current;
      if (rEl) {
        if (rp < 0.01) {
          if (rEl.style.display !== "none") rEl.style.display = "none";
        } else {
          if (rEl.style.display === "none") rEl.style.display = "";
          rEl.style.opacity = (rp * vis).toFixed(3);
        }
      }

      // leader lines: sensor (projected) -> nearest card border
      for (let i = 0; i < METRICS.length; i++) {
        const s = sensorScreen[i];
        const card = cardRefs.current[i];
        const ln = lineRefs.current[i];
        const dot = dotRefs.current[i];
        if (!card || !ln || !dot) continue;
        const r = card.getBoundingClientRect();
        const bp = borderPoint(r, s.x, s.y);
        ln.setAttribute(
          "d",
          `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} L ${bp.x.toFixed(1)} ${bp.y.toFixed(1)}`,
        );
        const status = metricStatus(METRICS[i], cur.current[i]);
        ln.style.stroke =
          status === 2
            ? "rgba(240,101,74,0.5)"
            : status === 1
              ? "rgba(232,179,74,0.45)"
              : "rgba(169,211,106,0.3)";
        const lr = s.vis * lineReveal[i];
        ln.style.opacity = String(lr);
        dot.setAttribute("cx", s.x.toFixed(1));
        dot.setAttribute("cy", s.y.toFixed(1));
        dot.style.fill = STATUS_COLOR[status];
        dot.style.opacity = String(lr);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <svg
        className="mlines"
        ref={linesRef}
        style={{ display: "none" }}
        aria-hidden
      >
        {METRICS.map((m, i) => (
          <g key={m.id}>
            <path
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className="mline"
            />
            <circle
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="msdot"
              r={3}
            />
          </g>
        ))}
      </svg>

      <div className="metrics-layer" ref={rootRef} style={{ opacity: 0 }}>
        {METRICS.map((m, i) => (
          <MetricCard
            key={m.id}
            m={m}
            cardRef={(el) => (cardRefs.current[i] = el)}
            numRef={(el) => (numRefs.current[i] = el)}
            arrowRef={(el) => (arrowRefs.current[i] = el)}
            statRef={(s, el) => (statRefs.current[i][s] = el)}
            lineEl={(el) => (chartRefs.current[i] = el)}
            areaEl={(el) => (areaRefs.current[i] = el)}
          />
        ))}

        {/* output/control runtime widgets — AC between the telemetry cards, Luces at the room's bottom-left */}
        <DeviceRuntimeCard d={DEVICES[1]} posClass="mc-ac" />
        <DeviceRuntimeCard d={DEVICES[0]} posClass="mc-lights" />

        <div
          className="dev-return"
          ref={returnRef}
          style={{ display: "none" }}
          aria-hidden
        >
          <span className="dev-return-dot" />
          {intl.formatMessage({ id: "card.return" })}
        </div>
      </div>
    </>
  );
}

const STAT_LABEL_IDS = ["card.stat.min", "card.stat.avg", "card.stat.median", "card.stat.max"];

function MetricCard({
  m,
  cardRef,
  numRef,
  arrowRef,
  statRef,
  lineEl,
  areaEl,
}: {
  m: MetricDef;
  cardRef: (el: HTMLDivElement | null) => void;
  numRef: (el: HTMLSpanElement | null) => void;
  arrowRef: (el: HTMLSpanElement | null) => void;
  statRef: (s: number, el: HTMLElement | null) => void;
  lineEl: (el: SVGPathElement | null) => void;
  areaEl: (el: SVGPathElement | null) => void;
}) {
  const intl = useIntl();
  const gradId = `mcg-${m.id}`;
  const unit = m.id === "hum" ? intl.formatMessage({ id: "card.unit.hum" }) : m.unit;
  return (
    <div className={`mcard mc-${m.id}`} ref={cardRef} data-status="normal">
      <div className="mc-head">
        <div className="mc-id">
          <div className="mc-title">{intl.formatMessage({ id: `card.metric.${m.id}` })}</div>
        </div>
        <div className="mc-seg">
          {SEGMENTS.map((s, i) => (
            <span key={s} className={i === SEG_ON ? "on" : ""}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mc-value">
        <span className="mc-num" ref={numRef}>
          {fmt(m.base, m.decimals)}
        </span>
        {unit && <span className="mc-unit">{unit}</span>}
        <span className="mc-arrow" ref={arrowRef} />
        <span className="mc-badge">{intl.formatMessage({ id: "card.alert" })}</span>
      </div>

      <div className="mc-stats">
        {STAT_LABEL_IDS.map((labelId, s) => (
          <div className="mc-stat" key={labelId}>
            <b ref={(el) => statRef(s, el)}>{fmt(m.base, m.decimals)}</b>
            <span>{intl.formatMessage({ id: labelId })}</span>
          </div>
        ))}
      </div>

      <div className="mc-chart">
        <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="mc-grad-top" />
              <stop offset="1" className="mc-grad-bot" />
            </linearGradient>
          </defs>
          <path className="mc-area" ref={areaEl} fill={`url(#${gradId})`} />
          <path className="mc-line" ref={lineEl} />
        </svg>
      </div>
    </div>
  );
}
