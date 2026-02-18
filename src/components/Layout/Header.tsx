import { Bell, User, LogOut, ServerOff, Wifi, WifiOff } from 'lucide-react';
import { useActiveBroker } from '../../hooks/useMetrics';
import { useAuthStore } from '../../hooks/useStore';
import { useSocketStatus } from '../../hooks/useSocket';
import { clsx } from 'clsx';

export function Header() {
  const { data: activeBroker, isLoading } = useActiveBroker();
  const { user, clearAuth } = useAuthStore();
  const { isConnected: wsConnected, mode } = useSocketStatus();

  // Determine status based on active broker
  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const statusColor = hasActiveBroker
    ? 'bg-green-500'
    : activeBroker?.status === 'connecting'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const statusText = hasActiveBroker
    ? 'Conectado'
    : activeBroker?.status === 'connecting'
      ? 'Conectando...'
      : activeBroker?.status === 'error'
        ? 'Erro'
        : 'Desconectado';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Status */}
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            <span className="text-sm text-gray-400">Carregando...</span>
          </div>
        ) : activeBroker ? (
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              statusColor,
              hasActiveBroker && 'animate-pulse'
            )} />
            <span className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{activeBroker.name}</span>
              {': '}
              <span className={clsx(
                hasActiveBroker && 'text-green-600',
                activeBroker.status === 'connecting' && 'text-yellow-600',
                activeBroker.status === 'error' && 'text-red-600',
                activeBroker.status === 'disconnected' && 'text-gray-500'
              )}>
                {statusText}
              </span>
              {hasActiveBroker && (activeBroker.messageCount ?? 0) > 0 && (
                <span className="text-gray-400 ml-1">
                  ({(activeBroker.messageCount ?? 0).toLocaleString('pt-BR')} msgs)
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ServerOff className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Nenhum broker ativo</span>
          </div>
        )}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        {/* WebSocket Status */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          wsConnected
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        )}>
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {mode === 'realtime' ? 'Real-time' : 'Polling'}
        </div>
        {/* Notifications */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'viewer'}</p>
          </div>
          <button
            onClick={() => clearAuth()}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
