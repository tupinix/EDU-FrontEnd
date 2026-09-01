import { V, toNum, stateDuo } from './visuals';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

export function BarWidget({ config, value, width, height }: Props) {
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const orientation = (config.orientation as 'horizontal' | 'vertical') ?? 'horizontal';
  const unit = String(config.unit ?? '');
  const label = String(config.label ?? '');

  const n = toNum(value);
  const clamped = n == null ? min : Math.min(Math.max(n, min), max);
  const pct = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const frac = pct / 100;
  const { main, light } = stateDuo(value, config.rules, frac);

  const disp = n == null ? '--' : n.toFixed(1);
  const isH = orientation === 'horizontal';
  const grad = `linear-gradient(${isH ? '90deg' : '0deg'}, ${main}, ${light})`;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-2 gap-1.5 select-none">
      {label && <span className="truncate w-full text-center" style={{ color: V.sub, fontSize: 10 }}>{label}</span>}

      <div
        className="relative overflow-hidden"
        style={{
          width: isH ? '100%' : Math.min(width * 0.42, 34),
          height: isH ? Math.min(height * 0.34, 22) : '100%',
          flex: isH ? undefined : 1,
          background: `linear-gradient(${isH ? '180deg' : '90deg'}, ${V.trackEdge}, ${V.track})`,
          borderRadius: 999,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,.6)',
          border: `1px solid ${V.trackEdge}`,
        }}
      >
        <div
          className="absolute transition-all duration-500"
          style={isH ? {
            left: 0, top: 0, bottom: 0, width: `${pct}%`,
            background: grad, borderRadius: 999,
            boxShadow: `0 0 10px ${main}66`,
          } : {
            left: 0, right: 0, bottom: 0, height: `${pct}%`,
            background: grad, borderRadius: 999,
            boxShadow: `0 0 10px ${main}66`,
          }}
        >
          {/* gloss */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: `linear-gradient(${isH ? '180deg' : '90deg'}, rgba(255,255,255,.35), rgba(255,255,255,0) 55%)` }} />
        </div>
      </div>

      <span className="font-semibold tabular-nums" style={{ color: V.text, fontSize: Math.max(11, Math.min(width, height) * 0.12) }}>
        {disp}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}
