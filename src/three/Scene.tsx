import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor, Preload, Stats } from "@react-three/drei";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";

// Default-exported so it can be React.lazy()'d.
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
      camera={{ position: [9, 7, 9], zoom: 74, near: 0.1, far: 100 }}
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
      {/* soft shadow under the diorama so it reads as a floating illustration */}
      <ContactShadows position={[0, -0.04, 0]} opacity={0.32} scale={15} blur={2.6} far={6} color="#3a4228" />
      <Preload all />

      {debug && <Stats />}
    </Canvas>
  );
}
