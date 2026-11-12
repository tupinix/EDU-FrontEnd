import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Loader2, ChevronDown, Database, X, FolderOpen, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTopicTree, useTopicDetails, useTopicHistory } from '../hooks/useTopics';
import { useActiveBroker, useBrokersStatus } from '../hooks/useMetrics';
import { useUIStore, useExplorerStore } from '../hooks/useStore';
import { TopicTree, TopicDetail, PayloadViewer } from '../components/Explorer';
import { TagTile } from '../components/Explorer/TagTile';
import { extractNumericValue, formatValue } from '../components/Explorer/value';
import {
  countValueTopics, filterTree, findNode, firstEquipment, folderChildren, leafName, parentPath, valueChildren,
} from '../components/Explorer/tree';
import { useQueryClient } from '@tanstack/react-query';
import type { TopicNode } from '../types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const PANEL = 'rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900';

export function Explorer() {
  const { t, i18n } = useTranslation();
  const { data: activeBroker } = useActiveBroker();
  const { data: brokersStatus } = useBrokersStatus();
  // Which broker's tree to show. '' = active (default), 'all' = every connected.
  const [brokerView, setBrokerView] = useState<string>('');
  const connectedBrokers = (brokersStatus?.brokers ?? []).filter((b) => b.status === 'connected');
  const { data: topics, isLoading: isLoadingTree, refetch: refetchTree } = useTopicTree(brokerView || undefined);
  const { selectedTopic, setSelectedTopic } = useUIStore();
  const { searchQuery, setSearchQuery, collapseAll, expandNode } = useExplorerStore();
  const queryClient = useQueryClient();

  // The equipment (namespace level) whose tags are on screen.
  const [equipmentPath, setEquipmentPath] = useState<string | null>(null);
  // Mobile: tree or the selected equipment's tags.
  const [mobilePanel, setMobilePanel] = useState<'tree' | 'tags'>('tags');

  // The UNS is fed by any ingestion source (OPC UA, Modbus, EtherNet/IP,
  // MQTT), not only an MQTT broker — and Kafka is an OUTPUT destination that
  // never populates it. So gate on whether the tree actually has topics,
  // not on an active MQTT broker.
  const hasTopics = (topics?.length ?? 0) > 0;

  const visibleTree = useMemo(() => filterTree(topics ?? [], searchQuery), [topics, searchQuery]);
  const tagCount = useMemo(() => countValueTopics(visibleTree), [visibleTree]);
  const equipment = useMemo(
    () => (equipmentPath ? findNode(topics ?? [], equipmentPath) : null) ?? firstEquipment(visibleTree),
    [topics, equipmentPath, visibleTree]
  );

  // Open the tree down to the equipment on screen, so its place in the namespace shows.
  useEffect(() => {
    if (!equipment) return;
    const parts = equipment.fullPath.split('/');
    for (let i = 1; i < parts.length; i++) expandNode(parts.slice(0, i).join('/'));
  }, [equipment?.fullPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arriving with a tag already selected (e.g. from another page): show its equipment.
  useEffect(() => {
    if (selectedTopic && !equipmentPath) setEquipmentPath(parentPath(selectedTopic));
  }, [selectedTopic]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectEquipment = (node: TopicNode) => {
    setEquipmentPath(node.fullPath);
    setSelectedTopic(null);
    setMobilePanel('tags');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['topics-tree'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    queryClient.invalidateQueries({ queryKey: ['topic-history'] });
    refetchTree();
  };

  const header = (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-950 dark:text-gray-50 sm:text-[24px]">
        {t('explorer.title')}
      </h1>
      <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{t('explorer.subtitle')}</p>
    </div>
  );

  // Nothing ingested into the UNS yet
  if (!isLoadingTree && !hasTopics) {
    return (
      <div className="space-y-6">
        {header}
        <section className={cn(PANEL, 'flex flex-col items-start gap-4 px-6 py-6 sm:flex-row sm:items-center')}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Database className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-[14.5px] font-medium text-gray-950 dark:text-gray-50">{t('explorer.noBroker')}</p>
            <p className="mt-0.5 max-w-xl text-[13.5px] text-gray-500 dark:text-gray-400">{t('explorer.noBrokerDesc')}</p>
          </div>
          <Link
            to="/opcua"
            className="rounded-full bg-[#03140c] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0b3a26] dark:bg-primary dark:hover:bg-primary/90"
          >
            {t('explorer.connectSource')}
          </Link>
        </section>
      </div>
    );
  }

  const tags = equipment ? valueChildren(equipment) : [];
  const subLevels = equipment ? folderChildren(equipment) : [];
  const drawerOpen = Boolean(selectedTopic);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-5 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {header}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Broker scope selector — default = active ("principal") broker */}
          <label className="sr-only" htmlFor="explorer-broker">{t('explorer.brokerScope')}</label>
          <select
            id="explorer-broker"
            value={brokerView}
            onChange={(e) => setBrokerView(e.target.value)}
            className="rounded-full border border-gray-200 bg-white py-2 pl-3.5 pr-8 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">
              {activeBroker ? t('explorer.mainBroker', { name: activeBroker.name }) : t('explorer.activeBroker')}
            </option>
            {connectedBrokers
              .filter((b) => b.id !== brokersStatus?.activeBrokerId)
              .map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            <option value="all">{t('explorer.allConnected')}</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoadingTree}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoadingTree && 'animate-spin')} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Mobile: tree or tags */}
      <div className="mb-3 flex shrink-0 gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800 lg:hidden" role="group">
        {(['tree', 'tags'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            aria-pressed={mobilePanel === panel}
            className={cn(
              'flex-1 rounded-full py-1.5 text-[13px] font-medium transition-colors',
              mobilePanel === panel ? 'bg-white text-gray-950 shadow-sm dark:bg-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {panel === 'tree' ? t('explorer.equipments') : (equipment?.name ?? t('explorer.topics'))}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        {/* Left — namespace levels */}
        <div
          className={cn(
            PANEL,
            'w-full flex-col overflow-hidden lg:flex lg:w-[300px] lg:shrink-0',
            mobilePanel === 'tree' ? 'flex' : 'hidden'
          )}
        >
          <div className="px-4 pb-2 pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                aria-label={t('explorer.searchTopics')}
                placeholder={t('explorer.searchTopics')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[13.5px] outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-900"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between px-1 text-[12.5px] text-gray-500 dark:text-gray-400">
              <span>{t('explorer.topicCount', { count: tagCount })}</span>
              <button onClick={() => collapseAll()} className="rounded-full px-2 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                {t('explorer.collapseAll')}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto border-t border-gray-100 dark:border-gray-800">
            {isLoadingTree ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              </div>
            ) : (
              <TopicTree nodes={visibleTree} selected={equipment?.fullPath ?? null} onSelect={selectEquipment} forceOpen={Boolean(searchQuery)} />
            )}
          </div>
        </div>

        {/* Right — the equipment's tags as live cards */}
        <div className={cn('min-w-0 flex-1 overflow-auto lg:block', mobilePanel === 'tags' ? 'block' : 'hidden')}>
          {equipment ? (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  {parentPath(equipment.fullPath) && (
                    <p className="truncate font-mono text-[12.5px] text-gray-400 dark:text-gray-500">{parentPath(equipment.fullPath)}/</p>
                  )}
                  <h2 className="truncate font-mono text-[20px] font-semibold text-gray-950 dark:text-gray-50">{equipment.name}</h2>
                </div>
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                  {t('explorer.tagsHere', { count: tags.length })}
                  {subLevels.length > 0 && `, ${t('explorer.subLevelsHere', { count: subLevels.length })}`}
                </span>
              </div>

              {tags.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                  {tags.map((tag) => (
                    <TagTile key={tag.fullPath} node={tag} selected={selectedTopic === tag.fullPath} onOpen={() => setSelectedTopic(tag.fullPath)} />
                  ))}
                </div>
              )}

              {/* Deeper levels: one click goes down the namespace. */}
              {subLevels.length > 0 && (
                <div className={cn(tags.length > 0 && 'mt-6')}>
                  <p className="mb-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">{t('explorer.subLevels')}</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                    {subLevels.map((lvl) => (
                      <button
                        key={lvl.fullPath}
                        onClick={() => selectEquipment(lvl)}
                        className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-left transition-colors hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900"
                      >
                        <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[13px] text-gray-900 dark:text-gray-100">{lvl.name}</span>
                          <span className="block text-[12px] text-gray-500 dark:text-gray-400">{t('explorer.topicCount', { count: countValueTopics([lvl]) })}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={cn(PANEL, 'flex h-full items-center justify-center border-dashed bg-transparent dark:bg-transparent')}>
              <p className="px-6 text-center text-[14px] text-gray-500">{t('explorer.noTopics')}</p>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && selectedTopic && (
        <TagDrawer topic={selectedTopic} onClose={() => setSelectedTopic(null)} locale={i18n.language} />
      )}
    </div>
  );
}

// ── Tag drawer ───────────────────────────────────────────────────────

function TagDrawer({ topic, onClose, locale }: { topic: string; onClose: () => void; locale: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: detail, isLoading, refetch } = useTopicDetails(topic);
  const { data: history } = useTopicHistory(topic, 50);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['topic-details', topic] });
    queryClient.invalidateQueries({ queryKey: ['topic-history', topic] });
    refetch();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 lg:bg-transparent" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-label={leafName(topic)}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f4f7f6] dark:bg-[#0f1117] lg:inset-auto lg:bottom-3 lg:right-3 lg:top-3 lg:w-[460px] lg:rounded-[24px] lg:border lg:border-gray-200 lg:shadow-[0_20px_60px_-20px_rgba(3,20,12,0.35)] dark:lg:border-gray-800"
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-4">
          <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{t('explorer.details')}</span>
          <button
            onClick={onClose}
            aria-label={t('explorer.closeDetails')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200/70 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4 pt-2">
          {isLoading ? (
            <div className={cn(PANEL, 'flex items-center justify-center p-8')}>
              <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
            </div>
          ) : detail ? (
            <TopicDetail topic={topic} detail={detail} isLoading={isLoading} onRefresh={refresh} />
          ) : null}

          {history && history.length > 1 && <TimeSeriesChart data={history} />}

          {detail && <PayloadViewer payload={detail.payload} maxHeight="220px" />}

          {history && history.length > 0 && (
            <section className={cn(PANEL, 'flex shrink-0 flex-col overflow-hidden')}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                aria-expanded={showHistory}
                className="flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-[15px] font-semibold text-gray-950 dark:text-gray-50">
                  {t('explorer.history')}
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {history.length}
                  </span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', showHistory && 'rotate-180')} />
              </button>
              {showHistory && (
                <div className="max-h-[320px] overflow-auto border-t border-gray-100 dark:border-gray-800">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        <th className="px-6 py-2 text-left font-medium">{t('explorer.time')}</th>
                        <th className="px-6 py-2 text-left font-medium">{t('explorer.value')}</th>
                        <th className="w-16 px-6 py-2 text-left font-medium">{t('explorer.qos')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => (
                        <tr key={`${item.receivedAt}-${index}`} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-6 py-2 text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
                            {new Date(item.receivedAt).toLocaleTimeString(locale)}
                          </td>
                          <td className="px-6 py-2 font-mono text-[12.5px] text-gray-800 dark:text-gray-200">{formatValue(item.payload, locale)}</td>
                          <td className="px-6 py-2 text-[12.5px] text-gray-500 dark:text-gray-400">{item.qos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Time Series Chart ────────────────────────────────────────────────

interface ChartDataPoint {
  time: string;
  value: number;
  ts: number;
}

const TREND = '#12a8b7';

function TimeSeriesChart({ data }: { data: { payload: unknown; receivedAt: string }[] }) {
  const { t, i18n } = useTranslation();
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data
      .map((item) => {
        const val = extractNumericValue(item.payload);
        if (val === null) return null;
        const d = new Date(item.receivedAt);
        return {
          time: d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: val,
          ts: d.getTime(),
        };
      })
      .filter((d): d is ChartDataPoint => d !== null)
      .sort((a, b) => a.ts - b.ts);
  }, [data, i18n.language]);

  if (chartData.length < 2) return null;

  return (
    <section className={cn(PANEL, 'shrink-0')}>
      <div className="flex items-baseline justify-between px-6 pt-4">
        <h2 className="text-[15px] font-semibold text-gray-950 dark:text-gray-50">{t('explorer.trend')}</h2>
        <span className="text-[12.5px] text-gray-500 dark:text-gray-400">{t('explorer.lastReadings', { count: chartData.length })}</span>
      </div>
      <div className="px-3 pb-3 pt-2" style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="explorerTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TREND} stopOpacity={0.18} />
                <stop offset="95%" stopColor={TREND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-tooltip-bg, #fff)',
                border: '1px solid var(--color-tooltip-border, #e5e7eb)',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 8px 24px -12px rgb(0 0 0 / 0.2)',
              }}
              labelStyle={{ color: '#6b7280', fontSize: '11px' }}
              formatter={(value: number) => [value.toLocaleString(i18n.language, { maximumFractionDigits: 4 }), t('explorer.value')]}
            />
            <Area type="monotone" dataKey="value" stroke={TREND} strokeWidth={1.75} fillOpacity={1} fill="url(#explorerTrend)" dot={false} activeDot={{ r: 3.5, fill: TREND, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
