import * as THREE from "three";

// ===========================================================================
// Growcast scroll story — a single source of truth.
//
// GSAP ScrollTrigger writes `scrollState.target` (0..1). The StoryDirector damps
// `current -> target` once per frame and calls updateStory(), which fills the
// mutable `story` object. The director then applies `story` to the 3D scene AND
// to the DOM overlays (via the `ui` ref registry) — one loop, no React renders.
// ===========================================================================

// ---- math helpers ---------------------------------------------------------
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** local 0..1 progress of `p` inside [a,b] */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** band opacity: fades in over the first `fi`, out over the last `fo` of [a,b] */
export const band = (p: number, a: number, b: number, fi = 0.18, fo = 0.18) => {
  if (p <= a || p >= b) return 0;
  const t = (p - a) / (b - a);
  return clamp01(Math.min(t / fi, 1, (1 - t) / fo));
};

// ---- palette --------------------------------------------------------------
export const COLORS = {
  bgWarm: "#080A08",
  bgCold: "#050705",
  black: "#020302",
  accent: "#C8E06A",
  accent2: "#9CB64F",
  accent3: "#D8EE82",
  amber: "#E8C36A",
  red: "#E0796A",
};

// ---- scroll state ---------------------------------------------------------
export const scrollState = { target: 0, current: 0 };

// ---- DOM ref registry (overlays register, director mutates) ---------------
export const ui: Record<string, HTMLElement | null> = {};
export const regRef = (key: string) => (el: HTMLElement | null) => {
  ui[key] = el;
};

export const MEASURE_CHIPS = [
  { id: "temp", label: "Temperatura", value: "24.8°C", anchor: [1.45, 1.78, -2.25] },
  { id: "hum", label: "Humedad", value: "63%", anchor: [-2.35, 1.68, 0.05] },
  { id: "co2", label: "CO₂", value: "820 ppm", anchor: [0.6, 2.08, 0.35] },
  { id: "ec", label: "EC", value: "1.7", anchor: [-2.55, 1.28, -1.6] },
  { id: "ph", label: "pH", value: "6.1", anchor: [-2.55, 0.95, -1.6] },
] as const;

export const IMPROVE_TAGS = [
  { id: "id", label: "Planta #2481", anchor: [0.6, 1.62, 0.95] },
  { id: "day", label: "Día 37", anchor: [1.35, 1.42, 0.7] },
  { id: "batch", label: "Lote A-204", anchor: [-0.2, 1.5, 1.25] },
  { id: "cultivar", label: "Blue Dream", anchor: [1.25, 1.12, 1.3] },
  { id: "program", label: "Programa de Riego B", anchor: [-0.35, 1.15, 0.55] },
] as const;

export const LOG_LINES = [
  "14:32   Temperatura sobre el umbral",
  "14:32   Alerta generada",
  "14:32   Automatización activada",
  "14:32   Climatización · ON",
  "14:36   Temperatura normalizada",
];

export const TRACE_ITEMS = [
  "Trasplante",
  "Poda",
  "Eventos de Riego",
  "Historial Ambiental",
  "Plan de Nutrición",
  "Acciones del Operario",
  "Predicción de Rendimiento",
];

export const HEADLINES = [
  { h: "Medir Todo", s: "Conocé exactamente qué ocurre en cada parte de tu instalación." },
  { h: "Detectar a Tiempo", s: "Identificá los problemas antes de que afecten al cultivo." },
  { h: "Controlar Automáticamente", s: "Convertí los datos en acciones, sin intervención manual." },
  { h: "Cada Planta con Contexto", s: "Seguí todo, del ambiente a la cosecha." },
  { h: "Trazabilidad Total", s: "De los sensores al historial completo del cultivo." },
];

// The hero plant the camera lands on (also the IMPROVE / TRACE anchor).
export const HERO_POS: [number, number, number] = [0.6, 1.18, 0.95];

// ---- simulation curves ----------------------------------------------------
function tempAt(p: number) {
  if (p < 0.28) return 24.8;
  if (p < 0.44) return lerp(24.8, 28.4, smooth(seg(p, 0.28, 0.44)));
  if (p < 0.52) return 28.4;
  if (p < 0.68) return lerp(28.4, 24.9, smooth(seg(p, 0.52, 0.68)));
  return 24.9;
}

function growthAt(p: number) {
  if (p < 0.14) return 0.42;
  if (p < 0.28) return lerp(0.42, 0.55, smooth(seg(p, 0.14, 0.28)));
  if (p < 0.68) return lerp(0.55, 0.66, smooth(seg(p, 0.28, 0.68)));
  if (p < 0.76) return lerp(0.66, 1.0, smooth(seg(p, 0.68, 0.76)));
  return 1.0;
}

function fanAt(p: number) {
  if (p < 0.54) return 0;
  if (p < 0.6) return smooth(seg(p, 0.54, 0.6));
  if (p < 0.8) return 1;
  return lerp(1, 0.22, smooth(seg(p, 0.8, 0.92)));
}

function logStepAt(p: number) {
  let n = 0;
  if (p >= 0.4) n = 1;
  if (p >= 0.43) n = 2;
  if (p >= 0.55) n = 3;
  if (p >= 0.58) n = 4;
  if (p >= 0.66) n = 5;
  return n;
}

// Green -> soft amber -> soft red, by temperature.
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

// ---- the live story object ------------------------------------------------
export const story = {
  p: 0,
  temp: 24.8,
  tempColorHex: COLORS.accent,
  alert: 0, // alert chip / amber glow 0..1
  logStep: 0,
  growth: 0.42,
  fan: 0, // climate/AC airflow 0..1
  agitation: 0, // leaf airflow response 0..1
  ambient: 1, // bright base; only dims slightly at the very end
  roomFade: 1, // 1 fully present -> recedes at final
  // floating-diorama motion
  focusYaw: 0, // per-act yaw bias for the room turntable
  zoom: 1, // ortho zoom factor
  // section windows
  traceP: 0,
  finalP: 0,
  // overlay opacities
  fMetrics: 0, // MEASURE metric chips (below room)
  fIncident: 0, // DETECT+CONTROL panel (temp/alert/log)
  fImprove: 0, // IMPROVE context tags
  headline: [0, 0, 0, 0, 0] as number[],
};

export function updateStory(p: number) {
  story.p = p;
  story.temp = tempAt(p);
  story.tempColorHex = tempColor(story.temp);
  story.alert = smooth(seg(story.temp, 26.2, 27.2));
  story.logStep = logStepAt(p);
  story.growth = growthAt(p);
  story.fan = fanAt(p);
  story.agitation = story.fan;
  story.traceP = seg(p, 0.88, 0.96);
  story.finalP = seg(p, 0.95, 1.0);

  // floating diorama: gentle turntable bias toward the relevant prop + zoom-in
  const toAC = smooth(seg(p, 0.46, 0.62));
  const fromAC = smooth(seg(p, 0.7, 0.84));
  story.focusYaw = 0.34 * toAC * (1 - fromAC) - 0.12 * fromAC;
  story.zoom = 1 + 0.16 * smooth(seg(p, 0.84, 0.96));

  // text panels (above/below the room)
  story.fMetrics = band(p, 0.03, 0.27, 0.2, 0.25);
  story.fIncident = band(p, 0.28, 0.74, 0.1, 0.12);
  story.fImprove = band(p, 0.76, 0.88, 0.2, 0.25) * (1 - story.traceP);
  story.headline[0] = band(p, 0.0, 0.22, 0.01, 0.25);
  story.headline[1] = band(p, 0.28, 0.5);
  story.headline[2] = band(p, 0.54, 0.72);
  story.headline[3] = band(p, 0.76, 0.88);
  story.headline[4] = band(p, 0.88, 0.97) * (1 - story.finalP);

  // lighting — bright throughout; only the final composition dims/recedes
  story.roomFade = 1 - 0.82 * seg(p, 0.93, 1.0);
  story.ambient = lerp(1.05, 0.85, seg(p, 0.86, 1.0)) * lerp(1, 0.4, seg(p, 0.93, 1.0));
}
