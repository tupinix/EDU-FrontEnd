import { MessageSquare, Clock, Hash, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number;
  suffix?: string;
}

function MetricCard({ title, value, icon: Icon, color, trend, suffix }: MetricCardProps) {
  return (
    <div className="card">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className={clsx('p-2 rounded-lg', color)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={clsx('flex items-center gap-1 text-sm', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
          </p>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
        </div>
      </div>
    </div>
  );
}

interface MetricsCardsProps {
  messagesPerDay: number;
  messagesPerMinute: number;
  totalTopics: number;
  errorRate: number;
}

export function MetricsCards({ messagesPerDay, messagesPerMinute, totalTopics, errorRate }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Mensagens/Dia"
        value={messagesPerDay}
        icon={MessageSquare}
        color="bg-blue-100 text-blue-600"
      />
      <MetricCard
        title="Mensagens/Minuto"
        value={messagesPerMinute}
        icon={Clock}
        color="bg-green-100 text-green-600"
      />
      <MetricCard
        title="Total de Tópicos"
        value={totalTopics}
        icon={Hash}
        color="bg-purple-100 text-purple-600"
      />
      <MetricCard
        title="Taxa de Erro"
        value={errorRate.toFixed(2)}
        suffix="%"
        icon={AlertCircle}
        color={errorRate > 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
      />
    </div>
  );
}
