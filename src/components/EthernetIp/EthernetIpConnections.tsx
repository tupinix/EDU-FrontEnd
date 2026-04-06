import { useState } from 'react';
import { Plus, Plug, Unplug, Trash2, Loader2, Activity, Tags } from 'lucide-react';
import { useEthipConnections, useConnectEthip, useDisconnectEthip, useDeleteEthipConnection } from '../../hooks/useEthernetIp';
import { EthernetIpForm } from './EthernetIpForm';
import { EthernetIpTagBrowser } from './EthernetIpTagBrowser';
import { EthernetIpMonitor } from './EthernetIpMonitor';
import { EthipConnection } from '../../types';
import { cn } from '@/lib/utils';

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400 animate-pulse',
  error: 'bg-red-400',
  disconnected: 'bg-gray-300',
};

const plcTypeLabel: Record<string, string> = {
  logix: 'ControlLogix / CompactLogix',
  slc: 'SLC 5/05 / PLC-5',
  micro800: 'Micro800',
};

export function EthernetIpConnections() {
  const { data: connections, isLoading, error } = useEthipConnections();
  const connectMutation = useConnectEthip();
  const disconnectMutation = useDisconnectEthip();
  const deleteMutation = useDeleteEthipConnection();
  const [showForm, setShowForm] = useState(false);
  const [browsingConn, setBrowsingConn] = useState<EthipConnection | null>(null);
  const [monitoringConn, setMonitoringConn] = useState<EthipConnection | null>(null);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>;
  if (error) return <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500">Failed to load EtherNet/IP connections: {error.message}</div>;
  if (browsingConn) return <EthernetIpTagBrowser connection={browsingConn} onBack={() => setBrowsingConn(null)} />;
  if (monitoringConn) return <EthernetIpMonitor connection={monitoringConn} onBack={() => setMonitoringConn(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">Allen-Bradley PLC connections</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Connection
        </button>
      </div>

      {showForm && <EthernetIpForm onClose={() => setShowForm(false)} />}

      {(!connections || connections.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No EtherNet/IP connections</p>
          <p className="text-[12px] text-gray-300 mt-1">Add an Allen-Bradley PLC to start collecting data</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden divide-y divide-gray-50">
          {connections.map((conn) => (
            <div key={conn.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[conn.status] || 'bg-gray-300')} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900">{conn.name}</p>
                  <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">
                    {conn.host} &middot; Slot {conn.slot} &middot; {plcTypeLabel[conn.plcType] || conn.plcType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 sm:ml-0 shrink-0">
                {conn.status === 'connected' && (
                  <>
                    <button onClick={() => setBrowsingConn(conn)} className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                      <Tags className="w-3 h-3" /> Tag Browser
                    </button>
                    <button onClick={() => setMonitoringConn(conn)} className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Monitor
                    </button>
                    <button onClick={() => disconnectMutation.mutate(conn.id)} disabled={disconnectMutation.isPending} className="p-2 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                      <Unplug className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {conn.status !== 'connected' && (
                  <button onClick={() => connectMutation.mutate(conn.id)} disabled={connectMutation.isPending} className="p-2 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                    {connectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button onClick={() => { if (confirm('Delete this connection?')) deleteMutation.mutate(conn.id); }} disabled={deleteMutation.isPending} className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
