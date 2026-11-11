import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { dashboardItem, standaloneItems, getNavGroups, type NavItem } from './nav-config';

const IS_EDGE = import.meta.env.VITE_EDU_EDITION === 'edge';

// Same petrol gradient as the login brand panel: the menu is the brand surface
// of the app, in light and dark mode alike.
const SIDEBAR_BG = 'linear-gradient(180deg, #073f36 0%, #04261e 45%, #03140c 100%)';
const LOGO_GRADIENT = 'linear-gradient(135deg, #50c86e, #12a8b7 55%, #2177c0)';

function getInitials(name?: string, email?: string): string {
  const source = name || email || 'U';
  return source
    .split(/[\s@]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation();
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-full text-[13.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/30',
          collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-3 px-3.5 py-[7px]',
          isActive
            ? 'bg-white/[0.11] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
            : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#7fe0a6]')} strokeWidth={1.8} />
          {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
          {isActive && !collapsed && (
            <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: LOGO_GRADIENT }} />
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {t(item.labelKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, sidebarGroupsOpen, toggleSidebarGroup } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const filteredNavGroups = getNavGroups();

  // Which space the user is in: the tenant on a tenant subdomain, otherwise
  // the edition (the admin-on-apex case reads "Cloud").
  const spaceLabel = IS_EDGE ? 'Edge' : (user?.tenant?.name ?? 'Cloud');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label={t('sidebar.openMenu', 'Abrir menu')}
        className="fixed left-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden"
      >
        <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Floating panel: rounded on every side, detached from the window edge. */}
      <aside
        style={{ background: SIDEBAR_BG }}
        className={cn(
          'fixed bottom-3 left-3 top-3 z-40 flex flex-col overflow-hidden rounded-[24px] text-white shadow-[0_20px_50px_-20px_rgba(3,20,12,0.55)] transition-all duration-300',
          sidebarCollapsed ? '-translate-x-[calc(100%+1rem)] lg:w-16 lg:translate-x-0' : 'w-60 translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-16 shrink-0 items-center', sidebarCollapsed ? 'justify-center' : 'gap-3 px-5')}>
          <img
            src="/edu-logo.png"
            alt="EDU"
            className={cn('w-auto shrink-0 select-none', sidebarCollapsed ? 'h-[18px]' : 'h-7')}
            draggable={false}
          />
          {!sidebarCollapsed && (
            <span className="truncate rounded-full bg-white/[0.09] px-2.5 py-0.5 text-[12px] font-medium text-white/75">
              {spaceLabel}
            </span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className={cn('space-y-0.5 pb-3', sidebarCollapsed ? 'px-2' : 'px-3')}>
            <SidebarNavItem item={dashboardItem} collapsed={sidebarCollapsed} />

            {standaloneItems.map((item) => (
              <SidebarNavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
            ))}

            {filteredNavGroups.map((group) => {
              const visibleItems = group.items.filter((item) => !item.adminOnly || user?.role === 'admin');
              if (visibleItems.length === 0) return null;

              if (sidebarCollapsed) {
                return (
                  <div key={group.key} className="space-y-0.5">
                    <div className="mx-auto my-2.5 h-1 w-1 rounded-full bg-white/20" />
                    {visibleItems.map((item) => (
                      <SidebarNavItem key={item.path} item={item} collapsed />
                    ))}
                  </div>
                );
              }

              const isOpen = sidebarGroupsOpen[group.key] !== false;
              return (
                <Collapsible key={group.key} open={isOpen} onOpenChange={() => toggleSidebarGroup(group.key)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-full px-3.5 pb-1.5 pt-4 text-[12px] font-medium text-white/40 outline-none transition-colors hover:text-white/70 focus-visible:text-white/70">
                    {t(group.labelKey)}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    {visibleItems.map((item) => (
                      <SidebarNavItem key={item.path} item={item} collapsed={false} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer: user card + collapse */}
        <div className={cn('shrink-0 space-y-1 p-2', !sidebarCollapsed && 'px-3 pb-3')}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] p-2 text-left outline-none transition-colors hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-white/30',
                    sidebarCollapsed && 'justify-center bg-transparent p-1'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white/[0.12] text-[11px] font-medium text-white/80">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white/85">{user.name || user.email}</p>
                      <p className="text-[12px] capitalize text-white/40">{user.role}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? t('sidebar.expand', 'Expandir menu') : t('sidebar.collapse')}
            className={cn(
              'flex items-center gap-2 rounded-full text-[12.5px] text-white/40 outline-none transition-colors hover:bg-white/[0.06] hover:text-white/75 focus-visible:ring-2 focus-visible:ring-white/30',
              sidebarCollapsed ? 'mx-auto h-9 w-9 justify-center' : 'w-full px-3.5 py-2'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>{t('sidebar.collapse')}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
