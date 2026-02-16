import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint, ReportConfig } from '../../../types';

interface BarChartRendererProps {
  data: ChartDataPoint[];
  config: ReportConfig;
}

export function BarChartRenderer({ data, config }: BarChartRendererProps) {
  const { visualization } = config;
  const colors = visualization.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Check if this is distribution data (each item has a different topic, same timestamp)
  const uniqueTimestamps = new Set(data.map(d => d.timestamp));
  const isDistributionData = uniqueTimestamps.size === 1 && data.length > 1;

  // Group data by topic for multiple series
  const topics = [...new Set(data.map(d => d.topic))].filter(Boolean);
  const hasSingleTopic = topics.length <= 1;

  // Format data for distribution (horizontal bar chart style)
  if (isDistributionData) {
    const formattedData = data.map(d => {
      const topicParts = d.topic?.split('/') || [];
      const shortName = topicParts.length > 2
        ? topicParts.slice(-2).join('/')
        : topicParts.pop() || 'Unknown';
      return {
        name: d.name || shortName,
        value: d.value,
      };
    });

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" stroke="#6B7280" fontSize={12} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar dataKey="value" fill={colors[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Format data for multiple series (timeseries)
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
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
          <Bar
            key={name}
            dataKey={name}
            name={name}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
