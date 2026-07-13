import { evaluateThresholds } from '@/lib/widgetThresholds';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function ValueWidget({ config, value, width, height }: Props) {
  const unit = String(config.unit ?? '');
  const label = String(config.label ?? '');
  const decimals = Number(config.decimals ?? 2);
  const fontSize = Number(config.fontSize ?? Math.max(20, Math.min(height * 0.35, width * 0.2)));

  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  const displayValue = isNaN(numValue) ? (value !== null && value !== undefined ? String(value) : '--') : numValue.toFixed(decimals);

  // Conditional formatting: colour/blink/label the value when a rule matches.
  const threshold = evaluateThresholds(value, config.rules);

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full select-none"
      style={{ padding: '8px' }}
    >
      {label && (
        <span className="text-gray-400 truncate w-full text-center" style={{ fontSize: Math.max(10, fontSize * 0.35) }}>
          {label}
        </span>
      )}
      <span
        className={`font-bold tabular-nums truncate w-full text-center ${threshold?.blink ? 'animate-pulse' : ''}`}
        style={{ fontSize, lineHeight: 1.1, color: threshold?.color ?? '#ffffff' }}
      >
        {displayValue}
      </span>
      {threshold?.label ? (
        <span className="font-semibold uppercase truncate w-full text-center" style={{ fontSize: Math.max(9, fontSize * 0.3), color: threshold.color }}>
          {threshold.label}
        </span>
      ) : unit && (
        <span className="text-gray-500 truncate w-full text-center" style={{ fontSize: Math.max(10, fontSize * 0.35) }}>
          {unit}
        </span>
      )}
    </div>
  );
}
