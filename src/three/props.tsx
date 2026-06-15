import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import * as mat from "./materials";
import { AC_POS, CONTROLLER_POS, ROOM_D, ROOM_W, TANK_POS, VAPORIZER_POS, WALL_THICK, type Vec3 } from "./sceneData";
import { METRICS, story } from "../scroll/story";

// --- Vaporizer / humidifier with a rising mist plume ------------------------
export function Vaporizer() {
  const mist = useRef<THREE.Group>(null);
  const puffs = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => ({ x: (i % 2 ? 1 : -1) * 0.03, base: i * 0.12 })), []);

  useFrame((_, delta) => {
    if (!mist.current) return;
    for (const c of mist.current.children) {
      const m = c as THREE.Mesh;
      let y = m.position.y + delta * 0.32;
      if (y > 0.75) y = 0;
      m.position.y = y;
      const f = THREE.MathUtils.clamp(1 - y / 0.75, 0, 1);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.14 * f;
      m.scale.setScalar(0.5 + y * 1.6);
    }
  });

  return (
    <group position={VAPORIZER_POS}>
      <mesh position={[0, 0.18, 0]} material={mat.vaporizerMat} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.36, 16]} />
      </mesh>
      <mesh position={[0, 0.37, 0]} material={mat.vaporizerCapMat}>
        <cylinderGeometry args={[0.1, 0.12, 0.045, 16]} />
      </mesh>
      <mesh position={[0.05, 0.3, 0.1]} material={mat.sensorLedMat}>
        <sphereGeometry args={[0.008, 8, 8]} />
      </mesh>
      <group ref={mist} position={[0, 0.41, 0]}>
        {puffs.map((p, i) => (
          <mesh key={i} position={[p.x, p.base, 0]}>
            <sphereGeometry args={[0.07, 7, 6]} />
            <meshBasicMaterial color={0xeef2ff} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

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

// --- Small sensor nodes at each metric anchor (leader lines land here) ------
export function Sensors() {
  const tempLed = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    // the temperature sensor LED tracks the alert (green -> amber -> red)
    if (tempLed.current) {
      const a = story.alert;
      const hex = a > 0.55 ? 0xf0654a : a > 0.18 ? 0xe8b34a : 0x5fbf30;
      tempLed.current.emissive.setHex(hex);
      tempLed.current.color.setHex(hex);
      tempLed.current.emissiveIntensity = 1.4 + a * 1.2;
    }
  });

  return (
    <group>
      {METRICS.map((m) => {
        const pos: Vec3 = [m.anchor[0], m.anchor[1] - 0.12, m.anchor[2]];
        return (
          <group key={m.id} position={pos}>
            <mesh material={mat.sensorMat} castShadow>
              <boxGeometry args={[0.08, 0.13, 0.045]} />
            </mesh>
            <mesh position={[0, 0.04, 0.03]}>
              <sphereGeometry args={[0.009, 8, 8]} />
              {m.id === "temp" ? (
                <meshStandardMaterial ref={tempLed} color={0x5fbf30} emissive={0x5fbf30} emissiveIntensity={1.4} roughness={0.3} />
              ) : (
                <primitive object={mat.sensorLedMat} attach="material" />
              )}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- Professional cultivation infrastructure --------------------------------
// Cable tray + drop conduits, wall control boxes, and a nutrient dosing / pump
// skid feeding the racks. Clean and intentional — engineered, not cluttered.
export function Infrastructure() {
  const backZ = -ROOM_D / 2 + WALL_THICK + 0.02; // just in front of the back wall
  const leftX = -ROOM_W / 2 + WALL_THICK + 0.02; // just off the left wall
  const dose = TANK_POS; // skid lives beside the reservoir

  return (
    <group>
      {/* ---- back-wall cable tray + drop conduits ---- */}
      <mesh position={[0.1, 2.28, backZ]} material={mat.trayMat} castShadow>
        <boxGeometry args={[4.7, 0.05, 0.13]} />
      </mesh>
      <mesh position={[0.1, 2.31, backZ + 0.07]} material={mat.conduitMat}>
        <boxGeometry args={[4.7, 0.07, 0.012]} />
      </mesh>
      {/* conduits dropping from the tray to each control box / the AC */}
      {[-1.2, 1.2, 2.15].map((x, i) => (
        <mesh key={i} position={[x, i === 2 ? 2.14 : 1.98, backZ + 0.02]} material={mat.conduitMat}>
          <boxGeometry args={[0.045, i === 2 ? 0.3 : 0.62, 0.045]} />
        </mesh>
      ))}

      {/* ---- two wall-mounted control / automation boxes flanking the controller ---- */}
      {[-1.2, 1.2].map((x, i) => (
        <group key={i} position={[x, 1.5, backZ + 0.02]}>
          <mesh material={mat.boxMat} castShadow>
            <boxGeometry args={[0.34, 0.46, 0.14]} />
          </mesh>
          <mesh position={[0, 0.02, 0.08]} material={mat.boxDarkMat}>
            <boxGeometry args={[0.27, 0.34, 0.02]} />
          </mesh>
          <mesh position={[0.11, 0.18, 0.08]} material={mat.ledGreenMat}>
            <sphereGeometry args={[0.009, 8, 8]} />
          </mesh>
          {/* conduit gland at the bottom */}
          <mesh position={[0, -0.27, 0.02]} material={mat.conduitMat}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          </mesh>
        </group>
      ))}

      {/* ---- left-wall vertical conduit run (organized cable routing) ---- */}
      <mesh position={[leftX, 1.05, -0.9]} material={mat.conduitMat}>
        <boxGeometry args={[0.05, 1.7, 0.05]} />
      </mesh>
      <mesh position={[leftX, 1.88, -0.45]} material={mat.conduitMat}>
        <boxGeometry args={[0.045, 0.045, 0.95]} />
      </mesh>

      {/* ---- nutrient dosing + irrigation pump skid (beside the reservoir) ---- */}
      <group position={[dose[0] + 0.55, 0.12, dose[2] + 0.85]}>
        {/* base plate */}
        <mesh position={[0, 0.03, 0]} material={mat.boxDarkMat} receiveShadow>
          <boxGeometry args={[0.82, 0.05, 0.52]} />
        </mesh>
        {/* irrigation pump (body + motor) */}
        <mesh position={[-0.24, 0.2, 0.02]} material={mat.steelMat} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
        </mesh>
        <mesh position={[-0.24, 0.2, 0.2]} material={mat.boxDarkMat} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.18]} />
        </mesh>
        {/* three nutrient dosing bottles (A / B / pH) with caps */}
        {[0.04, 0.18, 0.32].map((x, i) => {
          const h = [0.26, 0.32, 0.24][i];
          return (
            <group key={i} position={[x, 0.05, -0.06]}>
              <mesh position={[0, h / 2, 0]} material={mat.boxMat} castShadow>
                <cylinderGeometry args={[0.045, 0.05, h, 14]} />
              </mesh>
              <mesh position={[0, h + 0.018, 0]} material={mat.acAccentMat}>
                <cylinderGeometry args={[0.03, 0.035, 0.035, 12]} />
              </mesh>
            </group>
          );
        })}
        {/* dosing manifold pipe + valves running toward the racks */}
        <mesh position={[0.05, 0.36, -0.18]} rotation={[0, 0, Math.PI / 2]} material={mat.pipeMat}>
          <cylinderGeometry args={[0.018, 0.018, 0.62, 10]} />
        </mesh>
        {[-0.18, 0.0, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0.36, -0.18]} material={mat.boxDarkMat}>
            <boxGeometry args={[0.04, 0.06, 0.05]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// --- Central controller on the back wall ------------------------------------
// Three operating states drive the wall display + alarm indicator:
//   0 estable (green) · 1 alerta (red) · 2 control activo (amber)
function controlState(): 0 | 1 | 2 {
  if (story.alert > 0.45) return 1;
  if (story.fan > 0.25) return 2;
  return 0;
}

export function Controller() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const alarmRef = useRef<THREE.MeshStandardMaterial>(null);
  const lastState = useRef<number>(-1);

  const screenTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    texRef.current = tex;
    return tex;
  }, []);

  const drawScreen = (state: number, temp: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const accent = state === 1 ? "#F0654A" : state === 2 ? "#E8B34A" : "#C8E06A";
    const label = state === 1 ? "ALERTA" : state === 2 ? "CONTROL ACTIVO" : "ESTABLE";
    ctx.fillStyle = "#0a120a";
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = "#9CB64F";
    ctx.font = "600 15px ui-monospace, monospace";
    ctx.fillText("GROWCAST · CTRL", 18, 28);
    ctx.fillStyle = accent;
    ctx.font = "700 13px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("● " + label, 238, 28);
    ctx.textAlign = "left";
    ctx.strokeStyle = "#1d2a14";
    ctx.beginPath();
    ctx.moveTo(18, 42);
    ctx.lineTo(238, 42);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = "700 30px ui-monospace, monospace";
    ctx.fillText(temp.toFixed(1) + "°C", 18, 86);
    ctx.fillStyle = "#9CB64F";
    ctx.font = "500 15px ui-monospace, monospace";
    ctx.fillText("HUM 63%", 18, 116);
    ctx.fillText("CO₂ 820", 130, 116);
    ctx.fillText("EC 1.7   pH 6.1", 18, 140);
    if (texRef.current) texRef.current.needsUpdate = true;
  };

  useFrame(() => {
    const state = controlState();
    // redraw only on state change or while the temperature is moving
    if (state !== lastState.current || story.alert > 0.02) {
      lastState.current = state;
      drawScreen(state, story.temp);
    }
    if (alarmRef.current) {
      alarmRef.current.emissiveIntensity = 0.4 + story.alert * 2.6;
      alarmRef.current.emissive.setHex(story.alert > 0.25 ? 0xff4326 : 0x5fbf30);
      alarmRef.current.color.setHex(story.alert > 0.25 ? 0xff6a52 : 0x7bd44a);
    }
  });

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
      {/* steady alarm indicator (green → red with the alert, never flashing) */}
      <mesh position={[-0.2, -0.15, 0.045]}>
        <sphereGeometry args={[0.011, 10, 10]} />
        <meshStandardMaterial ref={alarmRef} color={0x7bd44a} emissive={0x5fbf30} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {[-0.16, -0.12].map((x, i) => (
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
