import { useState, useEffect, useRef } from 'react';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

const MAX_POINTS = 40;

export function SparklineWidget({ config, value, width, height }: Props) {
  const color = (config.color as string) || '#10b981';
  const bufferRef = useRef<number[]>([]);
  const [points, setPoints] = useState<number[]>([]);

  // Accumulate values over time
  useEffect(() => {
    const num = typeof value === 'number' ? value
      : typeof value === 'object' && value !== null ? Number((value as Record<string, unknown>).value ?? 0)
      : Number(value);

    if (isNaN(num)) return;

    bufferRef.current = [...bufferRef.current.slice(-(MAX_POINTS - 1)), num];
    setPoints([...bufferRef.current]);
  }, [value]);

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-[10px] text-gray-500">waiting...</span>
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const pathData = points
    .map((p, i) => {
      const x = padding + (i / (points.length - 1)) * w;
      const y = padding + h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Area fill path
  const areaPath = pathData +
    ` L ${(padding + w).toFixed(1)} ${(padding + h).toFixed(1)}` +
    ` L ${padding.toFixed(1)} ${(padding + h).toFixed(1)} Z`;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current value dot */}
      {points.length > 0 && (
        <circle
          cx={padding + w}
          cy={padding + h - ((points[points.length - 1] - min) / range) * h}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
}
