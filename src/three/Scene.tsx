import { useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { TraceTablet } from "./TraceTablet";
import { concreteMat } from "./materials";

// Clean neutral backdrop — the facility recedes into a soft dark grey (no glow).
function Backdrop() {
  const scene = useThree((s) => s.scene);
  const bgTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#1d201c");
    g.addColorStop(0.6, "#13150f");
    g.addColorStop(1, "#0c0d0a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useLayoutEffect(() => {
    const prev = scene.background;
    scene.background = bgTex;
    return () => {
      scene.background = prev;
      bgTex.dispose();
    };
  }, [scene, bgTex]);
  return null;
}

// Large continuous polished-concrete facility floor the room is anchored to.
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} material={concreteMat} receiveShadow>
      <planeGeometry args={[120, 120]} />
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
      shadows
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
      <Floor />
      <RoomScene />
      <TraceTablet />

      <Preload all />
      {debug && <Stats />}
    </Canvas>
  );
}
