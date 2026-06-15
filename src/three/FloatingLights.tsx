import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Soft purple glow orbs that float slowly in the space around the suspended room.
function makeGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const ORBS = [
  { pos: [-1.5, 4.2, 0.5], s: 3.4, ph: 0.0, amp: 0.7, c: 0xb070ff },
  { pos: [2.5, 4.4, 2.2], s: 3.0, ph: 1.3, amp: 0.6, c: 0x9c5cff },
  { pos: [4.8, 2.6, 0.8], s: 2.6, ph: 2.1, amp: 0.8, c: 0xc088ff },
  { pos: [-3.6, 2.2, 2.6], s: 3.2, ph: 3.4, amp: 0.7, c: 0x8c5cf0 },
  { pos: [1.0, 3.4, -1.4], s: 2.4, ph: 4.2, amp: 0.5, c: 0xb070ff },
  { pos: [3.6, 4.0, -2.4], s: 2.8, ph: 5.0, amp: 0.6, c: 0xa868ff },
] as const;

export function FloatingLights() {
  const tex = useMemo(() => makeGlow(), []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < ORBS.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const o = ORBS[i];
      m.position.set(
        o.pos[0] + Math.sin(t * 0.16 + o.ph) * o.amp,
        o.pos[1] + Math.sin(t * 0.12 + o.ph * 1.3) * o.amp * 0.7,
        o.pos[2] + Math.cos(t * 0.14 + o.ph) * o.amp,
      );
    }
  });

  return (
    <>
      {ORBS.map((o, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={o.pos as unknown as [number, number, number]}
          scale={[o.s, o.s, o.s]}
        >
          <spriteMaterial
            map={tex}
            color={o.c}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}
