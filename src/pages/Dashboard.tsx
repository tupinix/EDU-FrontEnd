import { useTranslation } from 'react-i18next';
import { useDashboardMetrics, useBrokersStatus, useActiveBroker } from '../hooks/useMetrics';
import { HealthStatus, MetricsCards, BrokersStatus } from '../components/Dashboard';
import { Loader2, RefreshCw, ServerOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export function Dashboard() {
  const { t } = useTranslation();
  const { data: metrics, isLoading, error, refetch } = useDashboardMetrics();
  const { data: brokersData } = useBrokersStatus();
  const { data: activeBroker } = useActiveBroker();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['brokers-status'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    refetch();
  };

  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <p className="text-destructive">{t('dashboard.errorLoading')}: {error.message}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
            {t('common.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.overview')}
        actions={
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        }
      />

      {/* No Active Broker Warning */}
      {!hasActiveBroker && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <ServerOff className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('dashboard.noBroker')}</h3>
            <p className="text-sm text-yellow-700 mb-4">{t('dashboard.noBrokerDesc')}</p>
            <Button asChild>
              <Link to="/configuration">{t('dashboard.configureBrokers')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Health Status */}
      {hasActiveBroker && metrics && (
        <HealthStatus
          status={metrics.system.brokerStatus}
          latency={metrics.system.brokerLatency}
        />
      )}

      {/* Metrics Cards */}
      {hasActiveBroker && metrics && (
        <MetricsCards
          messagesPerDay={metrics.system.messagesPerDay}
          messagesPerMinute={metrics.system.messagesPerMinute}
          totalTopics={metrics.system.totalTopics}
          errorRate={metrics.system.errorRate}
        />
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {brokersData && (
          <BrokersStatus
            brokers={brokersData.brokers}
            activeBrokerId={brokersData.activeBrokerId}
          />
        )}

        {/* Top Topics */}
        {hasActiveBroker && metrics && metrics.topTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.topActiveTopics')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {metrics.topTopics.slice(0, 10).map((topic, index) => (
                  <div key={topic.topic} className="px-6 py-3 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="flex-1 min-w-0 text-sm font-mono truncate">{topic.topic}</p>
                    <span className="text-xs text-muted-foreground">
                      {topic.count.toLocaleString('pt-BR')} {t('dashboard.msgs')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Uptime */}
      {hasActiveBroker && metrics && (
        <p className="text-center text-xs text-muted-foreground">
          {t('dashboard.systemOnline')} {formatUptime(metrics.system.uptime)}
        </p>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}
