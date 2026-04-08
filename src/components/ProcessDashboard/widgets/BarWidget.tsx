interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function BarWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const orientation = (config.orientation as 'horizontal' | 'vertical') ?? 'horizontal';
  const unit = String(config.unit ?? '');
  const label = String(config.label ?? '');

  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  const clampedValue = isNaN(numValue) ? min : Math.min(Math.max(numValue, min), max);
  const percentage = max === min ? 0 : ((clampedValue - min) / (max - min)) * 100;

  const getColor = (pct: number) => {
    if (pct < 60) return '#10b981';
    if (pct < 85) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(percentage);
  const displayValue = isNaN(numValue) ? '--' : numValue.toFixed(1);
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-2 gap-1 select-none">
      {label && (
        <span className="text-gray-400 text-[10px] truncate w-full text-center">{label}</span>
      )}

      <div
        className="relative rounded-md overflow-hidden"
        style={{
          width: isHorizontal ? '100%' : Math.min(width * 0.4, 30),
          height: isHorizontal ? Math.min(height * 0.3, 20) : '100%',
          backgroundColor: '#374151',
          flex: isHorizontal ? undefined : 1,
        }}
      >
        <div
          className="absolute rounded-md transition-all duration-500"
          style={isHorizontal ? {
            left: 0, top: 0, bottom: 0,
            width: `${percentage}%`,
            backgroundColor: color,
          } : {
            left: 0, right: 0, bottom: 0,
            height: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span className="text-white font-semibold tabular-nums" style={{ fontSize: Math.max(11, Math.min(width, height) * 0.12) }}>
        {displayValue}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}
