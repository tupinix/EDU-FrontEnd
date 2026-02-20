import { useState } from 'react';
import { Server, Plus, Plug, Unplug, Trash2, Loader2, AlertCircle, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { useOpcUaConnections, useConnectOpcUa, useDisconnectOpcUa, useDeleteOpcUaConnection } from '../../hooks/useOpcUa';
import { OpcUaForm } from './OpcUaForm';
import { OpcUaBrowser } from './OpcUaBrowser';
import { OpcUaMonitor } from './OpcUaMonitor';
import { OpcUaConnection } from '../../types';

export function OpcUaConnections() {
  const { data: connections, isLoading, error } = useOpcUaConnections();
  const connectMutation = useConnectOpcUa();
  const disconnectMutation = useDisconnectOpcUa();
  const deleteMutation = useDeleteOpcUaConnection();
  const [showForm, setShowForm] = useState(false);
  const [browsingConnection, setBrowsingConnection] = useState<OpcUaConnection | null>(null);
  const [monitoringConnection, setMonitoringConnection] = useState<OpcUaConnection | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>Erro ao carregar conexões OPC-UA: {error.message}</span>
      </div>
    );
  }

  if (browsingConnection) {
    return (
      <OpcUaBrowser
        connection={browsingConnection}
        onBack={() => setBrowsingConnection(null)}
      />
    );
  }

  if (monitoringConnection) {
    return (
      <OpcUaMonitor
        connection={monitoringConnection}
        onBack={() => setMonitoringConnection(null)}
      />
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary-500" />
          Conexões OPC-UA
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Conexão
        </button>
      </div>

      {showForm && (
        <OpcUaForm onClose={() => setShowForm(false)} />
      )}

      {(!connections || connections.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          <Server className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma conexão OPC-UA configurada</p>
          <p className="text-sm mt-1">Adicione um servidor OPC-UA para começar a coletar dados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-2.5 h-2.5 rounded-full', statusColor(conn.status))} />
                  <div>
                    <p className="font-medium text-gray-900">{conn.name}</p>
                    <p className="text-sm text-gray-500">{conn.endpointUrl}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Segurança: {conn.securityMode}
                      {conn.username && ' | Autenticado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {conn.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => setBrowsingConnection(conn)}
                        className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Browse
                      </button>
                      <button
                        onClick={() => setMonitoringConnection(conn)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Monitor ao vivo"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Monitor
                      </button>
                      <button
                        onClick={() => disconnectMutation.mutate(conn.id)}
                        disabled={disconnectMutation.isPending}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Desconectar"
                      >
                        <Unplug className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => connectMutation.mutate(conn.id)}
                      disabled={connectMutation.isPending}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Conectar"
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plug className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta conexão?')) {
                        deleteMutation.mutate(conn.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
