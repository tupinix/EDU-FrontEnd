import { useId } from 'react';
import { V, toNum, stateDuo } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function TankWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const unit = String(config.unit ?? '%');

  const n = toNum(value);
  const clamped = n == null ? min : Math.min(Math.max(n, min), max);
  const pct = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const frac = pct / 100;
  const { main, light } = stateDuo(value, config.rules, frac);
  const id = useId();

  const padX = Math.max(10, width * 0.16);
  const x = padX, w = width - padX * 2;
  const ry = Math.min(w * 0.16, 13);
  const top = ry + 4;
  const bottom = height - 20;
  const bodyH = bottom - top;
  const cx = x + w / 2;
  const liqTop = bottom - bodyH * frac;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {/* cylinder curvature: dark edges, lit center */}
        <linearGradient id={`${id}-cyl`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d131c" /><stop offset="22%" stopColor="#28323f" />
          <stop offset="50%" stopColor="#3a4655" /><stop offset="78%" stopColor="#28323f" /><stop offset="100%" stopColor="#0d131c" />
        </linearGradient>
        <linearGradient id={`${id}-liq`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={main} stopOpacity="0.55" /><stop offset="50%" stopColor={light} stopOpacity="0.95" /><stop offset="100%" stopColor={main} stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={x} y={top} width={w} height={bodyH} />
          <ellipse cx={cx} cy={bottom} rx={w / 2} ry={ry} />
        </clipPath>
      </defs>

      {/* vessel body (empty) */}
      <ellipse cx={cx} cy={bottom} rx={w / 2} ry={ry} fill={`url(#${id}-cyl)`} />
      <rect x={x} y={top} width={w} height={bodyH} fill={`url(#${id}-cyl)`} />

      {/* liquid */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x} y={liqTop} width={w} height={bottom - liqTop + ry + 2} fill={`url(#${id}-liq)`} />
        <ellipse cx={cx} cy={bottom} rx={w / 2} ry={ry} fill={`url(#${id}-liq)`} />
        {/* gloss highlight */}
        <rect x={x + w * 0.12} y={top} width={w * 0.16} height={bodyH} fill="#ffffff" opacity={0.06} />
      </g>

      {/* liquid surface (meniscus) */}
      {frac > 0.02 && (
        <ellipse cx={cx} cy={liqTop} rx={w / 2} ry={ry} fill={light} opacity={0.9}>
          <animate attributeName="ry" values={`${ry};${ry * 0.86};${ry}`} dur="4s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* level ticks */}
      {[0.25, 0.5, 0.75].map((m) => (
        <line key={m} x1={x + w - 5} y1={bottom - bodyH * m} x2={x + w} y2={bottom - bodyH * m} stroke={V.dim} strokeWidth={1} />
      ))}

      {/* rims + outline */}
      <path d={`M ${x} ${top} L ${x} ${bottom}`} stroke="#7c8698" strokeWidth={1.4} fill="none" />
      <path d={`M ${x + w} ${top} L ${x + w} ${bottom}`} stroke="#7c8698" strokeWidth={1.4} fill="none" />
      <ellipse cx={cx} cy={bottom} rx={w / 2} ry={ry} fill="none" stroke="#7c8698" strokeWidth={1.4} />
      <ellipse cx={cx} cy={top} rx={w / 2} ry={ry} fill="#0d131c" stroke="#aab4c6" strokeWidth={1.6} />

      {/* readouts */}
      <text x={cx} y={top + bodyH / 2} textAnchor="middle" dominantBaseline="middle" fill={V.text} fontWeight={700}
        fontSize={Math.max(13, Math.min(w * 0.22, bodyH * 0.16))} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {n == null ? '--' : `${pct.toFixed(0)}%`}
      </text>
      <text x={cx} y={height - 4} textAnchor="middle" fill={V.sub} fontSize={Math.max(9, Math.min(width * 0.08, 12))}>
        {n == null ? '--' : `${n.toFixed(1)} ${unit}`}
      </text>
    </svg>
  );
}
