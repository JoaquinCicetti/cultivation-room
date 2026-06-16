import * as THREE from "three";

import { brushedRoughness, wallTextures } from "./textures";

// Premium architectural / CEA-facility materials — brushed stainless, anodised
// aluminium, painted panels, polished epoxy. PBR throughout: every surface
// reacts to the environment (scene.environment IBL) via envMapIntensity, so
// metals catch real edge reflections instead of reading flat. Engineered and
// precise — no pure white, no pure black.

const brushed = () => {
  const t = brushedRoughness();
  return t;
};

// --- facility surfaces ----------------------------------------------------
export const floorMat = new THREE.MeshStandardMaterial({ color: 0x303338, roughness: 0.42, metalness: 0.55, envMapIntensity: 0.9 });

const wallTex = wallTextures();
wallTex.map.repeat.set(3, 1.4);
wallTex.roughnessMap.repeat.set(3, 1.4);
export const wallMat = new THREE.MeshStandardMaterial({
  color: 0xbdb8af, // neutral, slightly warm cleanroom concrete
  map: wallTex.map,
  roughnessMap: wallTex.roughnessMap,
  roughness: 0.65,
  metalness: 0.15,
  envMapIntensity: 0.4,
});
// Soft vertical falloff baked into the walls: full albedo near the floor →
// noticeably darker toward the top, so the upper walls + corners recede into
// shadow instead of reading as one flat gray. Independent of the light rig.
wallMat.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vWallY;")
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvWallY = (modelMatrix * vec4(transformed, 1.0)).y;",
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vWallY;")
    .replace(
      "#include <map_fragment>",
      "#include <map_fragment>\ndiffuseColor.rgb *= mix(1.0, 0.4, smoothstep(0.5, 2.5, vWallY));",
    );
};
export const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x6f736d, roughness: 0.55, metalness: 0.25, envMapIntensity: 0.5 });
// recessed dark reveal between insulated wall panels (IMP seams)
export const panelSeamMat = new THREE.MeshStandardMaterial({ color: 0x53574f, roughness: 0.7, metalness: 0.15, envMapIntensity: 0.3 });
export const platformMat = new THREE.MeshStandardMaterial({ color: 0x82867c, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.4 });
// dark surrounding facility void floor
export const concreteMat = new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.5 });
// architectural plinth the diorama sits on (dark honed stone) + brushed reveal
export const plinthMat = new THREE.MeshStandardMaterial({ color: 0x202327, roughness: 0.55, metalness: 0.25, envMapIntensity: 0.6 });
export const plinthTopMat = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.7 });
export const plinthRevealMat = new THREE.MeshStandardMaterial({ color: 0x9fa6aa, roughness: 0.34, metalness: 0.95, roughnessMap: brushed(), envMapIntensity: 1.2 });
// dedicated cultivation-zone floor: dark polished epoxy resin
export const epoxyMat = new THREE.MeshStandardMaterial({ color: 0x222a26, roughness: 0.22, metalness: 0.2, envMapIntensity: 1.0 });
// thin painted safety-line trim framing the cultivation zone
export const zoneTrimMat = new THREE.MeshStandardMaterial({ color: 0x97a29a, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.6 });
// conduit / cable-tray / control-box metals
export const conduitMat = new THREE.MeshStandardMaterial({ color: 0x34383b, roughness: 0.45, metalness: 0.7, envMapIntensity: 0.9 });
export const trayMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.38, metalness: 0.9, envMapIntensity: 1.0 });
export const boxMat = new THREE.MeshStandardMaterial({ color: 0xd2d5cf, roughness: 0.42, metalness: 0.25, envMapIntensity: 0.7 });
export const boxDarkMat = new THREE.MeshStandardMaterial({ color: 0x2c302d, roughness: 0.45, metalness: 0.4, envMapIntensity: 0.7 });

// --- racks / structure (brushed stainless + anodised aluminium) -----------
export const rackMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc3, roughness: 0.25, metalness: 0.8, envMapIntensity: 1.1 });
export const trayMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb4b8, roughness: 0.25, metalness: 0.82, envMapIntensity: 1.15 });
export const footMat = new THREE.MeshStandardMaterial({ color: 0x3a3e40, roughness: 0.4, metalness: 0.6, envMapIntensity: 0.8 });
export const steelMat = new THREE.MeshStandardMaterial({ color: 0xc2c8cc, roughness: 0.25, metalness: 0.82, roughnessMap: brushed(), envMapIntensity: 1.2 });
export const tubingMat = new THREE.MeshStandardMaterial({ color: 0x33373a, roughness: 0.45, metalness: 0.4, envMapIntensity: 0.7 });

// --- grow lighting (purple horticultural full-spectrum) -------------------
export const lightFixtureMat = new THREE.MeshStandardMaterial({ color: 0xcfd3cf, roughness: 0.25, metalness: 0.8, roughnessMap: brushed(), envMapIntensity: 1.2 });
export const lightGlowMat = new THREE.MeshStandardMaterial({
  color: 0xf0d9ee,
  emissive: 0xcf6fd6,
  emissiveIntensity: 1.7,
  roughness: 0.3,
});
export const cableMat = new THREE.MeshStandardMaterial({ color: 0x202423, roughness: 0.7, metalness: 0.1, envMapIntensity: 0.4 });

// --- plants ----------------------------------------------------------------
export const potMat = new THREE.MeshStandardMaterial({ color: 0x2f322c, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.18 });
export const soilMat = new THREE.MeshStandardMaterial({ color: 0x231f19, roughness: 0.98, metalness: 0.0, envMapIntensity: 0.1 });
// matte foliage — instanceColor tints per-leaf; kept rough + non-reflective so
// it reads as a real leaf, not a plastic game prop
export const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.0, envMapIntensity: 0.16 });
export const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6428, roughness: 0.82, metalness: 0.0, envMapIntensity: 0.18 });
export const LEAF_COLORS = [0x4e7a32, 0x3c5f26, 0x6f9c3e] as const;

// --- props: tank / pipes / AC / sensors -----------------------------------
export const tankMat = new THREE.MeshStandardMaterial({ color: 0xbcc2c6, roughness: 0.26, metalness: 0.82, roughnessMap: brushed(), envMapIntensity: 1.15 });
export const tankCapMat = new THREE.MeshStandardMaterial({ color: 0x8d939b, roughness: 0.28, metalness: 0.82, envMapIntensity: 1.1 });
export const pipeMat = new THREE.MeshStandardMaterial({ color: 0xacb2b6, roughness: 0.26, metalness: 0.82, envMapIntensity: 1.15 });
export const valveMat = new THREE.MeshStandardMaterial({ color: 0xc7a14e, roughness: 0.4, metalness: 0.9, envMapIntensity: 1.1 });
export const labelMat = new THREE.MeshStandardMaterial({ color: 0xeef0ea, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.4 });

export const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xeef0ea, roughness: 0.45, metalness: 0.08, envMapIntensity: 0.6 });
export const acVentMat = new THREE.MeshStandardMaterial({ color: 0xa6aca8, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.6 });
export const acAccentMat = new THREE.MeshStandardMaterial({
  color: 0x86c247,
  emissive: 0x5a9e2e,
  emissiveIntensity: 0.8,
  roughness: 0.4,
});

export const vaporizerMat = new THREE.MeshStandardMaterial({ color: 0xdfe2da, roughness: 0.4, metalness: 0.25, envMapIntensity: 0.7 });
export const vaporizerCapMat = new THREE.MeshStandardMaterial({ color: 0xaab0a8, roughness: 0.4, metalness: 0.85, envMapIntensity: 1.0 });

export const sensorMat = new THREE.MeshStandardMaterial({ color: 0xbcc0b8, roughness: 0.42, metalness: 0.35, envMapIntensity: 0.7 });
export const sensorLedMat = new THREE.MeshStandardMaterial({
  color: 0x7bd44a,
  emissive: 0x5fbf30,
  emissiveIntensity: 1.4,
  roughness: 0.3,
});

// --- controller -----------------------------------------------------------
// matte black housing, glassy screen overlay, soft emissive screen
export const panelMat = new THREE.MeshStandardMaterial({ color: 0x202420, roughness: 0.5, metalness: 0.4, envMapIntensity: 0.8 });
export const panelDarkMat = new THREE.MeshStandardMaterial({ color: 0x0d100b, roughness: 0.35, metalness: 0.5, envMapIntensity: 0.9 });
export const screenGlassMat = new THREE.MeshPhysicalMaterial({
  color: 0x05070a,
  roughness: 0.08,
  metalness: 0.0,
  transmission: 0.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.08,
  transparent: true,
  opacity: 0.28,
  envMapIntensity: 1.4,
});
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
export const buttonMat = new THREE.MeshStandardMaterial({ color: 0x33392f, roughness: 0.45, metalness: 0.5, envMapIntensity: 0.8 });

// --- industrial electrical panel (Growcast Industria) ---------------------
export const whitePanelMat = new THREE.MeshStandardMaterial({ color: 0xe9ebe4, roughness: 0.42, metalness: 0.22, envMapIntensity: 0.7 });
export const blackConduitMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.5, metalness: 0.45, envMapIntensity: 0.6 });

// --- exterior threshold / facility grounding ------------------------------
export const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.26, metalness: 0.82, envMapIntensity: 1.1 });
export const cabinetDoorMat = new THREE.MeshStandardMaterial({ color: 0x80868a, roughness: 0.26, metalness: 0.82, envMapIntensity: 1.1 });
export const doorMat = new THREE.MeshStandardMaterial({ color: 0x3c4044, roughness: 0.5, metalness: 0.55, envMapIntensity: 0.7 });
export const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x6f736d, roughness: 0.45, metalness: 0.6, envMapIntensity: 0.8 });
export const exitSignMat = new THREE.MeshStandardMaterial({
  color: 0x2a0c08,
  emissive: 0xff3a26,
  emissiveIntensity: 2.4,
  roughness: 0.4,
});
export const exitFaceMat = new THREE.MeshBasicMaterial({ color: 0xff5a44, toneMapped: false });
export const bollardMat = new THREE.MeshStandardMaterial({ color: 0xd8b53a, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.6 });
export const reservoirMat = new THREE.MeshStandardMaterial({ color: 0x232723, roughness: 0.55, metalness: 0.2, envMapIntensity: 0.4 });
// large decorative planter that grounds the threshold corner
export const planterMat = new THREE.MeshStandardMaterial({ color: 0x40443d, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.3 });
