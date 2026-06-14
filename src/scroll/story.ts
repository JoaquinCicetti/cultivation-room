import * as THREE from "three";

// ===========================================================================
// Growcast scroll story — single source of truth.
// GSAP ScrollTrigger writes scrollState.target; StoryDirector damps current and
// applies `story` to the 3D scene AND the DOM (via `ui`). No React re-renders.
// ===========================================================================

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const band = (p: number, a: number, b: number, fi = 0.18, fo = 0.18) => {
  if (p <= a || p >= b) return 0;
  const t = (p - a) / (b - a);
  return clamp01(Math.min(t / fi, 1, (1 - t) / fo));
};

export const COLORS = {
  accent: "#c8e06a",
  amber: "#e8b34a",
  red: "#e2543a",
};

export const scrollState = { target: 0, current: 0 };

export const ui: Record<string, HTMLElement | null> = {};
export const regRef = (key: string) => (el: HTMLElement | null) => {
  ui[key] = el;
};

// ---- holographic sensor readings (anchored on the room) -------------------
export const MEASURE_CHIPS = [
  { id: "temp", label: "Temperatura", value: "24.8 °C", anchor: [1.45, 1.55, -2.2] },
  { id: "hum", label: "Humedad", value: "63 %", anchor: [-2.35, 1.4, 0.1] },
  { id: "co2", label: "CO₂", value: "820 ppm", anchor: [0.6, 1.8, 0.35] },
  { id: "ph", label: "pH", value: "6.1", anchor: [-2.55, 0.95, -1.55] },
] as const;

// ---- single ID holo on the hero plant (links to its traceability record) --
export const IMPROVE_TAGS = [{ id: "id", label: "Planta #2481", anchor: [0.6, 1.62, 0.95] }] as const;

// ---- bottom-right notification toasts -------------------------------------
export const NOTIFICATIONS = [
  { title: "Temperatura alta", desc: "28.4 °C · supera el umbral", kind: "warn", at: 0.31 },
  { title: "Enfriamiento activado", desc: "Climatización en marcha", kind: "action", at: 0.46 },
  { title: "Temperatura normalizada", desc: "24.9 °C · dentro de rango", kind: "ok", at: 0.55 },
] as const;

// ---- traceability sub-window data -----------------------------------------
export const TIMELINE = [
  { day: "Día 1", label: "Trasplante" },
  { day: "Día 12", label: "Primer riego automatizado" },
  { day: "Día 21", label: "Poda de formación" },
  { day: "Día 28", label: "Cambio de solución nutritiva" },
  { day: "Día 30", label: "Inicio de floración" },
  { day: "Día 37", label: "Lectura actual" },
];

export const TRACE_METRICS = [
  { value: "1.8 kg/m²", label: "Rendimiento estimado" },
  { value: "5", label: "Ciclos completados" },
  { value: "37", label: "Días de ciclo" },
  { value: "1.284", label: "Eventos registrados" },
];

// ---- professional storytelling (left, over the scene) ---------------------
export const HEADLINES = [
  {
    k: "01 · Medición",
    h: "Medición en tiempo real",
    s: "Visibilidad completa del estado de cada zona de la instalación.",
    lead: "Temperatura, humedad, CO₂ y pH se registran de forma continua, sin puntos ciegos.",
  },
  {
    k: "02 · Detección",
    h: "Detección temprana",
    s: "Identificación de desviaciones antes de que afecten al cultivo.",
    lead: "Cada lectura se compara contra los umbrales definidos y se notifica apenas algo se sale de rango.",
  },
  {
    k: "03 · Control",
    h: "Control automático",
    s: "Cada lectura se convierte en una acción, sin intervención manual.",
    lead: "Ante una alerta, la climatización se activa sola y devuelve el ambiente a su rango óptimo.",
  },
  {
    k: "04 · Contexto",
    h: "Contexto por planta",
    s: "Historial de ambiente, nutrición, riego y rendimiento, planta por planta.",
    lead: "Cada ejemplar acumula su propia historia: lote, genética, programa de riego y días de ciclo.",
  },
  {
    k: "05 · Trazabilidad",
    h: "Trazabilidad total",
    s: "Del dato del sensor al historial verificable de todo el ciclo.",
    lead: "Todo queda registrado y disponible al instante en un pasaporte digital del cultivo.",
  },
];

export const HERO_POS: [number, number, number] = [0.6, 1.18, 0.95];

// ---------------------------------------------------------------------------
// Phase windows (progress 0..1). Traceability is wide for its sub-scroll.
// ---------------------------------------------------------------------------
function tempAt(p: number) {
  if (p < 0.22) return 24.8;
  if (p < 0.37) return lerp(24.8, 28.4, smooth(seg(p, 0.22, 0.37)));
  if (p < 0.43) return 28.4;
  if (p < 0.57) return lerp(28.4, 24.9, smooth(seg(p, 0.43, 0.57)));
  return 24.9;
}
function growthAt(p: number) {
  // wider range -> plants visibly grow through the cycle
  if (p < 0.13) return 0.22;
  if (p < 0.22) return lerp(0.22, 0.42, smooth(seg(p, 0.13, 0.22)));
  if (p < 0.57) return lerp(0.42, 0.66, smooth(seg(p, 0.22, 0.57)));
  if (p < 0.7) return lerp(0.66, 1.0, smooth(seg(p, 0.57, 0.7)));
  return 1.0;
}
function fanAt(p: number) {
  if (p < 0.43) return 0;
  if (p < 0.49) return smooth(seg(p, 0.43, 0.49));
  if (p < 0.66) return 1;
  return lerp(1, 0.22, smooth(seg(p, 0.66, 0.78)));
}

const cGreen = new THREE.Color(COLORS.accent);
const cAmber = new THREE.Color(COLORS.amber);
const cRed = new THREE.Color(COLORS.red);
const tmpCol = new THREE.Color();
function tempColor(temp: number): string {
  if (temp <= 25.5) tmpCol.copy(cGreen);
  else if (temp <= 27.0) tmpCol.copy(cGreen).lerp(cAmber, smooth(seg(temp, 25.5, 27.0)));
  else tmpCol.copy(cAmber).lerp(cRed, smooth(seg(temp, 27.0, 28.4)));
  return "#" + tmpCol.getHexString();
}

export const story = {
  p: 0,
  temp: 24.8,
  tempColorHex: COLORS.accent,
  alert: 0,
  growth: 0.42,
  fan: 0,
  agitation: 0,
  ambient: 1,
  roomFade: 1,
  focusYaw: 0,
  zoom: 1,
  // sections
  traceP: 0,
  finalP: 0,
  notif: 0, // count of active toasts
  // holо fades
  fSensors: 0, // hum/co2/ec/ph holos (MEASURE only)
  fTemp: 0, // temp holo (MEASURE..CONTROL)
  fImprove: 0, // context holos
  // traceability sub-progress
  qrP: 0,
  lineP: 0,
  timelineP: 0,
  metricsP: 0,
  scrim: 0,
  scrollHint: 1,
  headline: [0, 0, 0, 0, 0] as number[],
};

export function updateStory(p: number) {
  story.p = p;
  story.temp = tempAt(p);
  story.tempColorHex = tempColor(story.temp);
  story.alert = smooth(seg(story.temp, 26.2, 27.4));
  story.growth = growthAt(p);
  story.fan = fanAt(p);
  story.agitation = story.fan;
  story.traceP = seg(p, 0.77, 0.94);
  story.finalP = seg(p, 0.94, 1.0);

  // notifications revealed by threshold
  let n = 0;
  for (const t of NOTIFICATIONS) if (p >= t.at) n++;
  story.notif = n;

  // diorama motion
  const toAC = smooth(seg(p, 0.39, 0.5));
  const fromAC = smooth(seg(p, 0.59, 0.7));
  story.focusYaw = 0.32 * toAC * (1 - fromAC) - 0.1 * fromAC;
  story.zoom = 1 + 0.12 * smooth(seg(p, 0.62, 0.74));

  // holographic readings
  story.fSensors = band(p, 0.02, 0.2, 0.25, 0.3);
  story.fTemp = band(p, 0.02, 0.62, 0.1, 0.1);
  story.fImprove = band(p, 0.65, 0.77, 0.2, 0.25) * (1 - story.traceP);

  // headlines (left, over the scene) — the first is visible from the very start
  story.headline[0] = 1 - smooth(seg(p, 0.1, 0.18));
  story.headline[1] = band(p, 0.22, 0.39);
  story.headline[2] = band(p, 0.43, 0.6);
  story.headline[3] = band(p, 0.65, 0.78);
  // section 5's text lives inside the traceability panel (above its timeline)
  story.headline[4] = 0;
  story.scrollHint = 1 - smooth(seg(p, 0.004, 0.03));

  // traceability sub-sequence
  const tl = story.traceP;
  story.qrP = seg(tl, 0.0, 0.22);
  story.lineP = seg(tl, 0.22, 0.38);
  story.timelineP = seg(tl, 0.34, 0.78);
  story.metricsP = seg(tl, 0.74, 1.0);
  story.scrim = clamp01(smooth(seg(p, 0.78, 0.85)));

  // lighting — brighter steady scene; only the final dims/recedes
  story.roomFade = 1 - 0.88 * seg(p, 0.92, 1.0);
  story.ambient = lerp(2.0, 1.6, seg(p, 0.85, 1.0)) * lerp(1, 0.45, seg(p, 0.92, 1.0));
}
