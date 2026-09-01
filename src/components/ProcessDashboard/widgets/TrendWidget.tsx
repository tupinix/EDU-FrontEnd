import { useState, useEffect, useRef, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { topicsApi } from '../../../services/api';
import { extractValue } from '../../../hooks/useDashboardLiveValues';

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

interface DataPoint {
  time: number;
  value: number;
  label: string;
}

// timeRange → window in ms. Used both to seed history and to prune live points.
const RANGE_MS: Record<string, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
};
const MAX_POINTS = 300;

function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  return NaN;
}

export function TrendWidget({ config, value }: Props) {
  const topic = String(config.tagBinding ?? '');
  const field = (config.tagField as string) || undefined;
  const timeRange = String(config.timeRange ?? '5m');
  const rangeMs = RANGE_MS[timeRange] ?? RANGE_MS['5m'];
  const color = String(config.color ?? '#10b981');

  const [data, setData] = useState<DataPoint[]>([]);
  const lastValueRef = useRef<unknown>(undefined);
  const gradientId = useMemo(() => `trend-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  // Seed the chart from REAL history whenever the topic or time range changes.
  // (Previously the timeRange config was ignored and only in-session values
  // were shown.)
  useEffect(() => {
    if (!topic) {
      setData([]);
      return;
    }
    let cancelled = false;
    const from = new Date(Date.now() - rangeMs).toISOString();
    topicsApi
      .getHistory(topic, MAX_POINTS, from)
      .then((rows) => {
        if (cancelled) return;
        const points: DataPoint[] = [];
        // Backend returns newest-first; walk ascending for the chart.
        for (const row of [...rows].reverse()) {
          const n = toNum(extractValue(row.payload, field));
          if (Number.isNaN(n)) continue;
          const t = new Date(row.receivedAt).getTime();
          points.push({ time: t, value: n, label: fmtTime(t) });
        }
        setData(points);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [topic, field, rangeMs]);

  // Append live values on top of the seeded history, pruning to the window.
  useEffect(() => {
    if (value === null || value === undefined) return;
    const numValue = toNum(value);
    if (Number.isNaN(numValue)) return;
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;

    const now = Date.now();
    setData((prev) => {
      const cutoff = now - rangeMs;
      const next = [...prev, { time: now, value: numValue, label: fmtTime(now) }].filter((p) => p.time >= cutoff);
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, [value, rangeMs]);

  if (data.length < 1) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span className="text-gray-600 text-[11px]">{topic ? 'Waiting for data...' : 'Bind a tag'}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#e5e7eb',
            }}
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.label) return payload[0].payload.label;
              return '';
            }}
            formatter={(val: number) => [val.toFixed(3), 'Value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 2, fill: color, stroke: '#fff', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
