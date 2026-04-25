import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Plug, Unplug, Trash2, Loader2, Activity } from 'lucide-react';
import { useOpcUaConnections, useConnectOpcUa, useDisconnectOpcUa, useDeleteOpcUaConnection } from '../../hooks/useOpcUa';
import { OpcUaForm, type OpcUaFormInitial } from './OpcUaForm';
import { OpcUaBrowser } from './OpcUaBrowser';
import { OpcUaMonitor } from './OpcUaMonitor';
import { OpcUaConnection } from '../../types';
import { cn } from '@/lib/utils';

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400', connecting: 'bg-amber-400 animate-pulse', error: 'bg-red-400', disconnected: 'bg-gray-300',
};

export function OpcUaConnections() {
  const { data: connections, isLoading, error } = useOpcUaConnections();
  const connectMutation = useConnectOpcUa();
  const disconnectMutation = useDisconnectOpcUa();
  const deleteMutation = useDeleteOpcUaConnection();
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<OpcUaFormInitial | undefined>();
  const [browsingConn, setBrowsingConn] = useState<OpcUaConnection | null>(null);
  const [monitoringConn, setMonitoringConn] = useState<OpcUaConnection | null>(null);
  const [prefillBanner, setPrefillBanner] = useState<string>('');

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const prefill = (location.state as { prefill?: OpcUaFormInitial } | null)?.prefill;
    if (!prefill || !connections) return;
    const existing = connections.find((c) => c.endpointUrl === prefill.endpointUrl);
    if (existing) {
      setPrefillBanner(`Connection for ${existing.endpointUrl} already exists`);
      if (existing.status !== 'connected') connectMutation.mutate(existing.id);
    } else {
      setFormInitial(prefill);
      setShowForm(true);
    }
    navigate(location.pathname, { replace: true });
  }, [location.state, connections]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>;
  if (error) return <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">Failed to load OPC-UA connections: {error.message}</div>;
  if (browsingConn) return <OpcUaBrowser connection={browsingConn} onBack={() => setBrowsingConn(null)} />;
  if (monitoringConn) return <OpcUaMonitor connection={monitoringConn} onBack={() => setMonitoringConn(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Connection
        </button>
      </div>

      {prefillBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-3 text-[13px] text-blue-600 dark:text-blue-400 flex items-center justify-between">
          <span>{prefillBanner}</span>
          <button onClick={() => setPrefillBanner('')} className="text-blue-400 hover:text-blue-600">×</button>
        </div>
      )}

      {showForm && <OpcUaForm onClose={() => { setShowForm(false); setFormInitial(undefined); }} initialValues={formInitial} />}

      {(!connections || connections.length === 0) ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No OPC-UA connections</p>
          <p className="text-[12px] text-gray-300 mt-1">Add an OPC-UA server to start collecting data</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
          {connections.map((conn) => (
            <div key={conn.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[conn.status])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{conn.name}</p>
                  <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">{conn.endpointUrl}</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Security: {conn.securityMode}{conn.username ? ' · Authenticated' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 sm:ml-0 shrink-0">
                {conn.status === 'connected' && (
                  <>
                    <button onClick={() => setBrowsingConn(conn)} className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Browse</button>
                    <button onClick={() => setMonitoringConn(conn)} className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1">
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
