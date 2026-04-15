import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Bell } from 'lucide-react';
import { useAlerts, useToggleAlert, useDeleteAlert } from '../../hooks/useAlerts';
import { AlertForm } from './AlertForm';
import { AlertRule } from '../../types';
import { cn } from '@/lib/utils';

const statusDot: Record<string, string> = {
  good: 'bg-emerald-400',
  warn: 'bg-amber-400',
  bad: 'bg-red-400',
  unknown: 'bg-gray-300',
};

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  good: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Good' },
  warn: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', label: 'Warning' },
  bad: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'Bad' },
  unknown: { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-400', label: 'Unknown' },
};

function formatTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function AlertList() {
  const { data: alerts, isLoading, error } = useAlerts();
  const toggleMutation = useToggleAlert();
  const deleteMutation = useDeleteAlert();
  const [editing, setEditing] = useState<{ show: boolean; alert: AlertRule | null }>({ show: false, alert: null });

  if (editing.show) {
    return <AlertForm alert={editing.alert} onClose={() => setEditing({ show: false, alert: null })} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">
        Failed to load alerts: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">Tag-based alerting with Discord notifications</p>
        <button
          onClick={() => setEditing({ show: true, alert: null })}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Alert
        </button>
      </div>

      {(!alerts || alerts.length === 0) ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No alert rules configured</p>
          <p className="text-[12px] text-gray-300 mt-1">Create an alert to start monitoring your MQTT tags</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
          {alerts.map((alert: AlertRule) => {
            const status = alert.currentStatus || 'unknown';
            const badge = statusBadge[status] || statusBadge.unknown;

            return (
              <div key={alert.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[status] || 'bg-gray-300')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{alert.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">{alert.sourceTopic}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] shrink-0">
                  {alert.lastValue != null && (
                    <span className="text-[12px] font-mono text-gray-500 tabular-nums">{alert.lastValue}</span>
                  )}
                  <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-medium', badge.bg, badge.text)}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-300 shrink-0">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Bell className="w-3 h-3" />
                    {alert.totalNotifications}
                  </span>
                  <span>{formatTime(alert.lastNotifiedAt)}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-4 sm:ml-0 shrink-0">
                  <div
                    onClick={() => toggleMutation.mutate(alert.id)}
                    className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', alert.enabled ? 'bg-gray-900' : 'bg-gray-200')}
                  >
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', alert.enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                  </div>
                  <button onClick={() => setEditing({ show: true, alert })} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this alert?')) deleteMutation.mutate(alert.id); }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
