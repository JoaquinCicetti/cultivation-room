import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import * as mat from "./materials";
import { AC_POS, CONTROLLER_POS, TANK_POS, type Vec3 } from "./sceneData";
import { MEASURE_CHIPS, story } from "../scroll/story";

// --- Wall-mounted AC (mini-split) with animated airflow ---------------------
export function AirConditioner() {
  const louvers = useRef<THREE.Group>(null);
  const flow = useRef<THREE.Group>(null);

  // downward-spreading air ribbons
  const streams = useMemo(
    () => [0, 1, 2, 3, 4, 5].map((i) => ({ x: (i - 2.5) * 0.16, seed: i * 0.17 })),
    [],
  );

  useFrame((state, delta) => {
    const ac = story.fan; // climate-response 0..1 (ramps on in CONTROL)
    const t = state.clock.elapsedTime;
    if (louvers.current) {
      const tilt = -0.45 - Math.sin(t * 2.4) * 0.28 * ac;
      for (const c of louvers.current.children) (c as THREE.Mesh).rotation.x = tilt;
    }
    if (flow.current) {
      for (const c of flow.current.children) {
        const m = c as THREE.Mesh;
        let y = m.position.y - delta * (0.5 + ac) * 0.8;
        if (y < -1.2) y = -0.05;
        m.position.y = y;
        const f = THREE.MathUtils.clamp(1 - -y / 1.2, 0, 1);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.22 * ac * f;
      }
    }
  });

  return (
    <group position={AC_POS}>
      {/* body */}
      <mesh material={mat.acBodyMat} castShadow>
        <boxGeometry args={[1.15, 0.32, 0.26]} />
      </mesh>
      {/* lime status line */}
      <mesh position={[0.4, 0.08, 0.135]} material={mat.acAccentMat}>
        <boxGeometry args={[0.28, 0.012, 0.01]} />
      </mesh>
      {/* top intake grille */}
      {[0.03, 0.0, -0.03].map((y, i) => (
        <mesh key={i} position={[0, y + 0.07, 0.131]} material={mat.acVentMat}>
          <boxGeometry args={[1.0, 0.006, 0.005]} />
        </mesh>
      ))}
      {/* bottom outlet louvers */}
      <group ref={louvers} position={[0, -0.15, 0.12]}>
        {[-0.34, 0, 0.34].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} material={mat.acVentMat}>
            <boxGeometry args={[0.34, 0.018, 0.07]} />
          </mesh>
        ))}
      </group>
      {/* animated airflow ribbons */}
      <group ref={flow} position={[0, -0.22, 0.18]}>
        {streams.map((s, i) => (
          <mesh key={i} position={[s.x, -0.1 - s.seed, 0.04 + s.seed * 0.4]} rotation={[0.55, 0, 0]}>
            <planeGeometry args={[0.05, 0.5]} />
            <meshBasicMaterial
              color={0xd8ee82}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// --- Irrigation tank in the back corner + thin feed lines -------------------
export function IrrigationTank() {
  const [tx, , tz] = TANK_POS;
  const bodyH = 0.95;
  const bodyY = 0.12 + bodyH / 2;

  return (
    <group>
      <mesh position={[tx, bodyY, tz]} material={mat.tankMat} castShadow>
        <cylinderGeometry args={[0.32, 0.34, bodyH, 20]} />
      </mesh>
      <mesh position={[tx, 0.12 + bodyH, tz]} material={mat.tankCapMat}>
        <cylinderGeometry args={[0.33, 0.33, 0.06, 20]} />
      </mesh>
      <mesh position={[tx, 0.12 + 0.02, tz]} material={mat.tankCapMat}>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
      </mesh>
      <mesh position={[tx + 0.34, 0.12 + 0.9, tz]} material={mat.pipeMat}>
        <cylinderGeometry args={[0.022, 0.022, 1.4, 8]} />
      </mesh>
      <mesh position={[tx + 1.3, 0.12 + 1.58, tz + 0.05]} rotation={[0, 0, Math.PI / 2]} material={mat.pipeMat}>
        <cylinderGeometry args={[0.018, 0.018, 2.6, 8]} />
      </mesh>
      <mesh position={[tx + 2.2, 0.12 + 1.15, tz + 0.05]} material={mat.pipeMat}>
        <cylinderGeometry args={[0.015, 0.015, 0.85, 8]} />
      </mesh>
    </group>
  );
}

// --- Small sensor nodes at each MEASURE anchor ------------------------------
export function Sensors() {
  return (
    <group>
      {MEASURE_CHIPS.map((c) => {
        const pos: Vec3 = [c.anchor[0], c.anchor[1] - 0.12, c.anchor[2]];
        return (
          <group key={c.id} position={pos}>
            <mesh material={mat.sensorMat} castShadow>
              <boxGeometry args={[0.08, 0.13, 0.045]} />
            </mesh>
            <mesh position={[0, 0.04, 0.03]} material={mat.sensorLedMat}>
              <sphereGeometry args={[0.009, 8, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- Central controller on the back wall ------------------------------------
export function Controller() {
  const screenTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0a120a";
      ctx.fillRect(0, 0, 256, 160);
      ctx.fillStyle = "#9CB64F";
      ctx.font = "600 16px ui-monospace, monospace";
      ctx.fillText("GROWCAST · CTRL", 18, 30);
      ctx.strokeStyle = "#1d2a14";
      ctx.beginPath();
      ctx.moveTo(18, 44);
      ctx.lineTo(238, 44);
      ctx.stroke();
      ctx.fillStyle = "#C8E06A";
      ctx.font = "700 30px ui-monospace, monospace";
      ctx.fillText("24.8°C", 18, 88);
      ctx.fillStyle = "#9CB64F";
      ctx.font = "500 15px ui-monospace, monospace";
      ctx.fillText("HUM 63%", 18, 118);
      ctx.fillText("CO₂ 820", 130, 118);
      ctx.fillText("EC 1.7   pH 6.1", 18, 142);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <group position={CONTROLLER_POS}>
      <mesh material={mat.panelMat} castShadow>
        <boxGeometry args={[0.58, 0.42, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.031]} material={mat.panelDarkMat}>
        <boxGeometry args={[0.54, 0.38, 0.012]} />
      </mesh>
      <mesh position={[0, 0.03, 0.04]}>
        <planeGeometry args={[0.42, 0.26]} />
        <meshBasicMaterial map={screenTexture} toneMapped={false} transparent />
      </mesh>
      {[-0.2, -0.16, -0.12].map((x, i) => (
        <mesh key={i} position={[x, -0.15, 0.04]} material={mat.ledGreenMat}>
          <sphereGeometry args={[0.007, 8, 8]} />
        </mesh>
      ))}
      {[0, 1, 2].map((b) => (
        <mesh key={b} position={[0.08 + b * 0.06, -0.15, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={mat.buttonMat}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 10]} />
        </mesh>
      ))}
    </group>
  );
}
