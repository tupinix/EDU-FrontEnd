import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, Square, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { OEEMetrics } from '../../types';
import { OEEGauge } from './OEEGauge';

interface OEECardProps {
  metrics: OEEMetrics;
}

function StatusBadge({ status }: { status: OEEMetrics['currentStatus'] }) {
  const { t } = useTranslation();

  const config = {
    running:  { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', Icon: Activity },
    stopped:  { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',   Icon: Square },
    fault:    { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',       Icon: AlertTriangle },
    unknown:  { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', Icon: HelpCircle },
  }[status];

  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', config.color)}>
      <config.Icon className="h-3 w-3" />
      {t(`oee.status.${status}`)}
    </span>
  );
}

export function OEECard({ metrics }: OEECardProps) {
  const { t } = useTranslation();
  const oeePercent = (metrics.oee * 100);
  const avail = (metrics.availability * 100);
  const perf = metrics.performance !== null ? (metrics.performance * 100) : null;
  const qual = (metrics.quality * 100);

  const oeeColor =
    oeePercent >= 85 ? '#22c55e' :
    oeePercent >= 60 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
            {metrics.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t('oee.since')}: {new Date(metrics.since).toLocaleTimeString()}
          </p>
        </div>
        <StatusBadge status={metrics.currentStatus} />
      </div>

      {/* OEE total */}
      <div className="flex justify-center">
        <OEEGauge value={oeePercent} label="OEE" color={oeeColor} size={140} />
      </div>

      {/* 3 sub-gauges */}
      <div className="grid grid-cols-3 gap-2">
        <OEEGauge value={avail} label={t('oee.availability')} color="#3b82f6" size={90} />
        <OEEGauge
          value={perf ?? 0}
          label={t('oee.performance')}
          color="#8b5cf6"
          size={90}
        />
        <OEEGauge value={qual} label={t('oee.quality')} color="#06b6d4" size={90} />
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{metrics.totalCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('oee.pieces')}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            {metrics.totalCount - metrics.goodCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('oee.rejects')}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(metrics.runMinutes)} min
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('oee.running')}</p>
        </div>
      </div>
    </div>
  );
}
