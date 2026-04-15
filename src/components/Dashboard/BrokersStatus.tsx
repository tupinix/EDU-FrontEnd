import { Lock } from 'lucide-react';
import { BrokerConfig } from '../../types';
import { cn } from '@/lib/utils';

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-gray-300',
  error: 'bg-red-400',
};

interface BrokersStatusProps {
  brokers: BrokerConfig[];
  activeBrokerId: string | null;
}

export function BrokersStatus({ brokers, activeBrokerId }: BrokersStatusProps) {
  if (brokers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-8 text-center">
        <p className="text-[13px] text-gray-300">No brokers configured</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Brokers</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
        {brokers.map((broker) => {
          const isActive = broker.id === activeBrokerId;
          return (
            <div key={broker.id} className="px-6 py-4 flex items-center gap-4">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[broker.status])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100 truncate">{broker.name}</p>
                  {broker.useTls && <Lock className="w-3 h-3 text-gray-300" />}
                  {isActive && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">
                  {broker.host}:{broker.port}
                </p>
              </div>
              {(broker.messageCount ?? 0) > 0 && (
                <span className="text-[12px] text-gray-300 tabular-nums shrink-0">
                  {(broker.messageCount ?? 0).toLocaleString('pt-BR')} msgs
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
