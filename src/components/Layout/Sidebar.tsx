import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  // Network, // TODO: Enable when Discovery page is ready
  Search,
  Bot,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  LogOut,
  Shield,
  Wrench,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../hooks/useStore';
import { clsx } from 'clsx';
import LogoTupinix from '../../utils/Logo BR.jpg';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  // { path: '/discovery', labelKey: 'sidebar.discovery', icon: Network }, // TODO: Enable when Discovery page is ready
  { path: '/explorer', labelKey: 'sidebar.explorer', icon: Search },
  { path: '/assistant', labelKey: 'sidebar.assistant', icon: Bot },
  { path: '/reports', labelKey: 'sidebar.reports', icon: FileBarChart },
  { path: '/configuration', labelKey: 'sidebar.configuration', icon: Settings },
  { path: '/users', labelKey: 'sidebar.users', icon: Users, adminOnly: true },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-gradient-to-b from-[#059669] to-[#022c22] text-white transition-all duration-300 z-40 flex flex-col shadow-xl',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={LogoTupinix}
              alt="Tupinix"
              className="relative w-9 h-9 rounded-lg object-cover ring-2 ring-white/20 group-hover:ring-white/40 transition-all"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden animate-fade-in">
              <h1 className="font-bold text-lg tracking-tight">EDU</h1>
              <p className="text-xs text-white/60 truncate">Espaco de Dados Unificado</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredNavItems.map((item, index) => (
            <li key={item.path} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
                title={sidebarCollapsed ? t(item.labelKey) : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                    <item.icon className={clsx(
                      'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )} />
                    {!sidebarCollapsed && (
                      <span className="truncate font-medium">{t(item.labelKey)}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and logout */}
      <div className="border-t border-white/10 p-3 space-y-3 bg-black/10">
        {/* User info */}
        {user && (
          <div className={clsx(
            'flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5',
            sidebarCollapsed ? 'justify-center' : ''
          )}>
            <div className={clsx(
              'flex items-center justify-center rounded-lg bg-white/10',
              sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'
            )}>
              {user.role === 'admin' ? (
                <Shield className="w-5 h-5 text-amber-300" />
              ) : (
                <Wrench className="w-5 h-5 text-white/80" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                <p className="text-xs text-white/50 capitalize">
                  {t(`roles.${user.role}`)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group',
            sidebarCollapsed ? 'justify-center' : ''
          )}
          title={sidebarCollapsed ? t('auth.logout') : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {!sidebarCollapsed && <span className="text-sm font-medium">{t('auth.logout')}</span>}
        </button>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200',
            sidebarCollapsed ? 'justify-center' : ''
          )}
          title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs">{t('sidebar.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
