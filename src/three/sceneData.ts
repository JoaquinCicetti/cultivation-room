import * as THREE from "three";

// ---------------------------------------------------------------------------
// Commercial cultivation room — strict parallel rack grid (rolling benches),
// rows running along the room depth axis. Engineered, uniform, no randomness.
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
export const POT_GEO = new THREE.CylinderGeometry(1, 0.82, 1, 8); // square-ish nursery pot
export const CYL_GEO = new THREE.CylinderGeometry(1, 1, 1, 10);
export const STEM_GEO = new THREE.CylinderGeometry(0.012, 0.018, 1, 5);
export const FOOT_GEO = new THREE.CylinderGeometry(0.04, 0.045, 0.02, 8);
export const LEAF_GEO = new THREE.SphereGeometry(1, 7, 6);

export type Vec3 = [number, number, number];
export interface XForm {
  position: Vec3;
  scale: Vec3;
  rot?: Vec3; // optional per-instance euler (organic variation)
}
export interface LeafXForm {
  position: Vec3;
  baseScale: number;
  color: number;
  phaseX: number;
  phaseZ: number;
  yaw: number;
  tilt: number;
}

interface RackDef {
  name: string;
  x: number;
  z: number;
  w: number; // extent along X
  d: number; // extent along Z
  axis: "x" | "z"; // long axis
  plantCount: number; // crops along the long axis
  lightWidth: number; // LED bar length along the long axis
  lightY: number;
}

// Three identical benches in a strict parallel array, running along Z (depth),
// evenly spaced across X with clean service aisles between them. The back strip
// (toward the back wall) stays clear for the door / controller / reservoir.
const RACK_XS = [-2.05, -0.35, 1.35];
export const RACKS: RackDef[] = RACK_XS.map((x, i) => ({
  name: `rack${i + 1}`,
  x,
  z: 0.2,
  w: 0.74,
  d: 4.0,
  axis: "z",
  plantCount: 6,
  lightWidth: 3.7,
  lightY: 1.98,
}));

export interface GrowLightDef {
  x: number;
  y: number;
  z: number;
}
// Each bench is lit by a row of LED segments — discrete downward cones, not one
// flood. Three segments per bench keep the cone coverage even along its length.
const SEG_OFFSETS = [-1.25, 0, 1.25];
export const GROW_LIGHTS: GrowLightDef[] = RACKS.flatMap((r) =>
  SEG_OFFSETS.map((o) => ({ x: r.x, y: r.lightY, z: r.z + o })),
);

// natural, slightly desaturated foliage greens (deep core → fresh tips)
const LEAF_TINTS = [0x47702c, 0x375a22, 0x5f8a36, 0x789f44];

export interface InstanceData {
  rackBars: XForm[];
  trayParts: XForm[];
  channels: XForm[]; // integrated drainage channels under each tray
  lightBars: XForm[];
  lightGlows: XForm[];
  feet: XForm[];
  tubes: XForm[];
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
    channels: [],
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
    const isZ = rack.axis === "z";
    const legXs = [-w / 2 + 0.05, w / 2 - 0.05];
    const legZs = [-d / 2 + 0.05, d / 2 - 0.05];

    // legs + levelling feet at the four corners
    for (const lx of legXs) {
      for (const lz of legZs) {
        data.rackBars.push({ position: [x + lx, TABLE_H / 2 + 0.12, z + lz], scale: [0.055, TABLE_H, 0.055] });
        data.feet.push({ position: [x + lx, 0.12 + 0.01, z + lz], scale: ones });
      }
    }

    // long support rails (top + lower stretcher) running along the bench axis
    const railLen = isZ ? d - 0.1 : w - 0.1;
    const lowY = 0.12 + 0.22;
    const sideOffs = isZ ? legXs : legZs;
    for (const off of sideOffs) {
      const topPos: Vec3 = isZ ? [x + off, TOP_RAIL_Y, z] : [x, TOP_RAIL_Y, z + off];
      const lowPos: Vec3 = isZ ? [x + off, lowY, z] : [x, lowY, z + off];
      const railScale: Vec3 = isZ ? [0.04, 0.04, railLen] : [railLen, 0.04, 0.04];
      const lowScale: Vec3 = isZ ? [0.03, 0.03, railLen] : [railLen, 0.03, 0.03];
      data.rackBars.push({ position: topPos, scale: railScale });
      data.rackBars.push({ position: lowPos, scale: lowScale });
    }
    // end cross-braces tying the two side frames together
    for (const endo of isZ ? legZs : legXs) {
      const braceScale: Vec3 = isZ ? [w - 0.1, 0.03, 0.03] : [0.03, 0.03, d - 0.1];
      const bracePos: Vec3 = isZ ? [x, lowY, z + endo] : [x + endo, lowY, z];
      data.rackBars.push({ position: bracePos, scale: braceScale });
    }

    // stainless plant tray (bottom + 4 low walls)
    data.trayParts.push({ position: [x, TOP_RAIL_Y + 0.008, z], scale: [w - 0.06, 0.014, d - 0.06] });
    for (const zw of [-d / 2 + 0.03 + TRAY_WALL_THICK / 2, d / 2 - 0.03 - TRAY_WALL_THICK / 2]) {
      data.trayParts.push({ position: [x, TOP_RAIL_Y + TRAY_H / 2, z + zw], scale: [w - 0.06, TRAY_H, TRAY_WALL_THICK] });
    }
    for (const xw of [-w / 2 + 0.03 + TRAY_WALL_THICK / 2, w / 2 - 0.03 - TRAY_WALL_THICK / 2]) {
      data.trayParts.push({ position: [x + xw, TOP_RAIL_Y + TRAY_H / 2, z], scale: [TRAY_WALL_THICK, TRAY_H, d - 0.06] });
    }
    // integrated drainage channel running the full length, centred under the tray
    const chY = TOP_RAIL_Y - 0.03;
    data.channels.push({
      position: [x, chY, z],
      scale: isZ ? [0.14, 0.05, d - 0.1] : [w - 0.1, 0.05, 0.14],
    });

    // suspended linear LED bar + emissive strip + two drop arms
    const barY = rack.lightY - 0.04;
    const barScale: Vec3 = isZ ? [0.09, 0.04, rack.lightWidth] : [rack.lightWidth, 0.04, 0.09];
    const glowScale: Vec3 = isZ ? [0.05, 0.01, rack.lightWidth - 0.08] : [rack.lightWidth - 0.08, 0.01, 0.05];
    data.lightBars.push({ position: [x, barY, z], scale: barScale });
    data.lightGlows.push({ position: [x, barY - 0.03, z], scale: glowScale });
    for (const ao of [-rack.lightWidth / 2 + 0.05, rack.lightWidth / 2 - 0.05]) {
      const armPos: Vec3 = isZ ? [x, (barY + TOP_RAIL_Y) / 2, z + ao] : [x + ao, (barY + TOP_RAIL_Y) / 2, z];
      data.rackBars.push({ position: armPos, scale: [0.022, barY - TOP_RAIL_Y, 0.022] });
    }

    // irrigation supply line along one side of the bench
    const tubeY = TOP_RAIL_Y + TRAY_H + 0.02;
    const supplyPos: Vec3 = isZ ? [x - w / 2 + 0.05, tubeY, z] : [x, tubeY, z - d / 2 + 0.05];
    const supplyScale: Vec3 = isZ ? [0.02, 0.02, d - 0.14] : [w - 0.14, 0.02, 0.02];
    data.tubes.push({ position: supplyPos, scale: supplyScale });

    // ---- crops: strict uniform grid (rows × cols) embedded in the tray ----
    const along = isZ ? d : w;
    const across = isZ ? w : d;
    const cols = rack.plantCount;
    const rows = across > 0.7 ? 2 : 1;
    const spreadAlong = along - 0.45;
    const spreadAcross = Math.min(across - 0.34, 0.46);
    for (let ci = 0; ci < cols; ci++) {
      for (let ri = 0; ri < rows; ri++) {
        const potR = 0.066;
        const potH = 0.1;
        const plantSize = 0.125 + (ci % 2) * 0.012; // near-uniform, faint alternation
        const cellIdx = ci * rows + ri;

        const alongPos = -spreadAlong / 2 + ci * (spreadAlong / Math.max(cols - 1, 1));
        const acrossPos = rows > 1 ? -spreadAcross / 2 + ri * (spreadAcross / (rows - 1)) : 0;
        const posX = x + (isZ ? acrossPos : alongPos);
        const posZ = z + (isZ ? alongPos : acrossPos);
        const baseY = SURFACE_Y + potH;

        data.pots.push({ position: [posX, SURFACE_Y + potH / 2, posZ], scale: [potR, potH, potR] });
        data.soil.push({ position: [posX, SURFACE_Y + potH - 0.02, posZ], scale: [potR * 0.86, 0.02, potR * 0.86] });
        data.stems.push({ position: [posX, baseY + plantSize * 0.45, posZ], scale: [1, plantSize * 0.95, 1] });

        // short drip stake at each pot
        data.tubes.push({ position: [posX + potR * 0.5, baseY + 0.05, posZ], scale: [0.008, 0.12, 0.008] });

        // dense leafy canopy: phyllotaxis spiral, deep-green core → fresh tips
        const tintDeep = LEAF_TINTS[cellIdx % 2];
        const tintMid = LEAF_TINTS[2];
        const tintTip = LEAF_TINTS[3];
        const leafCount = 46;
        for (let i = 0; i < leafCount; i++) {
          const tier = i / leafCount;
          const ang = i * 2.399963; // golden angle
          const radius = plantSize * (0.82 - tier * 0.5) * (0.78 + ((i * 13) % 7) / 18);
          const lx = Math.cos(ang) * radius;
          const lz = Math.sin(ang) * radius;
          const ly = plantSize * (0.1 + tier * 0.92) + ((i * 7) % 5) / 60;
          const size = plantSize * (0.46 + (1 - tier) * 0.34) * (0.78 + ((i * 5) % 6) / 18);
          const col = tier < 0.4 ? tintDeep : tier < 0.78 ? tintMid : tintTip;
          const droop = tier < 0.45 ? -0.2 - (0.45 - tier) * 0.7 : 0.3 + tier * 0.85;
          data.leaves.push({
            position: [posX + lx, baseY + ly, posZ + lz],
            baseScale: size,
            color: i % 6 === 0 ? tintMid : col,
            phaseX: lx,
            phaseZ: lz,
            yaw: ang,
            tilt: droop,
          });
        }
      }
    }
  }

  return data;
}

// Physical anchor points for prop placement (back wall = -Z, left wall = -X).
export const AC_POS: Vec3 = [2.2, 2.0, -ROOM_D / 2 + 0.22];
export const TANK_POS: Vec3 = [-3.0, 0.12, -2.15];
export const CONTROLLER_POS: Vec3 = [-1.45, 1.5, -ROOM_D / 2 + 0.14];
export const VAPORIZER_POS: Vec3 = [2.6, 0.12, 1.5];
