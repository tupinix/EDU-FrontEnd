import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, Trans } from 'react-i18next';
import { Loader2, ShieldCheck, ShieldOff, AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { opcuaApi, southboundApi } from '../../services/api';
import { OpcUaConnection, SouthboundCommand } from '../../types';
import { cn } from '@/lib/utils';

const statusBadge: Record<string, string> = {
  ACK: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  NACK: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  received: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

/** Safety banner + per-machine arm/disarm. Dispatch lives in the MethodBrowser. */
export function SouthboundPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: connections } = useQuery<OpcUaConnection[], Error>({
    queryKey: ['opcua-connections'],
    queryFn: opcuaApi.getConnections,
    refetchInterval: 5000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['opcua-connections'] });
  const armMut = useMutation({ mutationFn: southboundApi.arm, onSuccess: invalidate });
  const disarmMut = useMutation({ mutationFn: southboundApi.disarm, onSuccess: invalidate });

  const machines = (connections ?? []).filter((c) => c.euromapEnabled);

  return (
    <div className="space-y-6">
      {/* Safety banner */}
      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-amber-700 dark:text-amber-400">
          <Trans i18nKey="southbound.banner" components={{ strong: <strong /> }} />
        </p>
      </div>

      {/* Machines + arm/disarm */}
      <section>
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('southbound.machines.title')}</h2>
        {machines.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-8 text-center text-[13px] text-gray-400">
            {t('southbound.machines.empty')}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
            {machines.map((m) => (
              <div key={m.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{m.machineId || m.name}</p>
                  <p className="text-[12px] text-gray-400 font-mono truncate">{m.endpointUrl}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1',
                    m.southboundArmed ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
                    {m.southboundArmed ? <><ShieldCheck className="w-3 h-3" /> {t('southbound.machines.armed')}</> : <><ShieldOff className="w-3 h-3" /> {t('southbound.machines.disarmed')}</>}
                  </span>
                  {m.southboundArmed ? (
                    <button onClick={() => disarmMut.mutate(m.id)} disabled={disarmMut.isPending} className="px-2.5 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition-colors">{t('southbound.machines.disarm')}</button>
                  ) : (
                    <button onClick={() => armMut.mutate(m.id)} disabled={armMut.isPending} className="px-2.5 py-1.5 text-[11px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">{t('southbound.machines.arm')}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const LOG_PAGE_SIZE = 15;

const pagerBtn = 'p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

/** Recent southbound command log (every dispatch: UI, API or Kafka).
 *  Paginated; rows can be selected and deleted from the log. */
export function SouthboundCommandLog() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ commands: SouthboundCommand[]; total: number }, Error>({
    queryKey: ['southbound-commands', page],
    queryFn: () => southboundApi.getCommands(LOG_PAGE_SIZE, page * LOG_PAGE_SIZE),
    refetchInterval: 4000,
    placeholderData: (prev) => prev,
  });

  const commands = data?.commands ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LOG_PAGE_SIZE));

  // If deletes shrink the log below the current page, snap back.
  useEffect(() => {
    if (page > 0 && page >= pages) setPage(pages - 1);
  }, [page, pages]);

  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => southboundApi.deleteCommands(ids),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['southbound-commands'] });
    },
  });

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const pageIds = commands.map((c) => c.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    allOnPageSelected ? pageIds.forEach((id) => next.delete(id)) : pageIds.forEach((id) => next.add(id));
    return next;
  });

  const from = total === 0 ? 0 : page * LOG_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * LOG_PAGE_SIZE);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{t('southbound.log.title')}</h2>
        {total > 0 && (
          <button
            onClick={() => deleteMut.mutate([...selected])}
            disabled={selected.size === 0 || deleteMut.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-40 disabled:hover:bg-red-50 dark:disabled:hover:bg-red-900/20 transition-colors"
          >
            {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {t('southbound.log.deleteSelected', { count: selected.size })}
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : commands.length === 0 ? (
          <div className="px-6 py-8 text-center text-[13px] text-gray-400">{t('southbound.log.empty')}</div>
        ) : (
          <table className="w-full text-[12px]">
            <thead className="text-gray-400 border-b border-gray-50 dark:border-gray-800/50">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} className="accent-gray-900 dark:accent-white" />
                </th>
                <th className="text-left py-2 font-medium">{t('southbound.log.machine')}</th><th className="text-left py-2 font-medium">{t('southbound.log.command')}</th><th className="text-left py-2 font-medium">{t('southbound.log.status')}</th><th className="text-left py-2 font-medium">{t('southbound.log.error')}</th><th className="text-left py-2 font-medium pr-5">{t('southbound.log.when')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {commands.map((c) => (
                <tr key={c.id} className={cn(selected.has(c.id) && 'bg-gray-50/70 dark:bg-gray-800/40')}>
                  <td className="px-4 py-2">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-gray-900 dark:accent-white" />
                  </td>
                  <td className="py-2 font-medium text-gray-700 dark:text-gray-300">{c.machine_id}</td>
                  <td className="py-2 text-gray-500">{c.method_name || c.command_kind}</td>
                  <td className="py-2"><span className={cn('px-1.5 py-0.5 rounded-md font-medium', statusBadge[c.status] ?? 'bg-amber-50 text-amber-600')}>{c.status}</span></td>
                  <td className="py-2 text-red-400 truncate max-w-[200px]">{c.error ?? ''}</td>
                  <td className="py-2 pr-5 text-gray-400 font-mono">{new Date(c.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > LOG_PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-gray-50 dark:border-gray-800/50">
            <span className="text-[11px] text-gray-400 tabular-nums">{t('events.pager.range', { from, to, total })}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={pagerBtn} title={t('events.pager.prev')}><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-[11px] text-gray-400 tabular-nums">{page + 1}/{pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className={pagerBtn} title={t('events.pager.next')}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
