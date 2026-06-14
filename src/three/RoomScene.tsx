import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import * as mat from "./materials";
import {
  buildInstanceData,
  CYL_GEO,
  FOOT_GEO,
  LEAF_GEO,
  POT_GEO,
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
import { AirConditioner, Controller, IrrigationTank, Sensors } from "./props";

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

// The floating isometric diorama. Named "room" so the director can gently
// rotate/scale it. Geometry only — lights live in StoryDirector.
export function RoomScene() {
  const data = useMemo(() => buildInstanceData(), []);

  return (
    <group name="room">
      <RoomShell />

      <StaticInstances geometry={UNIT_BOX} material={mat.rackMat} items={data.rackBars} castShadow />
      <StaticInstances geometry={UNIT_BOX} material={mat.trayMaterial} items={data.trayParts} castShadow receiveShadow />
      <StaticInstances geometry={UNIT_BOX} material={mat.lightFixtureMat} items={data.lightBars} />
      <StaticInstances geometry={UNIT_BOX} material={mat.lightGlowMat} items={data.lightGlows} />
      <StaticInstances geometry={FOOT_GEO} material={mat.footMat} items={data.feet} />
      <StaticInstances geometry={POT_GEO} material={mat.potMat} items={data.pots} castShadow />
      <StaticInstances geometry={CYL_GEO} material={mat.soilMat} items={data.soil} />
      <StaticInstances geometry={STEM_GEO} material={mat.stemMat} items={data.stems} />
      <LeafInstances items={data.leaves} />

      <Controller />
      <AirConditioner />
      <IrrigationTank />
      <Sensors />
    </group>
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
      dummy.rotation.set(0, 0, 0);
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
    const grow = 0.1 + 1.2 * story.growth; // wider range -> plants grow more
    const amp = 0.035 + story.agitation * 0.09;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const s = it.baseScale * grow;
      dummy.position.set(it.position[0], it.position[1], it.position[2]);
      dummy.rotation.set(
        Math.cos(t * 0.7 + it.phaseZ * 10) * amp,
        0,
        Math.sin(t * 0.9 + it.phaseX * 10) * amp,
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[LEAF_GEO, mat.leafMat, items.length]} />;
}

// Light platform + low back & left walls (open-top miniature).
function RoomShell() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} material={mat.floorMat} castShadow receiveShadow>
        <boxGeometry args={[ROOM_W, 0.12, ROOM_D]} />
      </mesh>
      {/* platform base lip so the diorama reads as a floating object */}
      <mesh position={[0, -0.02, 0]} material={mat.platformMat}>
        <boxGeometry args={[ROOM_W + 0.3, 0.06, ROOM_D + 0.3]} />
      </mesh>
      <mesh position={[0, ROOM_H / 2 + 0.12, -ROOM_D / 2 + WALL_THICK / 2]} material={mat.wallMat} receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H, WALL_THICK]} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + WALL_THICK / 2, ROOM_H / 2 + 0.12, 0]} material={mat.wallMat} receiveShadow>
        <boxGeometry args={[WALL_THICK, ROOM_H, ROOM_D]} />
      </mesh>
      <mesh position={[0, 0.12 + 0.04, -ROOM_D / 2 + 0.12]} material={mat.baseboardMat}>
        <boxGeometry args={[ROOM_W - 0.2, 0.08, 0.04]} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + 0.12, 0.12 + 0.04, 0]} material={mat.baseboardMat}>
        <boxGeometry args={[0.04, 0.08, ROOM_D - 0.2]} />
      </mesh>
    </group>
  );
}
