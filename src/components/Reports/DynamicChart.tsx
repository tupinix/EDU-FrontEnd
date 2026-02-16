import { useTranslation } from 'react-i18next';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { ChartDataPoint, ReportConfig } from '../../types';
import {
  LineChartRenderer,
  BarChartRenderer,
  AreaChartRenderer,
  PieChartRenderer
} from './charts';

interface DynamicChartProps {
  config: ReportConfig;
  data: ChartDataPoint[];
}

export function DynamicChart({ config, data }: DynamicChartProps) {
  const { t } = useTranslation();

  const getChartIcon = () => {
    switch (config.chartType) {
      case 'line':
        return <LineChart className="w-5 h-5" />;
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'area':
        return <TrendingUp className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      default:
        return <LineChart className="w-5 h-5" />;
    }
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
          <p className="font-medium">{t('reports.noData')}</p>
          <p className="text-sm">{t('reports.noDataDesc')}</p>
        </div>
      );
    }

    switch (config.chartType) {
      case 'line':
        return <LineChartRenderer data={data} config={config} />;
      case 'bar':
        return <BarChartRenderer data={data} config={config} />;
      case 'area':
        return <AreaChartRenderer data={data} config={config} />;
      case 'pie':
        return <PieChartRenderer data={data} config={config} />;
      default:
        return <LineChartRenderer data={data} config={config} />;
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary-100 rounded-lg text-primary-600">
              {getChartIcon()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>

        {/* Chart type badge */}
        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          {t(`reports.chartTypes.${config.chartType}`)}
        </span>
      </div>

      {/* Chart */}
      <div className="min-h-[400px]">
        {renderChart()}
      </div>

      {/* Footer with metadata */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>
            <strong>Topicos:</strong> {config.query.topics.length > 0 ? config.query.topics.join(', ') : 'Todos'}
          </span>
          <span>
            <strong>Periodo:</strong> {config.query.timeRange.start} - {config.query.timeRange.end}
          </span>
          <span>
            <strong>Pontos:</strong> {data.length}
          </span>
        </div>
      )}
    </div>
  );
}
