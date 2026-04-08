import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Save, Eye, Pencil, Loader2 } from 'lucide-react';
import { ProcessDashboard, DashboardWidget } from '../../types';
import { useUpdateDashboard } from '../../hooks/useDashboards';
import { useDashboardLiveValues } from '../../hooks/useDashboardLiveValues';
import { WidgetPalette, getWidgetDefaults } from './WidgetPalette';
import { WidgetConfig } from './WidgetConfig';
import { WidgetRenderer } from './WidgetRenderer';
import { cn } from '@/lib/utils';

interface Props {
  dashboard: ProcessDashboard;
  onBack: () => void;
}

function generateId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function DashboardCanvas({ dashboard, onBack }: Props) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(dashboard.widgets || []);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [name, setName] = useState(dashboard.name);
  const canvasRef = useRef<HTMLDivElement>(null);
  const updateMutation = useUpdateDashboard();

  // Live values for all bound tags
  const bindings = widgets
    .filter((w) => w.config.tagBinding)
    .map((w) => w.config.tagBinding as string);
  const liveValues = useDashboardLiveValues(bindings);

  const selectedWidget = selectedWidgetId ? widgets.find((w) => w.id === selectedWidgetId) : null;

  // Update widget position
  const updateWidgetPos = useCallback((id: string, x: number, y: number) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x: Math.round(x), y: Math.round(y) } : w))
    );
  }, []);

  // Update widget size
  const updateWidgetSize = useCallback((id: string, width: number, height: number) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, width: Math.round(width), height: Math.round(height) } : w))
    );
  }, []);

  // Update widget properties (position/size/zIndex)
  const updateWidgetProps = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  // Update widget config
  const updateWidgetConfig = useCallback((id: string, configUpdates: Record<string, unknown>) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, config: { ...w.config, ...configUpdates } } : w
      )
    );
  }, []);

  // Delete widget
  const deleteWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  }, [selectedWidgetId]);

  // Handle drop from palette
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-widget-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('application/x-widget-type') as DashboardWidget['type'];
    if (!widgetType) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { defaultWidth, defaultHeight } = getWidgetDefaults(widgetType);
    const x = Math.max(0, e.clientX - rect.left - defaultWidth / 2 + (canvasRef.current?.scrollLeft ?? 0));
    const y = Math.max(0, e.clientY - rect.top - defaultHeight / 2 + (canvasRef.current?.scrollTop ?? 0));

    const maxZ = widgets.length > 0 ? Math.max(...widgets.map((w) => w.zIndex)) : 0;

    const newWidget: DashboardWidget = {
      id: generateId(),
      type: widgetType,
      x: Math.round(x),
      y: Math.round(y),
      width: defaultWidth,
      height: defaultHeight,
      zIndex: maxZ + 1,
      config: getDefaultConfig(widgetType),
    };

    setWidgets((prev) => [...prev, newWidget]);
    setSelectedWidgetId(newWidget.id);
  }, [widgets]);

  // Click canvas background to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      setSelectedWidgetId(null);
    }
  }, []);

  // Save
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: dashboard.id,
        name: name.trim(),
        widgets,
      });
    } catch {
      // error handled
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200/60 shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-[15px] font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent
                       hover:border-gray-200 focus:border-gray-400 transition-colors w-48 sm:w-64 pb-0.5"
          />
          <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded hidden sm:inline">
            {dashboard.canvasWidth}x{dashboard.canvasHeight}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit/View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsEditMode(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md transition-colors',
                isEditMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => { setIsEditMode(false); setSelectedWidgetId(null); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md transition-colors',
                !isEditMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-[12px] font-medium
                       rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Widget Palette (only in edit mode) */}
        {isEditMode && <WidgetPalette />}

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div
            ref={canvasRef}
            data-canvas-bg="true"
            className="relative mx-auto shadow-2xl"
            style={{
              width: dashboard.canvasWidth,
              height: dashboard.canvasHeight,
              backgroundColor: dashboard.backgroundColor || '#1a1a2e',
              minWidth: dashboard.canvasWidth,
              minHeight: dashboard.canvasHeight,
            }}
            onClick={handleCanvasClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {widgets.map((widget) => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                liveValue={liveValues.get(widget.config.tagBinding as string)}
                isEditMode={isEditMode}
                isSelected={selectedWidgetId === widget.id}
                onSelect={() => setSelectedWidgetId(widget.id)}
                onMove={(x, y) => updateWidgetPos(widget.id, x, y)}
                onResize={(w, h) => updateWidgetSize(widget.id, w, h)}
              />
            ))}

            {/* Empty state */}
            {widgets.length === 0 && isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-gray-500 text-[14px]">Drag widgets from the palette</p>
                  <p className="text-gray-600 text-[12px] mt-1">Drop them onto the canvas to build your dashboard</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Config Panel (only in edit mode when widget selected) */}
        {isEditMode && selectedWidget && (
          <WidgetConfig
            widget={selectedWidget}
            onChange={(updates) => updateWidgetProps(selectedWidget.id, updates)}
            onConfigChange={(configUpdates) => updateWidgetConfig(selectedWidget.id, configUpdates)}
            onDelete={() => deleteWidget(selectedWidget.id)}
          />
        )}
      </div>
    </div>
  );
}

// Default config per widget type
function getDefaultConfig(type: DashboardWidget['type']): Record<string, unknown> {
  switch (type) {
    case 'gauge':
      return { min: 0, max: 100, unit: '', label: 'Gauge' };
    case 'value':
      return { unit: '', label: 'Value', decimals: 2 };
    case 'trend':
      return { timeRange: '5m' };
    case 'status':
      return { onValue: '1', onLabel: 'ON', offLabel: 'OFF' };
    case 'tank':
      return { min: 0, max: 100, unit: '%' };
    case 'label':
      return { text: 'Label', fontSize: 14, color: '#e5e7eb' };
    case 'text':
      return { text: 'Text block', fontSize: 13, color: '#d1d5db', textAlign: 'left' };
    case 'bar':
      return { min: 0, max: 100, unit: '', orientation: 'horizontal' };
    case 'image':
      return { src: '', objectFit: 'contain' };
    case 'rectangle':
      return { backgroundColor: '#1f2937', borderRadius: 8, border: '1px solid #374151' };
    default:
      return {};
  }
}
