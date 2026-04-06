import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useEthipLiveValues } from '../../hooks/useEthernetIp';
import { useSocketStatus } from '../../hooks/useSocket';
import { EthipConnection, EthipLiveValue } from '../../types';
import { cn } from '@/lib/utils';

interface Props { connection: EthipConnection; onBack: () => void; }

function fmtVal(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
  if (value === null || value === undefined) return '-';
  return String(value);
}

export function EthernetIpMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const liveValues = useEthipLiveValues(connection.id);
  const { isConnected: ws } = useSocketStatus();

  const filtered = liveValues.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.tagName.toLowerCase().includes(q) || (v.dataType || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Monitor — {connection.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', ws ? 'bg-emerald-400' : 'bg-gray-300')} />
              <span className="text-[11px] text-gray-400">{ws ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input type="text" placeholder="Filter by tag name or data type..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-100 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition-all" />
      </div>

      {liveValues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No values yet</p>
          <p className="text-[12px] text-gray-300 mt-1">Subscribe to tags in the Tag Browser to see live values</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Tag Name</th>
                <th className="text-left px-5 py-2.5">Type</th>
                <th className="text-left px-5 py-2.5">Value</th>
                <th className="text-left px-5 py-2.5">Quality</th>
                <th className="text-left px-5 py-2.5">Time</th>
                <th className="text-right px-5 py-2.5">#</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => <Row key={`${v.connectionId}::${v.tagName}`} v={v} />)}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-gray-300">No results for "{search}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-gray-300 text-right">{filtered.length} of {liveValues.length} tag(s)</p>
    </div>
  );
}

function Row({ v }: { v: EthipLiveValue }) {
  const ts = v.timestamp ? (() => { const d = new Date(v.timestamp); return `${d.toLocaleTimeString('pt-BR', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`; })() : '-';
  const qColor = v.quality === 'good' ? 'text-emerald-500' : v.quality === 'uncertain' ? 'text-amber-500' : 'text-red-400';
  return (
    <tr className="border-t border-gray-50">
      <td className="px-5 py-2 font-medium text-gray-700 font-mono">{v.tagName}</td>
      <td className="px-5 py-2"><span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{v.dataType || '-'}</span></td>
      <td className="px-5 py-2 font-mono font-semibold text-gray-900">{fmtVal(v.value)}</td>
      <td className={cn('px-5 py-2 font-medium', qColor)}>{v.quality}</td>
      <td className="px-5 py-2 font-mono text-gray-400 tabular-nums">{ts}</td>
      <td className="px-5 py-2 text-right text-gray-300 tabular-nums">{v.updateCount}</td>
    </tr>
  );
}
