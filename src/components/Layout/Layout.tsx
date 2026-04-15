import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LicenseBanner } from './LicenseBanner';
import { useUIStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';

export function Layout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f1117] transition-colors">
      <LicenseBanner />
      <Sidebar />

      {/* Mobile overlay when sidebar is open */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 z-30 lg:hidden transition-opacity',
          !sidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => useUIStore.getState().setSidebarCollapsed(true)}
      />

      <div
        className={cn(
          'transition-all duration-300',
          'ml-0 lg:ml-16',
          !sidebarCollapsed && 'lg:ml-64'
        )}
      >
        <Header />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
