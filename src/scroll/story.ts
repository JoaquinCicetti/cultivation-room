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

export const COLORS = { accent: "#c8e06a", amber: "#e8b34a", red: "#e2543a" };

export const scrollState = { target: 0, current: 0 };

export const ui: Record<string, HTMLElement | null> = {};
export const regRef = (key: string) => (el: HTMLElement | null) => {
  ui[key] = el;
};

// ---- opening ---------------------------------------------------------------
export const INTRO = {
  brand: "Growcast",
  tagline: "Cultivo observable, automatizado y trazable.",
};

// ---- holographic sensor readings (anchored on the room) --------------------
export const MEASURE_CHIPS = [
  { id: "temp", label: "Temperatura", value: "24.8 °C", anchor: [1.45, 1.55, -2.2] },
  { id: "hum", label: "Humedad", value: "63 %", anchor: [-2.35, 1.4, 0.1] },
  { id: "co2", label: "CO₂", value: "820 ppm", anchor: [0.6, 1.8, 0.35] },
  { id: "ph", label: "pH", value: "6.1", anchor: [-2.55, 0.95, -1.55] },
] as const;

// ---- single ID holo on the hero plant (the traceability hook) --------------
export const IMPROVE_TAGS = [{ id: "id", label: "Planta #2481", anchor: [0.6, 1.62, 0.95] }] as const;

// ---- bottom-right notification toasts -------------------------------------
export const NOTIFICATIONS = [
  { title: "Temperatura alta", desc: "28.4 °C · supera el umbral", kind: "warn", at: 0.3 },
  { title: "Enfriamiento activado", desc: "Climatización en marcha", kind: "action", at: 0.44 },
  { title: "Temperatura normalizada", desc: "24.9 °C · dentro de rango", kind: "ok", at: 0.52 },
] as const;

// ---- traceability dashboard data ------------------------------------------
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

// yield per cycle (normalized) and ambient temperature over the last days
export const YIELD_SERIES = [0.32, 0.42, 0.38, 0.55, 0.64, 0.6, 0.74, 0.82, 0.9];
export const TEMP_SERIES = [0.45, 0.5, 0.62, 0.85, 0.7, 0.55, 0.48, 0.5, 0.46];

// consumption of the main supplies
export const CONSUMPTION = [
  { label: "Agua", value: "1.240 L", pct: 0.74 },
  { label: "Nutrientes", value: "86 L", pct: 0.46 },
  { label: "Energía", value: "312 kWh", pct: 0.62 },
];

// ---- professional storytelling (left, over the scene) ----------------------
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
    k: "04 · Trazabilidad",
    h: "Cada planta, trazada",
    s: "Cada ejemplar guarda su historia completa, de la semilla a la cosecha.",
    lead: "Lote, genética, programa de riego y días de ciclo quedan asociados a cada planta.",
  },
];

export const HERO_POS: [number, number, number] = [0.6, 1.18, 0.95];

// ---------------------------------------------------------------------------
// Phase windows. Intro at the start; the traceability dashboard is wide so it
// stays on screen longer.
// ---------------------------------------------------------------------------
function tempAt(p: number) {
  if (p < 0.24) return 24.8;
  if (p < 0.36) return lerp(24.8, 28.4, smooth(seg(p, 0.24, 0.36)));
  if (p < 0.41) return 28.4;
  if (p < 0.53) return lerp(28.4, 24.9, smooth(seg(p, 0.41, 0.53)));
  return 24.9;
}
function growthAt(p: number) {
  if (p < 0.16) return 0.22;
  if (p < 0.24) return lerp(0.22, 0.42, smooth(seg(p, 0.16, 0.24)));
  if (p < 0.53) return lerp(0.42, 0.66, smooth(seg(p, 0.24, 0.53)));
  if (p < 0.6) return lerp(0.66, 1.0, smooth(seg(p, 0.53, 0.6)));
  return 1.0;
}
function fanAt(p: number) {
  if (p < 0.41) return 0;
  if (p < 0.47) return smooth(seg(p, 0.41, 0.47));
  if (p < 0.6) return 1;
  return lerp(1, 0.22, smooth(seg(p, 0.6, 0.72)));
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
  traceP: 0,
  finalP: 0,
  introFade: 1,
  notif: 0,
  fSensors: 0,
  fTemp: 0,
  fImprove: 0,
  // traceability dashboard sub-progress
  qrP: 0,
  lineP: 0,
  timelineP: 0,
  chartsP: 0,
  consumptionP: 0,
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
  story.traceP = seg(p, 0.7, 0.93);
  story.finalP = seg(p, 0.93, 1.0);

  // intro -> story
  story.introFade = 1 - smooth(seg(p, 0.05, 0.09));
  story.scrollHint = 1 - smooth(seg(p, 0.004, 0.03));

  let n = 0;
  for (const t of NOTIFICATIONS) if (p >= t.at) n++;
  story.notif = n;

  const toAC = smooth(seg(p, 0.37, 0.47));
  const fromAC = smooth(seg(p, 0.56, 0.66));
  story.focusYaw = 0.32 * toAC * (1 - fromAC) - 0.1 * fromAC;
  story.zoom = 1 + 0.1 * smooth(seg(p, 0.58, 0.69));

  story.fSensors = band(p, 0.08, 0.2, 0.25, 0.3);
  story.fTemp = band(p, 0.08, 0.56, 0.1, 0.1);
  story.fImprove = band(p, 0.6, 0.71, 0.2, 0.25) * (1 - story.traceP);

  story.headline[0] = band(p, 0.08, 0.2);
  story.headline[1] = band(p, 0.24, 0.37);
  story.headline[2] = band(p, 0.41, 0.54);
  story.headline[3] = band(p, 0.6, 0.71);
  story.headline[4] = 0;

  // traceability dashboard sub-sequence (over the wide trace window)
  const tl = story.traceP;
  story.qrP = seg(tl, 0.0, 0.14);
  story.lineP = seg(tl, 0.12, 0.24);
  story.timelineP = seg(tl, 0.2, 0.44);
  story.chartsP = seg(tl, 0.4, 0.68);
  story.consumptionP = seg(tl, 0.62, 0.86);
  story.metricsP = seg(tl, 0.82, 1.0);
  story.scrim = clamp01(smooth(seg(p, 0.69, 0.75)));

  story.roomFade = 1 - 0.88 * seg(p, 0.94, 1.0);
  story.ambient = lerp(2.0, 1.6, seg(p, 0.85, 1.0)) * lerp(1, 0.5, seg(p, 0.94, 1.0));
}
