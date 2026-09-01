import { useState, useMemo } from 'react';
import { Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardWidget, BrokerConfig, TopicNode } from '../../types';
import { topicsApi, brokersApi } from '../../services/api';
import { cn } from '@/lib/utils';
import { ThresholdRule, ThresholdOp, normalizeRules } from '@/lib/widgetThresholds';
import type { TableRow } from './widgets/TableWidget';

// Widgets that support conditional-formatting rules ("regras de negócio").
const RULES_SUPPORTED: DashboardWidget['type'][] = ['value', 'gauge', 'bar', 'kpi', 'radial'];

const OP_OPTIONS: { value: ThresholdOp; label: string }[] = [
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'eq', label: '=' },
  { value: 'between', label: 'entre' },
  { value: 'outside', label: 'fora' },
];

// Editor for a widget's ordered threshold rules. First match wins at runtime.
function ThresholdRulesConfig({ rules, onChange }: { rules: unknown; onChange: (rules: ThresholdRule[]) => void }) {
  const list = normalizeRules(rules);
  const miniInp = 'px-2 py-1 text-[11px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none dark:text-gray-200 tabular-nums w-full';
  const miniSel = 'px-1.5 py-1 text-[11px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none dark:text-gray-200';

  const update = (i: number, patch: Partial<ThresholdRule>) =>
    onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () =>
    onChange([...list, { id: `rule_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, op: 'gt', value: 0, color: '#ef4444', blink: false }]);
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Regras (cor condicional)</label>
        <button type="button" onClick={add} className="text-[10px] font-medium text-blue-500 hover:text-blue-600">+ regra</button>
      </div>
      {list.length === 0 && (
        <p className="text-[10px] text-gray-400">Sem regras — usa a cor padrão do widget.</p>
      )}
      {list.map((r, i) => (
        <div key={r.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <select value={r.op} onChange={(e) => update(i, { op: e.target.value as ThresholdOp })} className={miniSel}>
              {OP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={r.value} onChange={(e) => update(i, { value: Number(e.target.value) })} className={miniInp} />
            {(r.op === 'between' || r.op === 'outside') && (
              <input type="number" value={r.value2 ?? r.value} onChange={(e) => update(i, { value2: Number(e.target.value) })} className={miniInp} />
            )}
            <input
              type="color"
              value={r.color}
              onChange={(e) => update(i, { color: e.target.value })}
              className="w-7 h-7 shrink-0 rounded cursor-pointer bg-transparent border border-gray-200 dark:border-gray-700"
            />
            <button type="button" onClick={() => remove(i)} className="shrink-0 text-red-400 hover:text-red-500 text-[12px] px-1">✕</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={r.label ?? ''}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="rótulo (ex: CRÍTICO)"
              className={cn(miniInp, 'flex-1')}
            />
            <label className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
              <input type="checkbox" checked={!!r.blink} onChange={(e) => update(i, { blink: e.target.checked })} /> piscar
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

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

// Flatten a topic tree to its leaf TAGS (nodes that carry a value) — that's
// what a widget binds to.
function flattenTags(nodes: TopicNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.hasValue) out.push(n.fullPath);
    if (n.children?.length) flattenTags(n.children, out);
  }
  return out;
}

// Tag binding = choose a BROKER, then a tag from that broker, then which payload
// field to read — same pattern as the Models / Alerts / KG screens.
function TagBindingPicker({ widget, onConfigChange }: {
  widget: DashboardWidget;
  onConfigChange: (u: Record<string, unknown>) => void;
}) {
  const c = widget.config;
  const topic = String(c.tagBinding ?? '');
  const brokerId = String(c.tagBrokerId ?? '');
  const field = String(c.tagField ?? 'value');
  const [search, setSearch] = useState('');

  const { data: brokers = [] } = useQuery<BrokerConfig[]>({
    queryKey: ['brokers-list-dash'],
    queryFn: brokersApi.getAll,
    staleTime: 15000,
  });

  // Tree scoped to the chosen broker (undefined → active/principal broker).
  const { data: tree = [], isLoading } = useQuery<TopicNode[]>({
    queryKey: ['topics-tree-dash', brokerId || 'active'],
    queryFn: () => topicsApi.getTree(brokerId || undefined),
    staleTime: 15000,
  });
  const tags = useMemo(() => {
    const all = flattenTags(tree);
    const q = search.toLowerCase().trim();
    return (q ? all.filter((t) => t.toLowerCase().includes(q)) : all).slice(0, 200);
  }, [tree, search]);

  // Field options = keys of the selected tag's payload (so you pick which datum).
  const { data: detail } = useQuery({
    queryKey: ['topic-detail-dash', topic, brokerId || 'active'],
    queryFn: () => topicsApi.getDetails(topic, brokerId || undefined),
    enabled: !!topic,
    staleTime: 15000,
  });
  const fieldOptions = useMemo(() => {
    const p = detail?.payload;
    const keys = p && typeof p === 'object' && !Array.isArray(p) ? Object.keys(p as Record<string, unknown>) : [];
    return keys.length ? Array.from(new Set([...keys, 'value'])) : ['value'];
  }, [detail]);

  const selectCls = 'w-full px-3 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none transition-all focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200';

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Tag Binding</label>

      {/* Broker */}
      <select value={brokerId} onChange={(e) => onConfigChange({ tagBrokerId: e.target.value || undefined })} className={selectCls}>
        <option value="">Broker ativo (principal)</option>
        {brokers.filter((b) => b.status === 'connected').map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      {/* Search + tag list */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tag do broker…"
          className="w-full pl-7 pr-3 py-1.5 text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none transition-all placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 dark:text-gray-200"
        />
      </div>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
        {isLoading ? (
          <p className="text-center py-3 text-[11px] text-gray-300">Carregando…</p>
        ) : tags.length === 0 ? (
          <p className="text-center py-3 text-[11px] text-gray-300">Nenhuma tag nesse broker</p>
        ) : (
          tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onConfigChange({ tagBinding: t })}
              className={cn(
                'w-full text-left px-3 py-1.5 text-[11px] font-mono truncate transition-colors',
                t === topic ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {t}
            </button>
          ))
        )}
      </div>

      {/* Selected tag + field picker */}
      {topic && (
        <>
          <p className="text-[10px] text-gray-400">Tag: <span className="font-mono text-gray-600 dark:text-gray-300">{topic}</span></p>
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Campo</label>
            <select value={field} onChange={(e) => onConfigChange({ tagField: e.target.value })} className={selectCls}>
              {fieldOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button
            onClick={() => onConfigChange({ tagBinding: undefined })}
            className="text-[10px] text-red-400 hover:text-red-500 transition-colors"
          >
            Clear binding
          </button>
        </>
      )}
    </div>
  );
}

// One row of a Table widget: a tag binding plus display options.
function TableRowEditor({ row, brokers, onChange, onRemove }: {
  row: TableRow;
  brokers: BrokerConfig[];
  onChange: (patch: Partial<TableRow>) => void;
  onRemove: () => void;
}) {
  const [search, setSearch] = useState('');
  const selectCls = 'w-full px-2 py-1 text-[11px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none dark:text-gray-200';

  const { data: tree = [], isLoading } = useQuery<TopicNode[]>({
    queryKey: ['topics-tree-dash', row.brokerId || 'active'],
    queryFn: () => topicsApi.getTree(row.brokerId || undefined),
    staleTime: 15000,
  });
  const tags = useMemo(() => {
    const all = flattenTags(tree);
    const q = search.toLowerCase().trim();
    return (q ? all.filter((t) => t.toLowerCase().includes(q)) : all).slice(0, 100);
  }, [tree, search]);

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-gray-500 truncate">{row.topic || 'sem tag'}</span>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-500 text-[12px] px-1 shrink-0">✕</button>
      </div>

      <select value={row.brokerId ?? ''} onChange={(e) => onChange({ brokerId: e.target.value || undefined })} className={selectCls}>
        <option value="">Broker ativo</option>
        {brokers.filter((b) => b.status === 'connected').map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar tag…"
        className="w-full px-2 py-1 text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none placeholder:text-gray-300 dark:text-gray-200"
      />
      <div className="max-h-28 overflow-y-auto rounded-md border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
        {isLoading ? (
          <p className="text-center py-2 text-[10px] text-gray-300">Carregando…</p>
        ) : tags.length === 0 ? (
          <p className="text-center py-2 text-[10px] text-gray-300">Nenhuma tag</p>
        ) : (
          tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ topic: t })}
              className={cn(
                'w-full text-left px-2 py-1 text-[10px] font-mono truncate transition-colors',
                t === row.topic ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {t}
            </button>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <input type="text" value={row.label ?? ''} onChange={(e) => onChange({ label: e.target.value })} placeholder="rótulo" className={selectCls} />
        <input type="text" value={row.unit ?? ''} onChange={(e) => onChange({ unit: e.target.value })} placeholder="un." className={selectCls} />
        <input type="number" value={row.decimals ?? 2} onChange={(e) => onChange({ decimals: Number(e.target.value) })} placeholder="dec." className={selectCls} min={0} max={6} />
      </div>

      <ThresholdRulesConfig rules={row.rules} onChange={(rules) => onChange({ rules })} />
    </div>
  );
}

function TableRowsConfig({ rows, onChange }: { rows: unknown; onChange: (rows: TableRow[]) => void }) {
  const list: TableRow[] = Array.isArray(rows) ? (rows as TableRow[]) : [];
  const { data: brokers = [] } = useQuery<BrokerConfig[]>({
    queryKey: ['brokers-list-dash'],
    queryFn: brokersApi.getAll,
    staleTime: 15000,
  });

  const add = () => onChange([...list, { id: `row_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, topic: '', decimals: 2 }]);
  const update = (i: number, patch: Partial<TableRow>) => onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Linhas da tabela</label>
        <button type="button" onClick={add} className="text-[10px] font-medium text-blue-500 hover:text-blue-600">+ linha</button>
      </div>
      {list.length === 0 && <p className="text-[10px] text-gray-400">Sem linhas — adicione tags.</p>}
      {list.map((r, i) => (
        <TableRowEditor key={r.id} row={r} brokers={brokers} onChange={(patch) => update(i, patch)} onRemove={() => remove(i)} />
      ))}
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

    case 'kpi':
      return (
        <>
          <ConfigInput label="Label" value={String(c.label ?? 'KPI')} onChange={(v) => onConfigChange({ label: v })} placeholder="e.g. Produção/h" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Unit" value={String(c.unit ?? '')} onChange={(v) => onConfigChange({ unit: v })} placeholder="e.g. pç, %" />
            <ConfigInput label="Decimals" value={String(c.decimals ?? 0)} onChange={(v) => onConfigChange({ decimals: Number(v) })} type="number" min={0} max={6} />
          </div>
          <ConfigInput label="Meta (target)" value={String(c.target ?? '')} onChange={(v) => onConfigChange({ target: v === '' ? undefined : Number(v) })} type="number" placeholder="opcional" />
          <ConfigInput label="Cor de destaque" value={String(c.color ?? '#3b82f6')} onChange={(v) => onConfigChange({ color: v })} type="color" />
        </>
      );

    case 'radial':
      return (
        <>
          <ConfigInput label="Label" value={String(c.label ?? '')} onChange={(v) => onConfigChange({ label: v })} placeholder="Radial title" />
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Min" value={String(c.min ?? 0)} onChange={(v) => onConfigChange({ min: Number(v) })} type="number" />
            <ConfigInput label="Max" value={String(c.max ?? 100)} onChange={(v) => onConfigChange({ max: Number(v) })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ConfigInput label="Unit" value={String(c.unit ?? '%')} onChange={(v) => onConfigChange({ unit: v })} placeholder="%, bar…" />
            <ConfigInput label="Decimals" value={String(c.decimals ?? 0)} onChange={(v) => onConfigChange({ decimals: Number(v) })} type="number" min={0} max={6} />
          </div>
        </>
      );

    case 'table':
      return (
        <>
          <label className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={c.showHeader !== false}
              onChange={(e) => onConfigChange({ showHeader: e.target.checked })}
            />
            Mostrar cabeçalho
          </label>
          <div className="border-t border-gray-100 dark:border-gray-800" />
          <TableRowsConfig rows={c.rows} onChange={(rows) => onConfigChange({ rows })} />
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
  kpi: 'KPI / Stat',
  radial: 'Radial / Donut',
  table: 'Tabela',
  sparkline: 'Sparkline',
  alarm: 'Alarm',
  pipe: 'Pipe',
};

export function WidgetConfig({ widget, onChange, onConfigChange, onDelete }: Props) {
  const needsBinding = !['text', 'rectangle', 'image', 'table'].includes(widget.type);

  return (
    <div className="w-64 shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200/60 dark:border-gray-800 overflow-auto flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Widget Config</p>
        <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 mt-0.5">{WIDGET_TYPE_LABELS[widget.type] ?? widget.type}</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {/* Tag Binding */}
        {needsBinding && <TagBindingPicker widget={widget} onConfigChange={onConfigChange} />}

        {/* Separator */}
        {needsBinding && <div className="border-t border-gray-100 dark:border-gray-800" />}

        {/* Type-specific */}
        <TypeSpecificConfig widget={widget} onConfigChange={onConfigChange} />

        {/* Conditional-formatting rules ("regras de negócio") */}
        {RULES_SUPPORTED.includes(widget.type) && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <ThresholdRulesConfig rules={widget.config.rules} onChange={(rules) => onConfigChange({ rules })} />
          </>
        )}

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
