import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Loader2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTopicTree, useTopicDetails, useTopicHistory } from '../hooks/useTopics';
import { useActiveBroker } from '../hooks/useMetrics';
import { useUIStore, useExplorerStore } from '../hooks/useStore';
import { TopicTree, TopicDetail, PayloadViewer } from '../components/Explorer';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function Explorer() {
  const { t } = useTranslation();
  const { data: activeBroker } = useActiveBroker();
  const { data: topics, isLoading: isLoadingTree, refetch: refetchTree } = useTopicTree();
  const { selectedTopic } = useUIStore();
  const { searchQuery, setSearchQuery, collapseAll } = useExplorerStore();
  const queryClient = useQueryClient();

  const { data: topicDetail, isLoading: isLoadingDetail, refetch: refetchDetail } = useTopicDetails(selectedTopic);
  const { data: topicHistory } = useTopicHistory(selectedTopic, 50);

  const [showHistory, setShowHistory] = useState(false);
  const [showChart, setShowChart] = useState(false);
  // Mobile: which panel is visible
  const [mobilePanel, setMobilePanel] = useState<'tree' | 'detail'>('tree');

  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['topics-tree'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    refetchTree();
  };

  const handleRefreshDetail = () => {
    if (selectedTopic) {
      queryClient.invalidateQueries({ queryKey: ['topic-details', selectedTopic] });
      queryClient.invalidateQueries({ queryKey: ['topic-history', selectedTopic] });
      refetchDetail();
    }
  };

  const filteredTopics = topics?.filter((topic) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return topic.fullPath.toLowerCase().includes(q) || topic.name.toLowerCase().includes(q);
  });

  // No broker
  if (!hasActiveBroker) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            {t('explorer.title')}
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{t('explorer.subtitle')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 px-8 py-12 text-center">
          <p className="text-[15px] font-medium text-gray-900 mb-1">{t('explorer.noBroker')}</p>
          <p className="text-[13px] text-gray-400 mb-5 max-w-md mx-auto">{t('explorer.noBrokerDesc')}</p>
          <Link
            to="/configuration"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-900 hover:text-gray-600 transition-colors"
          >
            {t('dashboard.configureBrokers')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            {t('explorer.title')}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            {t('explorer.subtitle')}
            {activeBroker && (
              <span className="text-gray-500"> &middot; {activeBroker.name}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingTree}
          className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4', isLoadingTree && 'animate-spin')} />
        </button>
      </div>

      {/* Mobile panel switcher */}
      {selectedTopic && (
        <div className="flex lg:hidden mb-3 shrink-0">
          <button
            onClick={() => setMobilePanel('tree')}
            className={cn(
              'flex-1 py-2 text-[13px] font-medium rounded-l-lg border transition-colors',
              mobilePanel === 'tree'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            Topics
          </button>
          <button
            onClick={() => setMobilePanel('detail')}
            className={cn(
              'flex-1 py-2 text-[13px] font-medium rounded-r-lg border border-l-0 transition-colors',
              mobilePanel === 'detail'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            Details
          </button>
        </div>
      )}

      {/* Panels */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left — Topic Tree */}
        <div className={cn(
          'bg-white rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden',
          'w-full lg:w-[340px] lg:shrink-0',
          // Mobile: hide when detail panel is active
          selectedTopic && mobilePanel === 'detail' ? 'hidden lg:flex' : 'flex'
        )}>
          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder={t('explorer.searchTopics')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100"
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 text-[11px] text-gray-400">
              <span>{filteredTopics?.length || 0} {t('explorer.topics').toLowerCase()}</span>
              <button onClick={() => collapseAll()} className="hover:text-gray-500 transition-colors">
                {t('explorer.collapseAll')}
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-auto">
            {isLoadingTree ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            ) : filteredTopics && filteredTopics.length > 0 ? (
              <TopicTree topics={filteredTopics} />
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-[13px] text-gray-300">{t('explorer.noTopics')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Detail */}
        <div className={cn(
          'flex-1 flex flex-col gap-4 overflow-auto min-w-0',
          // Mobile: hide when tree panel is active
          !selectedTopic || mobilePanel === 'tree' ? 'hidden lg:flex' : 'flex'
        )}>
          {selectedTopic ? (
            <>
              {/* Back button (mobile) */}
              <button
                onClick={() => setMobilePanel('tree')}
                className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 lg:hidden shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to topics
              </button>

              {/* Detail card */}
              {isLoadingDetail ? (
                <div className="bg-white rounded-2xl border border-gray-200/60 p-8 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                </div>
              ) : topicDetail ? (
                <TopicDetail
                  topic={selectedTopic}
                  detail={topicDetail}
                  isLoading={isLoadingDetail}
                  onRefresh={handleRefreshDetail}
                />
              ) : null}

              {/* Payload */}
              {topicDetail && (
                <PayloadViewer payload={topicDetail.payload} maxHeight="200px" />
              )}

              {/* Chart */}
              {topicHistory && topicHistory.length > 1 && (
                <TimeSeriesChart data={topicHistory} show={showChart} onToggle={() => setShowChart(!showChart)} />
              )}

              {/* History */}
              {topicHistory && topicHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden flex flex-col flex-1 min-h-0">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0"
                  >
                    <span className="text-[13px] font-semibold text-gray-900">
                      {t('explorer.history')}
                      <span className="text-gray-300 font-normal ml-1.5">{topicHistory.length}</span>
                    </span>
                    {showHistory ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </button>
                  {showHistory && (
                    <div className="flex-1 overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-[11px] text-gray-400 border-b border-gray-50">
                            <th className="text-left font-medium px-5 py-2">{t('explorer.time')}</th>
                            <th className="text-left font-medium px-5 py-2">{t('explorer.value')}</th>
                            <th className="text-left font-medium px-5 py-2 w-16">{t('explorer.qos')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topicHistory.map((item, index) => (
                            <tr
                              key={`${item.receivedAt}-${index}`}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="px-5 py-2 text-[12px] text-gray-400 tabular-nums">
                                {new Date(item.receivedAt).toLocaleTimeString('pt-BR')}
                              </td>
                              <td className="px-5 py-2 text-[12px] font-mono text-gray-700">
                                {formatValue(item.payload)}
                              </td>
                              <td className="px-5 py-2 text-[12px] text-gray-400">{item.qos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] text-gray-400">{t('explorer.selectTopic')}</p>
                <p className="text-[12px] text-gray-300 mt-1">{t('explorer.selectTopicHint')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Time Series Chart ────────────────────────────────────────────────

interface ChartDataPoint {
  time: string;
  value: number;
  ts: number;
}

function TimeSeriesChart({ data, show, onToggle }: { data: { payload: unknown; receivedAt: string }[]; show: boolean; onToggle: () => void }) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data
      .map((item) => {
        const val = extractNumericValue(item.payload);
        if (val === null) return null;
        const d = new Date(item.receivedAt);
        return {
          time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: val,
          ts: d.getTime(),
        };
      })
      .filter((d): d is ChartDataPoint => d !== null)
      .sort((a, b) => a.ts - b.ts);
  }, [data]);

  if (chartData.length < 2) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-3 border-b border-gray-100 flex items-center justify-between"
      >
        <span className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
          Trend
          <span className="text-gray-300 font-normal">{chartData.length} pts</span>
        </span>
        {show ? <ChevronUp className="w-3.5 h-3.5 text-gray-300" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
      </button>
      {show && (
        <div className="px-3 py-4" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#d1d5db' }}
                axisLine={{ stroke: '#f3f4f6' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#d1d5db' }}
                axisLine={false}
                tickLine={false}
                width={50}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                }}
                labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
                formatter={(value: number) => [value.toFixed(4), 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue)"
                dot={false}
                activeDot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function extractNumericValue(payload: unknown): number | null {
  if (typeof payload === 'number') return payload;
  if (typeof payload === 'boolean') return payload ? 1 : 0;
  if (typeof payload === 'string') {
    const n = parseFloat(payload);
    return isNaN(n) ? null : n;
  }
  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;
    // Try common value fields
    for (const key of ['value', 'Value', 'val', 'data', 'measurement']) {
      if (key in obj) return extractNumericValue(obj[key]);
    }
  }
  return null;
}

function formatValue(payload: unknown): string {
  if (payload === null || payload === undefined) return '-';
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj.value !== undefined) return String(obj.value);
    return JSON.stringify(payload).substring(0, 50) + '...';
  }
  return String(payload);
}
