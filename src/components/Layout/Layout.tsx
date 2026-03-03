import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';

export function Layout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />

        <main className="p-6">
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
