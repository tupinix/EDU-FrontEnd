import { MessageSquare, Clock, Hash, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  trend?: number;
  suffix?: string;
}

function MetricCard({ title, value, icon: Icon, iconBg, trend, suffix }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-sm', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Mensagens/Dia"
        value={messagesPerDay}
        icon={MessageSquare}
        iconBg="bg-blue-50 text-blue-600"
      />
      <MetricCard
        title="Mensagens/Minuto"
        value={messagesPerMinute}
        icon={Clock}
        iconBg="bg-emerald-50 text-emerald-600"
      />
      <MetricCard
        title="Total de Tópicos"
        value={totalTopics}
        icon={Hash}
        iconBg="bg-purple-50 text-purple-600"
      />
      <MetricCard
        title="Taxa de Erro"
        value={errorRate.toFixed(2)}
        suffix="%"
        icon={AlertCircle}
        iconBg={errorRate > 1 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}
      />
    </div>
  );
}
