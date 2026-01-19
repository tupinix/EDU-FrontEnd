import { Server, Wifi, WifiOff, AlertTriangle, Radio, Lock } from 'lucide-react';
import { BrokerConfig } from '../../types';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusIcons = {
  connected: Wifi,
  connecting: Radio,
  disconnected: WifiOff,
  error: AlertTriangle,
};

const statusColors = {
  connected: 'text-green-600 bg-green-100',
  connecting: 'text-yellow-600 bg-yellow-100',
  disconnected: 'text-gray-600 bg-gray-100',
  error: 'text-red-600 bg-red-100',
};

const statusText = {
  connected: 'Conectado',
  connecting: 'Conectando',
  disconnected: 'Desconectado',
  error: 'Erro',
};

interface BrokersStatusProps {
  brokers: BrokerConfig[];
  activeBrokerId: string | null;
}

export function BrokersStatus({ brokers, activeBrokerId }: BrokersStatusProps) {
  if (brokers.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Status dos Brokers</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Server className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhum broker configurado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Status dos Brokers</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {brokers.map((broker) => {
          const StatusIcon = statusIcons[broker.status];
          const isActive = broker.id === activeBrokerId;

          return (
            <div
              key={broker.id}
              className={clsx(
                'p-4 flex items-center gap-4',
                isActive && 'bg-primary-50 border-l-4 border-primary-500'
              )}
            >
              <div className={clsx(
                'p-2 rounded-lg',
                isActive ? 'bg-primary-100' : 'bg-gray-100'
              )}>
                <Server className={clsx(
                  'w-5 h-5',
                  isActive ? 'text-primary-600' : 'text-gray-600'
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{broker.name}</p>
                  {broker.useTls && (
                    <Lock className="w-3 h-3 text-green-600" />
                  )}
                  {isActive && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate font-mono">
                  {broker.host}:{broker.port}
                </p>
                <p className="text-xs text-gray-400">
                  {broker.lastConnected
                    ? `Última conexão: ${formatDistanceToNow(new Date(broker.lastConnected), { addSuffix: true, locale: ptBR })}`
                    : 'Nunca conectado'}
                  {(broker.messageCount ?? 0) > 0 && ` • ${(broker.messageCount ?? 0).toLocaleString('pt-BR')} msgs`}
                </p>
              </div>

              <div className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                statusColors[broker.status]
              )}>
                <StatusIcon className={clsx(
                  'w-4 h-4',
                  broker.status === 'connecting' && 'animate-pulse'
                )} />
                <span>{statusText[broker.status]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
