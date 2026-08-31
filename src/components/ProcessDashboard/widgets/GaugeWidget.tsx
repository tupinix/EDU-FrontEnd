import { useId } from 'react';
import { V, toNum, stateDuo } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function GaugeWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const unit = String(config.unit ?? '');
  const label = String(config.label ?? '');
  const decimals = Number(config.decimals ?? 1);

  const n = toNum(value);
  const clamped = n == null ? min : Math.min(Math.max(n, min), max);
  const frac = max === min ? 0 : (clamped - min) / (max - min);
  const { main, light } = stateDuo(value, config.rules, frac);
  const id = useId();

  const cx = width / 2;
  const cy = height * 0.7;
  const radius = Math.min(width * 0.42, height * 0.5);
  const sw = Math.max(6, radius * 0.16);

  const A0 = Math.PI, A1 = 0; // top semicircle, left -> right
  const p = (a: number) => ({ x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) });
  const s = p(A0), e = p(A1);
  const arc = `M ${s.x} ${s.y} A ${radius} ${radius} 0 0 1 ${e.x} ${e.y}`;
  const sweep = A0 - (A0 - A1) * frac;
  const tip = p(sweep);

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = A0 - (A0 - A1) * (i / 10);
    const ro = radius + sw * 0.62, ri = radius + sw * 0.1;
    return { x1: cx + ro * Math.cos(a), y1: cy - ro * Math.sin(a), x2: cx + ri * Math.cos(a), y2: cy - ri * Math.sin(a), major: i % 5 === 0 };
  });

  // needle base perpendicular to its direction, for a tapered look
  const perp = sweep + Math.PI / 2, bw = sw * 0.32;
  const nb1 = { x: cx + bw * Math.cos(perp), y: cy - bw * Math.sin(perp) };
  const nb2 = { x: cx - bw * Math.cos(perp), y: cy + bw * Math.sin(perp) };

  const disp = n == null ? '--' : n.toFixed(decimals);
  const valFont = Math.max(14, Math.min(radius * 0.42, height * 0.16));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-arc`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={main} /><stop offset="100%" stopColor={light} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={sw * 0.3} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`${id}-hub`} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>

      {label && (
        <text x={cx} y={14} textAnchor="middle" fill={V.sub} fontSize={Math.max(10, Math.min(height * 0.09, 14))} letterSpacing="0.4">{label}</text>
      )}

      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.major ? V.sub : V.dim} strokeWidth={t.major ? 1.6 : 1} strokeLinecap="round" />
      ))}

      <path d={arc} fill="none" stroke={V.track} strokeWidth={sw} strokeLinecap="round" />
      <path d={arc} fill="none" stroke={`url(#${id}-arc)`} strokeWidth={sw} strokeLinecap="round"
        pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - frac)}
        filter={`url(#${id}-glow)`} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }} />

      <polygon points={`${nb1.x},${nb1.y} ${nb2.x},${nb2.y} ${tip.x},${tip.y}`} fill="#e2e8f0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
      <circle cx={cx} cy={cy} r={sw * 0.44} fill={`url(#${id}-hub)`} stroke="#0f172a" strokeWidth={1} />

      <text x={cx} y={cy + valFont * 0.95} textAnchor="middle" fill={V.text} fontWeight={700} fontSize={valFont} style={{ fontVariantNumeric: 'tabular-nums' }}>{disp}</text>
      {unit && <text x={cx} y={cy + valFont * 1.6} textAnchor="middle" fill={V.sub} fontSize={valFont * 0.5}>{unit}</text>}
      <text x={s.x} y={s.y + 14} textAnchor="middle" fill={V.dim} fontSize={9}>{min}</text>
      <text x={e.x} y={e.y + 14} textAnchor="middle" fill={V.dim} fontSize={9}>{max}</text>
    </svg>
  );
}
