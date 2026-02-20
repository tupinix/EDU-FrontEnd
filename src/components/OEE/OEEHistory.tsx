import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useOEEDefinitions, useOEEHistory } from '../../hooks/useOEE';
import { OEESnapshot } from '../../types';

type Period = 'today' | '7d' | '30d';

function periodToFilters(period: Period) {
  const now = new Date();
  const to = now.toISOString();
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to, limit: 300 };
  }
  if (period === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    return { from: start.toISOString(), to, limit: 500 };
  }
  const start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  return { from: start.toISOString(), to, limit: 1000 };
}

function formatSnap(snap: OEESnapshot) {
  return {
    time: new Date(snap.time).toLocaleString(),
    OEE: +(snap.oee * 100).toFixed(1),
    Disponibilidade: +(snap.availability * 100).toFixed(1),
    Performance: snap.performance !== null ? +(snap.performance * 100).toFixed(1) : null,
    Qualidade: +(snap.quality * 100).toFixed(1),
  };
}

export function OEEHistory() {
  const { t } = useTranslation();
  const { data: definitions = [] } = useOEEDefinitions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [period, setPeriod] = useState<Period>('today');

  const activeId = selectedId || definitions[0]?.id || '';
  const filters = periodToFilters(period);
  const { data: snapshots = [], isLoading } = useOEEHistory(activeId, filters);

  const chartData = [...snapshots].reverse().map(formatSnap);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: t('oee.history.today') },
    { key: '7d', label: t('oee.history.7d') },
    { key: '30d', label: t('oee.history.30d') },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={activeId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {definitions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            {t('common.loading')}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            {t('oee.history.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.split(',')[1]?.trim() || v}
              />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="OEE" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Disponibilidade" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Performance" stroke="#8b5cf6" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="Qualidade" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
