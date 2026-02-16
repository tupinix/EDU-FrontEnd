import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint, ReportConfig } from '../../../types';

interface PieChartRendererProps {
  data: ChartDataPoint[];
  config: ReportConfig;
}

export function PieChartRenderer({ data, config }: PieChartRendererProps) {
  const { visualization } = config;
  const colors = visualization.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  // Format data for pie chart - use last 2 segments of topic for better readability
  const formattedData = data.map(d => {
    const topicParts = d.topic?.split('/') || [];
    const shortName = topicParts.length > 2
      ? topicParts.slice(-2).join('/')
      : topicParts.pop() || 'Unknown';
    return {
      name: d.name || shortName,
      value: d.value,
      fullTopic: d.topic,
    };
  });

  // Calculate total for percentage
  const total = formattedData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null; // Don't show label for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={150}
          innerRadius={60}
          dataKey="value"
          paddingAngle={2}
        >
          {formattedData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} (${((value / total) * 100).toFixed(1)}%)`,
            name
          ]}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value) => (
            <span style={{ color: '#374151', fontSize: '14px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
