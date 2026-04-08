interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function TextWidget({ config }: Props) {
  const text = String(config.text ?? 'Text block');
  const fontSize = Number(config.fontSize ?? 13);
  const color = String(config.color ?? '#d1d5db');
  const textAlign = (config.textAlign as 'left' | 'center' | 'right') ?? 'left';

  return (
    <div
      className="h-full w-full overflow-hidden p-2 select-none whitespace-pre-wrap"
      style={{ color, fontSize, textAlign, lineHeight: 1.4 }}
    >
      {text}
    </div>
  );
}
