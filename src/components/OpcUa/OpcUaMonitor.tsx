import { useState } from 'react';
import { ArrowLeft, Activity, RefreshCw, Search, Circle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { useOpcUaLiveValues } from '../../hooks/useOpcUa';
import { useSocketStatus } from '../../hooks/useSocket';
import { opcuaApi } from '../../services/api';
import { OpcUaConnection, NodeLiveValue } from '../../types';

interface Props {
  connection: OpcUaConnection;
  onBack: () => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function qualityBadge(quality: string) {
  const isGood = quality.toLowerCase().includes('good');
  const isUncertain = quality.toLowerCase().includes('uncertain');
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
      isGood ? 'bg-green-100 text-green-700' :
      isUncertain ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    )}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {quality.replace(/^StatusCodes_/, '')}
    </span>
  );
}

export function OpcUaMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [readNodeId, setReadNodeId] = useState('');
  const liveValues = useOpcUaLiveValues(connection.id);
  const { isConnected: wsConnected } = useSocketStatus();

  const readMutation = useMutation({
    mutationFn: () => opcuaApi.readNode(connection.id, readNodeId.trim()),
  });

  const filtered = liveValues.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.nodeId.toLowerCase().includes(q) || v.displayName.toLowerCase().includes(q);
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

      {/* On-demand read */}
      <div className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="text"
          placeholder="NodeId para leitura pontual (ex: ns=2;i=2)"
          value={readNodeId}
          onChange={e => setReadNodeId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && readNodeId.trim() && readMutation.mutate()}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          onClick={() => readMutation.mutate()}
          disabled={!readNodeId.trim() || readMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
        >
          {readMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Ler
        </button>
      </div>

      {/* On-demand read result */}
      {readMutation.data && (
        <ReadResult value={readMutation.data} />
      )}
      {readMutation.error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {(readMutation.error as Error).message}
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filtrar por Node ID ou nome..."
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
          <p className="text-xs mt-1">Crie subscrições no Browser para ver valores ao vivo aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-5/12">Node ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-1/12">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-2/12">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-2/12">Qualidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-2/12">Timestamp</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-[60px]">#</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <MonitorRow key={`${v.connectionId}::${v.nodeId}`} value={v} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Nenhum resultado para "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        {filtered.length} de {liveValues.length} node(s)
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MonitorRow({ value }: { value: NodeLiveValue }) {
  const ts = value.timestamp ? (() => {
    const d = new Date(value.timestamp);
    const base = d.toLocaleTimeString('pt-BR', { hour12: false });
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${base}.${ms}`;
  })() : '—';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5 font-mono text-xs text-gray-700 truncate max-w-0">
        <span title={value.nodeId}>{value.nodeId}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {value.dataType}
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-sm font-semibold text-gray-900">
        {formatValue(value.value)}
      </td>
      <td className="px-4 py-2.5">
        {qualityBadge(value.quality)}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{ts}</td>
      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{value.updateCount}</td>
    </tr>
  );
}

function ReadResult({ value }: { value: NodeLiveValue }) {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1">
      <p className="font-medium text-blue-900">{value.nodeId}</p>
      <div className="flex flex-wrap gap-4 text-blue-800">
        <span><span className="text-blue-500">Valor:</span> <strong>{formatValue(value.value)}</strong></span>
        <span><span className="text-blue-500">Tipo:</span> {value.dataType}</span>
        <span><span className="text-blue-500">Qualidade:</span> {value.quality}</span>
        <span><span className="text-blue-500">Timestamp:</span> {value.timestamp ? new Date(value.timestamp).toLocaleString('pt-BR') : '—'}</span>
      </div>
    </div>
  );
}
