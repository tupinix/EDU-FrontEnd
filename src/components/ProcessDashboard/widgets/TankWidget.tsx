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

  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  const clampedValue = isNaN(numValue) ? min : Math.min(Math.max(numValue, min), max);
  const percentage = max === min ? 0 : ((clampedValue - min) / (max - min)) * 100;

  const padding = 8;
  const tankWidth = width - padding * 2;
  const tankHeight = height - padding * 2 - 20; // Leave space for text
  const tankX = padding;
  const tankY = padding;
  const fillHeight = (tankHeight * percentage) / 100;

  const getColor = (pct: number) => {
    if (pct < 30) return '#ef4444';
    if (pct < 60) return '#f59e0b';
    return '#3b82f6';
  };

  const color = getColor(percentage);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Tank outline */}
      <rect
        x={tankX} y={tankY}
        width={tankWidth} height={tankHeight}
        rx={4} ry={4}
        fill="none" stroke="#4b5563" strokeWidth={2}
      />

      {/* Liquid fill */}
      <defs>
        <clipPath id={`tank-clip-${width}-${height}`}>
          <rect x={tankX + 1} y={tankY + 1} width={tankWidth - 2} height={tankHeight - 2} rx={3} ry={3} />
        </clipPath>
        <linearGradient id={`tank-grad-${width}-${height}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="50%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#tank-clip-${width}-${height})`}>
        {/* Fill rectangle */}
        <rect
          x={tankX + 1}
          y={tankY + tankHeight - fillHeight}
          width={tankWidth - 2}
          height={fillHeight}
          fill={`url(#tank-grad-${width}-${height})`}
        />

        {/* Wave effect at surface */}
        {fillHeight > 3 && (
          <path
            d={`M ${tankX + 1} ${tankY + tankHeight - fillHeight}
                Q ${tankX + tankWidth * 0.25} ${tankY + tankHeight - fillHeight - 3},
                  ${tankX + tankWidth * 0.5} ${tankY + tankHeight - fillHeight}
                Q ${tankX + tankWidth * 0.75} ${tankY + tankHeight - fillHeight + 3},
                  ${tankX + tankWidth} ${tankY + tankHeight - fillHeight}`}
            fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}
          >
            <animateTransform
              attributeName="transform" type="translate"
              values="0,0; 2,-1; 0,0; -2,1; 0,0"
              dur="4s" repeatCount="indefinite"
            />
          </path>
        )}
      </g>

      {/* Level marks */}
      {[0.25, 0.5, 0.75].map((mark) => (
        <line
          key={mark}
          x1={tankX + tankWidth - 6} y1={tankY + tankHeight * (1 - mark)}
          x2={tankX + tankWidth} y2={tankY + tankHeight * (1 - mark)}
          stroke="#6b7280" strokeWidth={1}
        />
      ))}

      {/* Percentage text */}
      <text
        x={width / 2} y={tankY + tankHeight / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill="#f9fafb" fontWeight="bold"
        fontSize={Math.max(12, Math.min(tankWidth * 0.18, tankHeight * 0.12))}
      >
        {isNaN(numValue) ? '--' : `${percentage.toFixed(0)}%`}
      </text>

      {/* Value + unit label below */}
      <text
        x={width / 2} y={height - 4}
        textAnchor="middle" fill="#9ca3af"
        fontSize={Math.max(9, Math.min(width * 0.08, 12))}
      >
        {isNaN(numValue) ? '--' : `${numValue.toFixed(1)} ${unit}`}
      </text>
    </svg>
  );
}
