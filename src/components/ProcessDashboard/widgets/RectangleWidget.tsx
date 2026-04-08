interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function RectangleWidget({ config }: Props) {
  const backgroundColor = String(config.backgroundColor ?? '#1f2937');
  const borderRadius = Number(config.borderRadius ?? 8);
  const border = String(config.border ?? '1px solid #374151');

  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor, borderRadius, border }}
    />
  );
}
