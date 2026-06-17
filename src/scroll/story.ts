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
  eyebrow: "Plataforma de cultivo",
  tagline: "Medí, controlá y documentá cada ciclo — en tiempo real y sin puntos ciegos.",
  meta: [
    { k: "24/7", v: "Monitoreo continuo" },
    { k: "Automático", v: "Control de equipos" },
    { k: "Trazable", v: "De semilla a cosecha" },
  ],
};

// ---- holographic sensor readings (anchored on the room) --------------------
export const MEASURE_CHIPS = [
  { id: "temp", label: "Temperatura", value: "24.8 °C", anchor: [1.45, 1.55, -2.2] },
  { id: "hum", label: "Humedad", value: "63 %", anchor: [-2.35, 1.4, 0.1] },
  { id: "co2", label: "CO₂", value: "820 ppm", anchor: [0.6, 1.8, 0.35] },
  { id: "ph", label: "pH", value: "6.1", anchor: [-2.55, 0.95, -1.55] },
] as const;

// ---- single ID holo on the hero plant (the traceability hook) --------------
export const IMPROVE_TAGS = [{ id: "id", label: "Planta #2481", anchor: [1.35, 1.42, 0.6] }] as const;

// ---- live monitoring metric cards (the Growcast telemetry cards) -----------
// One card per environmental variable, ringed around the room. Temperature is
// the primary variable that drifts during the alert; the rest stay in range.
export interface MetricDef {
  id: string;
  name: string;
  sensor: string;
  unit: string;
  decimals: number;
  base: number; // resting value
  disp: [number, number]; // chart vertical display range
  warn?: number; // value >= warn  -> warning (amber)
  alarm?: number; // value >= alarm -> alarm (red)
  anchor: Vec3orT; // sensor position in room-local space (for leader lines)
}
type Vec3orT = [number, number, number];

// Two telemetry cards stay on the scene (Temperatura, Humedad). CO₂ is replaced
// by an output device card (Luces); pH/EC/PPFD/VPD live in the in-app dashboard.
export const METRICS: MetricDef[] = [
  { id: "temp", name: "Temperatura", sensor: "Sensor THC · Growcast +", unit: "°C", decimals: 1, base: 24.3, disp: [22.5, 29], warn: 25.9, alarm: 27.2, anchor: [1.45, 1.55, -2.2] },
  { id: "hum", name: "Humedad", sensor: "Sensor THC · Growcast +", unit: "%HR", decimals: 0, base: 62, disp: [48, 74], anchor: [-2.35, 1.4, 0.1] },
];

// screen-space sensor positions (px), written each frame by StoryDirector so
// the DOM card layer can draw leader lines without touching the 3D camera.
export const sensorScreen = METRICS.map(() => ({ x: 0, y: 0, vis: 0 }));

// ---- device control: output cards (Section 04 — Control de equipos) --------
// Output cards share the exact visual language of the telemetry cards but drive
// real equipment: grow lights + the wall AC. The CARD is the source of truth —
// the 3D room mirrors `devices` every frame. Each card also runs a small leader
// line to the equipment it controls (projected into `deviceScreen`).
export type DeviceId = "lights" | "ac";
export interface DeviceDef {
  id: DeviceId;
  name: string;
  meta: string; // metadata row (output type · module · zone)
  automation: string; // the rule operating the control (shown in the badge when AUTO)
  duty: number; // typical duty cycle 0..1 (seeds the runtime history)
  anchor: [number, number, number]; // equipment position in room-local space
}
export const DEVICES: DeviceDef[] = [
  { id: "lights", name: "Luces", meta: "Salida de control · Módulo integrado · Sala 2", automation: "Fotoperiodo", duty: 0.9, anchor: [-0.35, 1.96, 0.6] },
  { id: "ac", name: "Aire", meta: "Salida de control · Módulo integrado · Sala 2", automation: "Clima S2", duty: 0.55, anchor: [2.2, 2.0, -2.45] },
];
export const deviceScreen = DEVICES.map(() => ({ x: 0, y: 0, vis: 0 }));

// screen-space position (px) of the wall control tablet — the traceability report
// flies in 2D FROM exactly here, projected with the same view-offset-aware camera
// matrix as the cards (so it tracks the tablet; drei <Html transform> does not).
export const traceScreen = { x: 0, y: 0, vis: 0 };

// resolved device state, recomputed every frame from the timeline OR a user
// override. `manual` flags an active override (automation paused for it).
export interface DeviceView {
  on: boolean;
  level: number; // 0..1 output
  manual: boolean;
}
export const devices: Record<DeviceId, DeviceView> & { releaseSeq: number } = {
  lights: { on: true, level: 1, manual: false },
  ac: { on: false, level: 0, manual: false },
  releaseSeq: 0, // bumped whenever an override is auto-released (return-to-history)
};

interface DevOverride {
  active: boolean;
  on: boolean;
  level: number;
  setP: number; // scroll position when the user took control
}
const DEVICE_IDS: DeviceId[] = ["lights", "ac"];
let alarmLatch = 0; // notification sequence state within the incident band
const overrides: Record<DeviceId, DevOverride> = {
  lights: { active: false, on: true, level: 1, setP: 0 },
  ac: { active: false, on: false, level: 0, setP: 0 },
};
// scroll distance after taking control before the override is released and the
// recorded timeline resumes (well above any damping settle jitter).
const RELEASE_DELTA = 0.02;

// historical (scroll-driven) device states — the "recorded timeline"
function lightsHist(_p: number) {
  return { on: true, level: 1 }; // grow lights run through the whole cultivation arc
}
function acHist(p: number) {
  return acAuto(p); // cool by default; drops out during the incident
}
function deviceHist(id: DeviceId, p: number) {
  return id === "lights" ? lightsHist(p) : acHist(p);
}

// ---- user actions (called from the card click handlers) -------------------
export function deviceSetPower(id: DeviceId, on: boolean) {
  const o = overrides[id];
  o.active = true;
  o.on = on;
  o.level = on ? 1 : 0;
  o.setP = scrollState.current;
}
export function deviceSetAuto(id: DeviceId) {
  overrides[id].active = false; // release immediately back to the timeline
}
export function deviceSetManual(id: DeviceId) {
  const o = overrides[id];
  const v = devices[id];
  o.active = true;
  o.on = v.on;
  o.level = v.on ? v.level || 1 : 0;
  o.setP = scrollState.current;
}

export type MetricStatus = 0 | 1 | 2; // normal | warning | alarm
export function metricStatus(m: MetricDef, v: number): MetricStatus {
  if (m.alarm !== undefined && v >= m.alarm) return 2;
  if (m.warn !== undefined && v >= m.warn) return 1;
  return 0;
}
// resting target a card's value counts toward — temperature and humidity both
// follow the live climate sim (see updateStory); the rest rest at their base.
export function metricTarget(m: MetricDef): number {
  if (m.id === "temp") return story.temp;
  if (m.id === "hum") return story.hum;
  return m.base;
}

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

// consumption of the main supplies (label + value localized via i18n trace.cons.*)
export const CONSUMPTION = [
  { key: "water", pct: 0.74 },
  { key: "nutrients", pct: 0.46 },
  { key: "energy", pct: 0.62 },
] as const;

// ---- production-report content (the in-tablet traceability sections) -------
// Stable, language-neutral fields stay here; state/zone/start/harvest are
// localized via i18n (trace.state / trace.batch.*).
export const BATCH = {
  id: "#A-2408",
  cultivar: "Lemon Haze",
  operator: "M. Álvarez",
};

const HUM_SERIES = [0.55, 0.6, 0.58, 0.5, 0.46, 0.52, 0.6, 0.63, 0.62];
const CO2_SERIES = [0.6, 0.64, 0.58, 0.55, 0.62, 0.7, 0.66, 0.6, 0.63];
const VPD_SERIES = [0.5, 0.48, 0.54, 0.7, 0.62, 0.5, 0.46, 0.5, 0.52];

// label localized via i18n (trace.env.<id>); the "%HR" token in the humidity
// value is swapped for the localized unit (card.unit.hum) at render time.
export const ENV_SUMMARY = [
  { id: "temp", value: "24.6 °C", range: "22–26 °C", series: TEMP_SERIES, color: "#a9d36a" },
  { id: "hum", value: "64 %HR", range: "55–70 %", series: HUM_SERIES, color: "#8fb8cc" },
  { id: "co2", value: "824 ppm", range: "700–1000 ppm", series: CO2_SERIES, color: "#c8e06a" },
  { id: "vpd", value: "1.04 kPa", range: "0.8–1.2 kPa", series: VPD_SERIES, color: "#cf8fe0" },
];

// text localized via i18n (trace.event.<key>)
export const TRACE_EVENTS = [
  { t: "09:12", key: "tempAlarm", kind: "alarm" },
  { t: "09:13", key: "venting", kind: "action" },
  { t: "09:15", key: "humRecovered", kind: "ok" },
  { t: "09:17", key: "alarmResolved", kind: "ok" },
  { t: "11:40", key: "irrigation", kind: "action" },
  { t: "14:05", key: "dosing", kind: "action" },
] as const;

// label + note localized via i18n (trace.comp.<key>.*); calibration's value is
// a date, so it is localized too (value:null -> trace.comp.calibration.value).
export const COMPLIANCE = [
  { key: "alarms", value: "3" as string | null },
  { key: "manual", value: "1" as string | null },
  { key: "auto", value: "128" as string | null },
  { key: "calibration", value: null as string | null },
];

// value stays here; label localized via i18n (trace.prod.<key>)
export const PRODUCTION = [
  { value: "1.8 kg/m²", key: "yield" },
  { value: "94 %", key: "water" },
  { value: "98 / 100", key: "stability" },
  { value: "A+", key: "quality" },
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
    k: "04 · Control de equipos",
    h: "Del dato a la acción física",
    s: "Growcast no solo mide: enciende, regula y apaga los equipos de la sala.",
    lead: "Luces y climatización responden en automático, y siempre podés tomar el control manual desde la tarjeta.",
  },
];

export const HERO_POS: [number, number, number] = [0.6, 1.18, 0.95];

// ---------------------------------------------------------------------------
// Phase windows. Intro at the start; the traceability dashboard is wide so it
// stays on screen longer.
// ---------------------------------------------------------------------------
function growthAt(p: number) {
  if (p < 0.16) return 0.22;
  if (p < 0.24) return lerp(0.22, 0.42, smooth(seg(p, 0.16, 0.24)));
  if (p < 0.53) return lerp(0.42, 0.66, smooth(seg(p, 0.24, 0.53)));
  if (p < 0.6) return lerp(0.66, 1.0, smooth(seg(p, 0.53, 0.6)));
  return 1.0;
}
// Auto AC schedule: the climate system keeps the room cool by default, then
// DROPS OUT during the incident (≈0.24–0.42) so the room heats up and the alarm
// trips, then recovers. (Manual override can run it any time.)
function acAuto(p: number) {
  // AC drops out as the incident begins (temp climbs, alarm trips), then comes
  // back on right as the CONTROL section starts (~0.39) so the recovery is shown
  // there — not after it. The climate sim below then cools the room promptly.
  const dropout = smooth(seg(p, 0.22, 0.28)) * (1 - smooth(seg(p, 0.39, 0.45)));
  const level = clamp01(1 - dropout);
  return { on: level > 0.15, level };
}

// ---- climate physics: the AC cools + dehumidifies the room ----------------
// The room is inherently warm (grow lights): with the AC OFF temperature climbs
// toward AMBIENT_HOT, with it ON it is pulled toward the cool setpoint. So temp
// rises the whole time the AC is off, and the alarm trips when it actually
// crosses the threshold. Integrated off a fast rate so the move is quick.
const AMBIENT_HOT = 30.5; // °C the room drifts to with no cooling
const TEMP_SETPOINT = 22.5; // °C the AC drives temperature toward when running
const AMBIENT_HUM_HOT = 71; // %HR with no dehumidifying
const HUM_SETPOINT = 52; // %HR the AC drives humidity toward when running
const TEMP_RATE = 4.0; // per sim-second — temp tracks the AC closely (states linked)
const HUM_RATE = 2.4; // per sim-second
// sim time runs continuously off the wall clock (TIME_SCALE = sim-sec per real-sec)
const TIME_SCALE = 0.36;

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
  hum: 62,
  simClock: 0, // sim time, advanced slowly off the wall clock
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
  traceIn: 0, // room exits up + tablet detaches/enlarges
  traceScroll: 0, // internal report scroll inside the tablet
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
  cards: 0,
  headline: [0, 0, 0, 0, 0] as number[],
};

export function updateStory(p: number, dt = 0) {
  story.p = p;
  // sim time advances slowly and continuously off the wall clock
  const simDt = Math.min(dt, 0.05) * TIME_SCALE;
  story.simClock += simDt;
  story.growth = growthAt(p);

  // ---- resolve device state: user override OR the recorded timeline --------
  // An override is released once the user scrolls past where they took control,
  // resuming the historical state (and pulsing the "return to timeline" note).
  // Resolved first so the AC's state can drive the climate physics below.
  for (const id of DEVICE_IDS) {
    const o = overrides[id];
    if (o.active && Math.abs(p - o.setP) > RELEASE_DELTA) {
      o.active = false;
      devices.releaseSeq++;
    }
    const v = devices[id];
    if (o.active) {
      v.on = o.on;
      v.level = o.level;
      v.manual = true;
    } else {
      const h = deviceHist(id, p);
      v.on = h.on;
      v.level = h.level;
      v.manual = false;
    }
  }
  // AC running level (auto or manual); drives the airflow, leaves + climate
  const ac = devices.ac.on ? devices.ac.level : 0;
  story.fan = ac;
  story.agitation = ac;

  // ---- climate physics: AC influence on temperature & humidity -------------
  // With the AC off the room climbs toward AMBIENT_HOT; with it on it is pulled
  // to the cool setpoint. So temperature rises the whole time the AC is off, and
  // the alarm trips when temp actually crosses the threshold.
  const targetTemp = lerp(AMBIENT_HOT, TEMP_SETPOINT, ac) + Math.sin(story.simClock * 0.5) * 0.1;
  const targetHum = lerp(AMBIENT_HUM_HOT, HUM_SETPOINT, ac * 0.9) + Math.sin(story.simClock * 0.4 + 1.7) * 0.5;
  story.temp += (targetTemp - story.temp) * (1 - Math.exp(-simDt * TEMP_RATE));
  story.hum += (targetHum - story.hum) * (1 - Math.exp(-simDt * HUM_RATE));
  story.tempColorHex = tempColor(story.temp);
  story.alert = smooth(seg(story.temp, 26.2, 27.4));
  // Traceability: a transition (room rises out / tablet detaches + enlarges)
  // followed by an internal report scroll inside the now-large tablet.
  story.traceP = seg(p, 0.6, 0.94);
  story.traceIn = smooth(seg(p, 0.62, 0.72));
  // internal report scroll stays LOCKED at the top until the report finishes
  // flying to the front (the fly transform completes by p≈0.77); it then scrolls
  // to its end (incl. section F + footer) by 0.92, before the ending fade.
  story.traceScroll = seg(p, 0.78, 0.92);
  story.finalP = seg(p, 0.95, 1.0);

  // intro -> story
  story.introFade = 1 - smooth(seg(p, 0.05, 0.09));
  story.scrollHint = 1 - smooth(seg(p, 0.004, 0.03));

  // Notifications follow the real climate, not the scroll position: alta (temp
  // crossed the threshold) → enfriamiento (AC came back on) → normalizada (temp
  // recovered). Latched within the incident band so they read as a sequence.
  if (p < 0.2 || p > 0.62) {
    alarmLatch = 0;
  } else {
    if (story.alert > 0.45) alarmLatch = Math.max(alarmLatch, 1);
    if (alarmLatch >= 1 && devices.ac.on && story.fan > 0.4) alarmLatch = Math.max(alarmLatch, 2);
    if (alarmLatch >= 2 && story.temp < 25) alarmLatch = Math.max(alarmLatch, 3);
  }
  story.notif = alarmLatch;

  const toAC = smooth(seg(p, 0.37, 0.47));
  const fromAC = smooth(seg(p, 0.56, 0.66));
  story.focusYaw = 0.32 * toAC * (1 - fromAC) - 0.1 * fromAC;
  story.zoom = 1 + 0.1 * smooth(seg(p, 0.58, 0.69));

  story.fSensors = band(p, 0.08, 0.2, 0.25, 0.3);
  story.fTemp = band(p, 0.08, 0.56, 0.1, 0.1);
  story.fImprove = band(p, 0.6, 0.71, 0.2, 0.25) * (1 - story.traceP);

  story.headline[0] = band(p, 0.08, 0.2);
  story.headline[1] = band(p, 0.24, 0.37);
  story.headline[2] = band(p, 0.39, 0.49);
  story.headline[3] = band(p, 0.49, 0.6); // 04 · Control de equipos
  story.headline[4] = 0;

  // the room visibly rises out of frame — no covering scrim needed
  story.scrim = 0;

  // live metric + device cards ring the room through the monitoring & control
  // arc (scenes 1-4), then clear out before the traceability dashboard appears.
  story.cards = clamp01(smooth(seg(p, 0.04, 0.1))) * (1 - clamp01(smooth(seg(p, 0.57, 0.61))));

  story.roomFade = 1 - 0.88 * seg(p, 0.94, 1.0);
  story.ambient = lerp(2.0, 1.6, seg(p, 0.85, 1.0)) * lerp(1, 0.5, seg(p, 0.94, 1.0));
}
