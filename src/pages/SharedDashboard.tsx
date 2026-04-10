import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProcessDashboard, DashboardWidget } from '../types';
import { dashboardsApi } from '../services/api';
import { useDashboardLiveValues } from '../hooks/useDashboardLiveValues';
import { WidgetRenderer } from '../components/ProcessDashboard/WidgetRenderer';

export function SharedDashboard() {
  const { token } = useParams<{ token: string }>();
  const [dashboard, setDashboard] = useState<ProcessDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    dashboardsApi.getShared(token)
      .then(d => { setDashboard(d); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Dashboard not found'); setLoading(false); });
  }, [token]);

  const bindings = (dashboard?.widgets || [])
    .filter((w: DashboardWidget) => w.config.tagBinding)
    .map((w: DashboardWidget) => w.config.tagBinding as string);
  const liveValues = useDashboardLiveValues(bindings);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-[15px]">Dashboard not found</p>
          <p className="text-gray-600 text-[12px] mt-1">This link may have expired or been revoked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div
        className="relative"
        style={{
          width: dashboard.canvasWidth,
          height: dashboard.canvasHeight,
          backgroundColor: dashboard.backgroundColor || '#1a1a2e',
        }}
      >
        {dashboard.widgets.map((widget: DashboardWidget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            liveValue={liveValues.get(widget.config.tagBinding as string)}
            isEditMode={false}
            isSelected={false}
            onSelect={() => {}}
            onMove={() => {}}
            onResize={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
