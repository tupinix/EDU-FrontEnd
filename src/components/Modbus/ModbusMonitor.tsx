import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useModbusLiveValues } from '../../hooks/useModbus';
import { useSocketStatus } from '../../hooks/useSocket';
import { ModbusConnection, ModbusLiveValue } from '../../types';
import { cn } from '@/lib/utils';

interface Props { connection: ModbusConnection; onBack: () => void; }

function fmtVal(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return typeof value === 'number' ? (Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '')) : String(value);
}

export function ModbusMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const liveValues = useModbusLiveValues(connection.id);
  const { isConnected: ws } = useSocketStatus();

  const filtered = liveValues.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.registerType.toLowerCase().includes(q) || String(v.address).includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Monitor — {connection.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', ws ? 'bg-emerald-400' : 'bg-gray-300')} />
              <span className="text-[11px] text-gray-400">{ws ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input type="text" placeholder="Filter by name, type or address..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all" />
      </div>

      {liveValues.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No values yet</p>
          <p className="text-[12px] text-gray-300 mt-1">Connect and configure registers to see live values</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-[11px] font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Name</th>
                <th className="text-left px-5 py-2.5">Type</th>
                <th className="text-left px-5 py-2.5">Addr</th>
                <th className="text-left px-5 py-2.5">Value</th>
                <th className="text-left px-5 py-2.5">Raw</th>
                <th className="text-left px-5 py-2.5">Quality</th>
                <th className="text-left px-5 py-2.5">Time</th>
                <th className="text-right px-5 py-2.5">#</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => <Row key={`${v.connectionId}::${v.registerId}`} v={v} />)}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-gray-300">No results for "{search}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-gray-300 text-right">{filtered.length} of {liveValues.length} register(s)</p>
    </div>
  );
}

function Row({ v }: { v: ModbusLiveValue }) {
  const ts = v.timestamp ? (() => { const d = new Date(v.timestamp); return `${d.toLocaleTimeString('pt-BR', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`; })() : '—';
  const qColor = v.quality === 'good' ? 'text-emerald-500' : v.quality === 'uncertain' ? 'text-amber-500' : 'text-red-400';
  return (
    <tr className="border-t border-gray-50 dark:border-gray-800/50">
      <td className="px-5 py-2 font-medium text-gray-700 dark:text-gray-300">{v.name}</td>
      <td className="px-5 py-2"><span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">{v.registerType}</span></td>
      <td className="px-5 py-2 font-mono text-gray-400">{v.address}</td>
      <td className="px-5 py-2 font-mono font-semibold text-gray-900 dark:text-gray-100">{fmtVal(v.value)}</td>
      <td className="px-5 py-2 font-mono text-gray-300">{v.rawValue}</td>
      <td className={cn('px-5 py-2 font-medium', qColor)}>{v.quality}</td>
      <td className="px-5 py-2 font-mono text-gray-400 tabular-nums">{ts}</td>
      <td className="px-5 py-2 text-right text-gray-300 tabular-nums">{v.updateCount}</td>
    </tr>
  );
}
