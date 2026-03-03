import { useState } from 'react';
import { ArrowLeft, Activity, Search, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { useModbusLiveValues } from '../../hooks/useModbus';
import { useSocketStatus } from '../../hooks/useSocket';
import { ModbusConnection, ModbusLiveValue } from '../../types';

interface Props {
  connection: ModbusConnection;
  onBack: () => void;
}

function formatValue(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
  }
  return String(value);
}

function qualityBadge(quality: string) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
      quality === 'good' ? 'bg-green-100 text-green-700' :
      quality === 'uncertain' ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    )}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {quality === 'good' ? 'Boa' : quality === 'uncertain' ? 'Incerta' : 'Ruim'}
    </span>
  );
}

export function ModbusMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const liveValues = useModbusLiveValues(connection.id);
  const { isConnected: wsConnected } = useSocketStatus();

  const filtered = liveValues.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.registerType.toLowerCase().includes(q) || String(v.address).includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900">Monitor — {connection.name}</h3>
        </div>
        <span className={clsx(
          'ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          wsConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          <Circle className={clsx('w-1.5 h-1.5 fill-current', wsConnected ? 'animate-pulse' : '')} />
          {wsConnected ? 'Ao vivo' : 'Desconectado'}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filtrar por nome, tipo ou endereço..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Table */}
      {liveValues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum valor monitorado ainda.</p>
          <p className="text-xs mt-1">Conecte ao dispositivo e configure registradores para ver valores ao vivo aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Endereço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Raw</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Qualidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-[60px]">#</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <MonitorRow key={`${v.connectionId}::${v.registerId}`} value={v} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">
                    Nenhum resultado para "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        {filtered.length} de {liveValues.length} registrador(es)
      </p>
    </div>
  );
}

function MonitorRow({ value }: { value: ModbusLiveValue }) {
  const ts = value.timestamp ? (() => {
    const d = new Date(value.timestamp);
    const base = d.toLocaleTimeString('pt-BR', { hour12: false });
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${base}.${ms}`;
  })() : '—';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5 font-medium text-gray-900">{value.name}</td>
      <td className="px-4 py-2.5">
        <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
          {value.registerType}
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-gray-700">{value.address}</td>
      <td className="px-4 py-2.5 font-mono text-sm font-semibold text-gray-900">
        {formatValue(value.value)}
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{value.rawValue}</td>
      <td className="px-4 py-2.5">{qualityBadge(value.quality)}</td>
      <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{ts}</td>
      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{value.updateCount}</td>
    </tr>
  );
}
