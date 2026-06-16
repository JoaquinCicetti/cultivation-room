import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, Preload, RoundedBox, Stats } from "@react-three/drei";
import { EffectComposer, SSAO, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

import { RoomScene } from "./RoomScene";
import { StoryDirector } from "./StoryDirector";
import { TraceTablet } from "./TraceTablet";

const FLOOR_Y = 0.12; // facility floor is flush with the room floor (no step)

// Clean neutral backdrop — the facility recedes into a soft dark grey (no glow).
function Backdrop() {
  const scene = useThree((s) => s.scene);
  const bgTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    // Friendly neutral dark (#1e1e21), matched to the page/stage CSS so the
    // canvas and webpage are one continuous, premium space. Subtle lift in the
    // center for depth — essentially a flat, professional studio backdrop.
    ctx.fillStyle = "#1e1e21";
    ctx.fillRect(0, 0, 512, 512);
    const rg = ctx.createRadialGradient(282, 215, 0, 282, 215, 380);
    rg.addColorStop(0, "#26262b");
    rg.addColorStop(0.65, "#202023");
    rg.addColorStop(1, "#1e1e21");
    ctx.fillStyle = rg;
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

// Exterior facility ground: a thick, matte charcoal foundation slab — slightly
// larger than the room footprint, soft-beveled edges (no razor-sharp card
// outline). Reads as a physical poured base the room is set into, sitting in the
// unified dark space. The soft ground shadow is owned by <ContactShadows>.
function Floor() {
  const slabMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#26262b", // neutral charcoal, related to the #1e1e21 bg, reads as floor
        roughness: 0.9,
        metalness: 0.08,
        envMapIntensity: 0.14,
      }),
    [],
  );
  useEffect(() => () => slabMat.dispose(), [slabMat]);
  // top flush with the interior floor (FLOOR_Y); 0.5 thick → grounded mass
  return (
    <RoundedBox
      args={[8.6, 0.5, 7.0]}
      radius={0.05}
      smoothness={3}
      position={[0, FLOOR_Y - 0.25, 0]}
      material={slabMat}
      receiveShadow
    />
  );
}

// Self-contained dark "showroom" environment — gives every metal/glass surface
// real reflections without any external HDRI download. Background stays our
// gradient; this only drives scene.environment (IBL + reflections).
function Studio() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.42}>
      <color attach="background" args={["#0a0b09"]} />
      {/* large overhead soft key (faces down) */}
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#fff4e6"
        position={[0, 7, 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 8, 1]}
      />
      {/* cool rim from the left, warm fill from the right → metal edge highlights */}
      <Lightformer
        form="rect"
        intensity={1.0}
        color="#cfe0ff"
        position={[-8, 3.5, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[8, 9, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#ffe6c8"
        position={[8, 3.5, -2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[8, 9, 1]}
      />
      {/* dim front bounce + dark surround */}
      <Lightformer form="rect" intensity={0.35} color="#2a2e26" position={[0, 1, 9]} scale={[14, 8, 1]} />
      <Lightformer form="rect" intensity={0.2} color="#0c0e0a" position={[0, 2, -9]} scale={[14, 10, 1]} />
    </Environment>
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
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={dpr}
      orthographic
      camera={{ position: [9, 6.3, 9], zoom: 102, near: 0.1, far: 100 }}
      gl={{ powerPreference: "high-performance", antialias: false, toneMapping: THREE.NoToneMapping }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.75)}
        onFallback={() => setDpr(1)}
      />

      <StoryDirector />
      <Backdrop />
      <Studio />
      <Floor />
      <RoomScene />
      {/* soft, premium ambient-occlusion bleed where walls + benches meet the slab */}
      <ContactShadows
        position={[0, FLOOR_Y + 0.014, 0]}
        scale={12}
        resolution={512}
        frames={1}
        far={10}
        blur={3}
        opacity={0.6}
        color="#000000"
      />
      <TraceTablet />

      <EffectComposer multisampling={4} enableNormalPass>
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={24}
          rings={4}
          radius={0.1}
          intensity={2.6}
          bias={0.03}
          luminanceInfluence={0.6}
          worldDistanceThreshold={6}
          worldDistanceFalloff={1.5}
          worldProximityThreshold={0.6}
          worldProximityFalloff={0.2}
          color={new THREE.Color("black")}
        />
        <Bloom
          mipmapBlur
          luminanceThreshold={0.85}
          luminanceSmoothing={0.18}
          intensity={0.55}
          radius={0.5}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.4} darkness={0.34} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>

      <Preload all />
      {debug && <Stats />}
    </Canvas>
  );
}
