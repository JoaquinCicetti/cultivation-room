import * as THREE from "three";

// ---------------------------------------------------------------------------
// Sparse premium cultivation room — deliberate composition with negative space.
// ---------------------------------------------------------------------------
export const ROOM_W = 7;
export const ROOM_D = 5.5;
export const ROOM_H = 2.5;
export const WALL_THICK = 0.1;
export const TABLE_H = 0.8;
export const TOP_RAIL_Y = TABLE_H + 0.12 - 0.025;

const TRAY_H = 0.05;
const TRAY_WALL_THICK = 0.015;
const SURFACE_Y = TOP_RAIL_Y + 0.015;

// Base unit geometries — one per shape, scaled per-instance (one draw call each).
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const POT_GEO = new THREE.CylinderGeometry(1, 0.78, 1, 10);
export const CYL_GEO = new THREE.CylinderGeometry(1, 1, 1, 10);
export const STEM_GEO = new THREE.CylinderGeometry(0.012, 0.018, 1, 5);
export const FOOT_GEO = new THREE.CylinderGeometry(0.04, 0.045, 0.02, 8);
export const LEAF_GEO = new THREE.SphereGeometry(1, 7, 6);

export type Vec3 = [number, number, number];
export interface XForm {
  position: Vec3;
  scale: Vec3;
}
export interface LeafXForm {
  position: Vec3;
  baseScale: number;
  color: number;
  phaseX: number;
  phaseZ: number;
  yaw: number; // outward aim around Y
  tilt: number; // outward/upward tilt
}

interface RackDef {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  axis: "x" | "z";
  plantCount: number;
  lightWidth: number;
  lightY: number;
}

// Three racks, widely spaced. rackA (front-center) carries the hero plant.
export const RACKS: RackDef[] = [
  { name: "rackA", x: 0.4, z: 0.9, w: 2.2, d: 0.8, axis: "x", plantCount: 4, lightWidth: 1.9, lightY: 1.95 },
  { name: "rackB", x: -0.6, z: -1.7, w: 2.8, d: 0.85, axis: "x", plantCount: 5, lightWidth: 2.5, lightY: 2.0 },
  { name: "rackC", x: -2.7, z: -0.1, w: 0.8, d: 1.7, axis: "z", plantCount: 4, lightWidth: 0.6, lightY: 1.9 },
];

export interface GrowLightDef {
  x: number;
  y: number;
  z: number;
  width: number;
}
export const GROW_LIGHTS: GrowLightDef[] = RACKS.map((r) => ({
  x: r.x,
  y: r.lightY,
  z: r.z,
  width: r.lightWidth,
}));

const LEAF_TINTS = [0x6f9c3e, 0x567f2c, 0x9cc24f];

export interface InstanceData {
  rackBars: XForm[]; // rackMat boxes: legs, top rails, light arms
  trayParts: XForm[]; // trayMaterial boxes: tray bottom + walls
  lightBars: XForm[];
  lightGlows: XForm[];
  feet: XForm[];
  tubes: XForm[]; // irrigation tubing + cable conduit (tubingMat boxes)
  pots: XForm[];
  soil: XForm[];
  stems: XForm[];
  leaves: LeafXForm[];
}

const ones: Vec3 = [1, 1, 1];

export function buildInstanceData(): InstanceData {
  const data: InstanceData = {
    rackBars: [],
    trayParts: [],
    lightBars: [],
    lightGlows: [],
    feet: [],
    tubes: [],
    pots: [],
    soil: [],
    stems: [],
    leaves: [],
  };

  for (const rack of RACKS) {
    const { x, z, w, d } = rack;
    const legXs = [-w / 2 + 0.04, w / 2 - 0.04];
    const legZs = [-d / 2 + 0.04, d / 2 - 0.04];

    // legs + feet
    for (const lx of legXs) {
      for (const lz of legZs) {
        data.rackBars.push({ position: [x + lx, TABLE_H / 2 + 0.12, z + lz], scale: [0.05, TABLE_H, 0.05] });
        data.feet.push({ position: [x + lx, 0.12 + 0.01, z + lz], scale: ones });
      }
    }
    // top rails (2)
    for (const zPos of legZs) {
      data.rackBars.push({ position: [x, TOP_RAIL_Y, z + zPos], scale: [w - 0.08, 0.035, 0.035] });
    }
    // tray bottom + 4 walls
    data.trayParts.push({ position: [x, TOP_RAIL_Y + 0.008, z], scale: [w - 0.06, 0.014, d - 0.06] });
    for (const zw of [-d / 2 + 0.03 + TRAY_WALL_THICK / 2, d / 2 - 0.03 - TRAY_WALL_THICK / 2]) {
      data.trayParts.push({ position: [x, TOP_RAIL_Y + TRAY_H / 2, z + zw], scale: [w - 0.06, TRAY_H, TRAY_WALL_THICK] });
    }
    for (const xw of [-w / 2 + 0.03 + TRAY_WALL_THICK / 2, w / 2 - 0.03 - TRAY_WALL_THICK / 2]) {
      data.trayParts.push({ position: [x + xw, TOP_RAIL_Y + TRAY_H / 2, z], scale: [TRAY_WALL_THICK, TRAY_H, d - 0.06] });
    }
    // overhead light bar + glow strip + 2 arms
    const barY = rack.lightY - 0.04;
    data.lightBars.push({ position: [x, barY, z], scale: [rack.lightWidth, 0.03, 0.08] });
    data.lightGlows.push({ position: [x, barY - 0.025, z], scale: [rack.lightWidth - 0.06, 0.008, 0.05] });
    for (const ax of [-rack.lightWidth / 2 + 0.05, rack.lightWidth / 2 - 0.05]) {
      data.rackBars.push({ position: [x + ax, (barY + TOP_RAIL_Y) / 2, z], scale: [0.022, barY - TOP_RAIL_Y, 0.022] });
    }

    // irrigation supply tube along the back of the tray + a cable conduit on a leg
    const backZ = z - d / 2 + 0.06;
    const tubeY = TOP_RAIL_Y + TRAY_H + 0.02;
    data.tubes.push({ position: [x, tubeY, backZ], scale: [w - 0.12, 0.02, 0.02] });
    data.tubes.push({
      position: [x - w / 2 + 0.04, TABLE_H / 2 + 0.12, z - d / 2 + 0.01],
      scale: [0.02, TABLE_H, 0.02],
    });

    // plants (single row, generously spaced; fuller, structured canopies)
    for (let p = 0; p < rack.plantCount; p++) {
      const potR = 0.06 + Math.random() * 0.02;
      const potH = 0.085 + Math.random() * 0.03;
      const plantSize = 0.115 + Math.random() * 0.05;

      let posX: number;
      let posZ: number;
      if (rack.axis === "x") {
        const spread = w - 0.5;
        posX = x + (-spread / 2 + p * (spread / Math.max(rack.plantCount - 1, 1)));
        posZ = z;
      } else {
        const spread = d - 0.5;
        posX = x;
        posZ = z + (-spread / 2 + p * (spread / Math.max(rack.plantCount - 1, 1)));
      }
      const baseY = SURFACE_Y + potH;

      data.pots.push({ position: [posX, SURFACE_Y + potH / 2, posZ], scale: [potR, potH, potR] });
      data.soil.push({ position: [posX, SURFACE_Y + potH - 0.02, posZ], scale: [potR * 0.9, 0.02, potR * 0.9] });
      data.stems.push({ position: [posX, baseY + plantSize * 0.45, posZ], scale: [1, plantSize * 0.95, 1] });

      // drip emitter / stake at the pot, fed from the supply tube
      data.tubes.push({ position: [posX, (tubeY + baseY) / 2, backZ], scale: [0.011, tubeY - baseY, 0.011] });
      data.tubes.push({ position: [posX + potR * 0.5, baseY + 0.05, posZ], scale: [0.009, 0.12, 0.009] });

      // dense leafy canopy: phyllotaxis spiral, wider/fuller at the base
      const tint = LEAF_TINTS[p % 3];
      const tintAlt = LEAF_TINTS[(p + 1) % 3];
      const leafCount = 28 + Math.floor(Math.random() * 14);
      for (let i = 0; i < leafCount; i++) {
        const tier = i / leafCount;
        const ang = i * 2.399963; // golden angle
        const radius = plantSize * (0.7 - tier * 0.4) * (0.7 + Math.random() * 0.5);
        const lx = Math.cos(ang) * radius;
        const lz = Math.sin(ang) * radius;
        const ly = plantSize * (0.14 + tier * 0.9) + Math.random() * plantSize * 0.12;
        const size = plantSize * (0.42 + (1 - tier) * 0.36) * (0.72 + Math.random() * 0.4);
        data.leaves.push({
          position: [posX + lx, baseY + ly, posZ + lz],
          baseScale: size,
          color: Math.random() < 0.3 ? tintAlt : tint,
          phaseX: lx,
          phaseZ: lz,
          yaw: ang,
          tilt: 0.35 + tier * 0.75,
        });
      }
    }
  }

  return data;
}

// Physical anchor points for prop placement.
export const AC_POS: Vec3 = [2.15, 2.0, -ROOM_D / 2 + 0.22];
export const TANK_POS: Vec3 = [-2.8, 0.12, -2.0];
export const CONTROLLER_POS: Vec3 = [0.0, 1.55, -ROOM_D / 2 + 0.14];
export const VAPORIZER_POS: Vec3 = [1.5, 0.12, 1.55];
