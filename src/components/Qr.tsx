import { useMemo } from "react";

// Deterministic, stylized QR-pattern (not a real scannable code) with the three
// finder eyes of a real QR. Larger/denser for prominence.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 33;

function buildMatrix(seed: number): boolean[][] {
  const rng = mulberry32(seed);
  const m: boolean[][] = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) m[y][x] = rng() > 0.52;

  const eye = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y][ox + x] = border || core;
      }
    }
    for (let i = -1; i <= 7; i++) {
      if (oy + i >= 0 && oy + i < N && ox + 7 < N) m[oy + i][ox + 7] = false;
      if (ox + i >= 0 && ox + i < N && oy + 7 < N) m[oy + 7][ox + i] = false;
    }
  };
  eye(0, 0);
  eye(N - 7, 0);
  eye(0, N - 7);
  return m;
}

export function Qr({
  size = 150,
  color = "#46591f",
  bg = "#ffffff",
}: {
  size?: number;
  color?: string;
  bg?: string;
}) {
  const matrix = useMemo(() => buildMatrix(2481), []);
  const cell = size / (N + 2);
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (matrix[y][x]) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={(x + 1) * cell}
            y={(y + 1) * cell}
            width={cell}
            height={cell}
            rx={cell * 0.18}
          />,
        );
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pasaporte del cultivo (QR)">
      <rect width={size} height={size} rx={size * 0.05} fill={bg} />
      <g fill={color}>{rects}</g>
    </svg>
  );
}
