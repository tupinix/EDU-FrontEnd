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
  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  const clampedValue = isNaN(numValue) ? min : Math.min(Math.max(numValue, min), max);
  const percentage = (clampedValue - min) / (max - min);

  // SVG gauge dimensions
  const cx = width / 2;
  const cy = height * 0.6;
  const radius = Math.min(width * 0.4, height * 0.5);
  const strokeWidth = radius * 0.15;

  // Arc from 180 degrees (left) to 0 degrees (right) — bottom semicircle
  const startAngle = Math.PI; // 180 degrees
  const endAngle = 0; // 0 degrees
  const sweepAngle = startAngle - (startAngle - endAngle) * percentage;

  // Helper to get point on arc
  const pointOnArc = (angle: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  });

  // Background arc path
  const bgStart = pointOnArc(startAngle);
  const bgEnd = pointOnArc(endAngle);
  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${bgEnd.x} ${bgEnd.y}`;

  // Color segments
  const getColor = (pct: number) => {
    if (pct < 0.6) return '#10b981'; // green
    if (pct < 0.85) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Value arc path
  const valEnd = pointOnArc(sweepAngle);
  const largeArc = percentage > 0.5 ? 1 : 0;
  const valPath = percentage > 0.005
    ? `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${valEnd.x} ${valEnd.y}`
    : '';

  // Needle
  const needleLength = radius * 0.85;
  const needleTip = {
    x: cx + needleLength * Math.cos(sweepAngle),
    y: cy - needleLength * Math.sin(sweepAngle),
  };

  const displayValue = isNaN(numValue) ? '--' : numValue.toFixed(1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Label */}
      {label && (
        <text x={cx} y={14} textAnchor="middle" fill="#9ca3af" fontSize={Math.max(10, height * 0.08)}>
          {label}
        </text>
      )}

      {/* Background arc */}
      <path d={bgPath} fill="none" stroke="#374151" strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Value arc */}
      {valPath && (
        <path d={valPath} fill="none" stroke={getColor(percentage)} strokeWidth={strokeWidth} strokeLinecap="round" />
      )}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke="#e5e7eb" strokeWidth={2} strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#e5e7eb" />

      {/* Value text */}
      <text x={cx} y={cy + radius * 0.3} textAnchor="middle" fill="#f9fafb" fontWeight="bold" fontSize={Math.max(14, height * 0.12)}>
        {displayValue}
      </text>

      {/* Unit */}
      {unit && (
        <text x={cx} y={cy + radius * 0.5} textAnchor="middle" fill="#6b7280" fontSize={Math.max(9, height * 0.07)}>
          {unit}
        </text>
      )}

      {/* Min/Max labels */}
      <text x={cx - radius - 2} y={cy + 14} textAnchor="middle" fill="#4b5563" fontSize={9}>
        {min}
      </text>
      <text x={cx + radius + 2} y={cy + 14} textAnchor="middle" fill="#4b5563" fontSize={9}>
        {max}
      </text>
    </svg>
  );
}
