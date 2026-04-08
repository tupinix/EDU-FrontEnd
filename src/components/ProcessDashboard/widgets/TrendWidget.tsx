import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

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

const MAX_POINTS = 60;

export function TrendWidget({ value, width, height }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
  const lastValueRef = useRef<unknown>(undefined);
  const gradientId = `trend-gradient-${width}-${height}-${Math.random().toString(36).slice(2, 6)}`;

  useEffect(() => {
    if (value === null || value === undefined) return;
    const numValue = typeof value === 'number' ? value
      : typeof value === 'string' ? parseFloat(value)
      : typeof value === 'boolean' ? (value ? 1 : 0)
      : NaN;
    if (isNaN(numValue)) return;

    // Avoid duplicating the exact same value+time
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;

    const now = Date.now();
    const point: DataPoint = {
      time: now,
      value: numValue,
      label: new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setData((prev) => {
      const next = [...prev, point];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, [value]);

  if (data.length < 1) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span className="text-gray-600 text-[11px]">Waiting for data...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
            stroke="#10b981"
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 2, fill: '#10b981', stroke: '#fff', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
