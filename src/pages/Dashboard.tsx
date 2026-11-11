import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardMetrics, useActiveBroker } from '../hooks/useMetrics';
import { MetricsCards, ConnectionsStatus } from '../components/Dashboard';
import { Loader2, RefreshCw, Radio } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { kafkaApi } from '../services/api';
import type { KafkaConnector } from '../types';

const HISTORY_SIZE = 20;

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { data: metrics, isLoading, error, refetch } = useDashboardMetrics();
  const { data: activeBroker } = useActiveBroker();
  const { data: kafkaConnectors } = useQuery<KafkaConnector[], Error>({
    queryKey: ['kafka-connectors'],
    queryFn: kafkaApi.getConnectors,
    refetchInterval: 5000,
  });
  const queryClient = useQueryClient();

  // Messages per minute sampled on each metrics refresh while the page is open,
  // for the sparkline next to the number.
  const [perMinuteHistory, setPerMinuteHistory] = useState<number[]>([]);
  useEffect(() => {
    if (!metrics) return;
    setPerMinuteHistory((h) => [...h, metrics.system.messagesPerMinute].slice(-HISTORY_SIZE));
  }, [metrics]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['brokers-status'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    queryClient.invalidateQueries({ queryKey: ['kafka-connectors'] });
    refetch();
  };

  // A Kafka connection is a broker too: the active + connected Kafka
  // connector makes the dashboard "live" even when there's no MQTT broker
  // (the Flex edge case, where Kafka/Redpanda is the destination).
  const hasActiveMqtt = Boolean(activeBroker && activeBroker.status === 'connected');
  const hasActiveKafka = (kafkaConnectors ?? []).some((c) => c.isActive && c.status === 'connected');
  const hasActiveBroker = hasActiveMqtt || hasActiveKafka;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-[14px] text-gray-500">{t('dashboard.errorLoading')}</p>
        <button
          onClick={handleRefresh}
          className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  const topTopics = metrics?.topTopics.slice(0, 8) ?? [];
  const maxCount = topTopics[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-950 dark:text-gray-50 sm:text-[24px]">
            {t('dashboard.heading')}
          </h1>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{t('dashboard.subheading')}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('common.refresh')}
        </button>
      </div>

      {/* No broker: nothing reaches the namespace yet */}
      {!hasActiveBroker && (
        <section className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200/80 bg-white px-6 py-6 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
            <Radio className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-[14.5px] font-medium text-gray-950 dark:text-gray-50">{t('dashboard.noBroker')}</p>
            <p className="mt-0.5 max-w-xl text-[13.5px] text-gray-500 dark:text-gray-400">{t('dashboard.noBrokerDesc')}</p>
          </div>
          <Link
            to="/configuration"
            className="rounded-full bg-[#03140c] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0b3a26] dark:bg-primary dark:hover:bg-primary/90"
          >
            {t('dashboard.configureBrokers')}
          </Link>
        </section>
      )}

      {hasActiveBroker && metrics && (
        <MetricsCards
          messagesPerDay={metrics.system.messagesPerDay}
          messagesPerMinute={metrics.system.messagesPerMinute}
          totalTopics={metrics.system.totalTopics}
          errorRate={metrics.system.errorRate}
          perMinuteHistory={perMinuteHistory}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ConnectionsStatus />

        {hasActiveBroker && topTopics.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
            <h2 className="px-6 pb-3 pt-5 text-[15px] font-semibold text-gray-950 dark:text-gray-50">
              {t('dashboard.topActiveTopics')}
            </h2>
            <ol>
              {topTopics.map((topic) => {
                const parts = topic.topic.split('/');
                const leaf = parts.pop();
                return (
                  <li key={topic.topic} className="relative border-t border-gray-100 px-6 py-3 dark:border-gray-800">
                    {/* Bar behind the row: share of the busiest topic. */}
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 bg-emerald-50/80 dark:bg-emerald-900/20"
                      style={{ width: `${(topic.count / maxCount) * 100}%` }}
                    />
                    <div className="relative flex items-center gap-3" title={topic.topic}>
                      <span className="min-w-0 truncate font-mono text-[12.5px]">
                        {parts.length > 0 && <span className="text-gray-400 dark:text-gray-500">{parts.join('/')}/</span>}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{leaf}</span>
                      </span>
                      <span className="ml-auto shrink-0 text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
                        {topic.count.toLocaleString(i18n.language)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>

      {hasActiveBroker && metrics && (
        <p className="text-center text-[12.5px] text-gray-400">
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
