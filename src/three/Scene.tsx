import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { Holograms } from "./Holograms";
import { FloatingLights } from "./FloatingLights";

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
      <FloatingLights />
      <RoomScene />
      <Holograms />
      <Preload all />

      {debug && <Stats />}
    </Canvas>
  );
}
