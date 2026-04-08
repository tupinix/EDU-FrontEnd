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
  const dotSize = Math.max(12, Math.min(width, height) * 0.25);
  const labelFontSize = Math.max(11, Math.min(width, height) * 0.12);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 select-none">
      <div
        className="rounded-full shrink-0"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: isOn ? '#10b981' : '#6b7280',
          boxShadow: isOn ? '0 0 12px 4px rgba(16, 185, 129, 0.4)' : 'none',
          animation: isOn ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span
        className="font-medium truncate text-center"
        style={{
          fontSize: labelFontSize,
          color: isOn ? '#10b981' : '#9ca3af',
        }}
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
