import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import * as mat from "./materials";
import { GROW_LIGHTS } from "./sceneData";
import {
  clamp01,
  IMPROVE_TAGS,
  lerp,
  MEASURE_CHIPS,
  NOTIFICATIONS,
  scrollState,
  smooth,
  story,
  TIMELINE,
  TRACE_METRICS,
  ui,
  updateStory,
} from "../scroll/story";

// Look well left of the room so it sits in the RIGHT of the full-bleed canvas,
// leaving the left clear for the overlaid text.
const CAM_TARGET = new THREE.Vector3(-3.4, 1.3, 0);

const GROW_GREEN = new THREE.Color(0x9ed84a); // clearly green cultivation light
const ALERT_RED = new THREE.Color(0xff3b2e);
const gcol = new THREE.Color();

// "Lights on" intro: grow lights stutter on like LED/fluorescent tubes.
function flicker(x: number) {
  if (x < 0.05) return 0;
  if (x < 0.09) return 0.8;
  if (x < 0.13) return 0.1;
  if (x < 0.17) return 1;
  if (x < 0.21) return 0.4;
  return 1;
}

function setEl(key: string, opacity: number, ty = 0, scale = 1) {
  const el = ui[key];
  if (!el) return;
  if (opacity < 0.01) {
    if (el.style.display !== "none") el.style.display = "none";
    return;
  }
  if (el.style.display === "none") el.style.display = "";
  el.style.opacity = opacity.toFixed(3);
  if (ty !== 0 || scale !== 1) el.style.transform = `translate3d(0,${ty.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
}

const BASE_ZOOM = 82;

export function StoryDirector() {
  const { scene, camera } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillARef = useRef<THREE.DirectionalLight>(null);
  const fillBRef = useRef<THREE.DirectionalLight>(null);
  const growRefs = useRef<(THREE.PointLight | null)[]>([]);
  const roomRef = useRef<THREE.Object3D | null>(null);
  const startRef = useRef<number | null>(null);
  const yaw = useRef(0);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-delta * 5.5);
    scrollState.current += (scrollState.target - scrollState.current) * k;
    const p = scrollState.current;
    updateStory(p);
    const t = state.clock.elapsedTime;

    // --- dramatic power-on (time-based, plays once) ---
    if (startRef.current === null) startRef.current = t;
    const pt = t - startRef.current;
    const powerAll = smooth(clamp01((pt - 0.3) / (0.3 + GROW_LIGHTS.length * 0.25)));
    const pBright = lerp(0.05, 1, powerAll); // starts near-dark -> bright

    // --- floating diorama ---
    if (!roomRef.current) roomRef.current = scene.getObjectByName("room") ?? null;
    const room = roomRef.current;
    if (room) {
      const targetYaw = story.focusYaw + Math.sin(t * 0.22) * 0.1;
      yaw.current += (targetYaw - yaw.current) * (1 - Math.exp(-delta * 3));
      room.rotation.y = yaw.current;
      room.position.y = Math.sin(t * 0.5) * 0.05;
      room.scale.setScalar(lerp(1, 0.82, story.finalP));
    }

    // --- orthographic iso camera ---
    const cam = camera as THREE.OrthographicCamera;
    const targetZoom = BASE_ZOOM * story.zoom;
    if (Math.abs(cam.zoom - targetZoom) > 0.01) {
      cam.zoom += (targetZoom - cam.zoom) * (1 - Math.exp(-delta * 3));
      cam.updateProjectionMatrix();
    }
    cam.position.set(9 + Math.sin(t * 0.18) * 0.12, 7, 9 + Math.cos(t * 0.16) * 0.12);
    cam.lookAt(CAM_TARGET);

    // --- lights (brighter scene; white lights dim a bit so red reads on alarm) ---
    const rf = story.roomFade;
    const alertDim = 1 - 0.4 * story.alert;
    if (ambientRef.current) ambientRef.current.intensity = story.ambient * pBright * alertDim;
    if (hemiRef.current) hemiRef.current.intensity = 1.5 * rf * pBright * alertDim;
    if (keyRef.current) keyRef.current.intensity = 2.2 * rf * pBright * alertDim;
    if (fillARef.current) fillARef.current.intensity = 1.0 * rf * pBright * alertDim;
    if (fillBRef.current) fillBRef.current.intensity = 0.7 * rf * pBright * alertDim;
    // The CULTIVATION RACK LIGHTS turn red and brighter on alarm (no central blob).
    gcol.copy(GROW_GREEN).lerp(ALERT_RED, story.alert);
    const growBase = 3.4 * rf * (1 + story.alert * 1.2);
    const alarmPulse = 1 + Math.sin(t * 7) * 0.16 * story.alert;
    for (let i = 0; i < growRefs.current.length; i++) {
      const l = growRefs.current[i];
      if (l) {
        l.intensity = growBase * flicker(pt - (0.3 + i * 0.25)) * (1 + Math.sin(t * 1.3 + i) * 0.05) * alarmPulse;
        l.color.copy(gcol);
      }
    }
    mat.lightGlowMat.color.copy(gcol);
    mat.lightGlowMat.emissive.copy(gcol);
    mat.lightGlowMat.emissiveIntensity = (2.2 + story.alert * 2) * rf * powerAll;
    mat.sensorLedMat.emissiveIntensity = 2.0 * rf * powerAll;

    // --- DOM: headlines (left, slide up) ---
    for (let i = 0; i < 5; i++) setEl(`hl${i}`, story.headline[i], (1 - story.headline[i]) * 16);

    // --- DOM: holographic sensor readings ---
    for (const c of MEASURE_CHIPS) {
      if (c.id === "temp") {
        setEl("chip.temp", story.fTemp);
        const v = ui["val.temp"];
        if (v) v.textContent = `${story.temp.toFixed(1)} °C`;
        const chip = ui["chip.temp"];
        if (chip) chip.style.setProperty("--accent", story.tempColorHex);
      } else {
        setEl(`chip.${c.id}`, story.fSensors);
      }
    }
    IMPROVE_TAGS.forEach((tag, i) => {
      const stag = clamp01((p - (0.655 + i * 0.012)) / 0.04);
      setEl(`tag.${tag.id}`, story.fImprove * stag);
    });

    // --- DOM: bottom-right notification toasts (hidden once traceability starts) ---
    for (let i = 0; i < NOTIFICATIONS.length; i++) {
      const on = i < story.notif && p < 0.76;
      setEl(`toast${i}`, on ? 1 : 0, on ? 0 : 16);
    }

    // --- DOM: scroll hint + scrim ---
    setEl("scrollHint", story.scrollHint);
    setEl("scrim", story.scrim);

    // --- DOM: traceability QR -> line -> timeline -> metrics ---
    const traceVis = clamp01(story.traceP * 6) * clamp01(1 - story.finalP * 2.2);
    setEl("traceWrap", traceVis);
    setEl("qr", story.qrP);
    const line = ui["traceLine"];
    if (line) {
      line.style.opacity = (story.lineP * (1 - story.finalP)).toFixed(3);
      line.style.transform = `scaleX(${story.lineP.toFixed(3)})`;
    }
    setEl("subwindow", clamp01(story.lineP * 2));
    TIMELINE.forEach((_, i) => {
      const o = clamp01((story.timelineP - i / TIMELINE.length) * 3);
      setEl(`tl${i}`, o, (1 - o) * 8);
    });
    TRACE_METRICS.forEach((_, i) => {
      const o = clamp01((story.metricsP - i / TRACE_METRICS.length) * 3);
      setEl(`tm${i}`, o, (1 - o) * 10);
    });

    // --- DOM: final ---
    setEl("final", story.finalP);
  });

  return (
    <>
      <ambientLight ref={ambientRef} color={0xf3f6ea} intensity={0} />
      <hemisphereLight ref={hemiRef} color={0xeef3df} groundColor={0xb9bfae} intensity={0} />
      <directionalLight
        ref={keyRef}
        color={0xfff7e8}
        intensity={0}
        position={[6, 9, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={26}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />
      {/* white multidirectional fill so room details read */}
      <directionalLight ref={fillARef} color={0xffffff} intensity={0} position={[-6, 5, 8]} />
      <directionalLight ref={fillBRef} color={0xf2f5ff} intensity={0} position={[8, 4, -7]} />
      {GROW_LIGHTS.map((g, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            growRefs.current[i] = el;
          }}
          color={0x9ed84a}
          intensity={0}
          distance={4.8}
          decay={1.3}
          position={[g.x, g.y - 0.12, g.z]}
        />
      ))}
    </>
  );
}
