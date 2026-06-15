import * as THREE from "three";

// Clean architectural / CEA-facility materials — aluminium, stainless steel,
// epoxy surfaces. Engineered and precise, not stylised/fantasy.

// --- facility surfaces ----------------------------------------------------
export const floorMat = new THREE.MeshStandardMaterial({ color: 0x9a9e96, roughness: 0.5, metalness: 0.05 });
export const wallMat = new THREE.MeshStandardMaterial({ color: 0xb6b9b1, roughness: 0.9 });
export const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x8c908a, roughness: 0.7 });
export const platformMat = new THREE.MeshStandardMaterial({ color: 0x82867c, roughness: 0.6, metalness: 0.1 });
// darker surrounding facility floor — the cultivation zone reads brighter on it
export const concreteMat = new THREE.MeshStandardMaterial({ color: 0x26282a, roughness: 0.5, metalness: 0.06 });
// dedicated cultivation-zone floor: dark polished epoxy resin (reads as "the grow zone")
export const epoxyMat = new THREE.MeshStandardMaterial({ color: 0x2b332e, roughness: 0.3, metalness: 0.14 });
// thin painted safety-line trim framing the cultivation zone
export const zoneTrimMat = new THREE.MeshStandardMaterial({ color: 0x8f9a92, roughness: 0.45, metalness: 0.2 });
// conduit / cable-tray / control-box metals
export const conduitMat = new THREE.MeshStandardMaterial({ color: 0x3c4043, roughness: 0.5, metalness: 0.35 });
export const trayMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.4, metalness: 0.5 });
export const boxMat = new THREE.MeshStandardMaterial({ color: 0xd9dcd6, roughness: 0.45, metalness: 0.15 });
export const boxDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a3e3b, roughness: 0.5, metalness: 0.2 });

// --- racks / structure (aluminium + stainless) ----------------------------
// (metalness kept moderate so brushed metal reads light without an env map)
export const rackMat = new THREE.MeshStandardMaterial({ color: 0xb4babe, roughness: 0.46, metalness: 0.35 });
export const trayMaterial = new THREE.MeshStandardMaterial({ color: 0xa6acb0, roughness: 0.44, metalness: 0.4 });
export const footMat = new THREE.MeshStandardMaterial({ color: 0x4a4e50, roughness: 0.6, metalness: 0.3 });
export const steelMat = new THREE.MeshStandardMaterial({ color: 0xc0c6ca, roughness: 0.38, metalness: 0.45 });
export const tubingMat = new THREE.MeshStandardMaterial({ color: 0x3a3e41, roughness: 0.5, metalness: 0.2 });

// --- grow lighting (purple horticultural full-spectrum) -------------------
export const lightFixtureMat = new THREE.MeshStandardMaterial({ color: 0xc6cac6, roughness: 0.35, metalness: 0.6 });
export const lightGlowMat = new THREE.MeshStandardMaterial({
  color: 0xf0d9ee,
  emissive: 0xcf6fd6,
  emissiveIntensity: 1.7,
  roughness: 0.3,
});
export const cableMat = new THREE.MeshStandardMaterial({ color: 0x2a2e2c, roughness: 0.7 });

// --- plants ----------------------------------------------------------------
export const potMat = new THREE.MeshStandardMaterial({ color: 0x44483f, roughness: 0.7 });
export const soilMat = new THREE.MeshStandardMaterial({ color: 0xe6e4d8, roughness: 0.9 });
export const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
export const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7a2e, roughness: 0.75 });
export const LEAF_COLORS = [0x6fae3a, 0x568f2c, 0x86c247] as const;

// --- props: tank / pipes / AC / sensors -----------------------------------
export const tankMat = new THREE.MeshStandardMaterial({ color: 0xbcc2c6, roughness: 0.42, metalness: 0.4 });
export const tankCapMat = new THREE.MeshStandardMaterial({ color: 0x9298a0, roughness: 0.42, metalness: 0.45 });
export const pipeMat = new THREE.MeshStandardMaterial({ color: 0xacb2b6, roughness: 0.45, metalness: 0.35 });

export const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f4ee, roughness: 0.4, metalness: 0.1 });
export const acVentMat = new THREE.MeshStandardMaterial({ color: 0xb0b6b2, roughness: 0.5, metalness: 0.2 });
export const acAccentMat = new THREE.MeshStandardMaterial({
  color: 0x86c247,
  emissive: 0x5a9e2e,
  emissiveIntensity: 0.8,
  roughness: 0.4,
});

export const vaporizerMat = new THREE.MeshStandardMaterial({ color: 0xdfe2da, roughness: 0.4, metalness: 0.2 });
export const vaporizerCapMat = new THREE.MeshStandardMaterial({ color: 0xb6bcb2, roughness: 0.4, metalness: 0.4 });

export const sensorMat = new THREE.MeshStandardMaterial({ color: 0xc0c4bc, roughness: 0.4, metalness: 0.3 });
export const sensorLedMat = new THREE.MeshStandardMaterial({
  color: 0x7bd44a,
  emissive: 0x5fbf30,
  emissiveIntensity: 1.4,
  roughness: 0.3,
});

// --- controller -----------------------------------------------------------
export const panelMat = new THREE.MeshStandardMaterial({ color: 0x2c302a, roughness: 0.4, metalness: 0.5 });
export const panelDarkMat = new THREE.MeshStandardMaterial({ color: 0x14180f, roughness: 0.4, metalness: 0.5 });
export const screenMat = new THREE.MeshStandardMaterial({
  color: 0x0c1410,
  emissive: 0x1e3a2a,
  emissiveIntensity: 0.9,
  roughness: 0.2,
});
export const ledGreenMat = new THREE.MeshStandardMaterial({
  color: 0x7bd44a,
  emissive: 0x5fbf30,
  emissiveIntensity: 1.4,
  roughness: 0.3,
});
export const buttonMat = new THREE.MeshStandardMaterial({ color: 0x3a4036, roughness: 0.45, metalness: 0.4 });
