import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { Holograms } from "./Holograms";
import { clamp01, smooth, story } from "../scroll/story";

const GLOW_PURPLE = new THREE.Color(0x8a5cff);
const GLOW_RED = new THREE.Color(0xff4a33);

// The canvas is the only background: a dark gradient "wall" + a story-reactive
// glow behind the suspended room.
function Backdrop() {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const glowRef = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);

  const bgTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#1d2517");
    g.addColorStop(0.5, "#12160e");
    g.addColorStop(1, "#080a06");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.4)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  useLayoutEffect(() => {
    const prev = scene.background;
    scene.background = bgTex;
    return () => {
      scene.background = prev;
    };
  }, [scene, bgTex]);

  useFrame((state) => {
    const mesh = glowRef.current;
    if (!mesh) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const power = smooth(clamp01((state.clock.elapsedTime - start.current - 0.2) / 1.5));
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.color.copy(GLOW_PURPLE).lerp(GLOW_RED, story.alert);
    mat.opacity = (0.4 + story.alert * 0.55) * story.roomFade * power;
    mesh.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh ref={glowRef} position={[0, 2.2, -1]} renderOrder={-5}>
      <planeGeometry args={[34, 26]} />
      <meshBasicMaterial map={glowTex} transparent opacity={0} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

export default function Scene() {
  const debug = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"),
    [],
  );
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      orthographic
      camera={{ position: [9, 7, 9], zoom: 102, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: true }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.75)}
        onFallback={() => setDpr(1)}
      />

      <StoryDirector />
      <Backdrop />
      <RoomScene />
      <Holograms />
      <Preload all />

      {debug && <Stats />}
    </Canvas>
  );
}
