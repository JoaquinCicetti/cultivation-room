import * as THREE from "three";

// ---------------------------------------------------------------------------
// Procedural PBR maps (canvas-baked, no external assets). Kept deliberately
// subtle and crisp — surface variation and grout/seam detail, never haze.
// ---------------------------------------------------------------------------

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!];
}

// Convert a grayscale height canvas into a tangent-space normal map (Sobel).
function heightToNormal(height: HTMLCanvasElement, strength: number): THREE.CanvasTexture {
  const size = height.width;
  const hctx = height.getContext("2d")!;
  const src = hctx.getImageData(0, 0, size, size).data;
  const [out, octx] = makeCanvas(size);
  const dst = octx.createImageData(size, size);
  const at = (x: number, y: number) => {
    const xx = (x + size) % size;
    const yy = (y + size) % size;
    return src[(yy * size + xx) * 4] / 255;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      dst.data[i] = ((dx / len) * 0.5 + 0.5) * 255;
      dst.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      dst.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      dst.data[i + 3] = 255;
    }
  }
  octx.putImageData(dst, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function srgb(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
function linear(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export interface PBRSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

// Large-format dark porcelain tiles: subtle per-tile tone variation, recessed
// grout lines, semi-polished faces (low roughness) vs matte grout (high).
function buildTileTextures(): PBRSet {
  const S = 1024;
  const N = 6; // tiles per axis in the texture
  const cell = S / N;
  const grout = Math.max(2, Math.round(cell * 0.018));

  // --- color (low-contrast grout so the grid never reads as wireframe) ---
  const [col, cx] = makeCanvas(S);
  cx.fillStyle = "#202327"; // grout, close to tile tone
  cx.fillRect(0, 0, S, S);
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      // deterministic-ish per-tile tone variation
      const v = 38 + ((tx * 7 + ty * 13) % 6) * 2 + ((tx + ty) % 2) * 3;
      cx.fillStyle = `rgb(${v},${v + 2},${v + 3})`;
      cx.fillRect(tx * cell + grout, ty * cell + grout, cell - grout * 2, cell - grout * 2);
    }
  }
  // faint speckle for porcelain depth
  const spk = cx.getImageData(0, 0, S, S);
  for (let i = 0; i < spk.data.length; i += 4) {
    const n = (((i * 2654435761) >>> 0) % 9) - 4;
    spk.data[i] += n;
    spk.data[i + 1] += n;
    spk.data[i + 2] += n;
  }
  cx.putImageData(spk, 0, 0);

  // --- roughness: tile face smooth (dark), grout rough (light) ---
  const [rgh, rx] = makeCanvas(S);
  rx.fillStyle = "#c8c8c8"; // grout rough
  rx.fillRect(0, 0, S, S);
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      const r = 64 + ((tx * 5 + ty * 3) % 5) * 6; // semi-polished, slight variation
      rx.fillStyle = `rgb(${r},${r},${r})`;
      rx.fillRect(tx * cell + grout, ty * cell + grout, cell - grout * 2, cell - grout * 2);
    }
  }

  // --- height -> normal: grout grooves ---
  const [hgt, hx] = makeCanvas(S);
  hx.fillStyle = "#000"; // grout = low
  hx.fillRect(0, 0, S, S);
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      hx.fillStyle = "#fff";
      hx.fillRect(tx * cell + grout, ty * cell + grout, cell - grout * 2, cell - grout * 2);
    }
  }

  return {
    map: srgb(new THREE.CanvasTexture(col)),
    roughnessMap: linear(new THREE.CanvasTexture(rgh)),
    normalMap: heightToNormal(hgt, 1.1),
  };
}

// Painted industrial wall panels: light gray with very low-contrast roller
// texture + faint panel seams. Reads as real paint, not flat fill.
function buildWallTextures(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const S = 512;
  const [col, cx] = makeCanvas(S);
  cx.fillStyle = "#b9bcb4";
  cx.fillRect(0, 0, S, S);
  // subtle vertical roller streaks
  for (let x = 0; x < S; x += 2) {
    const a = 0.02 + 0.02 * Math.sin(x * 0.21);
    cx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
    cx.fillRect(x, 0, 1, S);
  }
  // low-amplitude value noise
  const img = cx.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (((i * 40503) >>> 0) % 7) - 3;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  cx.putImageData(img, 0, 0);

  const [rgh, rx] = makeCanvas(S);
  rx.fillStyle = "#e6e6e6"; // mostly matte paint
  rx.fillRect(0, 0, S, S);
  const rimg = rx.getImageData(0, 0, S, S);
  for (let i = 0; i < rimg.data.length; i += 4) {
    const n = (((i * 22699) >>> 0) % 11) - 5;
    rimg.data[i] += n;
    rimg.data[i + 1] += n;
    rimg.data[i + 2] += n;
  }
  rx.putImageData(rimg, 0, 0);

  return { map: srgb(new THREE.CanvasTexture(col)), roughnessMap: linear(new THREE.CanvasTexture(rgh)) };
}

// Brushed-metal anisotropic-ish roughness (fine horizontal grain) for stainless.
function buildBrushedRoughness(): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = "#6e6e6e";
  ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    const v = 90 + Math.round(((((y * 2654435761) >>> 0) % 40) - 20));
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.fillRect(0, y, S, 1);
  }
  return linear(new THREE.CanvasTexture(c));
}

// Singletons — built once, lazily (client only).
let _tiles: PBRSet | null = null;
let _wall: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } | null = null;
let _brushed: THREE.CanvasTexture | null = null;

export function tileTextures(): PBRSet {
  return (_tiles ??= buildTileTextures());
}
export function wallTextures() {
  return (_wall ??= buildWallTextures());
}
export function brushedRoughness(): THREE.CanvasTexture {
  return (_brushed ??= buildBrushedRoughness());
}
