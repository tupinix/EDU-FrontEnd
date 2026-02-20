import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, History, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { OEECard, OEEHistory, OEEConfig } from '../components/OEE';
import { useCurrentOEE } from '../hooks/useOEE';

type Tab = 'overview' | 'history' | 'configuration';

export function OEE() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: metrics = [], isLoading } = useCurrentOEE();

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview',       label: t('oee.tab.overview'),       icon: Gauge },
    { id: 'history',        label: t('oee.tab.history'),        icon: History },
    { id: 'configuration',  label: t('oee.tab.configuration'),  icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('oee.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('oee.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === item.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {tab === 'overview' && (
          <div>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500 text-sm">{t('common.loading')}</div>
            ) : metrics.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Gauge className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-base font-medium">{t('oee.noEquipment')}</p>
                <p className="text-sm mt-1">{t('oee.noEquipmentHint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {metrics.map((m) => (
                  <OEECard key={m.equipmentId} metrics={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'history' && <OEEHistory />}

        {tab === 'configuration' && <OEEConfig />}
      </div>
    </div>
  );
}
