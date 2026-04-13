import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Maximize, Minimize } from 'lucide-react';
import { ProcessDashboard, DashboardWidget } from '../types';
import { dashboardsApi } from '../services/api';
import { useDashboardLiveValues } from '../hooks/useDashboardLiveValues';
import { WidgetRenderer } from '../components/ProcessDashboard/WidgetRenderer';

export function SharedDashboard() {
  const { token } = useParams<{ token: string }>();
  const [dashboard, setDashboard] = useState<ProcessDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard
  useEffect(() => {
    if (!token) return;
    dashboardsApi.getShared(token)
      .then(d => { setDashboard(d); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Dashboard not found'); setLoading(false); });
  }, [token]);

  // Auto-scale canvas to fit viewport
  const computeScale = useCallback(() => {
    if (!dashboard || !containerRef.current) return;
    const vw = containerRef.current.clientWidth;
    const vh = containerRef.current.clientHeight;
    const scaleX = vw / dashboard.canvasWidth;
    const scaleY = vh / dashboard.canvasHeight;
    setScale(Math.min(scaleX, scaleY, 1)); // never scale up, only down
  }, [dashboard]);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Live values
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

  const bgColor = dashboard.backgroundColor || '#1a1a2e';

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Scaled canvas */}
      <div
        style={{
          width: dashboard.canvasWidth,
          height: dashboard.canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
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

      {/* Floating controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50">
        <span className="text-[10px] text-white/30 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
          {dashboard.name} &middot; {Math.round(scale * 100)}%
        </span>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-black/30 backdrop-blur-sm text-white/50 hover:text-white/80 rounded-lg transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
