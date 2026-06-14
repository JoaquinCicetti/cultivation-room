import * as THREE from "three";

// Bright, clean palette — the room is a floating isometric illustration on a
// light page, so materials read crisp and luminous (not a dark interior).

// --- architecture (dark room so the white AC + lit plants pop) ------------
export const floorMat = new THREE.MeshStandardMaterial({ color: 0x1c221b, roughness: 0.88 });
export const wallMat = new THREE.MeshStandardMaterial({ color: 0x141a12, roughness: 0.96 });
export const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0f140d, roughness: 0.85 });
export const platformMat = new THREE.MeshStandardMaterial({ color: 0x10150e, roughness: 0.92 });

// --- racks / structure ----------------------------------------------------
export const rackMat = new THREE.MeshStandardMaterial({ color: 0x474e3f, roughness: 0.42, metalness: 0.5 });
export const trayMaterial = new THREE.MeshStandardMaterial({ color: 0x363c30, roughness: 0.55, metalness: 0.35 });
export const footMat = new THREE.MeshStandardMaterial({ color: 0x2a2f24, roughness: 0.6 });

// --- grow lighting (warm lime) -------------------------------------------
export const lightFixtureMat = new THREE.MeshStandardMaterial({ color: 0x2a2f28, roughness: 0.4, metalness: 0.6 });
export const lightGlowMat = new THREE.MeshStandardMaterial({
  color: 0xc8e06a,
  emissive: 0xc8e06a,
  emissiveIntensity: 2.2,
  roughness: 0.3,
});
export const cableMat = new THREE.MeshStandardMaterial({ color: 0x1c201a, roughness: 0.7 });

// --- plants (vibrant) ------------------------------------------------------
export const potMat = new THREE.MeshStandardMaterial({ color: 0xc2774f, roughness: 0.8 });
export const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: 0.98 });
export const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
export const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7a2e, roughness: 0.75 });
export const LEAF_COLORS = [0x7bbf3f, 0x5a9e2e, 0x9ed85a] as const;

// --- props: tank / pipes / AC / sensors -----------------------------------
export const tankMat = new THREE.MeshStandardMaterial({ color: 0xbcc3b2, roughness: 0.4, metalness: 0.4 });
export const tankCapMat = new THREE.MeshStandardMaterial({ color: 0x8b9280, roughness: 0.4, metalness: 0.5 });
export const pipeMat = new THREE.MeshStandardMaterial({ color: 0x9aa18f, roughness: 0.5, metalness: 0.3 });

export const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xf6f8f1, roughness: 0.4, metalness: 0.1 });
export const acVentMat = new THREE.MeshStandardMaterial({ color: 0xb9c0ad, roughness: 0.5, metalness: 0.2 });
export const acAccentMat = new THREE.MeshStandardMaterial({
  color: 0xc8e06a,
  emissive: 0xc8e06a,
  emissiveIntensity: 1.6,
  roughness: 0.3,
});

export const sensorMat = new THREE.MeshStandardMaterial({ color: 0x33382f, roughness: 0.5, metalness: 0.3 });
export const sensorLedMat = new THREE.MeshStandardMaterial({
  color: 0xc8e06a,
  emissive: 0xc8e06a,
  emissiveIntensity: 2,
  roughness: 0.2,
});

// --- controller -----------------------------------------------------------
export const panelMat = new THREE.MeshStandardMaterial({ color: 0x2a2f28, roughness: 0.4, metalness: 0.4 });
export const panelDarkMat = new THREE.MeshStandardMaterial({ color: 0x14180f, roughness: 0.4, metalness: 0.5 });
export const screenMat = new THREE.MeshStandardMaterial({
  color: 0x0a120a,
  emissive: 0x2c3c16,
  emissiveIntensity: 1.0,
  roughness: 0.25,
});
export const ledGreenMat = new THREE.MeshStandardMaterial({
  color: 0xc8e06a,
  emissive: 0xc8e06a,
  emissiveIntensity: 2,
  roughness: 0.2,
});
export const buttonMat = new THREE.MeshStandardMaterial({ color: 0x3a4036, roughness: 0.45, metalness: 0.4 });
