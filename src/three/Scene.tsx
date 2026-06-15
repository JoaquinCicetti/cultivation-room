import { useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { Holograms } from "./Holograms";

// The canvas is the ONLY background: a dark vertical-gradient wall rendered as the
// scene background, so the room reads as suspended in it. Text is pure overlay.
function Backdrop() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#161b12");
    g.addColorStop(0.55, "#0c100a");
    g.addColorStop(1, "#070905");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const prev = scene.background;
    scene.background = tex;
    return () => {
      scene.background = prev;
      tex.dispose();
    };
  }, [scene]);
  return null;
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

      <Backdrop />
      <StoryDirector />
      <RoomScene />
      <Holograms />
      <Preload all />

      {debug && <Stats />}
    </Canvas>
  );
}
