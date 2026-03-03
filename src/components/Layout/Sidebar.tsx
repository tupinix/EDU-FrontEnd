import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
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
import { dashboardItem, navGroups, type NavItem } from './nav-config';
import LogoTupinix from '../../utils/Logo BR.jpg';

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
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative',
          isActive
            ? 'bg-white/10 text-white border-l-2 border-white'
            : 'text-white/70 hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-emerald-950 text-white transition-all duration-300 z-40 flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={LogoTupinix}
              alt="EDU"
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20"
            />
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <span className="font-semibold text-base tracking-tight">EDU Platform</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {/* Dashboard (standalone) */}
            <SidebarNavItem item={dashboardItem} collapsed={sidebarCollapsed} />

            {sidebarCollapsed ? (
              /* Collapsed: icons only, separated by dividers */
              <>
                {navGroups.map((group) => {
                  const visibleItems = group.items.filter(
                    (item) => !item.adminOnly || user?.role === 'admin'
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <Separator className="my-2 bg-white/10" />
                      <div className="space-y-1">
                        {visibleItems.map((item) => (
                          <SidebarNavItem key={item.path} item={item} collapsed />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* Expanded: collapsible groups */
              <>
                {navGroups.map((group) => {
                  const visibleItems = group.items.filter(
                    (item) => !item.adminOnly || user?.role === 'admin'
                  );
                  if (visibleItems.length === 0) return null;

                  const isOpen = sidebarGroupsOpen[group.key] !== false;

                  return (
                    <Collapsible
                      key={group.key}
                      open={isOpen}
                      onOpenChange={() => toggleSidebarGroup(group.key)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 pt-4 pb-1 group">
                        <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
                          {t(group.labelKey)}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 text-white/30 transition-transform',
                            !isOpen && '-rotate-90'
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                        <div className="space-y-1 mt-1">
                          {visibleItems.map((item) => (
                            <SidebarNavItem key={item.path} item={item} collapsed={false} />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer: user + toggle */}
        <div className="border-t border-white/10 p-2 space-y-2">
          {/* User */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-white/5 transition-colors',
                    sidebarCollapsed && 'justify-center'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white/10 text-white text-xs">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-white/50 capitalize">{t(`roles.${user.role}`)}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t(`roles.${user.role}`)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm',
              sidebarCollapsed && 'justify-center'
            )}
            title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">{t('sidebar.collapse')}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
