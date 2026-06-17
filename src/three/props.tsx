import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

import { useTr } from "../i18n/runtime";

import * as mat from "./materials";
import { AC_POS, CONTROLLER_BODY, CONTROLLER_POS, CONTROLLER_SCREEN, RACKS, ROOM_D, ROOM_W, TANK_POS, VAPORIZER_POS, WALL_THICK, type Vec3 } from "./sceneData";
import { devices, METRICS, story } from "../scroll/story";

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
    // the Aire acondicionado card is the source of truth (auto OR manual)
    const dac = devices.ac;
    const ac = dac.on ? dac.level : 0;
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
      {/* plastic housing seam (front parting line) */}
      <mesh position={[0, -0.02, 0.131]} material={mat.acVentMat}>
        <boxGeometry args={[1.14, 0.004, 0.004]} />
      </mesh>
      {/* wall mounting brackets behind the unit */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0, -0.16]} material={mat.boxDarkMat} castShadow>
          <boxGeometry args={[0.1, 0.24, 0.06]} />
        </mesh>
      ))}
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
      {/* painted spec label band */}
      <mesh position={[tx, bodyY + 0.05, tz + 0.345]} material={mat.labelMat}>
        <boxGeometry args={[0.34, 0.22, 0.006]} />
      </mesh>
      {/* outlet valve + handle + flange near the base */}
      <mesh position={[tx + 0.33, 0.12 + 0.22, tz]} rotation={[0, 0, Math.PI / 2]} material={mat.valveMat} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
      </mesh>
      <mesh position={[tx + 0.4, 0.12 + 0.22, tz]} material={mat.valveMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 14]} />
      </mesh>
      <mesh position={[tx + 0.42, 0.12 + 0.22, tz]} rotation={[0, 0, Math.PI / 2]} material={mat.valveMat}>
        <torusGeometry args={[0.045, 0.008, 8, 16]} />
      </mesh>
      {/* top inlet fitting */}
      <mesh position={[tx + 0.18, 0.12 + bodyH - 0.02, tz]} material={mat.pipeMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
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

// Shared Growcast sensor enclosure — TH / THP / THC all use the same body: a
// compact white module with a dark vented front face. The caller adds the status
// LED (so its colour can be driven per sensor).
function SensorBody() {
  return (
    <group>
      <RoundedBox args={[0.12, 0.085, 0.042]} radius={0.014} smoothness={4} material={mat.acBodyMat} castShadow />
      {/* recessed dark front */}
      <mesh position={[0, 0, 0.022]} material={mat.panelDarkMat}>
        <boxGeometry args={[0.098, 0.062, 0.005]} />
      </mesh>
      {/* fine vent slits on the right of the face */}
      {[-0.014, 0, 0.014].map((y, i) => (
        <mesh key={i} position={[0.022, y, 0.026]} material={mat.boxDarkMat}>
          <boxGeometry args={[0.04, 0.004, 0.003]} />
        </mesh>
      ))}
    </group>
  );
}

// --- Sensor nodes at each metric anchor (leader lines land here) ------------
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
            <SensorBody />
            <mesh position={[-0.03, 0.016, 0.026]}>
              <sphereGeometry args={[0.007, 8, 8]} />
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
      {/* ---- back-left corner piping riser bundle (utility network) ---- */}
      <group position={[leftX + 0.08, 0, backZ + 0.08]}>
        {[
          { x: 0.0, z: 0.0, r: 0.03, c: mat.pipeMat },
          { x: 0.07, z: 0.0, r: 0.022, c: mat.pipeMat },
          { x: 0.0, z: 0.07, r: 0.018, c: mat.conduitMat },
        ].map((p, i) => (
          <mesh key={i} position={[p.x, 1.25, p.z]} material={p.c}>
            <cylinderGeometry args={[p.r, p.r, 2.2, 10]} />
          </mesh>
        ))}
        {/* pipe clamps fixing the bundle to the corner */}
        {[0.55, 1.45, 2.15].map((y, i) => (
          <mesh key={i} position={[0.035, y, 0.035]} material={mat.boxDarkMat}>
            <boxGeometry args={[0.13, 0.03, 0.13]} />
          </mesh>
        ))}
        {/* elbow turning along the back wall toward the controller */}
        <mesh position={[0.4, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} material={mat.pipeMat}>
          <cylinderGeometry args={[0.022, 0.022, 0.9, 8]} />
        </mesh>
      </group>

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

// --- Exterior threshold: grounds the room in a larger facility --------------
// A wall control/breaker cabinet, an access door with an illuminated EXIT sign,
// and a couple of safety bollards. Deliberately restrained — industrial, not busy.
export function Exterior() {
  const leftFace = -ROOM_W / 2 + WALL_THICK; // interior face of left wall

  // small "EXIT" sign face texture (white legend on red)
  const exitTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e23a26";
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = "#fff";
    ctx.font = "700 34px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EXIT", 64, 36);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // door sits on the interior face of the left wall and protrudes INTO the room
  const doorFace = leftFace + 0.02;
  return (
    <group>
      {/* ---- sliding EXIT door on the LEFT wall (the face-on "back wall"),
              right side, rotated to face into the room ---- */}
      <group position={[doorFace, 0, -1.55]} rotation={[0, Math.PI / 2, 0]}>
        {/* recessed frame */}
        <mesh position={[0, 0.12 + 1.06, -0.01]} material={mat.doorFrameMat} castShadow>
          <boxGeometry args={[1.12, 2.18, 0.06]} />
        </mesh>
        {/* dark sliding leaf (with a vision panel) */}
        <mesh position={[0, 0.12 + 1.04, 0.05]} material={mat.doorMat} castShadow>
          <boxGeometry args={[0.96, 2.02, 0.05]} />
        </mesh>
        <mesh position={[0, 0.12 + 1.55, 0.08]} material={mat.screenGlassMat}>
          <boxGeometry args={[0.5, 0.55, 0.02]} />
        </mesh>
        {/* overhead sliding track + roller head */}
        <mesh position={[0, 0.12 + 2.16, 0.05]} material={mat.boxDarkMat}>
          <boxGeometry args={[1.3, 0.07, 0.06]} />
        </mesh>
        {/* recessed pull handle */}
        <mesh position={[0.3, 0.12 + 1.04, 0.08]} material={mat.cabinetMat}>
          <boxGeometry args={[0.05, 0.55, 0.03]} />
        </mesh>
        {/* illuminated EXIT sign above the door */}
        <mesh position={[0, 0.12 + 2.34, 0.06]} material={mat.exitSignMat}>
          <boxGeometry args={[0.36, 0.17, 0.05]} />
        </mesh>
        <mesh position={[0, 0.12 + 2.34, 0.091]}>
          <planeGeometry args={[0.32, 0.14]} />
          <meshBasicMaterial map={exitTex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// --- Growcast Industria electrical panel (centerpiece of the back/right wall) --
// White industrial enclosure with the Growcast logo, a "Growcast Industria"
// legend and a row of physical toggle switches. Flanked by the AC + a wall
// sensor and wired to both with black right-angled conduit.
const BACK_WALL_Z = -ROOM_D / 2 + 0.15; // common face for back-wall equipment

function panelFaceTexture(): THREE.CanvasTexture {
  const W = 360;
  const H = 500;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  // clean white panel face + subtle border
  ctx.fillStyle = "#eef0ea";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#d4d7cd";
  ctx.lineWidth = 3;
  ctx.strokeRect(9, 9, W - 18, H - 18);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    // big BLACK centered logo (recolor the lime glyph to black via source-in)
    const L = 212;
    const off = document.createElement("canvas");
    off.width = off.height = L;
    const o = off.getContext("2d")!;
    o.drawImage(img, 0, 0, L, L);
    o.globalCompositeOperation = "source-in";
    o.fillStyle = "#0c0d0c";
    o.fillRect(0, 0, L, L);
    ctx.drawImage(off, (W - L) / 2, 62);
    // compact wordmark caption under the logo
    ctx.fillStyle = "#15170f";
    ctx.font = "700 30px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GROWCAST", W / 2, 318);
    ctx.fillStyle = "#8b9080";
    ctx.font = "600 15px Inter, system-ui, sans-serif";
    ctx.fillText("I N D U S T R I A", W / 2, 344);
    tex.needsUpdate = true;
  };
  img.src = "/logo.svg";
  return tex;
}

export function ElectricalPanel() {
  const faceTex = useMemo(panelFaceTexture, []);
  const W = 0.72;
  const H = 1.04;
  const D = 0.12;
  return (
    <group position={[0, 1.46, BACK_WALL_Z]}>
      {/* white enclosure */}
      <mesh material={mat.whitePanelMat} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      {/* printed front face (logo + Growcast Industria + legends) */}
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.06, H - 0.06]} />
        <meshStandardMaterial map={faceTex} roughness={0.5} metalness={0.05} envMapIntensity={0.5} />
      </mesh>
      {/* hinge-side seam */}
      <mesh position={[W / 2 - 0.025, 0, D / 2 + 0.004]} material={mat.boxDarkMat}>
        <boxGeometry args={[0.012, H - 0.12, 0.02]} />
      </mesh>
      {/* smooth toggle switches below the logo (rounded housing + sliding knob) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const on = i % 2 === 0;
        const x = -0.24 + i * 0.12;
        return (
          <group key={i} position={[x, -0.27, D / 2 + 0.012]}>
            <RoundedBox args={[0.098, 0.052, 0.024]} radius={0.01} smoothness={4} material={mat.panelDarkMat} castShadow />
            <RoundedBox
              args={[0.044, 0.044, 0.03]}
              radius={0.012}
              smoothness={4}
              position={[on ? 0.024 : -0.024, 0, 0.007]}
              material={on ? mat.ledGreenMat : mat.cabinetMat}
            />
          </group>
        );
      })}
    </group>
  );
}

// Wall-mounted Sensor TH flanking the panel on the left of the equipment wall.
export function WallSensorTH() {
  return (
    <group position={[-2.2, 1.62, BACK_WALL_Z]}>
      <SensorBody />
      <mesh position={[-0.03, 0.016, 0.026]} material={mat.sensorLedMat}>
        <sphereGeometry args={[0.007, 8, 8]} />
      </mesh>
    </group>
  );
}

// Neat right-angled black conduit wiring the panel to the AC (right) and the
// wall Sensor TH (left): a clean horizontal run above the devices with tidy
// vertical drops into each — no messy diagonals.
export function PanelConduits() {
  const cz = BACK_WALL_Z + 0.04; // proud of the wall, in front of the equipment
  const RUN_Y = 1.92; // single clean run height above the panel + devices
  const seg = (pos: Vec3, size: Vec3) => (
    <mesh position={pos} material={mat.blackConduitMat}>
      <boxGeometry args={size} />
    </mesh>
  );
  const T = 0.026; // conduit thickness
  return (
    <group>
      {/* panel → AC (right): up off the panel, across, down into the unit */}
      {seg([0.3, 1.85, cz], [T, 0.16, T])}
      {seg([1.25, RUN_Y, cz], [1.9, T, T])}
      {seg([2.2, 1.96, cz], [T, 0.1, T])}
      {/* panel → sensor (left) */}
      {seg([-0.3, 1.85, cz], [T, 0.16, T])}
      {seg([-1.25, RUN_Y, cz], [1.9, T, T])}
      {seg([-2.2, 1.79, cz], [T, 0.26, T])}
    </group>
  );
}

// A second Sensor TH hung by a VISIBLE wire from the central rack's LED bar,
// dropping over the canopy.
export function HangingSensorTH() {
  const rack = RACKS[1]; // central bench
  const x = rack.x;
  const z = rack.z + 0.95; // along the bench
  const attachY = rack.lightY - 0.05; // clip just under the rack's LED bar
  const sensorY = 1.4; // hangs over the canopy
  return (
    <group>
      {/* visible drop wire from the rack */}
      <mesh position={[x, (attachY + sensorY) / 2, z]} material={mat.cableMat}>
        <cylinderGeometry args={[0.008, 0.008, attachY - sensorY, 8]} />
      </mesh>
      {/* clip onto the rack's LED bar */}
      <mesh position={[x, attachY, z]} material={mat.boxDarkMat}>
        <boxGeometry args={[0.035, 0.03, 0.035]} />
      </mesh>
      <group position={[x, sensorY, z]}>
        {/* cable gland on top of the sensor */}
        <mesh position={[0, 0.052, 0]} material={mat.boxDarkMat}>
          <cylinderGeometry args={[0.008, 0.011, 0.025, 8]} />
        </mesh>
        <SensorBody />
        <mesh position={[-0.03, 0.016, 0.026]} material={mat.sensorLedMat}>
          <sphereGeometry args={[0.007, 8, 8]} />
        </mesh>
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
  const { locale, t } = useTr();
  // state-indexed display labels: 0 stable · 1 alert · 2 active control
  const labels = [t("controller.stable"), t("controller.alert"), t("controller.active")];
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  const grpRef = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const alarmRef = useRef<THREE.MeshStandardMaterial>(null);
  const lastState = useRef<number>(-1);
  // own clones of the device materials so toggling depthTest while it flies (see
  // useFrame) doesn't affect the other props sharing these materials.
  const bodyMat = useMemo(() => mat.panelMat.clone(), []);
  const bezelMat = useMemo(() => mat.panelDarkMat.clone(), []);
  const glassMat = useMemo(() => mat.screenGlassMat.clone(), []);

  // redraw the canvas texture when the language changes (even while idle)
  useEffect(() => {
    lastState.current = -1;
  }, [locale]);

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
    const label = labelsRef.current[state] ?? labelsRef.current[0];
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
    // The wall tablet IS this controller — StoryDirector flies its whole group to
    // the front during the traceability section (it is NOT hidden); the report DOM
    // panel is projected from its live screen so it stays glued.
    // While flying it travels from the back wall THROUGH the room, so render it ON
    // TOP (depthTest off + high renderOrder) so it isn't occluded; at rest it is
    // depth-tested normally (correctly occluded by the canopy).
    const flying = story.p > 0.605 && story.p < 0.96;
    bodyMat.depthTest = bezelMat.depthTest = glassMat.depthTest = !flying;
    bodyMat.depthWrite = bezelMat.depthWrite = !flying;
    const ro = flying ? 100 : 0;
    if (grpRef.current) grpRef.current.traverse((o) => (o.renderOrder = ro));

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

  // Portrait control tablet: a screen (upper area, sized to the report's aspect)
  // + a button/LED strip in the bottom ~30%. SY = screen centre offset.
  const SY = CONTROLLER_SCREEN.y;
  const BY = -0.21; // button/LED strip centre (below the screen)
  return (
    <group ref={grpRef} name="controller" position={CONTROLLER_POS}>
      {/* portrait device body */}
      <mesh material={bodyMat} castShadow>
        <boxGeometry args={[CONTROLLER_BODY.w, CONTROLLER_BODY.h, CONTROLLER_BODY.d]} />
      </mesh>
      {/* screen recess (dark bezel) — the traceability report is rendered as this
          surface (a DOM overlay; see StoryDirector/Overlay), matched to its size */}
      <mesh position={[0, SY, 0.031]} material={bezelMat}>
        <boxGeometry args={[CONTROLLER_SCREEN.w + 0.02, CONTROLLER_SCREEN.h + 0.02, 0.012]} />
      </mesh>
      {/* hidden live-readout canvas (texture kept; the report is the surface) */}
      <mesh position={[0, SY, CONTROLLER_SCREEN.z]} visible={false}>
        <planeGeometry args={[CONTROLLER_SCREEN.w, CONTROLLER_SCREEN.h]} />
        <meshBasicMaterial map={screenTexture} toneMapped={false} transparent />
      </mesh>
      {/* glossy protective glass over the display (sharp reflections) */}
      <mesh position={[0, SY, 0.046]} material={glassMat}>
        <boxGeometry args={[CONTROLLER_SCREEN.w + 0.035, CONTROLLER_SCREEN.h + 0.035, 0.006]} />
      </mesh>
      {/* bottom strip — alarm indicator + status LEDs + buttons. Hidden by
          StoryDirector once the device grows/flies (giant buttons look odd). */}
      <group name="ctrlStrip">
        <mesh position={[-0.14, BY, 0.045]}>
          <sphereGeometry args={[0.012, 10, 10]} />
          <meshStandardMaterial ref={alarmRef} color={0x7bd44a} emissive={0x5fbf30} emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
        {[-0.09, -0.055].map((x, i) => (
          <mesh key={i} position={[x, BY, 0.04]} material={mat.ledGreenMat}>
            <sphereGeometry args={[0.008, 8, 8]} />
          </mesh>
        ))}
        {[0, 1, 2].map((b) => (
          <mesh key={b} position={[0.02 + b * 0.06, BY, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={mat.buttonMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.012, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
