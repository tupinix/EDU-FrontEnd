import { useId } from 'react';
import { V, toNum, stateDuo } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

// Radial / donut progress gauge. Color comes from threshold rules when present,
// else a calm emerald that shifts to amber/red near the top of the range.
export function RadialWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const unit = String(config.unit ?? '%');
  const label = String(config.label ?? '');
  const decimals = Number(config.decimals ?? 0);

  const n = toNum(value);
  const clamped = n == null ? min : Math.min(Math.max(n, min), max);
  const frac = max === min ? 0 : (clamped - min) / (max - min);
  const { main, light } = stateDuo(value, config.rules, frac);
  const blink = false;
  const id = useId();

  const hasLabel = label.length > 0;
  const size = Math.max(40, Math.min(width - 8, height - (hasLabel ? 26 : 8)));
  const stroke = Math.max(6, size * 0.11);
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;

  const centerText = n == null ? '--' : unit === '%' ? `${Math.round(frac * 100)}%` : clamped.toFixed(decimals);
  const valueFont = size * 0.24;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none overflow-hidden gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={main} /><stop offset="100%" stopColor={light} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={stroke * 0.28} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={V.trackEdge} strokeWidth={stroke + 2} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={V.track} strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={`url(#${id}-ring)`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={`url(#${id}-glow)`}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1), stroke .3s ease' }}
          className={blink ? 'animate-pulse' : undefined}
        />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={V.text} fontSize={valueFont} fontWeight={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {centerText}
        </text>
        {unit !== '%' && n != null && (
          <text x={cx} y={cy + valueFont * 0.92} textAnchor="middle" dominantBaseline="central" fill={V.sub} fontSize={valueFont * 0.42}>{unit}</text>
        )}
      </svg>
      {hasLabel && (
        <span className="truncate w-full text-center" style={{ color: V.sub, fontSize: Math.max(9, size * 0.11) }}>{label}</span>
      )}
    </div>
  );
}
