interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function PipeWidget({ config, width, height }: Props) {
  const direction = (config.direction as string) || 'horizontal';
  const color = (config.color as string) || '#3b82f6';
  const thickness = (config.thickness as number) || 6;
  const animated = config.animated !== false;

  const isHorizontal = direction === 'horizontal';

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Pipe body */}
      <line
        x1={isHorizontal ? 0 : width / 2}
        y1={isHorizontal ? height / 2 : 0}
        x2={isHorizontal ? width : width / 2}
        y2={isHorizontal ? height / 2 : height}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        opacity={0.3}
      />
      {/* Animated flow */}
      <line
        x1={isHorizontal ? 0 : width / 2}
        y1={isHorizontal ? height / 2 : 0}
        x2={isHorizontal ? width : width / 2}
        y2={isHorizontal ? height / 2 : height}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${thickness * 2} ${thickness * 3}`}
        opacity={0.8}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from={isHorizontal ? `${thickness * 5}` : `${-thickness * 5}`}
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </line>
      {/* End caps */}
      <circle
        cx={isHorizontal ? 0 : width / 2}
        cy={isHorizontal ? height / 2 : 0}
        r={thickness / 2 + 2}
        fill={color} opacity={0.5}
      />
      <circle
        cx={isHorizontal ? width : width / 2}
        cy={isHorizontal ? height / 2 : height}
        r={thickness / 2 + 2}
        fill={color} opacity={0.5}
      />
    </svg>
  );
}
