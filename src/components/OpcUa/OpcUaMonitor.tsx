import { useState } from 'react';
import { ArrowLeft, RefreshCw, Search, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useOpcUaLiveValues } from '../../hooks/useOpcUa';
import { useSocketStatus } from '../../hooks/useSocket';
import { opcuaApi } from '../../services/api';
import { OpcUaConnection, NodeLiveValue } from '../../types';
import { cn } from '@/lib/utils';

interface Props { connection: OpcUaConnection; onBack: () => void; }

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(6).replace(/\.?0+$/, '');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function OpcUaMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [readNodeId, setReadNodeId] = useState('');
  const liveValues = useOpcUaLiveValues(connection.id);
  const { isConnected: ws } = useSocketStatus();
  const readMutation = useMutation({ mutationFn: () => opcuaApi.readNode(connection.id, readNodeId.trim()) });

  const filtered = liveValues.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.nodeId.toLowerCase().includes(q) || v.displayName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Monitor — {connection.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', ws ? 'bg-emerald-400' : 'bg-gray-300')} />
            <span className="text-[11px] text-gray-400">{ws ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* On-demand read */}
      <div className="flex gap-2">
        <input type="text" placeholder="NodeId for on-demand read (e.g. ns=2;i=2)" value={readNodeId}
          onChange={e => setReadNodeId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && readNodeId.trim() && readMutation.mutate()}
          className="flex-1 px-3.5 py-2 text-[13px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 dark:focus:border-gray-700 dark:focus:ring-gray-800 transition-all" />
        <button onClick={() => readMutation.mutate()} disabled={!readNodeId.trim() || readMutation.isPending}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30">
          {readMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Read
        </button>
      </div>

      {readMutation.data && <ReadResult value={readMutation.data} />}
      {readMutation.error && <div className="text-[13px] text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3">{(readMutation.error as Error).message}</div>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input type="text" placeholder="Filter by Node ID or name..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 dark:focus:border-gray-700 dark:focus:ring-gray-800 transition-all" />
      </div>

      {liveValues.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No values yet</p>
          <p className="text-[12px] text-gray-300 mt-1">Create subscriptions in Browser to see live values</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Node ID</th>
                <th className="text-left px-5 py-2.5">Type</th>
                <th className="text-left px-5 py-2.5">Value</th>
                <th className="text-left px-5 py-2.5">Quality</th>
                <th className="text-left px-5 py-2.5">Time</th>
                <th className="text-right px-5 py-2.5">#</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => <MonitorRow key={`${v.connectionId}::${v.nodeId}`} v={v} />)}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-gray-300">No results for "{search}"</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-gray-300 text-right">{filtered.length} of {liveValues.length} node(s)</p>
    </div>
  );
}

function MonitorRow({ v }: { v: NodeLiveValue }) {
  const ts = v.timestamp ? (() => { const d = new Date(v.timestamp); return `${d.toLocaleTimeString('pt-BR', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`; })() : '—';
  const qGood = v.quality.toLowerCase().includes('good');
  const qColor = qGood ? 'text-emerald-500' : v.quality.toLowerCase().includes('uncertain') ? 'text-amber-500' : 'text-red-400';
  return (
    <tr className="border-t border-gray-50 dark:border-gray-800/50">
      <td className="px-5 py-2 font-mono text-gray-600 dark:text-gray-400 truncate max-w-[250px]" title={v.nodeId}>{v.nodeId}</td>
      <td className="px-5 py-2"><span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">{v.dataType}</span></td>
      <td className="px-5 py-2 font-mono font-semibold text-gray-900 dark:text-gray-100">{fmtVal(v.value)}</td>
      <td className={cn('px-5 py-2 font-medium', qColor)}>{v.quality.replace(/^StatusCodes_/, '')}</td>
      <td className="px-5 py-2 font-mono text-gray-400 tabular-nums">{ts}</td>
      <td className="px-5 py-2 text-right text-gray-300 tabular-nums">{v.updateCount}</td>
    </tr>
  );
}

function ReadResult({ value }: { value: NodeLiveValue }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
      <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">{value.nodeId}</span>
      <span><span className="text-gray-400">Value:</span> <strong className="text-gray-900 dark:text-gray-100">{fmtVal(value.value)}</strong></span>
      <span><span className="text-gray-400">Type:</span> {value.dataType}</span>
      <span><span className="text-gray-400">Quality:</span> {value.quality}</span>
    </div>
  );
}
