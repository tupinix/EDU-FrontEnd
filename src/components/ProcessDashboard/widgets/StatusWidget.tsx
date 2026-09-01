import { V } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function StatusWidget({ config, value, width, height }: Props) {
  const onValue = config.onValue ?? 1;
  const onLabel = String(config.onLabel ?? 'ON');
  const offLabel = String(config.offLabel ?? 'OFF');

  // Determine if "on" by comparing value to onValue
  const isOn = value !== null && value !== undefined && String(value) === String(onValue);
  const dotSize = Math.max(14, Math.min(width, height) * 0.26);
  const labelFontSize = Math.max(11, Math.min(width, height) * 0.12);
  const dotColor = isOn ? V.accent : V.dim;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2.5 select-none">
      <div
        className="rounded-full shrink-0"
        style={{
          width: dotSize,
          height: dotSize,
          background: `radial-gradient(circle at 35% 30%, ${isOn ? V.accentLight : '#8b95a8'}, ${dotColor} 70%)`,
          boxShadow: isOn ? `0 0 16px 3px ${V.accent}66, inset 0 1px 2px rgba(255,255,255,.4)` : 'inset 0 1px 2px rgba(255,255,255,.15)',
          outline: `${Math.max(3, dotSize * 0.16)}px solid ${dotColor}22`,
          animation: isOn ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span
        className="font-semibold truncate text-center"
        style={{ fontSize: labelFontSize, color: isOn ? V.accentLight : V.sub, letterSpacing: 0.4 }}
      >
        {isOn ? onLabel : offLabel}
      </span>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
