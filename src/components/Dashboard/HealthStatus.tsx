import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface HealthStatusProps {
  status: 'connected' | 'degraded' | 'offline';
  latency?: number;
}

const statusConfig = {
  connected: {
    icon: Wifi,
    borderColor: 'border-l-green-500',
    iconBg: 'bg-green-50 text-green-600',
    dotColor: 'bg-green-500',
    label: 'Sistema Operacional',
    description: 'Todos os serviços estão funcionando normalmente.',
  },
  degraded: {
    icon: AlertTriangle,
    borderColor: 'border-l-yellow-500',
    iconBg: 'bg-yellow-50 text-yellow-600',
    dotColor: 'bg-yellow-500',
    label: 'Desempenho Degradado',
    description: 'Alguns serviços podem estar com latência elevada.',
  },
  offline: {
    icon: WifiOff,
    borderColor: 'border-l-red-500',
    iconBg: 'bg-red-50 text-red-600',
    dotColor: 'bg-red-500',
    label: 'Sistema Offline',
    description: 'Não foi possível conectar ao broker MQTT.',
  },
};

export function HealthStatus({ status, latency }: HealthStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn('border-l-4', config.borderColor)}>
      <CardContent className="p-6 flex items-start gap-4">
        <div className={cn('p-2 rounded-lg', config.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                config.dotColor,
                status === 'connected' && 'animate-pulse-slow'
              )}
            />
            <h3 className="text-base font-semibold">{config.label}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          {latency !== undefined && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Latência: {latency}ms</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
