import { useState } from 'react';
import { Cpu, Plus, Plug, Unplug, Trash2, Loader2, AlertCircle, Activity, ListChecks } from 'lucide-react';
import { useModbusConnections, useConnectModbus, useDisconnectModbus, useDeleteModbusConnection } from '../../hooks/useModbus';
import { ModbusForm } from './ModbusForm';
import { ModbusRegisterConfig } from './ModbusRegisterConfig';
import { ModbusMonitor } from './ModbusMonitor';
import { ModbusConnection } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  connected: 'success',
  connecting: 'warning',
  error: 'destructive',
  disconnected: 'secondary',
};

const statusLabel: Record<string, string> = {
  connected: 'Conectado',
  connecting: 'Conectando...',
  error: 'Erro',
  disconnected: 'Desconectado',
};

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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar conexões Modbus: {error.message}</span>
        </CardContent>
      </Card>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Conexões Modbus TCP
        </h3>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {showForm && (
        <ModbusForm onClose={() => setShowForm(false)} />
      )}

      {(!connections || connections.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma conexão Modbus TCP configurada</p>
            <p className="text-sm mt-1">Adicione um dispositivo Modbus TCP para começar a coletar dados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <Card key={conn.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        conn.status === 'connected' && 'bg-green-500',
                        conn.status === 'connecting' && 'bg-yellow-500',
                        conn.status === 'error' && 'bg-red-500',
                        conn.status === 'disconnected' && 'bg-gray-400'
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">{conn.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conn.host}:{conn.port} — Unit ID: {conn.unitId}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Timeout: {conn.timeoutMs}ms</span>
                        <Badge variant={statusBadgeVariant[conn.status] || 'secondary'} className="text-[10px]">
                          {statusLabel[conn.status] || conn.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfiguringConn(conn)}
                      className="gap-1.5"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      Registradores
                    </Button>

                    {conn.status === 'connected' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMonitoringConn(conn)}
                          className="gap-1.5"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          Monitor
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => disconnectMutation.mutate(conn.id)}
                          disabled={disconnectMutation.isPending}
                          title="Desconectar"
                        >
                          <Unplug className="h-4 w-4 text-yellow-600" />
                        </Button>
                      </>
                    )}

                    {conn.status !== 'connected' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => connectMutation.mutate(conn.id)}
                        disabled={connectMutation.isPending}
                        title="Conectar"
                      >
                        {connectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plug className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta conexão?')) {
                          deleteMutation.mutate(conn.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
