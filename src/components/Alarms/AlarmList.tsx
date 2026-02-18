import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AlarmEvent, AlarmPriority, AlarmState } from '../../types';
import { AlarmAcknowledge } from './AlarmAcknowledge';
import { clsx } from 'clsx';

interface Props {
  events: AlarmEvent[];
  isLoading?: boolean;
  showFilters?: boolean;
}

const PRIORITY_ORDER: Record<AlarmPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const PRIORITY_CLASSES: Record<AlarmPriority, string> = {
  critical: 'bg-red-50 border-l-4 border-l-red-500',
  high: 'bg-orange-50 border-l-4 border-l-orange-500',
  medium: 'bg-yellow-50 border-l-4 border-l-yellow-400',
  low: 'bg-blue-50 border-l-4 border-l-blue-400',
  info: 'bg-gray-50 border-l-4 border-l-gray-300',
};

const PRIORITY_BADGE: Record<AlarmPriority, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-700',
};

export function AlarmList({ events, isLoading, showFilters = true }: Props) {
  const { t } = useTranslation();
  const [filterPriority, setFilterPriority] = useState<AlarmPriority | 'all'>('all');
  const [filterState, setFilterState] = useState<AlarmState | 'all'>('all');
  const [acknowledging, setAcknowledging] = useState<AlarmEvent | null>(null);

  const filtered = events
    .filter((e) => filterPriority === 'all' || e.priority === filterPriority)
    .filter((e) => filterState === 'all' || e.state === filterState)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showFilters && (
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as AlarmPriority | 'all')}
            className="input text-sm py-1.5"
          >
            <option value="all">{t('alarms.filters.allPriorities')}</option>
            {(['critical', 'high', 'medium', 'low', 'info'] as AlarmPriority[]).map((p) => (
              <option key={p} value={p}>{t(`alarms.priorities.${p}`)}</option>
            ))}
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as AlarmState | 'all')}
            className="input text-sm py-1.5"
          >
            <option value="all">{t('alarms.filters.allStates')}</option>
            {(['active_unack', 'active_ack', 'rtn_unack', 'normal'] as AlarmState[]).map((s) => (
              <option key={s} value={s}>{t(`alarms.states.${s}`)}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 self-center">
            {filtered.length} {t('alarms.events')}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p className="font-medium text-gray-600">{t('alarms.noActiveAlarms')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className={clsx(
                'rounded-lg px-4 py-3 flex items-center gap-4',
                PRIORITY_CLASSES[event.priority]
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {event.state === 'active_unack' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                ) : event.state === 'rtn_unack' ? (
                  <Clock className="w-5 h-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {event.alarmName}
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    PRIORITY_BADGE[event.priority]
                  )}>
                    {t(`alarms.priorities.${event.priority}`)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 text-gray-600 border border-gray-200">
                    {t(`alarms.states.${event.state}`)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span className="font-mono truncate">{event.topic}</span>
                  {event.triggeredValue !== undefined && (
                    <span>
                      {t('alarms.fields.value')}: <strong>{event.triggeredValue}</strong>
                    </span>
                  )}
                  <span>{new Date(event.triggeredAt).toLocaleString('pt-BR')}</span>
                  {event.acknowledgedBy && (
                    <span className="text-green-600">
                      ✓ {event.acknowledgedBy}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {event.state === 'active_unack' && (
                <button
                  onClick={() => setAcknowledging(event)}
                  className="flex-shrink-0 btn btn-secondary text-xs py-1.5 px-3"
                >
                  {t('alarms.acknowledge')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {acknowledging && (
        <AlarmAcknowledge
          event={acknowledging}
          onClose={() => setAcknowledging(null)}
        />
      )}
    </div>
  );
}
