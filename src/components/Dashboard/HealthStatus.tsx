import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface HealthStatusProps {
  status: 'connected' | 'degraded' | 'offline';
  latency?: number;
}

export function HealthStatus({ status, latency }: HealthStatusProps) {
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'bg-green-100 text-green-800 border-green-200',
      dotColor: 'bg-green-500',
      label: 'Sistema Operacional',
      description: 'Todos os serviços estão funcionando normalmente.',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dotColor: 'bg-yellow-500',
      label: 'Desempenho Degradado',
      description: 'Alguns serviços podem estar com latência elevada.',
    },
    offline: {
      icon: WifiOff,
      color: 'bg-red-100 text-red-800 border-red-200',
      dotColor: 'bg-red-500',
      label: 'Sistema Offline',
      description: 'Não foi possível conectar ao broker MQTT.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={clsx('card border-l-4', config.color)}>
      <div className="p-4 flex items-start gap-4">
        <div className={clsx('p-2 rounded-lg', status === 'connected' ? 'bg-green-200' : status === 'degraded' ? 'bg-yellow-200' : 'bg-red-200')}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={clsx('w-2 h-2 rounded-full', config.dotColor, status === 'connected' && 'animate-pulse')} />
            <h3 className="font-semibold">{config.label}</h3>
          </div>
          <p className="text-sm mt-1 opacity-80">{config.description}</p>
          {latency !== undefined && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Activity className="w-4 h-4" />
              <span>Latência: {latency}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
