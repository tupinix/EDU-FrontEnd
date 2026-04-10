import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Pencil, Loader2, Grid3X3, Undo2, Redo2 } from 'lucide-react';
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

const RULER_SIZE = 24;
const SNAP_THRESHOLD = 6;

// ── Ruler Component ──────────────────────────────────────────────────

function Ruler({ direction, size, scroll }: { direction: 'horizontal' | 'vertical'; size: number; scroll: number }) {
  const step = 50;
  const marks: number[] = [];
  for (let i = 0; i <= size; i += step) marks.push(i);

  if (direction === 'horizontal') {
    return (
      <div className="sticky top-0 z-20 h-6 bg-gray-800 border-b border-gray-700 overflow-hidden" style={{ marginLeft: RULER_SIZE }}>
        <svg width={size} height={RULER_SIZE} style={{ transform: `translateX(${-scroll}px)` }}>
          {marks.map(pos => (
            <g key={pos}>
              <line x1={pos} y1={RULER_SIZE - 8} x2={pos} y2={RULER_SIZE} stroke="#6b7280" strokeWidth={1} />
              {pos % 100 === 0 && (
                <text x={pos + 3} y={RULER_SIZE - 10} fill="#9ca3af" fontSize={9} fontFamily="monospace">{pos}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="sticky left-0 z-20 w-6 bg-gray-800 border-r border-gray-700 overflow-hidden shrink-0">
      <svg width={RULER_SIZE} height={size} style={{ transform: `translateY(${-scroll}px)` }}>
        {marks.map(pos => (
          <g key={pos}>
            <line x1={RULER_SIZE - 8} y1={pos} x2={RULER_SIZE} y2={pos} stroke="#6b7280" strokeWidth={1} />
            {pos % 100 === 0 && (
              <text x={2} y={pos + 12} fill="#9ca3af" fontSize={9} fontFamily="monospace" transform={`rotate(-90, 2, ${pos + 12})`}>{pos}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Snap Guides ──────────────────────────────────────────────────────

interface SnapGuide {
  type: 'horizontal' | 'vertical';
  position: number;
}

function computeSnapGuides(dragWidget: DashboardWidget, otherWidgets: DashboardWidget[]): { guides: SnapGuide[]; snapX: number | null; snapY: number | null } {
  const guides: SnapGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const dragCenterX = dragWidget.x + dragWidget.width / 2;
  const dragCenterY = dragWidget.y + dragWidget.height / 2;
  const dragRight = dragWidget.x + dragWidget.width;
  const dragBottom = dragWidget.y + dragWidget.height;

  for (const other of otherWidgets) {
    if (other.id === dragWidget.id) continue;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // Vertical snaps (x alignment)
    for (const [dragVal, otherVal] of [[dragWidget.x, other.x], [dragWidget.x, otherRight], [dragRight, other.x], [dragRight, otherRight], [dragCenterX, otherCenterX]] as [number, number][]) {
      if (Math.abs(dragVal - otherVal) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: otherVal });
        if (snapX === null) snapX = dragWidget.x + (otherVal - dragVal);
      }
    }

    // Horizontal snaps (y alignment)
    for (const [dragVal, otherVal] of [[dragWidget.y, other.y], [dragWidget.y, otherBottom], [dragBottom, other.y], [dragBottom, otherBottom], [dragCenterY, otherCenterY]] as [number, number][]) {
      if (Math.abs(dragVal - otherVal) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: otherVal });
        if (snapY === null) snapY = dragWidget.y + (otherVal - dragVal);
      }
    }
  }

  return { guides, snapX, snapY };
}

// ── Main Canvas ──────────────────────────────────────────────────────

export function DashboardCanvas({ dashboard, onBack }: Props) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(dashboard.widgets || []);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState(dashboard.name);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [clipboard, setClipboard] = useState<DashboardWidget[]>([]);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const updateMutation = useUpdateDashboard();

  // ── Undo/Redo ───────────────────────────────────────────────
  const historyRef = useRef<DashboardWidget[][]>([dashboard.widgets || []]);
  const historyIndexRef = useRef(0);
  const MAX_HISTORY = 50;

  const pushHistory = useCallback((newWidgets: DashboardWidget[]) => {
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    // Truncate any redo states
    historyRef.current = history.slice(0, idx + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newWidgets)));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    setWidgets(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    setWidgets(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Wrapper around setWidgets that pushes history on significant changes
  const setWidgetsWithHistory = useCallback((updater: (prev: DashboardWidget[]) => DashboardWidget[]) => {
    setWidgets(prev => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  // Grid snap helper
  const snapToGrid = useCallback((val: number) => {
    if (!gridEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  }, [gridEnabled, gridSize]);

  // Live values
  const bindings = widgets.filter(w => w.config.tagBinding).map(w => w.config.tagBinding as string);
  const liveValues = useDashboardLiveValues(bindings);

  const selectedWidget = selectedIds.size === 1 ? widgets.find(w => selectedIds.has(w.id)) : null;

  // Track scroll for rulers
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollX(scrollContainerRef.current.scrollLeft);
      setScrollY(scrollContainerRef.current.scrollTop);
    }
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────

  useEffect(() => {
    if (!isEditMode) return;

    const handler = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
        setWidgetsWithHistory(prev => prev.filter(w => !selectedIds.has(w.id)));
        setSelectedIds(new Set());
      }

      // Ctrl+C — copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.size > 0) {
        const copied = widgets.filter(w => selectedIds.has(w.id));
        setClipboard(copied);
      }

      // Ctrl+V — paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        const newWidgets = clipboard.map(w => ({
          ...w, id: generateId(), x: snapToGrid(w.x + 20), y: snapToGrid(w.y + 20), config: { ...w.config },
        }));
        setWidgetsWithHistory(prev => [...prev, ...newWidgets]);
        setSelectedIds(new Set(newWidgets.map(w => w.id)));
      }

      // Ctrl+D — duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedIds.size > 0) {
        e.preventDefault();
        const duped = widgets.filter(w => selectedIds.has(w.id)).map(w => ({
          ...w, id: generateId(), x: snapToGrid(w.x + 20), y: snapToGrid(w.y + 20), config: { ...w.config },
        }));
        setWidgetsWithHistory(prev => [...prev, ...duped]);
        setSelectedIds(new Set(duped.map(w => w.id)));
      }

      // Ctrl+A — select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(widgets.map(w => w.id)));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditMode, selectedIds, widgets, clipboard, undo, redo, setWidgetsWithHistory, snapToGrid]);

  // ── Widget operations ───────────────────────────────────────────

  const updateWidgetPos = useCallback((id: string, x: number, y: number) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const gx = snapToGrid(x);
    const gy = snapToGrid(y);

    // Compute snap guides (only if grid not enabled — grid takes priority)
    if (!gridEnabled) {
      const tempWidget = { ...widget, x: gx, y: gy };
      const others = widgets.filter(w => w.id !== id);
      const { guides, snapX, snapY } = computeSnapGuides(tempWidget, others);
      setSnapGuides(guides);
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, x: Math.round(snapX ?? gx), y: Math.round(snapY ?? gy) } : w));
    } else {
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, x: gx, y: gy } : w));
    }
  }, [widgets, snapToGrid, gridEnabled]);

  const clearSnapGuides = useCallback(() => {
    setSnapGuides([]);
    // Push history when move ends
    pushHistory(widgets);
  }, [widgets, pushHistory]);

  const updateWidgetSize = useCallback((id: string, width: number, height: number) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, width: snapToGrid(Math.round(width)), height: snapToGrid(Math.round(height)) } : w));
  }, [snapToGrid]);

  const updateWidgetProps = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const updateWidgetConfig = useCallback((id: string, configUpdates: Record<string, unknown>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, config: { ...w.config, ...configUpdates } } : w));
  }, []);

  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  // ── Drop from palette ───────────────────────────────────────────

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
    const container = scrollContainerRef.current;
    const x = Math.max(0, e.clientX - rect.left + (container?.scrollLeft ?? 0));
    const y = Math.max(0, e.clientY - rect.top + (container?.scrollTop ?? 0));

    const maxZ = widgets.length > 0 ? Math.max(...widgets.map(w => w.zIndex)) : 0;

    const newWidget: DashboardWidget = {
      id: generateId(),
      type: widgetType,
      x: snapToGrid(Math.round(x - defaultWidth / 2)),
      y: snapToGrid(Math.round(y - defaultHeight / 2)),
      width: defaultWidth,
      height: defaultHeight,
      zIndex: maxZ + 1,
      config: getDefaultConfig(widgetType),
    };

    setWidgetsWithHistory(prev => [...prev, newWidget]);
    setSelectedIds(new Set([newWidget.id]));
  }, [widgets, snapToGrid, setWidgetsWithHistory]);

  // ── Canvas click (select / deselect) ────────────────────────────

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      if (!e.shiftKey) setSelectedIds(new Set());
    }
  }, []);

  const handleWidgetSelect = useCallback((id: string, e?: React.MouseEvent) => {
    if (e?.shiftKey) {
      // Multi-select with shift
      setSelectedIds(prev => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  // ── Save ────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: dashboard.id, name: name.trim(), widgets });
    } catch { /* handled */ }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200/60 shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="text-[15px] font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-gray-400 transition-colors w-48 sm:w-64 pb-0.5" />
          <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded hidden sm:inline">
            {dashboard.canvasWidth}x{dashboard.canvasHeight}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Grid snap toggle */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={() => setGridEnabled(!gridEnabled)}
                className={cn('p-1.5 rounded-lg transition-colors', gridEnabled ? 'bg-blue-50 text-blue-500' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50')}
                title={gridEnabled ? `Grid ${gridSize}px (on)` : 'Grid snap (off)'}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              {gridEnabled && (
                <select value={gridSize} onChange={e => setGridSize(Number(e.target.value))}
                  className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-1 py-0.5 outline-none">
                  <option value={10}>10px</option>
                  <option value={20}>20px</option>
                  <option value={40}>40px</option>
                </select>
              )}
            </div>
          )}

          {/* Undo/Redo */}
          {isEditMode && (
            <div className="flex items-center gap-0.5 mr-1">
              <button onClick={undo} disabled={!canUndo}
                className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-20" title="Undo (Ctrl+Z)">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={redo} disabled={!canRedo}
                className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-20" title="Redo (Ctrl+Shift+Z)">
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="hidden sm:flex text-[9px] text-gray-300 gap-2 mr-2">
            <span>Ctrl+Z/Y</span>
            <span>Ctrl+C/V</span>
            <span>Del</span>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setIsEditMode(true)}
              className={cn('flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md transition-colors', isEditMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400')}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button onClick={() => { setIsEditMode(false); setSelectedIds(new Set()); setSnapGuides([]); }}
              className={cn('flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-md transition-colors', !isEditMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400')}>
              <Eye className="w-3 h-3" /> View
            </button>
          </div>
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Widget Palette */}
        {isEditMode && <WidgetPalette />}

        {/* Center: Rulers + Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-800">
          {/* Horizontal ruler */}
          {isEditMode && <Ruler direction="horizontal" size={dashboard.canvasWidth} scroll={scrollX} />}

          <div className="flex flex-1 min-h-0">
            {/* Vertical ruler */}
            {isEditMode && <Ruler direction="vertical" size={dashboard.canvasHeight} scroll={scrollY} />}

            {/* Scrollable canvas area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-auto" onScroll={handleScroll}>
              <div
                ref={canvasRef}
                data-canvas-bg="true"
                className="relative"
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
                {/* Grid lines */}
                {isEditMode && gridEnabled && (
                  <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ opacity: 0.08 }}>
                    {Array.from({ length: Math.ceil(dashboard.canvasWidth / gridSize) }, (_, i) => (
                      <line key={`v${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={dashboard.canvasHeight} stroke="#fff" strokeWidth={1} />
                    ))}
                    {Array.from({ length: Math.ceil(dashboard.canvasHeight / gridSize) }, (_, i) => (
                      <line key={`h${i}`} x1={0} y1={i * gridSize} x2={dashboard.canvasWidth} y2={i * gridSize} stroke="#fff" strokeWidth={1} />
                    ))}
                  </svg>
                )}

                {/* Snap guides */}
                {isEditMode && snapGuides.map((guide, i) => (
                  <div key={i} className="absolute pointer-events-none" style={
                    guide.type === 'vertical'
                      ? { left: guide.position, top: 0, width: 1, height: '100%', backgroundColor: '#3b82f6', opacity: 0.6 }
                      : { top: guide.position, left: 0, height: 1, width: '100%', backgroundColor: '#3b82f6', opacity: 0.6 }
                  } />
                ))}

                {/* Widgets */}
                {widgets.map(widget => (
                  <WidgetRenderer
                    key={widget.id}
                    widget={widget}
                    liveValue={liveValues.get(widget.config.tagBinding as string)}
                    isEditMode={isEditMode}
                    isSelected={selectedIds.has(widget.id)}
                    onSelect={(e) => handleWidgetSelect(widget.id, e)}
                    onMove={(x, y) => updateWidgetPos(widget.id, x, y)}
                    onMoveEnd={clearSnapGuides}
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
          </div>
        </div>

        {/* Right: Config Panel */}
        {isEditMode && selectedWidget && (
          <WidgetConfig
            widget={selectedWidget}
            onChange={updates => updateWidgetProps(selectedWidget.id, updates)}
            onConfigChange={configUpdates => updateWidgetConfig(selectedWidget.id, configUpdates)}
            onDelete={() => deleteWidget(selectedWidget.id)}
          />
        )}
      </div>
    </div>
  );
}

function getDefaultConfig(type: DashboardWidget['type']): Record<string, unknown> {
  switch (type) {
    case 'gauge': return { min: 0, max: 100, unit: '', label: 'Gauge' };
    case 'value': return { unit: '', label: 'Value', decimals: 2 };
    case 'trend': return { timeRange: '5m' };
    case 'status': return { onValue: '1', onLabel: 'ON', offLabel: 'OFF' };
    case 'tank': return { min: 0, max: 100, unit: '%' };
    case 'label': return { text: 'Label', fontSize: 14, color: '#e5e7eb' };
    case 'text': return { text: 'Text block', fontSize: 13, color: '#d1d5db', textAlign: 'left' };
    case 'bar': return { min: 0, max: 100, unit: '', orientation: 'horizontal' };
    case 'image': return { src: '', objectFit: 'contain' };
    case 'rectangle': return { backgroundColor: '#1f2937', borderRadius: 8, border: '1px solid #374151' };
    default: return {};
  }
}
