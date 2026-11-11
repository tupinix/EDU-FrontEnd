import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useActiveBroker } from '../../hooks/useMetrics';
import { useAuthStore, useUIStore } from '../../hooks/useStore';
import { useSocketStatus } from '../../hooks/useSocket';
import { cn } from '@/lib/utils';
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
  const { data: activeBroker } = useActiveBroker();
  const { user, clearAuth } = useAuthStore();
  const { isConnected: wsConnected, mode } = useSocketStatus();

  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#f4f7f6]/85 dark:bg-[#0f1117]/85 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Left — Broker status */}
      <div className="flex items-center gap-2.5 pl-10 lg:pl-0">
        {activeBroker ? (
          <>
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                hasActiveBroker && 'bg-emerald-400',
                activeBroker.status === 'connecting' && 'bg-amber-400 animate-pulse',
                activeBroker.status === 'error' && 'bg-red-400',
                activeBroker.status === 'disconnected' && 'bg-gray-300'
              )}
            />
            <span className="text-[13px] text-gray-500 dark:text-gray-400 hidden sm:inline">
              <span className="font-medium text-gray-800 dark:text-gray-200">{activeBroker.name}</span>
              <span className={cn('ml-2', hasActiveBroker ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400')}>
                {t(`header.status.${activeBroker.status}`, activeBroker.status)}
              </span>
            </span>
          </>
        ) : (
          <span className="text-[13px] text-gray-300">{t('dashboard.noBroker')}</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <DarkModeToggle />

        {/* WS indicator */}
        <div className="flex items-center gap-1.5 text-[12.5px] text-gray-500 dark:text-gray-400">
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="hidden sm:inline">{mode === 'realtime' ? t('header.realtime') : t('header.polling')}</span>
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-2.5 hover:bg-white dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-[11px] font-medium">
                  {(user?.name || user?.email || 'U')
                    .split(/[\s@]+/)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                {user?.name || user?.email}
              </span>
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

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useUIStore();
  return (
    <button
      onClick={toggleDarkMode}
      className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
