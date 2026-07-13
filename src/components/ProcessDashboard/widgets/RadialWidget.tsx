import { evaluateThresholds } from '@/lib/widgetThresholds';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

// Radial / donut progress gauge — circular variant of the arc gauge. Colour
// comes from threshold rules when present, else a green/amber/red default.
export function RadialWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const unit = String(config.unit ?? '%');
  const label = String(config.label ?? '');
  const decimals = Number(config.decimals ?? 0);

  const num = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  const hasValue = !Number.isNaN(num);
  const clamped = hasValue ? Math.min(Math.max(num, min), max) : min;
  const pct = max === min ? 0 : (clamped - min) / (max - min);

  const threshold = evaluateThresholds(value, config.rules);
  const defaultColor = pct < 0.6 ? '#10b981' : pct < 0.85 ? '#f59e0b' : '#ef4444';
  const color = threshold?.color ?? defaultColor;

  const hasLabel = label.length > 0;
  const size = Math.max(40, Math.min(width - 8, height - (hasLabel ? 26 : 8)));
  const stroke = Math.max(5, size * 0.1);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  // Center label: percent when the unit is '%', else the actual value.
  const centerText = !hasValue ? '--' : unit === '%' ? `${Math.round(pct * 100)}%` : clamped.toFixed(decimals);
  const valueFont = size * 0.24;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none overflow-hidden gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          className={threshold?.blink ? 'animate-pulse' : undefined}
        />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={valueFont} fontWeight="bold">
          {centerText}
        </text>
        {unit !== '%' && hasValue && (
          <text x={cx} y={cy + valueFont * 0.9} textAnchor="middle" dominantBaseline="central" fill="#6b7280" fontSize={valueFont * 0.45}>
            {unit}
          </text>
        )}
      </svg>
      {hasLabel && (
        <span className="text-gray-400 truncate w-full text-center" style={{ fontSize: Math.max(9, size * 0.11) }}>
          {label}
        </span>
      )}
    </div>
  );
}
