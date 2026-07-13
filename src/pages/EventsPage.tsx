import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ChevronRight, ChevronLeft, Trash2, Search, X, FolderTree } from 'lucide-react';
import { eventsApi, EventTypeRef, EventTypeSelection } from '../services/api';
import { EuromapEvent, MachineAlarm } from '../types';
import { cn } from '@/lib/utils';

type Tab = 'live' | 'history' | 'alarms' | 'types';
const TABS: { key: Tab; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'history', label: 'Histórico' },
  { key: 'alarms', label: 'Alarmes' },
  { key: 'types', label: 'Tipos monitorados' },
];

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}

const cardCls = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50';
const inputCls = 'px-3 py-1.5 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 w-28';

export function EventsPage() {
  const [machineId, setMachineId] = useState('IMM-01');
  const [tab, setTab] = useState<Tab>('live');
  const [hours, setHours] = useState(3);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Eventos</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Eventos ao vivo, histórico e alarmes das máquinas EUROMAP. O Event View, dentro do EDU</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors',
                  tab === t.key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200')}>
                {t.label}
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
        {tab === 'types' && <MonitoredTypes machineId={machineId} />}
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
  if (p.total <= PAGE_SIZES[0]) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-1">
      <span className="text-[11px] text-gray-400 tabular-nums">{p.from}-{p.to} de {p.total}</span>
      <div className="flex items-center gap-2">
        <select
          value={p.size}
          onChange={(e) => p.setSize(Number(e.target.value))}
          className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          title="itens por página"
        >
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / pág</option>)}
        </select>
        <button onClick={p.prev} disabled={p.page === 0} className={pagerBtn} title="página anterior"><ChevronLeft className="w-3.5 h-3.5" /></button>
        <span className="text-[11px] text-gray-400 tabular-nums">{p.page + 1}/{p.pages}</span>
        <button onClick={p.next} disabled={p.page >= p.pages - 1} className={pagerBtn} title="próxima página"><ChevronRight className="w-3.5 h-3.5" /></button>
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
  const [open, setOpen] = useState<string | null>(null);
  if (events.length === 0) return <EmptyState text="Nenhum evento nessa janela." />;
  return (
    <div className={cardCls}>
      {selection && (
        <label className="px-5 sm:px-6 py-2 flex items-center gap-3 text-[11px] text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll} className="accent-gray-900 dark:accent-white" />
          selecionar todos os deletáveis
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
                  className="accent-gray-900 dark:accent-white disabled:opacity-30 shrink-0" title={canDelete ? 'selecionar para excluir' : 'sem eventId (não deletável)'} />
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
  const { data = [] } = useQuery<EuromapEvent[]>({
    queryKey: ['events-recent', machineId],
    queryFn: () => eventsApi.recent(machineId),
    refetchInterval: 3000,
  });
  // "Limpar" esconde o que já está na tela (só a visualização, como no UaExpert);
  // eventos novos continuam aparecendo. Set de chaves evita depender de relógio.
  const [hidden, setHidden] = useState<Set<string> | null>(null);
  const visible = useMemo(
    () => (hidden ? data.filter((e) => !hidden.has(eventKey(e))) : data),
    [data, hidden],
  );
  const { slice, pager } = usePager(visible);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ao vivo · atualiza a cada 3s</p>
        {data.length > 0 && (
          <button
            onClick={() => setHidden(new Set(data.map(eventKey)))}
            disabled={visible.length === 0}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40"
            title="limpa a visualização; não apaga nada da máquina"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>
      {data.length === 0 ? <EmptyState text="Sem eventos ao vivo. Cicle a máquina (ciclos aparecem na hora que fecham)." /> :
        visible.length === 0 ? <EmptyState text="Feed limpo. Novos eventos aparecem aqui." /> : (
        <>
          <EventList events={slice} />
          <Pager p={pager} />
        </>
      )}
    </div>
  );
}

function HistoryEvents({ machineId, hours }: { machineId: string; hours: number }) {
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
    if (!window.confirm(`Apagar ${ids.length} evento(s) do buffer de histórico da máquina?\n\nIsso é IRREVERSÍVEL (HistoryUpdate DeleteEvent no equipamento).`)) return;
    setDeleting(true);
    try {
      const r = await eventsApi.deleteEvents(machineId, nodeId, ids);
      setSelected(new Set());
      await refetch();
      window.alert(`${r.deleted}/${r.total} evento(s) apagado(s) da máquina.`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Falha ao apagar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} /> {isFetching ? 'lendo histórico…' : `recarregar (últimas ${hours}h)`}
        </button>
        {deletableIds.length > 0 && (
          <button
            onClick={del}
            disabled={deleting || selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 transition-colors"
            title={selected.size === 0 ? 'marque eventos na lista para apagar do buffer da máquina' : 'apaga os eventos marcados do buffer da máquina (irreversível)'}
          >
            <Trash2 className="w-3.5 h-3.5" /> {selected.size > 0 ? `Excluir selecionados (${selected.size})` : 'Excluir do buffer'}
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
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ['event-selection', machineId],
    queryFn: () => eventsApi.getEventSelection(machineId),
    retry: false,
  });
  const [draft, setDraft] = useState<EventTypeSelection[] | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);

  const base = data?.eventTypes ?? [];
  const selection = draft ?? base;
  const dirty = draft !== null;
  const isDefault = !!data?.isDefault && !dirty;

  const toggle = (ref: EventTypeSelection) =>
    setDraft((cur) => {
      const list = cur ?? base;
      return list.some((t) => t.nodeId === ref.nodeId)
        ? list.filter((t) => t.nodeId !== ref.nodeId)
        : [...list, ref];
    });
  const remove = (nodeId: string) => setDraft((cur) => (cur ?? base).filter((t) => t.nodeId !== nodeId));

  const save = useMutation({
    mutationFn: (types: EventTypeSelection[]) => eventsApi.saveEventSelection(machineId, types),
    onSuccess: async () => {
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ['event-selection', machineId] });
    },
  });

  if (error) {
    return <EmptyState text={`Conecte a máquina ${machineId} para configurar os tipos de evento monitorados.`} />;
  }

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 sm:p-6 space-y-4">
        <div>
          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">Tipos de evento monitorados</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Escolha quais tipos de evento entram no Live, no Histórico e no Kafka. Monitorar um tipo já inclui os subtipos dele (filtro OfType, aplicado no servidor).
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            Os atributos de cada evento (Message, Severity, contadores) chegam automaticamente no payload; você escolhe só os tipos, não os campos.
          </p>
        </div>

        {isDefault && (
          <div className="inline-flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1.5">
            usando o padrão: os 3 tipos EUROMAP mapeados (ciclo, troca de caixa, alarme)
          </div>
        )}

        {selection.length === 0 ? (
          <p className="text-[12px] text-gray-400">Nenhum tipo selecionado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selection.map((t) => (
              <span key={t.nodeId} title={t.nodeId} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[12px] text-gray-700 dark:text-gray-200">
                {t.name}
                <button onClick={() => remove(t.nodeId)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-100" title="remover">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => setBrowserOpen(true)} className={cn(ghostBtn, 'inline-flex items-center gap-1.5')}>
            <FolderTree className="w-3.5 h-3.5" /> Procurar tipos
          </button>
          {!isDefault && (
            <button onClick={() => save.mutate([])} disabled={save.isPending} className={ghostBtn}>Restaurar padrão</button>
          )}
          <div className="flex-1" />
          {dirty && <button onClick={() => setDraft(null)} className={ghostBtn}>Descartar</button>}
          <button
            onClick={() => save.mutate(selection)}
            disabled={!dirty || save.isPending}
            className={primaryBtn}
          >
            {save.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>

        {save.isError && <p className="text-[12px] text-red-500">{(save.error as Error)?.message}</p>}
        <p className="text-[11px] text-gray-400">
          Vale no Histórico na hora. No Live, reconecte a máquina para reaplicar a subscrição.
        </p>
      </div>

      {browserOpen && (
        <EventTypeBrowser
          machineId={machineId}
          selectedIds={new Set(selection.map((t) => t.nodeId))}
          onToggle={toggle}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </div>
  );
}

function EventTypeBrowser({
  machineId, selectedIds, onToggle, onClose,
}: {
  machineId: string;
  selectedIds: Set<string>;
  onToggle: (ref: EventTypeSelection) => void;
  onClose: () => void;
}) {
  const [path, setPath] = useState<EventTypeSelection[]>([{ nodeId: 'i=2041', name: 'BaseEventType' }]);
  const [filter, setFilter] = useState('');
  const current = path[path.length - 1];

  const { data, isFetching, error } = useQuery({
    queryKey: ['event-types', machineId, current.nodeId],
    queryFn: () => eventsApi.browseEventTypes(machineId, current.nodeId),
    retry: false,
  });

  const nameOf = (r: EventTypeRef): string => r.displayName || r.browseName;
  const q = filter.trim().toLowerCase();
  const subtypes = (data?.subtypes ?? []).filter((s) => !q || nameOf(s).toLowerCase().includes(q));
  const fields = data?.fields ?? [];
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
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">Tipos de evento</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Navegue a árvore e marque os tipos que o EDU deve monitorar. Ao entrar num tipo você vê os subtipos dele e os atributos que cada evento carrega.
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
                    <input type="checkbox" checked={selectedIds.has(current.nodeId)} onChange={() => onToggle({ nodeId: current.nodeId, name: current.name })} className="accent-gray-900 dark:accent-white" />
                    <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">Monitorar este tipo</span>
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {atRoot
                    ? 'BaseEventType é a raiz: monitorar ele captura todos os eventos do servidor. Prefira marcar tipos específicos abaixo.'
                    : 'Monitorar um tipo inclui automaticamente todos os subtipos abaixo dele.'}
                </p>
              </div>

              <div className="mt-5">
                <div className="px-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className={sectionTitle}>Subtipos{loading ? '' : ` (${allSubtypes.length})`}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Classes de evento derivadas de {current.name}. Marque para monitorar, ou entre para explorar.</p>
                  </div>
                  {allSubtypes.length > 3 && (
                    <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar" className="w-28 bg-transparent text-[12px] text-gray-900 dark:text-gray-100 focus:outline-none" />
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
                        <input type="checkbox" checked={selectedIds.has(s.nodeId)} onChange={() => onToggle({ nodeId: s.nodeId, name: nameOf(s) })} className="accent-gray-900 dark:accent-white shrink-0" title="monitorar este tipo" />
                        <button onClick={() => drill(s)} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                          <span className="text-[13px] text-gray-900 dark:text-gray-100 truncate">{nameOf(s)}</span>
                          {typeof s.namespace === 'number' && s.namespace > 0 && <span className={nsBadge}>ns={s.namespace}</span>}
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            entrar <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>
                    ))}
                    {subtypes.length === 0 && (
                      <div className="px-5 py-5 text-center text-[12px] text-gray-400">
                        {q ? 'Nenhum subtipo bate com o filtro.' : `${current.name} não tem subtipos. É um tipo concreto, o nível mais específico da árvore.`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pb-5">
                <div className="px-5 flex items-center gap-2">
                  <p className={sectionTitle}>Atributos do evento{loading ? '' : ` (${fields.length})`}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400">informativo</span>
                </div>
                <p className="px-5 text-[11px] text-gray-400 mt-0.5">
                  Campos que chegam no payload de cada evento deste tipo. Vêm todos juntos, não é preciso escolher.
                </p>
                {loading ? (
                  <div className="px-5 mt-3"><div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" /></div>
                ) : fields.length > 0 ? (
                  <div className="mx-5 mt-2.5 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                    {fields.map((fld) => (
                      <span key={fld.nodeId} className="text-[12px] font-mono text-gray-600 dark:text-gray-300 truncate" title={nameOf(fld)}>{nameOf(fld)}</span>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 mt-2.5 text-[12px] text-gray-400">Este tipo não declara atributos próprios.</p>
                )}
                {!atRoot && (
                  <p className="px-5 mt-2 text-[11px] text-gray-400">
                    Além destes, todo evento também traz os atributos herdados dos tipos acima, como EventId, Time, Message e Severity.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <span className="text-[12px] text-gray-400">{selectedIds.size} tipo(s) marcado(s) para monitorar{isFetching ? ' · carregando…' : ''}</span>
          <button onClick={onClose} className={primaryBtn}>Concluir</button>
        </div>
      </div>
    </div>
  );
}

function Alarms({ machineId }: { machineId: string }) {
  const { data = [], error } = useQuery<MachineAlarm[], Error>({
    queryKey: ['alarms', machineId],
    queryFn: () => eventsApi.alarms(machineId),
    refetchInterval: 5000,
  });
  const { slice, pager } = usePager(data);
  if (error) return <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">{error.message}</div>;
  if (data.length === 0) return <EmptyState text="Nenhum alarme ativo 🎉" />;
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
