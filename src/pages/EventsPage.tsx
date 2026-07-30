import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ChevronRight, ChevronLeft, Trash2, Search, X, FolderTree, SlidersHorizontal, Loader2, Plus } from 'lucide-react';
import { eventsApi, publishRulesApi, kafkaApi, EventTypeRef, EventTypeSelection, PublishRuleEntry } from '../services/api';
import { EuromapEvent, MachineAlarm, KafkaConnector } from '../types';
import { cn } from '@/lib/utils';

type Tab = 'live' | 'history' | 'alarms' | 'types';
const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'live', labelKey: 'events.tabs.live' },
  { key: 'history', labelKey: 'events.tabs.history' },
  { key: 'alarms', labelKey: 'events.tabs.alarms' },
  { key: 'types', labelKey: 'events.tabs.types' },
];

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}

const cardCls = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50';
const inputCls = 'px-3 py-1.5 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 w-28';

export function EventsPage() {
  const { t } = useTranslation();
  const [machineId, setMachineId] = useState('IMM-01');
  const [tab, setTab] = useState<Tab>('live');
  const [hours, setHours] = useState(3);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{t('events.title')}</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">{t('events.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
            {TABS.map((tb) => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors',
                  tab === tb.key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200')}>
                {t(tb.labelKey)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'history' && (
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="px-2.5 py-1.5 text-[12px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value={1}>1h</option><option value={3}>3h</option><option value={12}>12h</option><option value={24}>24h</option><option value={48}>48h</option><option value={168}>7d</option>
              </select>
            )}
            <label className="text-[11px] font-medium text-gray-400">machineId</label>
            <input value={machineId} onChange={(e) => setMachineId(e.target.value)} className={inputCls} />
          </div>
        </div>

        {tab === 'live' && <LiveEvents machineId={machineId} />}
        {tab === 'history' && <HistoryEvents machineId={machineId} hours={hours} />}
        {tab === 'alarms' && <Alarms machineId={machineId} />}
        {tab === 'types' && <MonitoredTypes key={machineId} machineId={machineId} />}
      </div>
    </div>
  );
}

const PAGE_SIZES = [25, 50, 100] as const;

interface PagerControls {
  page: number;
  pages: number;
  size: number;
  total: number;
  from: number;
  to: number;
  prev: () => void;
  next: () => void;
  setSize: (n: number) => void;
}

function usePager<T>(items: T[], initialSize: number = PAGE_SIZES[0]): { slice: T[]; pager: PagerControls } {
  const [page, setPage] = useState(0);
  const [size, setSizeRaw] = useState(initialSize);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const cur = Math.min(page, pages - 1);
  const slice = items.slice(cur * size, (cur + 1) * size);
  return {
    slice,
    pager: {
      page: cur,
      pages,
      size,
      total: items.length,
      from: items.length === 0 ? 0 : cur * size + 1,
      to: Math.min((cur + 1) * size, items.length),
      prev: () => setPage(Math.max(0, cur - 1)),
      next: () => setPage(Math.min(pages - 1, cur + 1)),
      setSize: (n: number) => { setSizeRaw(n); setPage(0); },
    },
  };
}

const pagerBtn = 'p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

function Pager({ p }: { p: PagerControls }) {
  const { t } = useTranslation();
  if (p.total <= PAGE_SIZES[0]) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-1">
      <span className="text-[11px] text-gray-400 tabular-nums">{t('events.pager.range', { from: p.from, to: p.to, total: p.total })}</span>
      <div className="flex items-center gap-2">
        <select
          value={p.size}
          onChange={(e) => p.setSize(Number(e.target.value))}
          className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          title={t('events.pager.perPageTitle')}
        >
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{t('events.pager.perPage', { n })}</option>)}
        </select>
        <button onClick={p.prev} disabled={p.page === 0} className={pagerBtn} title={t('events.pager.prev')}><ChevronLeft className="w-3.5 h-3.5" /></button>
        <span className="text-[11px] text-gray-400 tabular-nums">{p.page + 1}/{p.pages}</span>
        <button onClick={p.next} disabled={p.page >= p.pages - 1} className={pagerBtn} title={t('events.pager.next')}><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
      <p className="text-[14px] text-gray-400">{text}</p>
    </div>
  );
}

interface Selection {
  selected: Set<string>;
  toggle: (eventId: string) => void;
  toggleAll: () => void;
  allSelected: boolean;
}

/**
 * Stable per-event identity, independent of the row's position in the list.
 * Keeps the expanded inspector open when a refetch prepends new events.
 */
function eventKey(ev: EuromapEvent): string {
  return ev.eventId ?? `${ev.sourceTimestamp ?? ''}|${ev.receiveTimestamp ?? ''}|${ev.eventTypeNodeId ?? ''}`;
}

function EventList({ events, selection }: { events: EuromapEvent[]; selection?: Selection }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  if (events.length === 0) return <EmptyState text={t('events.list.empty')} />;
  return (
    <div className={cardCls}>
      {selection && (
        <label className="px-5 sm:px-6 py-2 flex items-center gap-3 text-[11px] text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} className="accent-gray-900 dark:accent-white" />
          {t('events.list.selectAllDeletable')}
        </label>
      )}
      {events.map((ev) => {
        const key = eventKey(ev);
        const isCycle = /cycle/i.test(ev.eventTypeName || '') || ev.kind === 'cycle';
        const fieldKeys = Object.keys(ev.fields || {});
        const isOpen = open === key;
        const canDelete = !!(selection && ev.eventId);
        const checked = !!(selection && ev.eventId && selection.selected.has(ev.eventId));
        return (
          <div key={key}>
            <div className="px-5 sm:px-6 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              {selection && (
                <input type="checkbox" disabled={!canDelete} checked={checked}
                  onChange={() => ev.eventId && selection.toggle(ev.eventId)}
                  className="accent-gray-900 dark:accent-white disabled:opacity-30 shrink-0" title={canDelete ? t('events.list.selectToDelete') : t('events.list.notDeletable')} />
              )}
              <div onClick={() => setOpen(isOpen ? null : key)} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                <span className="text-[12px] tabular-nums text-gray-400 w-20 shrink-0">{fmtTime(ev.sourceTimestamp)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isCycle ? 'bg-emerald-400' : 'bg-gray-300')} />
                    <p className={cn('text-[13px] font-medium truncate', isCycle ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100')}>{ev.eventTypeName || ev.eventTypeNodeId}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">{fieldKeys.slice(0, 5).map((k) => `${k}=${JSON.stringify(ev.fields[k])}`).join('  ')}</p>
                </div>
                <ChevronRight className={cn('w-4 h-4 text-gray-300 shrink-0 transition-transform', isOpen && 'rotate-90')} />
              </div>
            </div>
            {isOpen && (
              <div className="px-5 sm:px-6 pb-3 bg-gray-50/60 dark:bg-gray-900/60">
                <pre className="text-[11px] text-gray-600 dark:text-gray-300 overflow-auto max-h-64 pt-2">{JSON.stringify({ eventTypeName: ev.eventTypeName, kind: ev.kind, eventId: ev.eventId, sourceTimestamp: ev.sourceTimestamp, fields: ev.fields, processValues: ev.processValues }, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveEvents({ machineId }: { machineId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery<EuromapEvent[]>({
    queryKey: ['events-recent', machineId],
    queryFn: () => eventsApi.recent(machineId),
    refetchInterval: 3000,
  });
  // "Limpar" apaga o buffer do feed ao vivo NO SERVIDOR (persiste entre
  // páginas/refresh); eventos novos continuam aparecendo normalmente.
  const clearMut = useMutation({
    mutationFn: () => eventsApi.clearRecent(machineId),
    onMutate: () => qc.setQueryData<EuromapEvent[]>(['events-recent', machineId], []),
    onSettled: () => qc.invalidateQueries({ queryKey: ['events-recent', machineId] }),
  });
  const { slice, pager } = usePager(data);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('events.live.status')}</p>
        {data.length > 0 && (
          <button
            onClick={() => clearMut.mutate()}
            disabled={clearMut.isPending}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40"
            title={t('events.live.clearHint')}
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('events.live.clear')}
          </button>
        )}
      </div>
      {data.length === 0 ? <EmptyState text={t('events.live.empty')} /> : (
        <>
          <EventList events={slice} />
          <Pager p={pager} />
        </>
      )}
    </div>
  );
}

function HistoryEvents({ machineId, hours }: { machineId: string; hours: number }) {
  const { t } = useTranslation();
  const { data = [], isFetching, refetch, error } = useQuery<EuromapEvent[], Error>({
    queryKey: ['events-history', machineId, hours],
    queryFn: () => eventsApi.history(machineId, hours, 1000),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const deletableIds = data.filter((e) => e.eventId).map((e) => e.eventId as string);
  const nodeId = data.find((e) => e.sourceNode)?.sourceNode || 'ns=1;s=IMM_Netstal';
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (deletableIds.length > 0 && s.size >= deletableIds.length ? new Set() : new Set(deletableIds)));

  // Machine returns history oldest-first; show newest-first like the live tab.
  const sorted = useMemo(
    () => [...data].sort((a, b) => (b.sourceTimestamp ?? '').localeCompare(a.sourceTimestamp ?? '')),
    [data],
  );
  const { slice, pager } = usePager(sorted);

  const del = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(t('events.history.confirmDelete', { count: ids.length }))) return;
    setDeleting(true);
    try {
      const r = await eventsApi.deleteEvents(machineId, nodeId, ids);
      setSelected(new Set());
      await refetch();
      window.alert(t('events.history.deleted', { deleted: r.deleted, total: r.total }));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('events.history.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} /> {isFetching ? t('events.history.loading') : t('events.history.reload', { hours })}
        </button>
        {deletableIds.length > 0 && (
          <button
            onClick={del}
            disabled={deleting || selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 transition-colors"
            title={selected.size === 0 ? t('events.history.deleteHintEmpty') : t('events.history.deleteHint')}
          >
            <Trash2 className="w-3.5 h-3.5" /> {selected.size > 0 ? t('events.history.deleteSelected', { count: selected.size }) : t('events.history.deleteFromBuffer')}
          </button>
        )}
      </div>
      {error
        ? <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">{error.message}</div>
        : (
          <>
            <EventList events={slice} selection={{ selected, toggle, toggleAll, allSelected: deletableIds.length > 0 && selected.size === deletableIds.length }} />
            <Pager p={pager} />
          </>
        )}
    </div>
  );
}

const nsBadge = 'text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0';
const primaryBtn = 'px-3.5 py-1.5 text-[12px] font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-40 transition-opacity';
const ghostBtn = 'px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors';

function MonitoredTypes({ machineId }: { machineId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: selection, error } = useQuery({
    queryKey: ['event-selection', machineId],
    queryFn: () => eventsApi.getEventSelection(machineId),
    retry: false,
  });
  const { data: rules, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['publish-rules', machineId],
    queryFn: () => publishRulesApi.getRules(machineId),
    retry: false,
    enabled: !!selection,
  });
  const { data: connectors } = useQuery<KafkaConnector[], Error>({
    queryKey: ['kafka-connectors'],
    queryFn: kafkaApi.getConnectors,
    refetchInterval: 5000,
  });

  const [browserOpen, setBrowserOpen] = useState(false);
  const [editing, setEditing] = useState<PublishRuleEntry | null>(null);
  const [pendingOpen, setPendingOpen] = useState<string | null>(null);

  const monitored = selection?.eventTypes ?? [];
  const isDefault = !!selection?.isDefault;
  const enabledByNode = new Map(monitored.map((m) => [m.nodeId, m.enabled !== false]));

  const save = useMutation({
    mutationFn: (types: EventTypeSelection[]) => eventsApi.saveEventSelection(machineId, types),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['event-selection', machineId] });
      await qc.invalidateQueries({ queryKey: ['publish-rules', machineId] });
    },
  });

  // Enable/disable a single type without touching the selection. Applies to
  // history immediately; the live subscription picks it up on the next reconnect.
  const toggleEnabled = useMutation({
    mutationFn: ({ nodeId, enabled }: { nodeId: string; enabled: boolean }) =>
      eventsApi.setEventEnabled(machineId, nodeId, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-selection', machineId] }),
  });

  // Toggling builds the next selection from `monitored`; only allow it once the
  // selection query has resolved (else `monitored` is [] and we'd wipe it) and
  // no save is in flight (else a stale-cache second toggle is a lost update).
  const canEdit = !!selection && !save.isPending;

  // Picking a type persists right away and opens its publish config as soon as
  // the rules list knows the new type (select -> model -> destination flow).
  const addType = (ref: EventTypeSelection) => {
    if (!canEdit) return;
    setPendingOpen(ref.nodeId);
    setBrowserOpen(false);
    save.mutate([...monitored, ref], { onError: () => setPendingOpen(null) });
  };
  const removeType = (nodeId: string) => {
    if (!canEdit) return;
    const next = monitored.filter((m) => m.nodeId !== nodeId);
    // The server reads an empty selection as "restore the default EUROMAP set",
    // so removing the last type re-monitors the three defaults. Make that explicit.
    if (next.length === 0 && !window.confirm(t('events.types.removeLastConfirm'))) return;
    save.mutate(next);
  };
  const toggle = (ref: EventTypeSelection) =>
    monitored.some((m) => m.nodeId === ref.nodeId) ? removeType(ref.nodeId) : addType(ref);

  useEffect(() => {
    if (!pendingOpen || !rules) return;
    const entry = rules.eventTypes.find((e) => e.ruleKey === pendingOpen);
    if (entry) {
      setEditing(entry);
      setPendingOpen(null);
    }
  }, [pendingOpen, rules]);

  if (error) {
    return <EmptyState text={t('events.types.connectFirst', { machineId })} />;
  }

  const entries = rules?.eventTypes ?? [];
  const platform = rules?.platformStreams ?? [];
  const loading = rulesLoading || (!rules && !rulesError);

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{t('events.types.title')}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{t('events.types.desc1')}</p>
          <p className="text-[12px] text-gray-400 mt-1">{t('events.types.desc2')}</p>
          {isDefault && (
            <div className="inline-flex items-center gap-2 mt-2.5 text-[11px] text-gray-500 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1.5">
              {t('events.types.usingDefault')}
            </div>
          )}
        </div>

        {rulesError ? (
          <div className="px-5 sm:px-6 py-4 text-[12px] text-red-500">{(rulesError as Error).message}</div>
        ) : loading ? (
          <div className="px-5 sm:px-6 py-4 space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-5 sm:px-6 py-5 text-[12px] text-gray-400">{t('events.types.noneSelected')}</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {entries.map((e) => (
              <PublishRuleRow
                key={e.ruleKey}
                entry={e}
                label={e.name}
                connectors={connectors ?? []}
                enabled={enabledByNode.get(e.ruleKey) ?? true}
                onToggleEnabled={(v) => toggleEnabled.mutate({ nodeId: e.ruleKey, enabled: v })}
                onConfigure={() => setEditing(e)}
                onRemove={() => removeType(e.ruleKey)}
                busy={save.isPending || toggleEnabled.isPending}
              />
            ))}
          </div>
        )}

        <div className="px-5 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
          <button onClick={() => setBrowserOpen(true)} disabled={!canEdit} className={cn(ghostBtn, 'inline-flex items-center gap-1.5')}>
            <FolderTree className="w-3.5 h-3.5" /> {t('events.types.browse')}
          </button>
          {!isDefault && (
            <button onClick={() => save.mutate([])} disabled={save.isPending || !selection} className={ghostBtn}>{t('events.types.restoreDefault')}</button>
          )}
          {save.isPending && <Loader2 className="w-3.5 h-3.5 text-gray-300 animate-spin" />}
          <div className="flex-1" />
          <p className="text-[11px] text-gray-400">{t('events.types.applyNote')}</p>
        </div>
        {save.isError && <p className="px-5 sm:px-6 pb-3 text-[12px] text-red-500">{(save.error as Error)?.message}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{t('events.publish.platformTitle')}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{t('events.publish.platformDesc')}</p>
        </div>
        {loading || rulesError ? (
          <div className="px-5 sm:px-6 py-4 space-y-2">
            {[0, 1].map((i) => <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {platform.map((e) => (
              <PublishRuleRow
                key={e.ruleKey}
                entry={e}
                label={t(`events.publish.platform.${e.ruleKey}`)}
                connectors={connectors ?? []}
                onConfigure={() => setEditing(e)}
              />
            ))}
          </div>
        )}
      </div>

      {browserOpen && (
        <EventTypeBrowser
          machineId={machineId}
          selectedIds={new Set(monitored.map((m) => m.nodeId))}
          onToggle={toggle}
          busy={save.isPending}
          onClose={() => setBrowserOpen(false)}
        />
      )}

      {editing && (
        <PublishRuleModal
          key={`${machineId}:${editing.ruleKey}`}
          machineId={machineId}
          entry={editing}
          label={platform.some((p) => p.ruleKey === editing.ruleKey) ? t(`events.publish.platform.${editing.ruleKey}`) : editing.name}
          connectors={connectors ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PublishRuleRow({
  entry, label, connectors, onConfigure, onRemove, busy, enabled, onToggleEnabled,
}: {
  entry: PublishRuleEntry;
  label: string;
  connectors: KafkaConnector[];
  onConfigure: () => void;
  onRemove?: () => void;
  busy?: boolean;
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
}) {
  const { t } = useTranslation();
  const isOn = enabled !== false;
  const modeled = entry.fieldModel?.fields?.length ?? 0;
  const headerCount = Object.keys(entry.headers ?? {}).length;
  const connectorName = entry.connectorId
    ? connectors.find((c) => c.id === entry.connectorId)?.name ?? entry.connectorId
    : t('events.publish.activeConnector');
  return (
    <div className="px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className={cn('flex-1 min-w-0', onToggleEnabled && !isOn && 'opacity-50')}>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
            modeled > 0 ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
          )}>
            {modeled > 0 ? t('events.publish.modeled', { count: modeled }) : t('events.publish.full')}
          </span>
          {headerCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
              {t('events.publish.headersCount', { count: headerCount })}
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate" title={entry.ruleKey}>{entry.ruleKey}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onToggleEnabled && (
          <button
            onClick={() => onToggleEnabled(!isOn)}
            disabled={busy}
            title={isOn ? t('common.disable') : t('common.enable')}
            aria-pressed={isOn}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 disabled:opacity-50',
              isOn ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700',
            )}
          >
            <span className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 transition-transform',
              isOn ? 'translate-x-4' : 'translate-x-1',
            )} />
          </button>
        )}
        <div className="text-right hidden sm:block mr-1">
          <p className={cn('text-[11px] font-mono', entry.topic ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400')}>
            {entry.topic ?? entry.defaultTopic}
          </p>
          <p className="text-[11px] text-gray-400">{connectorName}</p>
        </div>
        <button
          onClick={onConfigure}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" /> {t('events.types.configure')}
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={busy}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            title={t('events.types.remove')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---- publish rule editor (payload model + Kafka destination) ---------------

interface FieldRow {
  source: string;
  path: string[];
  included: boolean;
  target: string;
}

interface HeaderRow {
  key: string;
  value: string;
}

function initialFieldRows(entry: PublishRuleEntry): FieldRow[] {
  const model = new Map((entry.fieldModel?.fields ?? []).map((f) => [f.source, f.target ?? '']));
  const hasModel = model.size > 0;
  const rows: FieldRow[] = entry.availableFields.map((f) => ({
    source: f.source,
    path: f.path,
    included: hasModel ? model.has(f.source) : true,
    target: model.get(f.source) ?? '',
  }));
  // A stored model may reference fields the browse no longer lists; keep them.
  for (const [source, target] of model) {
    if (!rows.some((r) => r.source === source)) {
      rows.push({ source, path: source.startsWith('fields.') ? source.slice(7).split('_') : [source], included: true, target });
    }
  }
  return rows;
}

// ---- payload field tree (folder view of the modelable fields) ---------------

interface ModelNode {
  name: string;
  rowIndex?: number;
  children: Map<string, ModelNode>;
}

function buildModelTree(rows: FieldRow[]): ModelNode {
  const root: ModelNode = { name: '', children: new Map() };
  rows.forEach((r, i) => {
    const segs = r.path.length > 0 ? r.path : [r.source];
    let node = root;
    segs.forEach((seg, si) => {
      let child = node.children.get(seg);
      if (!child) {
        child = { name: seg, children: new Map() };
        node.children.set(seg, child);
      }
      if (si === segs.length - 1) child.rowIndex = i;
      node = child;
    });
  });
  return root;
}

function collectRows(node: ModelNode): number[] {
  const out: number[] = [];
  if (node.rowIndex !== undefined) out.push(node.rowIndex);
  for (const c of node.children.values()) out.push(...collectRows(c));
  return out;
}

interface ModelTreeProps {
  node: ModelNode;
  depth: number;
  rows: FieldRow[];
  onToggle: (idxs: number[], value: boolean) => void;
  onTarget: (i: number, v: string) => void;
  inputCls: string;
}

function ModelTree(props: ModelTreeProps) {
  return <>{[...props.node.children.values()].map((c) => <ModelField key={c.name} {...props} node={c} />)}</>;
}

function ModelField({ node, depth, rows, onToggle, onTarget, inputCls }: ModelTreeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false); // folders collapsed by default (many fields)
  const hasChildren = node.children.size > 0;
  const idxs = collectRows(node);
  const allOn = idxs.length > 0 && idxs.every((i) => rows[i].included);
  const someOn = idxs.some((i) => rows[i].included);
  const isField = node.rowIndex !== undefined;
  const row = isField ? rows[node.rowIndex as number] : undefined;
  return (
    <div>
      <div className="flex items-center gap-1.5 py-1 pr-4" style={{ paddingLeft: `${depth * 14 + 12}px` }}>
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="inline-block w-3 shrink-0" />
        )}
        <input
          type="checkbox"
          checked={allOn}
          ref={(el) => { if (el) el.indeterminate = !allOn && someOn; }}
          onChange={() => onToggle(idxs, !allOn)}
          className="accent-gray-900 dark:accent-white shrink-0"
        />
        <span
          className={cn(
            'font-mono truncate',
            hasChildren && !isField ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-300',
          )}
          title={node.name}
        >
          {node.name}
          {hasChildren && !isField && <span className="ml-1 text-gray-400 font-normal">({idxs.length})</span>}
        </span>
        {isField && row && (
          <input
            value={row.target}
            onChange={(e) => onTarget(node.rowIndex as number, e.target.value)}
            placeholder={t('events.publish.modal.renameTo')}
            disabled={!row.included}
            className={cn(inputCls, 'ml-auto w-28 sm:w-40 py-0.5 disabled:opacity-50')}
          />
        )}
      </div>
      {hasChildren && open && (
        <ModelTree node={node} depth={depth + 1} rows={rows} onToggle={onToggle} onTarget={onTarget} inputCls={inputCls} />
      )}
    </div>
  );
}

function PublishRuleModal({
  machineId, entry, label, connectors, onClose,
}: {
  machineId: string;
  entry: PublishRuleEntry;
  label: string;
  connectors: KafkaConnector[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [rows, setRows] = useState<FieldRow[]>(() => initialFieldRows(entry));
  const [topic, setTopic] = useState(entry.topic ?? '');
  const [connectorId, setConnectorId] = useState(entry.connectorId ?? '');
  const [headers, setHeaders] = useState<HeaderRow[]>(() =>
    Object.entries(entry.headers ?? {}).map(([key, value]) => ({ key, value })));

  const saveMut = useMutation({
    mutationFn: (body: {
      connectorId: string | null;
      topic: string | null;
      headers: Record<string, string> | null;
      fieldModel: { fields: { source: string; target?: string }[] } | null;
    }) => publishRulesApi.updateRule(machineId, entry.ruleKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publish-rules', machineId] });
      onClose();
    },
  });

  const setRow = (i: number, patch: Partial<FieldRow>) =>
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const onToggleRows = (idxs: number[], value: boolean) =>
    setRows((cur) => cur.map((r, j) => (idxs.includes(j) ? { ...r, included: value } : r)));
  const modelTree = buildModelTree(rows);
  const included = rows.filter((r) => r.included);
  const allIncluded = included.length === rows.length;
  const toggleAll = () => setRows((cur) => cur.map((r) => ({ ...r, included: !allIncluded })));

  const setHeader = (i: number, patch: Partial<HeaderRow>) =>
    setHeaders((cur) => cur.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const removeHeader = (i: number) => setHeaders((cur) => cur.filter((_, j) => j !== i));

  const producers = connectors.filter((c) => c.direction !== 'consumer');
  const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wide text-gray-400';

  const save = () => {
    // Full selection without renames is the default: store null, stays
    // forward-compatible when the mapper gains new fields.
    const isDefaultModel = allIncluded && rows.every((r) => r.target.trim() === '');
    const cleanHeaders = headers
      .map((h) => ({ key: h.key.trim(), value: h.value }))
      .filter((h) => h.key !== '');
    saveMut.mutate({
      fieldModel: isDefaultModel ? null : {
        fields: included.map((r) => ({ source: r.source, ...(r.target.trim() !== '' ? { target: r.target.trim() } : {}) })),
      },
      topic: topic.trim() === '' ? null : topic.trim(),
      connectorId: connectorId === '' ? null : connectorId,
      headers: cleanHeaders.length === 0 ? null : Object.fromEntries(cleanHeaders.map((h) => [h.key, h.value])),
    });
  };
  const reset = () => saveMut.mutate({ fieldModel: null, topic: null, connectorId: null, headers: null });

  const selectCls = 'px-2.5 py-1.5 text-[12px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';
  const textCls = 'w-full px-2.5 py-1.5 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
              {t('events.publish.modal.title')} <span className="font-mono">{label}</span>
            </p>
            <p className="text-[12px] text-gray-400 mt-0.5">{t('events.publish.modal.hint')}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-5 pt-4">
            <p className={sectionTitle}>{t('events.publish.modal.payloadSection')}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t('events.publish.modal.payloadHint')}</p>
          </div>
          <div className="mt-2 border-y border-gray-50 dark:border-gray-800/50">
            <div className="px-5 py-2 flex items-center gap-2 border-b border-gray-50 dark:border-gray-800/50">
              <input type="checkbox" checked={allIncluded} onChange={toggleAll} className="accent-gray-900 dark:accent-white" />
              <span className="text-[11px] text-gray-400">
                {t('events.publish.modal.field')} · {t('events.publish.modal.renameTo')}
              </span>
            </div>
            <div className="py-1">
              <ModelTree
                node={modelTree}
                depth={0}
                rows={rows}
                onToggle={onToggleRows}
                onTarget={(i, v) => setRow(i, { target: v })}
                inputCls={textCls}
              />
            </div>
          </div>

          <div className="px-5 pt-5">
            <p className={sectionTitle}>{t('events.publish.modal.destinationSection')}</p>
            <div className="mt-2.5 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('events.publish.modal.topic')}</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={entry.defaultTopic} className={textCls} />
                <p className="text-[11px] text-gray-400 mt-1">{t('events.publish.modal.topicHint', { topic: entry.defaultTopic })}</p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('events.publish.modal.connector')}</label>
                <select value={connectorId} onChange={(e) => setConnectorId(e.target.value)} className={cn(selectCls, 'w-full')}>
                  <option value="">{t('events.publish.activeConnector')}</option>
                  {producers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 pb-5">
            <p className={sectionTitle}>{t('events.publish.modal.headersSection')}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t('events.publish.modal.headersHint')}</p>
            <div className="mt-2.5 space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={h.key} onChange={(e) => setHeader(i, { key: e.target.value })} placeholder={t('events.publish.modal.headerKey')} className={cn(textCls, 'flex-1')} />
                  <input value={h.value} onChange={(e) => setHeader(i, { value: e.target.value })} placeholder={t('events.publish.modal.headerValue')} className={cn(textCls, 'flex-[1.4]')} />
                  <button onClick={() => removeHeader(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setHeaders((cur) => [...cur, { key: '', value: '' }])}
                disabled={headers.length >= 16}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
              >
                <Plus className="w-3 h-3" /> {t('events.publish.modal.addHeader')}
              </button>
            </div>
          </div>
        </div>

        {saveMut.error && <p className="px-5 py-2 text-[12px] text-red-500">{(saveMut.error as Error).message}</p>}

        <div className="px-5 py-3 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={reset} disabled={saveMut.isPending} className={ghostBtn}>
            {t('events.publish.modal.reset')}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3.5 py-2 text-[13px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">{t('common.cancel')}</button>
            <button
              onClick={save}
              disabled={saveMut.isPending || included.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl disabled:opacity-50"
            >
              {saveMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- event attribute tree (folder view of a type's full attribute set) -----

interface AttrNode {
  name: string;
  key?: string;
  children: Map<string, AttrNode>;
}

function buildAttrTree(fields: { key: string; path: string[] }[]): AttrNode {
  const root: AttrNode = { name: '', children: new Map() };
  for (const f of fields) {
    let node = root;
    f.path.forEach((seg, i) => {
      let child = node.children.get(seg);
      if (!child) {
        child = { name: seg, children: new Map() };
        node.children.set(seg, child);
      }
      if (i === f.path.length - 1) child.key = f.key;
      node = child;
    });
  }
  return root;
}

function AttrTree({ node, depth }: { node: AttrNode; depth: number }) {
  return (
    <>
      {[...node.children.values()].map((child) => (
        <AttrTreeNode key={child.name} node={child} depth={depth} />
      ))}
    </>
  );
}

function AttrTreeNode({ node, depth }: { node: AttrNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.size > 0;
  return (
    <div>
      <div className="flex items-center gap-1.5 py-0.5 text-[12px]" style={{ paddingLeft: `${depth * 14 + 8}px` }}>
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="inline-block w-3 shrink-0" />
        )}
        <span
          className={cn(
            'font-mono truncate',
            hasChildren ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400',
          )}
          title={node.key ?? node.name}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && open && <AttrTree node={node} depth={depth + 1} />}
    </div>
  );
}

function EventTypeBrowser({
  machineId, selectedIds, onToggle, busy, onClose,
}: {
  machineId: string;
  selectedIds: Set<string>;
  onToggle: (ref: EventTypeSelection) => void;
  busy?: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [path, setPath] = useState<EventTypeSelection[]>([{ nodeId: 'i=2041', name: 'BaseEventType' }]);
  const [filter, setFilter] = useState('');
  const current = path[path.length - 1];

  const { data, isFetching, error } = useQuery({
    queryKey: ['event-types', machineId, current.nodeId],
    queryFn: () => eventsApi.browseEventTypes(machineId, current.nodeId),
    retry: false,
  });
  // Complete attribute set of the current type (deep: inherited + nested), for
  // the folder tree. This is exactly what the raw payload carries.
  const { data: attrData, isFetching: attrFetching } = useQuery({
    queryKey: ['event-type-attributes', machineId, current.nodeId],
    queryFn: () => eventsApi.getEventTypeAttributes(machineId, current.nodeId),
    retry: false,
  });
  const attrTree = buildAttrTree(attrData?.fields ?? []);
  const attrCount = attrData?.fields.length ?? 0;
  const attrLoading = attrFetching && !attrData;

  const nameOf = (r: EventTypeRef): string => r.displayName || r.browseName;
  const q = filter.trim().toLowerCase();
  const subtypes = (data?.subtypes ?? []).filter((s) => !q || nameOf(s).toLowerCase().includes(q));
  const drill = (r: EventTypeRef) => { setFilter(''); setPath((p) => [...p, { nodeId: r.nodeId, name: nameOf(r) }]); };
  const goTo = (i: number) => { setFilter(''); setPath((p) => p.slice(0, i + 1)); };

  const atRoot = path.length === 1;
  const allSubtypes = data?.subtypes ?? [];
  const loading = isFetching && !data;
  const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wide text-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{t('events.browser.title')}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {t('events.browser.desc')}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 py-2.5 flex items-center gap-1 flex-wrap text-[12px] border-b border-gray-100 dark:border-gray-800">
          {path.map((p, i) => (
            <span key={p.nodeId} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              <button onClick={() => goTo(i)} className={cn('hover:underline', i === path.length - 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400')}>{p.name}</button>
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="px-5 py-10 text-center text-[13px] text-red-500">{(error as Error).message}</div>
          ) : (
            <>
              <div className="mx-5 mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{current.name}</p>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{current.nodeId}</p>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={selectedIds.has(current.nodeId)} disabled={busy} onChange={() => onToggle({ nodeId: current.nodeId, name: current.name })} className="accent-gray-900 dark:accent-white disabled:opacity-40" />
                    <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{t('events.browser.monitorThis')}</span>
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {atRoot
                    ? t('events.browser.rootHint')
                    : t('events.browser.subtypeHint')}
                </p>
              </div>

              <div className="mt-5">
                <div className="px-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className={sectionTitle}>{t('events.browser.subtypes')}{loading ? '' : ` (${allSubtypes.length})`}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t('events.browser.subtypesDesc', { name: current.name })}</p>
                  </div>
                  {allSubtypes.length > 3 && (
                    <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('events.browser.filter')} className="w-28 bg-transparent text-[12px] text-gray-900 dark:text-gray-100 focus:outline-none" />
                    </label>
                  )}
                </div>

                {loading ? (
                  <div className="px-5 mt-3 space-y-2">
                    {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="mt-2 border-y border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
                    {subtypes.map((s) => (
                      <div key={s.nodeId} className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 group">
                        <input type="checkbox" checked={selectedIds.has(s.nodeId)} disabled={busy} onChange={() => onToggle({ nodeId: s.nodeId, name: nameOf(s) })} className="accent-gray-900 dark:accent-white shrink-0 disabled:opacity-40" title={t('events.browser.monitorTitle')} />
                        <button onClick={() => drill(s)} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                          <span className="text-[13px] text-gray-900 dark:text-gray-100 truncate">{nameOf(s)}</span>
                          {typeof s.namespace === 'number' && s.namespace > 0 && <span className={nsBadge}>ns={s.namespace}</span>}
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {t('events.browser.enter')} <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>
                    ))}
                    {subtypes.length === 0 && (
                      <div className="px-5 py-5 text-center text-[12px] text-gray-400">
                        {q ? t('events.browser.noFilterMatch') : t('events.browser.noSubtypes', { name: current.name })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pb-5">
                <div className="px-5 flex items-center gap-2">
                  <p className={sectionTitle}>{t('events.browser.attributes')}{attrLoading ? '' : ` (${attrCount})`}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400">{t('events.browser.informative')}</span>
                </div>
                <p className="px-5 text-[11px] text-gray-400 mt-0.5">
                  {t('events.browser.attributesDesc')}
                </p>
                {attrLoading ? (
                  <div className="px-5 mt-3"><div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" /></div>
                ) : attrCount > 0 ? (
                  <div className="mx-5 mt-2.5 rounded-xl border border-gray-100 dark:border-gray-800 py-2 max-h-72 overflow-auto">
                    <AttrTree node={attrTree} depth={0} />
                  </div>
                ) : (
                  <p className="px-5 mt-2.5 text-[12px] text-gray-400">{t('events.browser.noOwnAttributes')}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <span className="text-[12px] text-gray-400">{t('events.browser.selectedCount', { count: selectedIds.size })}{isFetching ? ` · ${t('events.browser.loading')}` : ''}</span>
          <button onClick={onClose} className={primaryBtn}>{t('events.browser.done')}</button>
        </div>
      </div>
    </div>
  );
}

function Alarms({ machineId }: { machineId: string }) {
  const { t } = useTranslation();
  const { data = [], error } = useQuery<MachineAlarm[], Error>({
    queryKey: ['alarms', machineId],
    queryFn: () => eventsApi.alarms(machineId),
    refetchInterval: 5000,
  });
  const { slice, pager } = usePager(data);
  if (error) return <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">{error.message}</div>;
  if (data.length === 0) return <EmptyState text={t('events.alarms.empty')} />;
  return (
    <div className="space-y-2">
    <div className={cardCls}>
      {slice.map((a, i) => (
        <div key={`${a.id}-${i}`} className="px-5 sm:px-6 py-3 flex items-center gap-4">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', a.severity >= 1000 ? 'bg-red-400' : a.severity >= 500 ? 'bg-amber-400' : 'bg-gray-300')} />
          <span className="text-[12px] font-mono text-gray-400 w-24 shrink-0">{a.id}</span>
          <span className={cn('text-[11px] px-1.5 py-0.5 rounded-md font-medium shrink-0', a.severity >= 1000 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : a.severity >= 500 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800')}>{a.severity}</span>
          <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">{a.message}</span>
        </div>
      ))}
    </div>
    <Pager p={pager} />
    </div>
  );
}
