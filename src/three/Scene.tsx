import { useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { Holograms } from "./Holograms";

// Static soft shadow blob (replaces ContactShadows — no per-frame re-bake/flicker).
function SoftShadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    g.addColorStop(0, "rgba(38,46,26,0.5)");
    g.addColorStop(0.6, "rgba(38,46,26,0.22)");
    g.addColorStop(1, "rgba(38,46,26,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} renderOrder={-1}>
      <planeGeometry args={[15, 12]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
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
      camera={{ position: [9, 7, 9], zoom: 82, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.75)}
        onFallback={() => setDpr(1)}
      />

      <StoryDirector />
      <RoomScene />
      <SoftShadow />
      <Holograms />
      <Preload all />

      {debug && <Stats />}
    </Canvas>
  );
}
