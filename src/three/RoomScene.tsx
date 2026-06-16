import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

import * as mat from "./materials";
import { tileTextures } from "./textures";
import {
  buildInstanceData,
  CYL_GEO,
  FOOT_GEO,
  LEAF_GEO,
  POT_GEO,
  RACKS,
  ROOM_D,
  ROOM_H,
  ROOM_W,
  STEM_GEO,
  UNIT_BOX,
  WALL_THICK,
  type LeafXForm,
  type XForm,
} from "./sceneData";
import { story } from "../scroll/story";
import {
  AirConditioner,
  Controller,
  ElectricalPanel,
  Exterior,
  HangingSensorTH,
  Infrastructure,
  IrrigationTank,
  PanelConduits,
  Sensors,
  Vaporizer,
  WallSensorTH,
} from "./props";

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

// The floating isometric diorama. Named "room" so the director can gently
// rotate/scale it. Geometry only — lights live in StoryDirector.
export function RoomScene() {
  const data = useMemo(() => buildInstanceData(), []);

  return (
    <group name="room">
      <RoomShell />
      <CultivationFloor />

      <StaticInstances geometry={UNIT_BOX} material={mat.rackMat} items={data.rackBars} castShadow />
      <StaticInstances geometry={UNIT_BOX} material={mat.trayMaterial} items={data.trayParts} castShadow receiveShadow />
      <StaticInstances geometry={UNIT_BOX} material={mat.reservoirMat} items={data.channels} castShadow />
      <StaticInstances geometry={UNIT_BOX} material={mat.lightFixtureMat} items={data.lightBars} />
      <StaticInstances geometry={UNIT_BOX} material={mat.lightGlowMat} items={data.lightGlows} />
      <StaticInstances geometry={FOOT_GEO} material={mat.footMat} items={data.feet} />
      <StaticInstances geometry={UNIT_BOX} material={mat.tubingMat} items={data.tubes} castShadow />
      <StaticInstances geometry={POT_GEO} material={mat.potMat} items={data.pots} castShadow />
      <StaticInstances geometry={CYL_GEO} material={mat.soilMat} items={data.soil} />
      <StaticInstances geometry={STEM_GEO} material={mat.stemMat} items={data.stems} />
      <LeafInstances items={data.leaves} />
      <LightFixtureDetails />

      <Controller />
      <ElectricalPanel />
      <WallSensorTH />
      <PanelConduits />
      <HangingSensorTH />
      <AirConditioner />
      <IrrigationTank />
      <Vaporizer />
      <Sensors />
      <Infrastructure />
      <Exterior />
    </group>
  );
}

// Interior cleanroom floor: large semi-gloss tiles (subtle grid bump), catching
// soft spread-out light bounces — never sharp pools. Thin painted safety frame.
function CultivationFloor() {
  const zw = ROOM_W - 0.16;
  const zd = ROOM_D - 0.16;
  const floorMat = useMemo(() => {
    const b = tileTextures();
    const clone = (t: THREE.Texture) => {
      const c = t.clone();
      c.needsUpdate = true;
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      return c;
    };
    const map = clone(b.map);
    const roughnessMap = clone(b.roughnessMap);
    const normalMap = clone(b.normalMap);
    const rx = zw / 3.6;
    const rz = zd / 3.6; // ~0.6 m square cleanroom tiles
    for (const t of [map, roughnessMap, normalMap]) t.repeat.set(rx, rz);
    return new THREE.MeshStandardMaterial({
      map,
      roughnessMap,
      normalMap,
      normalScale: new THREE.Vector2(0.1, 0.1),
      color: "#6a6e72",
      roughness: 0.45,
      metalness: 0.05,
      envMapIntensity: 0.6,
    });
  }, [zw, zd]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.121, 0]} material={floorMat} receiveShadow>
      <planeGeometry args={[zw, zd]} />
    </mesh>
  );
}

interface StaticInstancesProps {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: XForm[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

function StaticInstances({ geometry, material, items, castShadow, receiveShadow }: StaticInstancesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      dummy.position.set(it.position[0], it.position[1], it.position[2]);
      if (it.rot) dummy.rotation.set(it.rot[0], it.rot[1], it.rot[2]);
      else dummy.rotation.set(0, 0, 0);
      dummy.scale.set(it.scale[0], it.scale[1], it.scale[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
  );
}

// Leaves: per-instance tint + growth scaling + airflow-reactive sway.
function LeafInstances({ items }: { items: LeafXForm[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < items.length; i++) mesh.setColorAt(i, tmpColor.set(items[i].color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const grow = 0.3 + 0.38 * story.growth; // gentle, believable growth (no ballooning)
    const amp = 0.016 + story.agitation * 0.05; // calm, deliberate — only stirs under airflow
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const s = it.baseScale * grow;
      dummy.position.set(it.position[0], it.position[1], it.position[2]);
      // oriented, flattened leaf blades with a gentle airflow sway
      dummy.rotation.set(
        it.tilt + Math.cos(t * 0.7 + it.phaseZ * 10) * amp,
        it.yaw,
        Math.sin(t * 0.9 + it.phaseX * 10) * amp,
      );
      dummy.scale.set(s * 1.75, s * 0.26, s * 0.7); // broad, thin leaf blades (not balls)
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[LEAF_GEO, mat.leafMat, items.length]} />;
}

// Manufactured grow-light fixtures: aluminium end caps + suspension/power
// cables tying each bar to the ceiling. Nothing floats without a connection.
function LightFixtureDetails() {
  const ceilY = ROOM_H + 0.12;
  return (
    <group>
      {RACKS.map((r, i) => {
        const barY = r.lightY - 0.04;
        const half = r.lightWidth / 2;
        // benches run along Z, so end caps + suspension points are along Z
        const ends = [r.z - half + 0.02, r.z + half - 0.02];
        const susp = [r.z - half * 0.6, r.z + half * 0.6];
        return (
          <group key={i}>
            {ends.map((cz, j) => (
              <mesh key={j} position={[r.x, barY, cz]} material={mat.lightFixtureMat} castShadow>
                <boxGeometry args={[0.12, 0.05, 0.06]} />
              </mesh>
            ))}
            {susp.map((cz, j) => (
              <mesh key={`c${j}`} position={[r.x, (barY + 0.02 + ceilY) / 2, cz]} material={mat.cableMat}>
                <cylinderGeometry args={[0.004, 0.004, ceilY - barY - 0.02, 6]} />
              </mesh>
            ))}
            <mesh position={[r.x - 0.04, (barY + ceilY) / 2, ends[0]]} material={mat.cableMat}>
              <cylinderGeometry args={[0.006, 0.006, ceilY - barY, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Back & left facility walls dressed as real insulated metal panels (IMP):
// vertical panel seams, a horizontal joint, top capping rail, corner trim.
function RoomShell() {
  const wallY = ROOM_H / 2 + 0.12;
  const topY = ROOM_H + 0.12;
  const cornerX = -ROOM_W / 2 + WALL_THICK / 2;
  const cornerZ = -ROOM_D / 2 + WALL_THICK / 2;
  const backFace = -ROOM_D / 2 + WALL_THICK + 0.002; // interior face of back wall
  const leftFace = -ROOM_W / 2 + WALL_THICK + 0.002; // interior face of left wall
  const jointY = 0.12 + ROOM_H * 0.62;
  const PANEL = 1.15; // insulated-panel module width
  const backSeams: number[] = [];
  for (let x = -ROOM_W / 2 + PANEL; x < ROOM_W / 2 - 0.05; x += PANEL) backSeams.push(x);
  const leftSeams: number[] = [];
  for (let z = -ROOM_D / 2 + PANEL; z < ROOM_D / 2 - 0.05; z += PANEL) leftSeams.push(z);
  return (
    <group>
      {/* walls beveled (RoundedBox) so corners catch a soft specular glint */}
      <RoundedBox args={[ROOM_W, ROOM_H, WALL_THICK]} radius={0.025} smoothness={2} position={[0, wallY, cornerZ]} material={mat.wallMat} receiveShadow />
      <RoundedBox args={[WALL_THICK, ROOM_H, ROOM_D]} radius={0.025} smoothness={2} position={[cornerX, wallY, 0]} material={mat.wallMat} receiveShadow />

      {/* vertical insulated-panel seams (recessed dark reveals) */}
      {backSeams.map((x, i) => (
        <mesh key={`bs${i}`} position={[x, wallY, backFace]} material={mat.panelSeamMat}>
          <boxGeometry args={[0.012, ROOM_H - 0.06, 0.01]} />
        </mesh>
      ))}
      {leftSeams.map((z, i) => (
        <mesh key={`ls${i}`} position={[leftFace, wallY, z]} material={mat.panelSeamMat}>
          <boxGeometry args={[0.01, ROOM_H - 0.06, 0.012]} />
        </mesh>
      ))}

      {/* top capping rail (matte trim — no specular sparkle) running both walls */}
      <mesh position={[0, topY - 0.025, cornerZ]} material={mat.baseboardMat}>
        <boxGeometry args={[ROOM_W + 0.02, 0.05, WALL_THICK + 0.03]} />
      </mesh>
      <mesh position={[cornerX, topY - 0.025, 0]} material={mat.baseboardMat}>
        <boxGeometry args={[WALL_THICK + 0.03, 0.05, ROOM_D + 0.02]} />
      </mesh>

      {/* vertical corner trim where the two walls meet */}
      <mesh position={[cornerX + 0.01, wallY, cornerZ + 0.01]} material={mat.baseboardMat}>
        <boxGeometry args={[0.05, ROOM_H, 0.05]} />
      </mesh>
      {/* horizontal construction joints (subtle recessed seam) */}
      <mesh position={[0, jointY, backFace]} material={mat.panelSeamMat}>
        <boxGeometry args={[ROOM_W - 0.1, 0.012, 0.008]} />
      </mesh>
      <mesh position={[leftFace, jointY, 0]} material={mat.panelSeamMat}>
        <boxGeometry args={[0.008, 0.012, ROOM_D - 0.1]} />
      </mesh>
      {/* baseboards */}
      <mesh position={[0, 0.12 + 0.04, -ROOM_D / 2 + 0.12]} material={mat.baseboardMat}>
        <boxGeometry args={[ROOM_W - 0.2, 0.08, 0.04]} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + 0.12, 0.12 + 0.04, 0]} material={mat.baseboardMat}>
        <boxGeometry args={[0.04, 0.08, ROOM_D - 0.2]} />
      </mesh>
    </group>
  );
}
