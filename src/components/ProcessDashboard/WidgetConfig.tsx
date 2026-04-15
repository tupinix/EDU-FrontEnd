import { useState, useEffect, useMemo } from 'react';
import { Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from '../../types';
import { topicsApi } from '../../services/api';
import { cn } from '@/lib/utils';

interface Props {
  widget: DashboardWidget;
  onChange: (updates: Partial<DashboardWidget>) => void;
  onConfigChange: (configUpdates: Record<string, unknown>) => void;
  onDelete: () => void;
}

// Input component for config fields
function ConfigInput({ label, value, onChange, type = 'text', placeholder, min, max, step }: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none
                   transition-all placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200"
      />
    </div>
  );
}

function ConfigSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none
                   transition-all focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Tag binding autocomplete
function TagBindingInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [search, setSearch] = useState(value || '');
  const [open, setOpen] = useState(false);

  const { data: topics = [] } = useQuery<string[]>({
    queryKey: ['topics-list'],
    queryFn: topicsApi.getList,
    staleTime: 15000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return topics.slice(0, 30);
    const q = search.toLowerCase();
    return topics.filter((t) => t.toLowerCase().includes(q)).slice(0, 30);
  }, [topics, search]);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  return (
    <div className="relative">
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Tag Binding</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search topic..."
          className="w-full pl-7 pr-3 py-1.5 text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none
                     transition-all placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((t) => (
            <button
              key={t}
              onMouseDown={(e) => {
                e.preventDefault();
                setSearch(t);
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                t === value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-400',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {value && (
        <button
          onClick={() => { setSearch(''); onChange(''); }}
          className="mt-1 text-[10px] text-red-400 hover:text-red-500 transition-colors"
        >
          Clear binding
        </button>
      )}
    </div>
  );
}

// Type-specific config fields
function TypeSpecificConfig({ widget, onConfigChange }: { widget: DashboardWidget; onConfigChange: (u: Record<string, unknown>) => void }) {
  const c = widget.config;

  switch (widget.type) {
    case 'gauge':
      return (
        <>
          <ConfigInput label="Label" value={String(c.label ?? '')} onChange={(v) => onConfigChange({ label: v })} placeholder="Gauge title" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Min" value={String(c.min ?? 0)} onChange={(v) => onConfigChange({ min: Number(v) })} type="number" />
            <ConfigInput label="Max" value={String(c.max ?? 100)} onChange={(v) => onConfigChange({ max: Number(v) })} type="number" />
          </div>
          <ConfigInput label="Unit" value={String(c.unit ?? '')} onChange={(v) => onConfigChange({ unit: v })} placeholder="e.g. C, %, PSI" />
        </>
      );

    case 'value':
      return (
        <>
          <ConfigInput label="Label" value={String(c.label ?? '')} onChange={(v) => onConfigChange({ label: v })} placeholder="Value title" />
          <ConfigInput label="Unit" value={String(c.unit ?? '')} onChange={(v) => onConfigChange({ unit: v })} placeholder="e.g. C, %, PSI" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Decimals" value={String(c.decimals ?? 2)} onChange={(v) => onConfigChange({ decimals: Number(v) })} type="number" min={0} max={10} />
            <ConfigInput label="Font Size" value={String(c.fontSize ?? 28)} onChange={(v) => onConfigChange({ fontSize: Number(v) })} type="number" min={10} max={120} />
          </div>
        </>
      );

    case 'status':
      return (
        <>
          <ConfigInput label="On Value" value={String(c.onValue ?? 1)} onChange={(v) => onConfigChange({ onValue: v })} placeholder="Value when ON" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="On Label" value={String(c.onLabel ?? 'ON')} onChange={(v) => onConfigChange({ onLabel: v })} />
            <ConfigInput label="Off Label" value={String(c.offLabel ?? 'OFF')} onChange={(v) => onConfigChange({ offLabel: v })} />
          </div>
        </>
      );

    case 'tank':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Min" value={String(c.min ?? 0)} onChange={(v) => onConfigChange({ min: Number(v) })} type="number" />
            <ConfigInput label="Max" value={String(c.max ?? 100)} onChange={(v) => onConfigChange({ max: Number(v) })} type="number" />
          </div>
          <ConfigInput label="Unit" value={String(c.unit ?? '%')} onChange={(v) => onConfigChange({ unit: v })} />
        </>
      );

    case 'trend':
      return (
        <ConfigSelect
          label="Time Range"
          value={String(c.timeRange ?? '5m')}
          onChange={(v) => onConfigChange({ timeRange: v })}
          options={[
            { value: '1m', label: '1 minute' },
            { value: '5m', label: '5 minutes' },
            { value: '30m', label: '30 minutes' },
            { value: '1h', label: '1 hour' },
          ]}
        />
      );

    case 'label':
      return (
        <>
          <ConfigInput label="Text" value={String(c.text ?? 'Label')} onChange={(v) => onConfigChange({ text: v })} />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Font Size" value={String(c.fontSize ?? 14)} onChange={(v) => onConfigChange({ fontSize: Number(v) })} type="number" min={8} max={72} />
            <ConfigInput label="Color" value={String(c.color ?? '#e5e7eb')} onChange={(v) => onConfigChange({ color: v })} type="color" />
          </div>
        </>
      );

    case 'text':
      return (
        <>
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Content</label>
            <textarea
              value={String(c.text ?? '')}
              onChange={(e) => onConfigChange({ text: e.target.value })}
              rows={3}
              className="w-full px-3 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none
                         transition-all placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200 resize-none"
              placeholder="Enter text..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Font Size" value={String(c.fontSize ?? 13)} onChange={(v) => onConfigChange({ fontSize: Number(v) })} type="number" min={8} max={72} />
            <ConfigInput label="Color" value={String(c.color ?? '#d1d5db')} onChange={(v) => onConfigChange({ color: v })} type="color" />
          </div>
          <ConfigSelect
            label="Text Align"
            value={String(c.textAlign ?? 'left')}
            onChange={(v) => onConfigChange({ textAlign: v })}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </>
      );

    case 'rectangle':
      return (
        <>
          <ConfigInput label="Background" value={String(c.backgroundColor ?? '#1f2937')} onChange={(v) => onConfigChange({ backgroundColor: v })} type="color" />
          <ConfigInput label="Border Radius" value={String(c.borderRadius ?? 8)} onChange={(v) => onConfigChange({ borderRadius: Number(v) })} type="number" min={0} max={50} />
          <ConfigInput label="Border" value={String(c.border ?? '1px solid #374151')} onChange={(v) => onConfigChange({ border: v })} placeholder="1px solid #374151" />
        </>
      );

    case 'image':
      return (
        <>
          <ConfigInput label="Image URL" value={String(c.src ?? '')} onChange={(v) => onConfigChange({ src: v })} placeholder="https://..." />
          <ConfigSelect
            label="Object Fit"
            value={String(c.objectFit ?? 'contain')}
            onChange={(v) => onConfigChange({ objectFit: v })}
            options={[
              { value: 'contain', label: 'Contain' },
              { value: 'cover', label: 'Cover' },
              { value: 'fill', label: 'Fill' },
              { value: 'none', label: 'None' },
            ]}
          />
        </>
      );

    case 'bar':
      return (
        <>
          <ConfigInput label="Label" value={String(c.label ?? '')} onChange={(v) => onConfigChange({ label: v })} placeholder="Bar title" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Min" value={String(c.min ?? 0)} onChange={(v) => onConfigChange({ min: Number(v) })} type="number" />
            <ConfigInput label="Max" value={String(c.max ?? 100)} onChange={(v) => onConfigChange({ max: Number(v) })} type="number" />
          </div>
          <ConfigInput label="Unit" value={String(c.unit ?? '')} onChange={(v) => onConfigChange({ unit: v })} placeholder="e.g. %, PSI" />
          <ConfigSelect
            label="Orientation"
            value={String(c.orientation ?? 'horizontal')}
            onChange={(v) => onConfigChange({ orientation: v })}
            options={[
              { value: 'horizontal', label: 'Horizontal' },
              { value: 'vertical', label: 'Vertical' },
            ]}
          />
        </>
      );

    default:
      return null;
  }
}

const WIDGET_TYPE_LABELS: Record<string, string> = {
  gauge: 'Gauge',
  value: 'Value Display',
  trend: 'Trend Chart',
  status: 'Status Indicator',
  tank: 'Tank Level',
  label: 'Label',
  text: 'Text Block',
  bar: 'Bar',
  image: 'Image',
  rectangle: 'Rectangle',
};

export function WidgetConfig({ widget, onChange, onConfigChange, onDelete }: Props) {
  const needsBinding = !['text', 'rectangle', 'image'].includes(widget.type);

  return (
    <div className="w-64 shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200/60 dark:border-gray-800 overflow-auto flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Widget Config</p>
        <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 mt-0.5">{WIDGET_TYPE_LABELS[widget.type] ?? widget.type}</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {/* Tag Binding */}
        {needsBinding && (
          <>
            <TagBindingInput
              value={String(widget.config.tagBinding ?? '')}
              onChange={(v) => onConfigChange({ tagBinding: v || undefined })}
            />
            <ConfigInput
              label="Tag Field"
              value={String(widget.config.tagField ?? 'value')}
              onChange={(v) => onConfigChange({ tagField: v })}
              placeholder="value"
            />
          </>
        )}

        {/* Separator */}
        {needsBinding && <div className="border-t border-gray-100 dark:border-gray-800" />}

        {/* Type-specific */}
        <TypeSpecificConfig widget={widget} onConfigChange={onConfigChange} />

        {/* Separator */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Position & Size */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Position & Size</p>
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="X" value={widget.x} onChange={(v) => onChange({ x: Number(v) })} type="number" min={0} />
            <ConfigInput label="Y" value={widget.y} onChange={(v) => onChange({ y: Number(v) })} type="number" min={0} />
            <ConfigInput label="Width" value={widget.width} onChange={(v) => onChange({ width: Math.max(40, Number(v)) })} type="number" min={40} />
            <ConfigInput label="Height" value={widget.height} onChange={(v) => onChange({ height: Math.max(30, Number(v)) })} type="number" min={30} />
          </div>
        </div>

        {/* Z-Index */}
        <ConfigInput
          label="Z-Index"
          value={widget.zIndex}
          onChange={(v) => onChange({ zIndex: Number(v) })}
          type="number"
          min={0}
          max={100}
        />
      </div>

      {/* Delete button */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium
                     text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Widget
        </button>
      </div>
    </div>
  );
}
