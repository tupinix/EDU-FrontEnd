import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, History, Settings } from 'lucide-react';
import { AlarmList } from '../components/Alarms/AlarmList';
import { AlarmConfig } from '../components/Alarms/AlarmConfig';
import { useActiveAlarms, useAlarmEvents } from '../hooks/useAlarms';
import { clsx } from 'clsx';

type Tab = 'active' | 'history' | 'configuration';

export function Alarms() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('active');

  const { data: activeAlarms = [], isLoading: loadingActive } = useActiveAlarms();
  const { data: historyAlarms = [], isLoading: loadingHistory } = useAlarmEvents(
    tab === 'history' ? { limit: 200 } : undefined
  );

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'active', label: t('alarms.active'), icon: Bell, count: activeAlarms.length },
    { id: 'history', label: t('alarms.history'), icon: History },
    { id: 'configuration', label: t('alarms.configuration'), icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('alarms.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('alarms.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === item.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                  tab === item.id ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {tab === 'active' && (
          <AlarmList
            events={activeAlarms}
            isLoading={loadingActive}
            showFilters={true}
          />
        )}
        {tab === 'history' && (
          <AlarmList
            events={historyAlarms}
            isLoading={loadingHistory}
            showFilters={true}
          />
        )}
        {tab === 'configuration' && (
          <AlarmConfig />
        )}
      </div>
    </div>
  );
}
