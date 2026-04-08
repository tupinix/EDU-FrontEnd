import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardList, DashboardCanvas } from '../components/ProcessDashboard';
import { useDashboard } from '../hooks/useDashboards';

export function ProcessDashboard() {
  const [openDashboardId, setOpenDashboardId] = useState<string | null>(null);
  const { data: dashboard, isLoading } = useDashboard(openDashboardId);

  // If a dashboard is selected, show the canvas
  if (openDashboardId) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      );
    }

    if (dashboard) {
      return (
        <DashboardCanvas
          key={dashboard.id}
          dashboard={dashboard}
          onBack={() => setOpenDashboardId(null)}
        />
      );
    }

    // Dashboard not found — fall back to list
    setOpenDashboardId(null);
  }

  return <DashboardList onOpen={setOpenDashboardId} />;
}
