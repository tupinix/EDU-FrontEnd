import { useTranslation } from 'react-i18next';
import { useDashboardMetrics, useActiveBroker } from '../hooks/useMetrics';
import { HealthStatus, MetricsCards, ConnectionsStatus } from '../components/Dashboard';
import { Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { editionLabels } from '../config/edition';

export function Dashboard() {
  const { t } = useTranslation();
  const { data: metrics, isLoading, error, refetch } = useDashboardMetrics();
  const { data: activeBroker } = useActiveBroker();
  const { editionMode } = useAuthStore();
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
        <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-8 text-center">
        <p className="text-[14px] text-gray-400 mb-3">{t('dashboard.errorLoading')}</p>
        <button
          onClick={handleRefresh}
          className="text-[13px] font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            {editionLabels[editionMode].title} &middot; {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasActiveBroker && metrics && (
            <div className="hidden sm:block">
              <HealthStatus
                status={metrics.system.brokerStatus}
                latency={metrics.system.brokerLatency}
              />
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-400 transition-colors"
            title={t('common.refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* No broker warning */}
      {!hasActiveBroker && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-8 py-10 text-center">
          <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1">{t('dashboard.noBroker')}</p>
          <p className="text-[13px] text-gray-400 mb-5 max-w-md mx-auto">
            {t('dashboard.noBrokerDesc')}
          </p>
          <Link
            to="/configuration"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t('dashboard.configureBrokers')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics */}
      {hasActiveBroker && metrics && (
        <MetricsCards
          messagesPerDay={metrics.system.messagesPerDay}
          messagesPerMinute={metrics.system.messagesPerMinute}
          totalTopics={metrics.system.totalTopics}
          errorRate={metrics.system.errorRate}
        />
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectionsStatus />

        {/* Top Topics */}
        {hasActiveBroker && metrics && metrics.topTopics.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                {t('dashboard.topActiveTopics')}
              </h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {metrics.topTopics.slice(0, 8).map((topic, index) => (
                <div key={topic.topic} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-[12px] text-gray-300 dark:text-gray-600 tabular-nums w-4 text-right">
                    {index + 1}
                  </span>
                  <p className="flex-1 min-w-0 text-[13px] font-mono text-gray-600 dark:text-gray-400 truncate">
                    {topic.topic}
                  </p>
                  <span className="text-[12px] text-gray-300 tabular-nums shrink-0">
                    {topic.count.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Uptime */}
      {hasActiveBroker && metrics && (
        <p className="text-center text-[12px] text-gray-300">
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
