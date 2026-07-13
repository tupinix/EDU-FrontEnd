import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, ShieldOff, Send, AlertTriangle } from 'lucide-react';
import { opcuaApi, southboundApi } from '../../services/api';
import { OpcUaConnection, SouthboundCommand } from '../../types';
import { cn } from '@/lib/utils';

const statusBadge: Record<string, string> = {
  ACK: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  NACK: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  received: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const KINDS = ['workorder', 'boxchange', 'recipe', 'testsample'] as const;

export function SouthboundPanel() {
  const qc = useQueryClient();
  const { data: connections } = useQuery<OpcUaConnection[], Error>({
    queryKey: ['opcua-connections'],
    queryFn: opcuaApi.getConnections,
    refetchInterval: 5000,
  });
  const { data: commands, isLoading } = useQuery<SouthboundCommand[], Error>({
    queryKey: ['southbound-commands'],
    queryFn: () => southboundApi.getCommands(100),
    refetchInterval: 4000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['opcua-connections'] });
  const armMut = useMutation({ mutationFn: southboundApi.arm, onSuccess: invalidate });
  const disarmMut = useMutation({ mutationFn: southboundApi.disarm, onSuccess: invalidate });
  const dispatchMut = useMutation({
    mutationFn: southboundApi.dispatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['southbound-commands'] }),
  });

  const machines = (connections ?? []).filter((c) => c.euromapEnabled);
  const [machineId, setMachineId] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('workorder');

  return (
    <div className="space-y-6">
      {/* Safety banner */}
      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-amber-700 dark:text-amber-400">
          Comandos só executam em máquinas <strong>armadas</strong>. Desarmado ou sem binding configurado → <strong>NACK</strong>. Arme apenas o que você controla.
        </p>
      </div>

      {/* Machines + arm/disarm */}
      <section>
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Máquinas EUROMAP</h2>
        {machines.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-8 text-center text-[13px] text-gray-400">
            Nenhuma conexão OPC-UA com EUROMAP habilitado
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
                    {m.southboundArmed ? <><ShieldCheck className="w-3 h-3" /> Armado</> : <><ShieldOff className="w-3 h-3" /> Desarmado</>}
                  </span>
                  {m.southboundArmed ? (
                    <button onClick={() => disarmMut.mutate(m.id)} disabled={disarmMut.isPending} className="px-2.5 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition-colors">Desarmar</button>
                  ) : (
                    <button onClick={() => armMut.mutate(m.id)} disabled={armMut.isPending} className="px-2.5 py-1.5 text-[11px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Armar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Test dispatch */}
      <section>
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Enviar comando de teste</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-[11px] font-medium text-gray-500">machineId</span>
            <input value={machineId} onChange={(e) => setMachineId(e.target.value)} placeholder="IMM-01" className="mt-1 px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-gray-500">comando</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])} className="mt-1 px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <button onClick={() => dispatchMut.mutate({ machineId, commandKind: kind })} disabled={!machineId || dispatchMut.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl disabled:opacity-50">
            {dispatchMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Enviar
          </button>
          {dispatchMut.isError && <span className="text-[12px] text-red-500">{(dispatchMut.error as Error).message}</span>}
        </div>
      </section>

      {/* Command log */}
      <section>
        <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Log de comandos</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
          ) : (commands ?? []).length === 0 ? (
            <div className="px-6 py-8 text-center text-[13px] text-gray-400">Nenhum comando ainda</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="text-gray-400 border-b border-gray-50 dark:border-gray-800/50">
                <tr><th className="text-left px-5 py-2 font-medium">máquina</th><th className="text-left py-2 font-medium">comando</th><th className="text-left py-2 font-medium">status</th><th className="text-left py-2 font-medium">erro</th><th className="text-left py-2 font-medium pr-5">quando</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {(commands ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-2 font-medium text-gray-700 dark:text-gray-300">{c.machine_id}</td>
                    <td className="py-2 text-gray-500">{c.command_kind}</td>
                    <td className="py-2"><span className={cn('px-1.5 py-0.5 rounded-md font-medium', statusBadge[c.status] ?? 'bg-amber-50 text-amber-600')}>{c.status}</span></td>
                    <td className="py-2 text-red-400 truncate max-w-[200px]">{c.error ?? ''}</td>
                    <td className="py-2 pr-5 text-gray-400 font-mono">{new Date(c.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
