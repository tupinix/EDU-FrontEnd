interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function LabelWidget({ config, value }: Props) {
  const text = String(config.text ?? 'Label');
  const fontSize = Number(config.fontSize ?? 14);
  const color = String(config.color ?? '#e5e7eb');

  // If there's a tag binding with a live value, show that instead
  const displayText = config.tagBinding && value !== null && value !== undefined
    ? String(value)
    : text;

  return (
    <div
      className="flex items-center justify-center h-full w-full select-none overflow-hidden px-2"
      style={{ color, fontSize, fontWeight: 500 }}
    >
      <span className="truncate">{displayText}</span>
    </div>
  );
}
