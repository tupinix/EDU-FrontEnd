import { useState } from 'react';
import { Cpu, Plus, Plug, Unplug, Trash2, Loader2, AlertCircle, Activity, ListChecks } from 'lucide-react';
import { clsx } from 'clsx';
import { useModbusConnections, useConnectModbus, useDisconnectModbus, useDeleteModbusConnection } from '../../hooks/useModbus';
import { ModbusForm } from './ModbusForm';
import { ModbusRegisterConfig } from './ModbusRegisterConfig';
import { ModbusMonitor } from './ModbusMonitor';
import { ModbusConnection } from '../../types';

export function ModbusConnections() {
  const { data: connections, isLoading, error } = useModbusConnections();
  const connectMutation = useConnectModbus();
  const disconnectMutation = useDisconnectModbus();
  const deleteMutation = useDeleteModbusConnection();
  const [showForm, setShowForm] = useState(false);
  const [configuringConn, setConfiguringConn] = useState<ModbusConnection | null>(null);
  const [monitoringConn, setMonitoringConn] = useState<ModbusConnection | null>(null);

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
        <span>Erro ao carregar conexões Modbus: {error.message}</span>
      </div>
    );
  }

  if (configuringConn) {
    return (
      <ModbusRegisterConfig
        connection={configuringConn}
        onBack={() => setConfiguringConn(null)}
      />
    );
  }

  if (monitoringConn) {
    return (
      <ModbusMonitor
        connection={monitoringConn}
        onBack={() => setMonitoringConn(null)}
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

  const statusLabel = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-500" />
          Conexões Modbus TCP
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
        <ModbusForm onClose={() => setShowForm(false)} />
      )}

      {(!connections || connections.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          <Cpu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma conexão Modbus TCP configurada</p>
          <p className="text-sm mt-1">Adicione um dispositivo Modbus TCP para começar a coletar dados</p>
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
                    <p className="text-sm text-gray-500">
                      {conn.host}:{conn.port} — Unit ID: {conn.unitId}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Timeout: {conn.timeoutMs}ms &bull; {statusLabel(conn.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {conn.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => setConfiguringConn(conn)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                        title="Configurar registradores"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        Registradores
                      </button>
                      <button
                        onClick={() => setMonitoringConn(conn)}
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
                    <>
                      <button
                        onClick={() => setConfiguringConn(conn)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Configurar registradores"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        Registradores
                      </button>
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
                    </>
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
