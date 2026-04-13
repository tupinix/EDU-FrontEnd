import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Maximize, Minimize } from 'lucide-react';
import { ProcessDashboard, DashboardWidget } from '../types';
import apiClient from '../services/api';
import { WidgetRenderer } from '../components/ProcessDashboard/WidgetRenderer';

export function SharedDashboard() {
  const { token } = useParams<{ token: string }>();
  const [dashboard, setDashboard] = useState<ProcessDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveValues, setLiveValues] = useState<Map<string, unknown>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard (using apiClient directly, no auth needed for shared)
  useEffect(() => {
    if (!token) return;
    apiClient.get(`/dashboards/shared/${token}`)
      .then(({ data }) => { setDashboard(data.data); setLoading(false); })
      .catch(() => { setError('Dashboard not found'); setLoading(false); });
  }, [token]);

  // Poll live values for all tag bindings
  useEffect(() => {
    if (!dashboard) return;
    const bindings = dashboard.widgets
      .filter((w: DashboardWidget) => w.config.tagBinding)
      .map((w: DashboardWidget) => w.config.tagBinding as string);

    if (bindings.length === 0) return;

    const poll = async () => {
      const newValues = new Map<string, unknown>();
      for (const topic of bindings) {
        try {
          const { data } = await apiClient.get(`/topics/${encodeURIComponent(topic)}/details`);
          if (data.data?.payload != null) {
            const p = data.data.payload;
            newValues.set(topic, typeof p === 'object' && p !== null ? (p as Record<string, unknown>).value ?? p : p);
          }
        } catch { /* skip */ }
      }
      setLiveValues(newValues);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [dashboard]);

  // Auto-scale canvas to fit viewport
  const computeScale = useCallback(() => {
    if (!dashboard || !containerRef.current) return;
    const vw = containerRef.current.clientWidth;
    const vh = containerRef.current.clientHeight;
    const scaleX = vw / dashboard.canvasWidth;
    const scaleY = vh / dashboard.canvasHeight;
    setScale(Math.min(scaleX, scaleY, 1));
  }, [dashboard]);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Recompute scale after fullscreen change
      setTimeout(computeScale, 100);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [computeScale]);

  // Hide any parent layout elements
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: 15 }}>Dashboard not found</p>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>This link may have expired or been revoked</p>
        </div>
      </div>
    );
  }

  const bgColor = dashboard.backgroundColor || '#1a1a2e';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* Scaled canvas */}
      <div
        style={{
          width: dashboard.canvasWidth,
          height: dashboard.canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          flexShrink: 0,
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
      <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10000 }}>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: 8,
        }}>
          {dashboard.name} &middot; {Math.round(scale * 100)}%
        </span>
        <button
          onClick={toggleFullscreen}
          style={{
            padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
