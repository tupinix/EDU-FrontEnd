import { V } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function AlarmIndicatorWidget({ config, value, height }: Props) {
  const label = (config.label as string) || 'Alarm';
  const goodMin = config.goodMin != null ? Number(config.goodMin) : undefined;
  const goodMax = config.goodMax != null ? Number(config.goodMax) : undefined;
  const warnMin = config.warnMin != null ? Number(config.warnMin) : undefined;
  const warnMax = config.warnMax != null ? Number(config.warnMax) : undefined;

  // Extract numeric value
  const num = typeof value === 'number' ? value
    : typeof value === 'object' && value !== null ? Number((value as Record<string, unknown>).value ?? NaN)
    : Number(value);

  // Evaluate status
  let status: 'good' | 'warn' | 'bad' | 'unknown' = 'unknown';
  if (!isNaN(num)) {
    if (goodMin != null && goodMax != null && num >= goodMin && num <= goodMax) {
      status = 'good';
    } else if (warnMin != null && warnMax != null && num >= warnMin && num <= warnMax) {
      status = 'warn';
    } else if (goodMin != null || goodMax != null || warnMin != null || warnMax != null) {
      status = 'bad';
    }
  }

  const colorMap = {
    good: { base: V.accent, light: V.accentLight, label: 'GOOD' },
    warn: { base: V.warn, light: V.warnLight, label: 'WARNING' },
    bad: { base: V.bad, light: V.badLight, label: 'BAD' },
    unknown: { base: V.dim, light: '#8b95a8', label: 'N/A' },
  };

  const c = colorMap[status];
  const isCompact = height < 80;
  const active = status === 'bad' || status === 'warn';
  const size = isCompact ? 24 : 40;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {active && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: c.base, opacity: 0.35 }} />
        )}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 70%)`,
            boxShadow: `0 0 16px 2px ${c.base}66, inset 0 1px 2px rgba(255,255,255,.4)`,
            outline: `${Math.max(3, size * 0.14)}px solid ${c.base}22`,
          }}
        />
      </div>

      {!isCompact && (
        <span className="text-[11px] font-medium truncate max-w-full px-1" style={{ color: V.sub }}>{label}</span>
      )}

      <div className="text-center">
        <span className="text-[10px] font-bold uppercase" style={{ color: c.light }}>{c.label}</span>
        {!isNaN(num) && <span className="text-[10px] ml-1" style={{ color: V.dim }}>{num.toFixed(1)}</span>}
      </div>
    </div>
  );
}
