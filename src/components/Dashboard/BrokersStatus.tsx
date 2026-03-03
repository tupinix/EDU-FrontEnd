import { Server, Wifi, WifiOff, AlertTriangle, Radio, Lock } from 'lucide-react';
import { BrokerConfig } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusIcons = {
  connected: Wifi,
  connecting: Radio,
  disconnected: WifiOff,
  error: AlertTriangle,
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  connected: 'success',
  connecting: 'warning',
  disconnected: 'secondary',
  error: 'destructive',
};

const statusText: Record<string, string> = {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Brokers</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum broker configurado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status dos Brokers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {brokers.map((broker) => {
            const StatusIcon = statusIcons[broker.status];
            const isActive = broker.id === activeBrokerId;

            return (
              <div
                key={broker.id}
                className={cn(
                  'px-6 py-4 flex items-center gap-4',
                  isActive && 'bg-primary-50/50 border-l-4 border-l-primary-500'
                )}
              >
                <div className={cn('p-2 rounded-lg', isActive ? 'bg-primary-100' : 'bg-muted')}>
                  <Server className={cn('h-5 w-5', isActive ? 'text-primary-600' : 'text-muted-foreground')} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{broker.name}</p>
                    {broker.useTls && <Lock className="h-3 w-3 text-green-600" />}
                    {isActive && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {broker.host}:{broker.port}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {broker.lastConnected
                      ? `Última conexão: ${formatDistanceToNow(new Date(broker.lastConnected), { addSuffix: true, locale: ptBR })}`
                      : 'Nunca conectado'}
                    {(broker.messageCount ?? 0) > 0 && ` · ${(broker.messageCount ?? 0).toLocaleString('pt-BR')} msgs`}
                  </p>
                </div>

                <Badge variant={statusBadgeVariant[broker.status]} className="gap-1.5 shrink-0">
                  <StatusIcon className={cn('h-3 w-3', broker.status === 'connecting' && 'animate-pulse')} />
                  {statusText[broker.status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
