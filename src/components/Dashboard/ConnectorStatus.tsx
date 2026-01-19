import { Database, Server, HardDrive, Check, X, AlertTriangle } from 'lucide-react';
import { ConnectorStatus as ConnectorStatusType } from '../../types';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const connectorIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mqtt: Server,
  neo4j: Database,
  timescaledb: HardDrive,
  default: Database,
};

const statusIcons = {
  connected: Check,
  disconnected: X,
  error: AlertTriangle,
};

const statusColors = {
  connected: 'text-green-600 bg-green-100',
  disconnected: 'text-gray-600 bg-gray-100',
  error: 'text-red-600 bg-red-100',
};

interface ConnectorStatusProps {
  connectors: ConnectorStatusType[];
}

export function ConnectorStatus({ connectors }: ConnectorStatusProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Status dos Conectores</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {connectors.map((connector) => {
          const Icon = connectorIcons[connector.type] || connectorIcons.default;
          const StatusIcon = statusIcons[connector.status];

          return (
            <div key={connector.id} className="p-4 flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{connector.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {connector.lastConnected
                    ? `Última conexão: ${formatDistanceToNow(new Date(connector.lastConnected), { addSuffix: true, locale: ptBR })}`
                    : 'Nunca conectado'}
                </p>
                {connector.errorMessage && (
                  <p className="text-sm text-red-600 truncate mt-1">{connector.errorMessage}</p>
                )}
              </div>

              <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', statusColors[connector.status])}>
                <StatusIcon className="w-4 h-4" />
                <span className="capitalize">
                  {connector.status === 'connected' ? 'Conectado' : connector.status === 'disconnected' ? 'Desconectado' : 'Erro'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
