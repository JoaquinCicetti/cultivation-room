// Small deterministic line/area chart used across the traceability dashboard.
export function MetricChart({
  data,
  color = "#c8e06a",
  width = 300,
  height = 104,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const padX = 6;
  const top = 12;
  const bottom = height - 12;
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = bottom - v * (bottom - top);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${width - padX} ${bottom} L ${padX} ${bottom} Z`;
  const id = `mc-${color.replace("#", "")}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={padX}
          x2={width - padX}
          y1={top + g * (bottom - top)}
          y2={top + g * (bottom - top)}
          stroke="rgba(238,242,226,0.08)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.4 : 1.8} fill={color} />
      ))}
    </svg>
  );
}
