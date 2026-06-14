import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import * as mat from "./materials";
import { GROW_LIGHTS } from "./sceneData";
import { clamp01, lerp, scrollState, seg, smooth, story, TRACE_ITEMS, ui, updateStory } from "../scroll/story";

const CAM_TARGET = new THREE.Vector3(0, 1.55, 0);

// "Lights on" intro: grow lights stutter on like LED/fluorescent tubes.
function flicker(x: number) {
  if (x < 0.05) return 0;
  if (x < 0.09) return 0.85;
  if (x < 0.13) return 0.12;
  if (x < 0.17) return 1;
  if (x < 0.21) return 0.45;
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

const BASE_ZOOM = 63;

// Single director: damps scroll, computes the story, floats the diorama, and
// drives the 2D text panels — no per-frame React renders.
export function StoryDirector() {
  const { scene, camera } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const alertRef = useRef<THREE.PointLight>(null);
  const growRefs = useRef<(THREE.PointLight | null)[]>([]);
  const roomRef = useRef<THREE.Object3D | null>(null);
  const startRef = useRef<number | null>(null);
  const yaw = useRef(0);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-delta * 5.5);
    scrollState.current += (scrollState.target - scrollState.current) * k;
    updateStory(scrollState.current);
    const t = state.clock.elapsedTime;

    if (startRef.current === null) startRef.current = t;
    const pt = t - startRef.current;
    const powerAll = smooth(clamp01((pt - 0.3) / (0.3 + GROW_LIGHTS.length * 0.25)));
    const pBright = lerp(0.4, 1, powerAll);

    // --- floating diorama: turntable bias + idle oscillation + bob + recede ---
    if (!roomRef.current) roomRef.current = scene.getObjectByName("room") ?? null;
    const room = roomRef.current;
    if (room) {
      const targetYaw = story.focusYaw + Math.sin(t * 0.22) * 0.12;
      yaw.current += (targetYaw - yaw.current) * (1 - Math.exp(-delta * 3));
      room.rotation.y = yaw.current;
      room.position.y = Math.sin(t * 0.5) * 0.05;
      const s = lerp(1, 0.78, story.finalP);
      room.scale.setScalar(s);
    }

    // --- orthographic iso camera (fixed; zoom eases per act) ---
    const cam = camera as THREE.OrthographicCamera;
    const targetZoom = BASE_ZOOM * story.zoom;
    if (Math.abs(cam.zoom - targetZoom) > 0.01) {
      cam.zoom += (targetZoom - cam.zoom) * (1 - Math.exp(-delta * 3));
      cam.updateProjectionMatrix();
    }
    cam.position.set(9 + Math.sin(t * 0.18) * 0.15, 7, 9 + Math.cos(t * 0.16) * 0.15);
    cam.lookAt(CAM_TARGET);

    // --- lights (bright; grow lights perform the power-on) ---
    const rf = story.roomFade;
    if (ambientRef.current) ambientRef.current.intensity = story.ambient * pBright;
    if (hemiRef.current) hemiRef.current.intensity = 0.85 * rf * pBright;
    if (keyRef.current) keyRef.current.intensity = 1.4 * rf * pBright;
    if (alertRef.current) alertRef.current.intensity = story.alert * 1.4 * rf;
    const growBase = 1.7 * rf;
    for (let i = 0; i < growRefs.current.length; i++) {
      const l = growRefs.current[i];
      if (l) l.intensity = growBase * flicker(pt - (0.3 + i * 0.25)) * (1 + Math.sin(t * 1.3 + i) * 0.05);
    }
    mat.lightGlowMat.emissiveIntensity = 2.2 * rf * powerAll;
    mat.sensorLedMat.emissiveIntensity = 2.0 * rf * powerAll;

    // --- DOM: headlines (above the room) ---
    for (let i = 0; i < 5; i++) setEl(`hl${i}`, story.headline[i], (1 - story.headline[i]) * -16);

    // --- DOM: MEASURE metric chips (below) ---
    setEl("bMetrics", story.fMetrics, (1 - story.fMetrics) * 16);

    // --- DOM: DETECT+CONTROL incident panel (below) ---
    setEl("bIncident", story.fIncident, (1 - story.fIncident) * 16);
    const tv = ui["val.temp"];
    if (tv) tv.textContent = `${story.temp.toFixed(1)}°C`;
    const tc = ui["chip.temp"];
    if (tc) tc.style.setProperty("--accent", story.tempColorHex);
    setEl("alertChip", story.alert);
    for (let i = 0; i < 5; i++) setEl(`log${i}`, i < story.logStep ? 1 : 0, i < story.logStep ? 0 : 6);

    // --- DOM: IMPROVE context tags (below) ---
    setEl("bImprove", story.fImprove, (1 - story.fImprove) * 16);

    // --- DOM: traceability record -> passport -> qr ---
    const tp = story.traceP;
    const assemble = clamp01(tp / 0.55);
    const collapse = clamp01((tp - 0.55) / 0.45);
    setEl("tracePanel", clamp01(tp * 5) * clamp01(1 - story.finalP * 1.8));
    TRACE_ITEMS.forEach((_, i) => {
      const inn = clamp01((assemble - i / TRACE_ITEMS.length) * 3);
      setEl(`trace${i}`, inn * clamp01(1 - collapse * 1.6), (1 - inn) * 12);
    });
    setEl("passport", clamp01((collapse - 0.12) / 0.88));

    // --- DOM: scrim mutes the room for the traceability climax + final ---
    setEl("scrim", clamp01(smooth(seg(scrollState.current, 0.88, 0.95))));

    // --- DOM: final composition ---
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
      {GROW_LIGHTS.map((g, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            growRefs.current[i] = el;
          }}
          color={0xc8e06a}
          intensity={0}
          distance={4.5}
          decay={1.4}
          position={[g.x, g.y - 0.12, g.z]}
        />
      ))}
      <pointLight ref={alertRef} color={0xe8a85a} intensity={0} distance={4} decay={1.6} position={[1.9, 1.9, -1.8]} />
    </>
  );
}
