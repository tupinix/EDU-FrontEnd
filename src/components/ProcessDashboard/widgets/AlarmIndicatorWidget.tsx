import { cn } from '@/lib/utils';

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
    good: { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', text: 'text-emerald-400', label: 'GOOD' },
    warn: { dot: 'bg-amber-400', ring: 'ring-amber-400/30', text: 'text-amber-400', label: 'WARNING' },
    bad: { dot: 'bg-red-500', ring: 'ring-red-500/30', text: 'text-red-400', label: 'BAD' },
    unknown: { dot: 'bg-gray-500', ring: 'ring-gray-500/30', text: 'text-gray-400', label: 'N/A' },
  };

  const c = colorMap[status];
  const isCompact = height < 80;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-1">
      {/* Pulsing dot */}
      <div className={cn('relative rounded-full', isCompact ? 'w-6 h-6' : 'w-10 h-10')}>
        <div className={cn('absolute inset-0 rounded-full', c.dot, (status === 'bad' || status === 'warn') && 'animate-ping opacity-40')} />
        <div className={cn('relative w-full h-full rounded-full ring-4', c.dot, c.ring)} />
      </div>

      {/* Label */}
      {!isCompact && (
        <span className="text-[11px] text-gray-400 font-medium truncate max-w-full px-1">{label}</span>
      )}

      {/* Status + value */}
      <div className="text-center">
        <span className={cn('text-[10px] font-bold uppercase', c.text)}>{c.label}</span>
        {!isNaN(num) && (
          <span className="text-[10px] text-gray-500 ml-1">{num.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
}
