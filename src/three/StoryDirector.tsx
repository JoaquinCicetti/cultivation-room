import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

import { GROW_LIGHTS } from "./sceneData";
import { lightGlowMat } from "./materials";
import {
  clamp01,
  DEVICES,
  deviceScreen,
  devices,
  lerp,
  METRICS,
  NOTIFICATIONS,
  scrollState,
  seg,
  sensorScreen,
  smooth,
  story,
  ui,
  updateStory,
} from "../scroll/story";

// Frame the room slightly right so the left stays clear for the overlaid text.
const CAM_TARGET = new THREE.Vector3(-3.8, 1.3, 0);
// On mobile the layout stacks (copy above, room below): centre the room and
// pull it into the lower half via the view offset.
const CAM_TARGET_MOBILE = new THREE.Vector3(0, 1.15, 0);
const BASE_ZOOM = 102;
const MOBILE_BP = 768;
// fit the ~9-unit-wide room across a narrow viewport (no side-wall clipping)
const mobileZoom = (w: number) => Math.max(30, Math.min(72, w / 9.5));
const projVec = new THREE.Vector3();

// Neutral, desaturated ambient so walls/machinery stay crisp gray. The alarm
// only nudges the environment a hair — the real red signalling rides the
// downward grow cones + the controller/sensor LEDs, never a whole-room stain.
const BASE_AMBIENT = new THREE.Color(0xb0b5bc); // weak, slightly cool desaturated fill
const BASE_HEMI_SKY = new THREE.Color(0xeaecf0);
const ALARM_RED = new THREE.Color(0xff2616);
const tmpA = new THREE.Color();
const tmpH = new THREE.Color();

// grow cones: magenta horticultural → red on alarm (always pointed down)
const GROW_MAGENTA = new THREE.Color(0xc56fd0);
const GROW_RED = new THREE.Color(0xff3322);
const tmpSpot = new THREE.Color();
const GROW_GLOW_MAGENTA = new THREE.Color(0xcf6fd6);
const GROW_GLOW_RED = new THREE.Color(0xff4030);
const tmpGlow = new THREE.Color();
const SPOT_BASE = 17; // per-segment downward cone intensity (strong canopy lift)
const LIGHTS_ON_AT = 1.1; // seconds after load before the banks start striking
const LIGHTS_STAGGER = 0.16; // delay between each bank igniting (sequential power-up)

// A single LED/HID bank igniting: off → quick double-strike flicker → steady full.
// This is what makes the boot read as real grow lights switching on, not a fade.
function ledTurnOn(lt: number): number {
  if (lt <= 0) return 0;
  if (lt < 0.05) return 0.55; // first strike
  if (lt < 0.09) return 0.1; // dropout
  if (lt < 0.14) return 0.9; // second strike
  if (lt < 0.17) return 0.4; // dip
  return Math.min(1, 0.72 + (lt - 0.17) / 0.16); // settle smoothly to full
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

export function StoryDirector() {
  const { scene, camera, size } = useThree();
  const roomRef = useRef<THREE.Object3D | null>(null);
  const startRef = useRef<number | null>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const redFillRef = useRef<THREE.DirectionalLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const growRef = useRef<THREE.Group>(null);
  const growK = useRef(1); // smoothed grow-light factor (Luces card drives it)
  const litRef = useRef(0); // smoothed cultivation-light level → drives the whole room's light
  // one target object per LED segment so each spotlight throws a strict downward cone
  const growTargets = useMemo(() => GROW_LIGHTS.map(() => new THREE.Object3D()), []);

  // shift the rendered scene up 10% / right 5% (room sits higher-right)
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const mobile = size.width < MOBILE_BP;
    cam.zoom = mobile ? mobileZoom(size.width) : BASE_ZOOM;
    if (mobile) {
      // centre horizontally, push the room into the LOWER band (copy + cards above)
      cam.setViewOffset(size.width, size.height, 0, -0.22 * size.height, size.width, size.height);
    } else {
      cam.setViewOffset(size.width, size.height, -0.05 * size.width, 0.1 * size.height, size.width, size.height);
    }
    cam.updateProjectionMatrix();
    return () => {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
    };
  }, [camera, size.width, size.height]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-delta * 5.5);
    scrollState.current += (scrollState.target - scrollState.current) * k;
    const p = scrollState.current;
    updateStory(p, delta);
    const t = state.clock.elapsedTime;

    // --- clean opening reveal: fade in from dark + a subtle settle/zoom-in ---
    if (startRef.current === null) startRef.current = t;
    const rev = smooth(clamp01((t - startRef.current - 0.15) / 1.4));
    setEl("boot", 0); // no black room-fade — the loader is the only cover
    // the loading screen fades early, revealing the DARK (powered-off) room…
    setEl("loader", 1 - smooth(clamp01((t - startRef.current - 0.35) / 0.6)));
    // boot turn-on clock: you arrive in the dark room, then a beat later the
    // cultivation banks ignite one after another with a flicker (see grow block).
    const since = t - startRef.current;

    // --- anchored room: slow, deliberate few-degree rotation (premium showcase) ---
    if (!roomRef.current) roomRef.current = scene.getObjectByName("room") ?? null;
    const room = roomRef.current;
    // room is LOCKED and ALWAYS visible — it stays as the live background even
    // when the traceability report flies in front of the camera at the end.
    if (room) room.visible = true;
    if (growRef.current) {
      growRef.current.visible = true;
      // the Luces card is the source of truth: dim the cones + emissive strip to
      // match its on/level (smoothed, so toggling fades — never blinks).
      const targetK = devices.lights.on ? devices.lights.level : 0;
      growK.current += (targetK - growK.current) * k;
      // end-of-day: grow lights fade off as the final section arrives
      const gk = growK.current * (1 - story.finalP);
      // grow cones shift magenta → red with the alarm, but never bleed the room
      const a = story.alert;
      tmpSpot.copy(GROW_MAGENTA).lerp(GROW_RED, a);
      let sumOn = 0;
      let idx = 0;
      for (const g of growRef.current.children) {
        const sp = g.children[0] as THREE.SpotLight | undefined;
        if (sp && (sp as THREE.SpotLight).isSpotLight) {
          // each bank ignites a little after the previous → reads as a real grow
          // room powering up bank-by-bank, not a uniform fade
          const on = ledTurnOn(since - LIGHTS_ON_AT - idx * LIGHTS_STAGGER);
          sp.intensity = SPOT_BASE * gk * on;
          sp.color.copy(tmpSpot);
          sumOn += on;
          idx++;
        }
      }
      const lit = gk * (idx ? sumOn / idx : 0); // aggregate drives the whole-room fill
      litRef.current = lit;
      lightGlowMat.emissiveIntensity = 0.04 + 2.0 * lit;
      lightGlowMat.emissive.copy(tmpGlow.copy(GROW_GLOW_MAGENTA).lerp(GROW_GLOW_RED, a));
    }

    // --- stable camera (no float / per-act drift) — mobile fits + centres ---
    const mobile = size.width < MOBILE_BP;
    const cam = camera as THREE.OrthographicCamera;
    const targetZoom = mobile ? mobileZoom(size.width) : BASE_ZOOM;
    if (Math.abs(cam.zoom - targetZoom) > 0.001) {
      cam.zoom = targetZoom;
      cam.updateProjectionMatrix();
    }
    cam.position.set(9, 6.3, 9);
    cam.lookAt(mobile ? CAM_TARGET_MOBILE : CAM_TARGET);

    // --- DOM: headlines (left, slide up) ---
    for (let i = 0; i < 5; i++) setEl(`hl${i}`, story.headline[i], (1 - story.headline[i]) * 16);

    // --- DOM: notification toasts (hidden once traceability starts) ---
    // On mobile only ONE toast is shown (the latest in the sequence) so the
    // stack never overlaps the room; desktop shows the accumulated stack.
    for (let i = 0; i < NOTIFICATIONS.length; i++) {
      const on = (mobile ? i === story.notif - 1 : i < story.notif) && p < 0.6;
      setEl(`toast${i}`, on ? 1 : 0, on ? 0 : 16);
    }

    // --- DOM: brand mark morph (hero -> top-left header -> final) ---
    const bm = ui["brandmark"];
    if (bm) {
      // hero -> top-left header only; the ending logo is the LogoReveal mark, so
      // the brandmark fades out as the final section arrives (no double logo).
      const big = 1 - smooth(clamp01(p / 0.09));
      const scale = (mobile ? 0.42 : 0.34) + (mobile ? 0.34 : 0.66) * big;
      let tx: number;
      let ty: number;
      if (mobile) {
        // hero (big=1): centre the lockup horizontally and keep it NEAR THE TOP
        // (minimal top whitespace) so it never reaches the centred hero copy
        // lower down. header (big=0): back to the top-left CSS anchor (tx/ty → 0).
        const w = bm.offsetWidth * scale;
        tx = ((size.width - w) / 2 - bm.offsetLeft) * big;
        ty = (size.height * 0.06 - bm.offsetTop) * big;
      } else {
        tx = 12 * big;
        ty = (size.height * 0.3 - 26) * big;
      }
      bm.style.opacity = (rev * (1 - smooth(story.finalP))).toFixed(3);
      bm.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }
    setEl("introTag", rev * (1 - smooth(clamp01(p / 0.045))));
    setEl("scrollHint", story.scrollHint);
    setEl("scrim", story.scrim);

    // --- DOM: traceability — static left title (the report is the 3D tablet) ---
    const traceOut = 1 - smooth(seg(story.p, 0.94, 0.99));
    setEl("trace2Left", story.traceIn * traceOut, (1 - story.traceIn) * 18);
    // internal report scroll: only the content inside the tablet screen moves
    const content = ui["tabletContent"];
    const screenEl = ui["tabletScreen"];
    if (content && screenEl) {
      const maxScroll = Math.max(0, content.scrollHeight - screenEl.clientHeight);
      content.style.transform = `translateY(${(-story.traceScroll * maxScroll).toFixed(1)}px)`;
    }
    const shell = ui["traceShell"];
    if (shell) shell.style.opacity = traceOut.toFixed(3); // fade the tablet out into the final

    // --- DOM: final ---
    setEl("final", story.finalP);

    // --- alarm: only a faint environmental hint so walls stay crisp gray ---
    const red = story.alert * (1 - story.traceP);
    if (ambientRef.current) ambientRef.current.color.copy(tmpA.copy(BASE_AMBIENT).lerp(ALARM_RED, red * 0.12));
    if (hemiRef.current) hemiRef.current.color.copy(tmpH.copy(BASE_HEMI_SKY).lerp(ALARM_RED, red * 0.1));
    if (redFillRef.current) redFillRef.current.intensity = red * 0.5;

    // --- end of day: dim the facility lighting down to a dusk hush ---
    const dusk = 1 - story.finalP * 0.72;
    // The cultivation lights drive the WHOLE room: OFF → only a dim facility wash
    // (dark, lights-out), ON → full key + fill. This is what makes the Luces card
    // toggle read as a real room on/off, not just the LED cones changing.
    const lit = litRef.current;
    if (ambientRef.current) ambientRef.current.intensity = lerp(0.035, 0.16, lit) * dusk;
    if (hemiRef.current) hemiRef.current.intensity = lerp(0.1, 0.42, lit) * dusk;
    if (keyRef.current) keyRef.current.intensity = lerp(0.4, 3.6, lit) * dusk;
    // gate the environment IBL too, so "lights off" is genuinely dark (the IBL
    // was keeping the room visibly lit even with the grow lights down)
    scene.environmentIntensity = lerp(0.08, 0.42, lit);

    // --- project sensor anchors -> screen px for the DOM leader lines ---
    if (room) room.updateMatrixWorld();
    for (let i = 0; i < METRICS.length; i++) {
      const a = METRICS[i].anchor;
      projVec.set(a[0], a[1], a[2]);
      if (room) projVec.applyMatrix4(room.matrixWorld);
      projVec.project(camera);
      const s = sensorScreen[i];
      s.x = (projVec.x * 0.5 + 0.5) * size.width;
      s.y = (-projVec.y * 0.5 + 0.5) * size.height;
      s.vis = projVec.z < 1 ? 1 : 0;
    }
    // --- project device anchors -> screen px for the device card leader lines ---
    for (let i = 0; i < DEVICES.length; i++) {
      const a = DEVICES[i].anchor;
      projVec.set(a[0], a[1], a[2]);
      if (room) projVec.applyMatrix4(room.matrixWorld);
      projVec.project(camera);
      const s = deviceScreen[i];
      s.x = (projVec.x * 0.5 + 0.5) * size.width;
      s.y = (-projVec.y * 0.5 + 0.5) * size.height;
      s.vis = projVec.z < 1 ? 1 : 0;
    }
  });

  // Clean architectural lighting (crisp soft key + bounce) under a realistic
  // magenta horticultural grow glow. Cool neutral fills so the purple reads true.
  return (
    <>
      {/* env IBL (Studio) carries most of the fill + reflections now, so the
          direct rig is leaner and higher-contrast — premium, not washed-flat */}
      <ambientLight ref={ambientRef} color={0xb0b5bc} intensity={0.16} />
      <hemisphereLight ref={hemiRef} color={0xeaecf0} groundColor={0x6f7278} intensity={0.42} />
      <directionalLight
        ref={keyRef}
        color={0xfdf7ff}
        intensity={2.35}
        position={[5, 10, 6]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
      />
      <directionalLight color={0xe6ecf6} intensity={0.42} position={[-6, 6, 8]} />
      <directionalLight color={0xf0ecf6} intensity={0.28} position={[8, 5, -6]} />
      {/* horticultural LED cones — one tight spotlight per segment, aimed
          strictly DOWN at the canopy via a target so it never floods the room */}
      <group ref={growRef}>
        {GROW_LIGHTS.map((g, i) => (
          <group key={i}>
            <spotLight
              position={[g.x, g.y, g.z]}
              target={growTargets[i]}
              color={0xc56fd0}
              intensity={SPOT_BASE}
              angle={0.62}
              penumbra={1}
              distance={3.2}
              decay={1.4}
            />
            <primitive object={growTargets[i]} position={[g.x, 0.95, g.z]} />
          </group>
        ))}
      </group>
      {/* red bounce fill (front) — reflects off walls/racks/floor during alarm */}
      <directionalLight ref={redFillRef} color={0xff3a26} intensity={0} position={[2, 4, 9]} />
    </>
  );
}
