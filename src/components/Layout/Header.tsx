import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, ServerOff, Wifi, WifiOff } from 'lucide-react';
import { useActiveBroker } from '../../hooks/useMetrics';
import { useAuthStore } from '../../hooks/useStore';
import { useSocketStatus } from '../../hooks/useSocket';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: activeBroker, isLoading } = useActiveBroker();
  const { user, clearAuth } = useAuthStore();
  const { isConnected: wsConnected, mode } = useSocketStatus();

  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-background border-b flex items-center justify-between px-6">
      {/* Left — Broker status */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
          </div>
        ) : activeBroker ? (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                hasActiveBroker && 'bg-green-500 animate-pulse-slow',
                activeBroker.status === 'connecting' && 'bg-yellow-500 animate-pulse',
                activeBroker.status === 'error' && 'bg-red-500',
                activeBroker.status === 'disconnected' && 'bg-gray-400'
              )}
            />
            <span className="text-sm">
              <span className="font-medium">{activeBroker.name}</span>
              <span className="text-muted-foreground">
                {' — '}
                <span
                  className={cn(
                    hasActiveBroker && 'text-green-600',
                    activeBroker.status === 'connecting' && 'text-yellow-600',
                    activeBroker.status === 'error' && 'text-red-600',
                    activeBroker.status === 'disconnected' && 'text-muted-foreground'
                  )}
                >
                  {hasActiveBroker
                    ? t('configuration.connected')
                    : activeBroker.status === 'connecting'
                      ? t('configuration.connecting')
                      : activeBroker.status === 'error'
                        ? t('configuration.errorStatus')
                        : t('configuration.disconnected')}
                </span>
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ServerOff className="h-4 w-4" />
            <span className="text-sm">{t('dashboard.noBroker')}</span>
          </div>
        )}
      </div>

      {/* Right — WS status + User */}
      <div className="flex items-center gap-3">
        {/* WebSocket badge */}
        <Badge variant={wsConnected ? 'success' : 'secondary'} className="gap-1.5">
          {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {mode === 'realtime' ? 'Real-time' : 'Polling'}
        </Badge>

        <Separator orientation="vertical" className="h-6" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-medium">
                  {(user?.name || user?.email || 'U')
                    .split(/[\s@]+/)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{user?.name || t('common.user')}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'viewer'}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
