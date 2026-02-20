import React from 'react';

interface OEEGaugeProps {
  value: number; // 0-100
  label: string;
  color?: string;
  size?: number;
}

export function OEEGauge({ value, label, color = '#3b82f6', size = 120 }: OEEGaugeProps) {
  const radius = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Semicircle: from 180° to 0° (left to right)
  const startAngle = Math.PI; // 180 deg
  const endAngle = 0;         // 0 deg
  const arcLength = Math.PI; // total arc

  const clampedValue = Math.min(100, Math.max(0, value));
  const fraction = clampedValue / 100;
  const currentAngle = startAngle - fraction * arcLength;

  const polarToCartesian = (angle: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  });

  const bgStart = polarToCartesian(startAngle);
  const bgEnd = polarToCartesian(endAngle);
  const fgEnd = polarToCartesian(currentAngle);

  const bgArcFlag = 1; // always large arc for background
  const fgArcFlag = fraction > 0.5 ? 1 : 0;

  const bgPath = [
    `M ${bgStart.x} ${bgStart.y}`,
    `A ${radius} ${radius} 0 ${bgArcFlag} 0 ${bgEnd.x} ${bgEnd.y}`,
  ].join(' ');

  const fgPath = clampedValue > 0
    ? [
        `M ${bgStart.x} ${bgStart.y}`,
        `A ${radius} ${radius} 0 ${fgArcFlag} 0 ${fgEnd.x} ${fgEnd.y}`,
      ].join(' ')
    : '';

  const strokeWidth = size * 0.1;
  const textY = cy + radius * 0.15;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        {fgPath && (
          <path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Value text */}
        <text
          x={cx}
          y={textY}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="600"
          fill="currentColor"
          className="text-gray-900 dark:text-gray-100"
        >
          {clampedValue.toFixed(1)}%
        </text>
      </svg>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    </div>
  );
}
