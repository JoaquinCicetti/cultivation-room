// Small deterministic line/area chart that closes the traceability step.
const DATA = [0.32, 0.42, 0.38, 0.55, 0.64, 0.6, 0.74, 0.82, 0.9];

export function MetricChart({ width = 330, height = 116 }: { width?: number; height?: number }) {
  const padX = 6;
  const top = 12;
  const bottom = height - 14;
  const pts = DATA.map((v, i) => {
    const x = padX + (i / (DATA.length - 1)) * (width - padX * 2);
    const y = bottom - v * (bottom - top);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${width - padX} ${bottom} L ${padX} ${bottom} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Rendimiento por ciclo">
      <defs>
        <linearGradient id="mc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8e06a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#c8e06a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={padX} x2={width - padX} y1={top + g * (bottom - top)} y2={top + g * (bottom - top)} stroke="rgba(238,242,226,0.08)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#mc-fill)" />
      <path d={line} fill="none" stroke="#c8e06a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 2} fill="#c8e06a" />
      ))}
    </svg>
  );
}
