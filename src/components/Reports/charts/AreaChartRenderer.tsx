import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint, ReportConfig } from '../../../types';

interface AreaChartRendererProps {
  data: ChartDataPoint[];
  config: ReportConfig;
}

export function AreaChartRenderer({ data, config }: AreaChartRendererProps) {
  const { visualization } = config;
  const colors = visualization.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Group data by topic for multiple series
  const topics = [...new Set(data.map(d => d.topic))].filter(Boolean);
  const hasSingleTopic = topics.length <= 1;

  // Format data for multiple series
  const formattedData = hasSingleTopic
    ? data.map(d => ({
        timestamp: new Date(d.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        value: d.value,
      }))
    : (() => {
        const grouped: Record<string, Record<string, number>> = {};
        data.forEach(d => {
          const time = new Date(d.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });
          if (!grouped[time]) {
            grouped[time] = { timestamp: time as unknown as number };
          }
          if (d.topic) {
            const seriesName = d.topic.split('/').pop() || d.topic;
            grouped[time][seriesName] = d.value;
          }
        });
        return Object.values(grouped);
      })();

  const seriesNames = hasSingleTopic
    ? ['value']
    : topics.map(t => t?.split('/').pop() || t || 'value');

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          {seriesNames.map((name, index) => (
            <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="timestamp"
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          label={{
            value: visualization.yAxis,
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#6B7280' }
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend />
        {seriesNames.map((name, index) => (
          <Area
            key={name}
            type="monotone"
            dataKey={name}
            name={name}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            fill={`url(#gradient-${name})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
