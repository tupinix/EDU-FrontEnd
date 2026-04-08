interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function ImageWidget({ config, width, height }: Props) {
  const src = String(config.src ?? '');
  const objectFit = (config.objectFit as string) ?? 'contain';

  if (!src) {
    return (
      <div className="flex items-center justify-center h-full w-full border border-dashed border-gray-600 rounded-lg">
        <span className="text-gray-500 text-[12px]">No image URL</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      className="select-none"
      style={{ width: '100%', height: '100%', objectFit: objectFit as any }}
      draggable={false}
    />
  );
}
