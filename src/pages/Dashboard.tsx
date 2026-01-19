import { useTranslation } from 'react-i18next';
import { useDashboardMetrics, useBrokersStatus, useActiveBroker } from '../hooks/useMetrics';
import { HealthStatus, MetricsCards, BrokersStatus } from '../components/Dashboard';
import { Loader2, RefreshCw, ServerOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

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

  // Check if there's an active and connected broker
  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('dashboard.errorLoading')}: {error.message}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-100"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('dashboard.overview')}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* No Active Broker Warning */}
      {!hasActiveBroker && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ServerOff className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <h3 className="font-semibold text-yellow-800 mb-2">{t('dashboard.noBroker')}</h3>
          <p className="text-yellow-700 mb-4">
            {t('dashboard.noBrokerDesc')}
          </p>
          <Link to="/configuration" className="btn btn-primary">
            {t('dashboard.configureBrokers')}
          </Link>
        </div>
      )}

      {/* Health Status - Only show if active broker */}
      {hasActiveBroker && metrics && (
        <HealthStatus
          status={metrics.system.brokerStatus}
          latency={metrics.system.brokerLatency}
        />
      )}

      {/* Metrics Cards - Only show if active broker */}
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
        {/* Brokers Status - Always show */}
        {brokersData && (
          <BrokersStatus
            brokers={brokersData.brokers}
            activeBrokerId={brokersData.activeBrokerId}
          />
        )}

        {/* Top Topics - Only show if active broker */}
        {hasActiveBroker && metrics && metrics.topTopics.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">{t('dashboard.topActiveTopics')}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {metrics.topTopics.slice(0, 10).map((topic, index) => (
                <div key={topic.topic} className="p-4 flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate font-mono">{topic.topic}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {topic.count.toLocaleString('pt-BR')} msgs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Graph - Commented for now */}
      {/*
      {hasActiveBroker && (
        <KnowledgeGraph />
      )}
      */}

      {/* TimeSeries - Commented for now */}
      {/*
      {hasActiveBroker && (
        <TimeSeries />
      )}
      */}

      {/* Uptime - Only show if active broker */}
      {hasActiveBroker && metrics && (
        <div className="text-center text-sm text-gray-400">
          {t('dashboard.systemOnline')} {formatUptime(metrics.system.uptime)}
        </div>
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
