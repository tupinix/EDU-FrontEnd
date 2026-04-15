import {
  Gauge,
  Activity,
  Hash,
  Type,
  AlignLeft,
  Circle,
  Droplets,
  BarChart3,
  Image,
  Square,
  Minus,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardWidget } from '../../types';

interface WidgetTypeInfo {
  type: DashboardWidget['type'];
  label: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
}

const WIDGET_GROUPS: { group: string; items: WidgetTypeInfo[] }[] = [
  {
    group: 'Display',
    items: [
      { type: 'label', label: 'Label', icon: Type, defaultWidth: 120, defaultHeight: 40 },
      { type: 'value', label: 'Value', icon: Hash, defaultWidth: 160, defaultHeight: 100 },
      { type: 'text', label: 'Text', icon: AlignLeft, defaultWidth: 200, defaultHeight: 80 },
    ],
  },
  {
    group: 'Indicators',
    items: [
      { type: 'gauge', label: 'Gauge', icon: Gauge, defaultWidth: 200, defaultHeight: 160 },
      { type: 'status', label: 'Status', icon: Circle, defaultWidth: 100, defaultHeight: 100 },
      { type: 'bar', label: 'Bar', icon: BarChart3, defaultWidth: 200, defaultHeight: 60 },
      { type: 'tank', label: 'Tank', icon: Droplets, defaultWidth: 100, defaultHeight: 180 },
      { type: 'alarm', label: 'Alarm', icon: AlertTriangle, defaultWidth: 120, defaultHeight: 120 },
    ],
  },
  {
    group: 'Charts',
    items: [
      { type: 'trend', label: 'Trend', icon: Activity, defaultWidth: 300, defaultHeight: 150 },
      { type: 'sparkline', label: 'Sparkline', icon: TrendingUp, defaultWidth: 200, defaultHeight: 80 },
    ],
  },
  {
    group: 'Layout',
    items: [
      { type: 'rectangle', label: 'Rectangle', icon: Square, defaultWidth: 200, defaultHeight: 150 },
      { type: 'pipe', label: 'Pipe', icon: Minus, defaultWidth: 200, defaultHeight: 20 },
      { type: 'image', label: 'Image', icon: Image, defaultWidth: 200, defaultHeight: 150 },
    ],
  },
];

export function getWidgetDefaults(type: DashboardWidget['type']): { defaultWidth: number; defaultHeight: number } {
  for (const group of WIDGET_GROUPS) {
    for (const item of group.items) {
      if (item.type === type) {
        return { defaultWidth: item.defaultWidth, defaultHeight: item.defaultHeight };
      }
    }
  }
  return { defaultWidth: 150, defaultHeight: 100 };
}

export function WidgetPalette() {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/x-widget-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-52 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200/60 dark:border-gray-800 overflow-auto">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Widgets</p>
      </div>

      <div className="p-3 space-y-4">
        {WIDGET_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-2 px-1">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing
                               text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors select-none"
                  >
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-[12px] font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
