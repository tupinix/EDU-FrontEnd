import { useEffect, useRef } from 'react';
import { evaluateThresholds } from '@/lib/widgetThresholds';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

function toNum(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isNaN(n) ? null : n;
}

// KPI / stat card: big value + trend delta (vs target when set, else vs the
// previous reading) + optional target check + conditional color from rules.
export function KpiWidget({ config, value, width, height }: Props) {
  const label = String(config.label ?? 'KPI');
  const unit = String(config.unit ?? '');
  const decimals = Number(config.decimals ?? 0);
  const target = toNum(config.target);
  const num = toNum(value);

  // Remember the previous reading so we can show a trend arrow.
  const prevRef = useRef<number | null>(null);
  const prev = prevRef.current;
  useEffect(() => {
    if (num !== null) prevRef.current = num;
  }, [num]);

  const threshold = evaluateThresholds(value, config.rules);
  const accent = threshold?.color ?? String(config.color ?? '#3b82f6');

  let delta: number | null = null;
  let base: number | null = null;
  if (num !== null && target !== null) { delta = num - target; base = target; }
  else if (num !== null && prev !== null) { delta = num - prev; base = prev; }

  const pct = delta !== null && base !== null && base !== 0 ? (delta / Math.abs(base)) * 100 : null;
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;
  const deltaColor = delta === null || delta === 0 ? '#9ca3af' : up ? '#10b981' : '#ef4444';

  const display = num === null ? '--' : num.toFixed(decimals);
  const valueFont = Math.max(18, Math.min(height * 0.36, width * 0.26));
  const smallFont = Math.max(9, valueFont * 0.26);
  const meetsTarget = target !== null && num !== null && num >= target;

  return (
    <div
      className="flex flex-col justify-center h-full w-full select-none overflow-hidden"
      style={{ padding: 10, paddingLeft: 12, borderLeft: `3px solid ${accent}` }}
    >
      <span className="text-gray-400 uppercase tracking-wider truncate" style={{ fontSize: smallFont }}>
        {label}
      </span>

      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-bold tabular-nums truncate ${threshold?.blink ? 'animate-pulse' : ''}`}
          style={{ fontSize: valueFont, color: threshold?.color ?? '#ffffff', lineHeight: 1.1 }}
        >
          {display}
        </span>
        {unit && <span className="text-gray-500 shrink-0" style={{ fontSize: valueFont * 0.4 }}>{unit}</span>}
      </div>

      <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ fontSize: smallFont }}>
        {delta !== null && (
          <span style={{ color: deltaColor }} className="tabular-nums font-medium shrink-0">
            {up ? '▲' : down ? '▼' : '■'} {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : Math.abs(delta).toFixed(decimals)}
          </span>
        )}
        {target !== null && (
          <span className="text-gray-500 tabular-nums shrink-0">
            meta {target.toFixed(decimals)} {meetsTarget ? '✓' : ''}
          </span>
        )}
        {threshold?.label && (
          <span style={{ color: threshold.color }} className="font-semibold uppercase truncate">
            {threshold.label}
          </span>
        )}
      </div>
    </div>
  );
}
