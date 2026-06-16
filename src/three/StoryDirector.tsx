import { useLayoutEffect, useRef } from "react";
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
const BASE_ZOOM = 102;
const projVec = new THREE.Vector3();

// whole-room alarm tint — the environment gradually reddens, no spotlights
const BASE_AMBIENT = new THREE.Color(0xecebf4);
const BASE_HEMI_SKY = new THREE.Color(0xeef0f8);
const ALARM_RED = new THREE.Color(0xff2616);
const tmpA = new THREE.Color();
const tmpH = new THREE.Color();

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
  const growRef = useRef<THREE.Group>(null);
  const growK = useRef(1); // smoothed grow-light factor (Luces card drives it)

  // shift the rendered scene up 10% / right 5% (room sits higher-right)
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = BASE_ZOOM;
    cam.setViewOffset(size.width, size.height, -0.05 * size.width, 0.1 * size.height, size.width, size.height);
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
    setEl("boot", 1 - rev);

    // --- anchored room: slow, deliberate few-degree rotation (premium showcase) ---
    if (!roomRef.current) roomRef.current = scene.getObjectByName("room") ?? null;
    const room = roomRef.current;
    if (room) {
      // settles its rotation and rises out of the top of frame during the
      // traceability transition (camera stays fixed — the room leaves, not the cam)
      room.rotation.y = Math.sin(t * 0.05) * 0.06 * (1 - story.traceIn);
      room.position.y = lerp(0, 9.5, story.traceIn);
      room.scale.setScalar(lerp(0.965, 1, rev) * lerp(1, 0.92, story.finalP));
      room.visible = story.traceIn < 0.995; // fully exited → drop it (off-screen, reversible)
    }
    // the grow lights belong to the room — carry them up so no pools are left behind
    if (growRef.current) {
      growRef.current.position.y = lerp(0, 9.5, story.traceIn);
      growRef.current.visible = story.traceIn < 0.995;
      // the Luces card is the source of truth: dim the pools + emissive strip to
      // match its on/level (smoothed, so toggling fades — never blinks).
      const targetK = devices.lights.on ? devices.lights.level : 0;
      growK.current += (targetK - growK.current) * k;
      const gk = growK.current;
      for (const g of growRef.current.children) {
        const pls = g.children;
        if (pls[0]) (pls[0] as THREE.PointLight).intensity = 1.7 * gk;
        if (pls[1]) (pls[1] as THREE.PointLight).intensity = 0.85 * gk;
      }
      lightGlowMat.emissiveIntensity = 0.08 + 1.62 * gk;
    }

    // --- stable camera (no float / per-act drift) — subtle settle on load ---
    const cam = camera as THREE.OrthographicCamera;
    const targetZoom = BASE_ZOOM * lerp(0.94, 1, rev);
    if (Math.abs(cam.zoom - targetZoom) > 0.03) {
      cam.zoom = targetZoom;
      cam.updateProjectionMatrix();
    }
    cam.position.set(9, 7, 9);
    cam.lookAt(CAM_TARGET);

    // --- DOM: headlines (left, slide up) ---
    for (let i = 0; i < 5; i++) setEl(`hl${i}`, story.headline[i], (1 - story.headline[i]) * 16);

    // --- DOM: notification toasts (hidden once traceability starts) ---
    for (let i = 0; i < NOTIFICATIONS.length; i++) {
      const on = i < story.notif && p < 0.6;
      setEl(`toast${i}`, on ? 1 : 0, on ? 0 : 16);
    }

    // --- DOM: brand mark morph (hero -> top-left header -> final) ---
    const bm = ui["brandmark"];
    if (bm) {
      // hero -> top-left header only; the ending logo is the LogoReveal mark, so
      // the brandmark fades out as the final section arrives (no double logo).
      const big = 1 - smooth(clamp01(p / 0.09));
      const scale = 0.34 + 0.66 * big;
      const tx = 12 * big;
      const ty = (size.height * 0.3 - 26) * big;
      bm.style.opacity = (rev * (1 - smooth(story.finalP))).toFixed(3);
      bm.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }
    setEl("introTag", rev * (1 - smooth(clamp01(p / 0.045))));
    setEl("scrollHint", story.scrollHint);
    setEl("scrim", story.scrim);

    // --- DOM: traceability — static left title (the report is the 3D tablet) ---
    const traceOut = 1 - smooth(seg(story.p, 0.9, 0.95));
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

    // --- whole-room alarm tint: ambient + sky redden, red bounce on surfaces ---
    const red = story.alert * (1 - story.traceP);
    if (ambientRef.current) ambientRef.current.color.copy(tmpA.copy(BASE_AMBIENT).lerp(ALARM_RED, red * 0.6));
    if (hemiRef.current) hemiRef.current.color.copy(tmpH.copy(BASE_HEMI_SKY).lerp(ALARM_RED, red * 0.55));
    if (redFillRef.current) redFillRef.current.intensity = red * 2.4;

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
      <ambientLight ref={ambientRef} color={0xecebf4} intensity={0.74} />
      <hemisphereLight ref={hemiRef} color={0xeef0f8} groundColor={0x5e6066} intensity={0.74} />
      <directionalLight
        color={0xfdf7ff}
        intensity={1.95}
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
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight color={0xe6ecf6} intensity={0.62} position={[-6, 6, 8]} />
      <directionalLight color={0xf0ecf6} intensity={0.44} position={[8, 5, -6]} />
      {/* realistic magenta horticultural grow pools over each rack (rise with the room) */}
      <group ref={growRef}>
        {GROW_LIGHTS.map((g, i) => (
          <group key={i}>
            <pointLight color={0xc56fd0} intensity={1.7} distance={3.4} decay={1.7} position={[g.x, g.y - 0.18, g.z]} />
            <pointLight color={0xd58fe0} intensity={0.85} distance={5} decay={1.5} position={[g.x, g.y - 0.5, g.z]} />
          </group>
        ))}
      </group>
      {/* red bounce fill (front) — reflects off walls/racks/floor during alarm */}
      <directionalLight ref={redFillRef} color={0xff3a26} intensity={0} position={[2, 4, 9]} />
    </>
  );
}
