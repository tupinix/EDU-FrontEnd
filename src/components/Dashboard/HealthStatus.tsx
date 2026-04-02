import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthStatusProps {
  status: 'connected' | 'degraded' | 'offline';
  latency?: number;
}

const config = {
  connected: { dot: 'bg-emerald-400', label: 'Operational', color: 'text-emerald-600' },
  degraded: { dot: 'bg-amber-400', label: 'Degraded', color: 'text-amber-600' },
  offline: { dot: 'bg-red-400', label: 'Offline', color: 'text-red-500' },
};

export function HealthStatus({ status, latency }: HealthStatusProps) {
  const c = config[status];

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className={cn('relative flex h-2 w-2', c.dot, 'rounded-full')}>
        {status === 'connected' && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
        )}
      </span>
      <span className={cn('font-medium', c.color)}>{c.label}</span>
      {latency !== undefined && (
        <span className="flex items-center gap-1 text-gray-400">
          <Activity className="w-3 h-3" />
          {latency}ms
        </span>
      )}
    </div>
  );
}
