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
import { dashboardItem, getNavGroups, type NavItem } from './nav-config';
import { editionLabels } from '../../config/edition';

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
          'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
          isActive
            ? 'bg-white/10 text-white font-medium'
            : 'text-white/50 hover:bg-white/5 hover:text-white/80',
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
  const { user, clearAuth, editionMode } = useAuthStore();
  const filteredNavGroups = getNavGroups(editionMode);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm lg:hidden"
      >
        <Menu className="h-4 w-4 text-gray-600" />
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-gray-950 text-white transition-all duration-300 z-40 flex flex-col',
          // Mobile: offscreen when collapsed
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-semibold text-[14px] tracking-tight block">EDU Platform</span>
                <span className="text-[10px] text-white/30 font-medium block -mt-0.5">
                  {editionLabels[editionMode].title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            <SidebarNavItem item={dashboardItem} collapsed={sidebarCollapsed} />

            {sidebarCollapsed ? (
              <>
                {filteredNavGroups.map((group) => {
                  const visibleItems = group.items.filter(
                    (item) => !item.adminOnly || user?.role === 'admin'
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <div className="my-2 mx-2 h-px bg-white/5" />
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => (
                          <SidebarNavItem key={item.path} item={item} collapsed />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {filteredNavGroups.map((group) => {
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
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 pt-5 pb-1.5 group">
                        <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium">
                          {t(group.labelKey)}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 text-white/15 transition-transform',
                            !isOpen && '-rotate-90'
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                        <div className="space-y-0.5">
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

        {/* Footer */}
        <div className="border-t border-white/5 p-2 space-y-1">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-white/5 transition-colors',
                    sidebarCollapsed && 'justify-center'
                  )}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-white/10 text-white/70 text-[11px]">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[13px] font-medium text-white/80 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-[11px] text-white/30 capitalize">{user.role}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
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
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/20 hover:bg-white/5 hover:text-white/40 transition-colors text-[12px]',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>{t('sidebar.collapse')}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
