import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ForceGraph2D from 'react-force-graph-2d';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  X,
  ChevronRight,
  Play,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Check,
  Save,
} from 'lucide-react';
import { hierarchyApi } from '../services/api';
import {
  CypherResult,
  GraphNode,
  GraphProperties,
  GraphPropertyValue,
  GraphRelationship,
  HierarchyData,
  RawGraph,
} from '../types';
import { useAuthStore } from '../hooks/useStore';
import { cn } from '@/lib/utils';

// ─── Graph types ──────────────────────────────────────────────────────

interface GNode {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  metadata?: Record<string, string>;
  tagCount?: number;
  val: number;
  color: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GLink { id?: string; source: string; target: string; label: string; }
interface GData { nodes: GNode[]; links: GLink[]; }

// ─── Colors ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  root:       { color: '#6366f1', label: 'Plant Model' },
  enterprise: { color: '#8b5cf6', label: 'Enterprise' },
  site:       { color: '#0ea5e9', label: 'Site' },
  area:       { color: '#10b981', label: 'Area' },
  line:       { color: '#f59e0b', label: 'Line' },
  equipment:  { color: '#ef4444', label: 'Equipment' },
  tag:        { color: '#9ca3af', label: 'Tag' },
};

const CUSTOM_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6',
];

function hashLabel(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorForLabel(label: string): string {
  const key = label.toLowerCase();
  if (TYPE_COLORS[key]) return TYPE_COLORS[key].color;
  return CUSTOM_PALETTE[hashLabel(label) % CUSTOM_PALETTE.length];
}

function sizeForLabel(label: string): number {
  const key = label.toLowerCase();
  const sizeMap: Record<string, number> = {
    enterprise: 20, site: 16, area: 14, line: 12, equipment: 10, tag: 6,
  };
  return sizeMap[key] ?? 12;
}

// ─── Transforms ──────────────────────────────────────────────────────

function buildIsaGraph(data: HierarchyData, showTags: boolean): GData {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  nodes.push({ id: 'root', name: 'ISA-95', type: 'root', val: 24, color: TYPE_COLORS.root.color });

  for (const ent of data.enterprises) {
    nodes.push({ id: `ent:${ent.id}`, name: ent.name, type: 'enterprise', val: 20, color: TYPE_COLORS.enterprise.color });
    links.push({ source: 'root', target: `ent:${ent.id}`, label: 'OWNS' });
    for (const site of ent.sites) {
      nodes.push({ id: `site:${site.id}`, name: site.name, type: 'site', parentId: `ent:${ent.id}`, val: 16, color: TYPE_COLORS.site.color });
      links.push({ source: `ent:${ent.id}`, target: `site:${site.id}`, label: 'HAS_SITE' });
      for (const area of site.areas) {
        nodes.push({ id: `area:${area.id}`, name: area.name, type: 'area', parentId: `site:${site.id}`, val: 14, color: TYPE_COLORS.area.color });
        links.push({ source: `site:${site.id}`, target: `area:${area.id}`, label: 'HAS_AREA' });
        for (const line of area.lines) {
          nodes.push({ id: `line:${line.id}`, name: line.name, type: 'line', parentId: `area:${area.id}`, val: 12, color: TYPE_COLORS.line.color });
          links.push({ source: `area:${area.id}`, target: `line:${line.id}`, label: 'HAS_LINE' });
          for (const eq of line.equipment) {
            nodes.push({ id: `eq:${eq.id}`, name: eq.name, type: 'equipment', parentId: `line:${line.id}`, metadata: { type: eq.type }, tagCount: eq.tags.length, val: 10, color: TYPE_COLORS.equipment.color });
            links.push({ source: `line:${line.id}`, target: `eq:${eq.id}`, label: 'HAS_EQUIPMENT' });
            if (showTags) {
              for (const tag of eq.tags) {
                const tagId = `tag:${eq.id}:${tag}`;
                nodes.push({ id: tagId, name: tag.split('/').pop() || tag, type: 'tag', parentId: `eq:${eq.id}`, metadata: { topic: tag }, val: 6, color: TYPE_COLORS.tag.color });
                links.push({ source: `eq:${eq.id}`, target: tagId, label: 'HAS_TAG' });
              }
            }
          }
        }
      }
    }
  }
  return { nodes, links };
}

function buildRawGraph(graph: RawGraph): GData {
  const nodes: GNode[] = graph.nodes.map((n) => {
    const primaryLabel = n.labels[0] ?? 'Node';
    const name = (n.properties.name as string) ?? n.id.slice(0, 8);
    return {
      id: n.id,
      name,
      type: primaryLabel.toLowerCase(),
      val: sizeForLabel(primaryLabel),
      color: colorForLabel(primaryLabel),
    };
  });
  const links: GLink[] = graph.relationships.map((r) => ({
    id: r.id,
    source: r.sourceId,
    target: r.targetId,
    label: r.type,
  }));
  return { nodes, links };
}

// ─── Property editor ────────────────────────────────────────────────

interface PropEditorProps {
  value: GraphProperties;
  onChange: (next: GraphProperties) => void;
  excludedKeys?: string[];
  disabled?: boolean;
}

function PropertyEditor({ value, onChange, excludedKeys = [], disabled }: PropEditorProps) {
  const entries = Object.entries(value).filter(([k]) => !excludedKeys.includes(k));

  const setKeyAt = (i: number, newKey: string) => {
    const next: GraphProperties = {};
    let idx = 0;
    for (const [k, v] of entries) {
      next[idx === i ? newKey : k] = v;
      idx++;
    }
    onChange(next);
  };
  const setValAt = (i: number, raw: string) => {
    const next: GraphProperties = { ...value };
    const key = entries[i][0];
    next[key] = inferValue(raw);
    onChange(next);
  };
  const removeAt = (i: number) => {
    const next: GraphProperties = { ...value };
    delete next[entries[i][0]];
    onChange(next);
  };
  const addRow = () => {
    let i = 1;
    let key = `prop_${i}`;
    while (key in value) { i++; key = `prop_${i}`; }
    onChange({ ...value, [key]: '' });
  };

  return (
    <div className="space-y-1.5">
      {entries.length === 0 && (
        <p className="text-[11px] text-gray-400 italic">
          Adicione informações extras como email, telefone, unidade, etc.
        </p>
      )}
      {entries.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            disabled={disabled}
            value={k}
            onChange={(e) => setKeyAt(i, e.target.value)}
            placeholder="campo"
            className="w-32 px-2 py-1 text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none focus:border-gray-300 disabled:opacity-50"
          />
          <input
            disabled={disabled}
            value={v === null ? '' : String(v)}
            onChange={(e) => setValAt(i, e.target.value)}
            placeholder="valor"
            className="flex-1 px-2 py-1 text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none focus:border-gray-300 disabled:opacity-50"
          />
          <button
            disabled={disabled}
            onClick={() => removeAt(i)}
            className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30"
            title="Remover"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        disabled={disabled}
        onClick={addRow}
        className="text-[11px] text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
      >
        <Plus className="w-3 h-3" /> adicionar campo
      </button>
    </div>
  );
}

function inferValue(raw: string): GraphPropertyValue {
  if (raw === '') return '';
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

// ─── Presets for the simplified create flow ─────────────────────────

const NODE_TYPE_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'Equipment',  label: 'Equipamento' },
  { value: 'Person',     label: 'Pessoa' },
  { value: 'Site',       label: 'Planta' },
  { value: 'Area',       label: 'Área' },
  { value: 'Line',       label: 'Linha' },
  { value: 'Tag',        label: 'Tag' },
];

const REL_TYPE_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'HAS',          label: 'tem' },
  { value: 'CONTAINS',     label: 'contém' },
  { value: 'OPERATES',     label: 'opera' },
  { value: 'BELONGS_TO',   label: 'pertence a' },
  { value: 'CONNECTED_TO', label: 'conectado a' },
  { value: 'RELATED_TO',   label: 'relacionado a' },
];

function ChipRow<T extends { value: string; label: string }>({
  options, selected, onSelect, customLabel = 'Outro…', customActive, onCustom,
}: {
  options: T[];
  selected: string;
  onSelect: (value: string) => void;
  customLabel?: string;
  customActive: boolean;
  onCustom: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = !customActive && selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              'px-3 py-1.5 text-[12px] rounded-full border transition-colors',
              active
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            {opt.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onCustom}
        className={cn(
          'px-3 py-1.5 text-[12px] rounded-full border transition-colors',
          customActive
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
            : 'bg-white dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400'
        )}
      >
        {customLabel}
      </button>
    </div>
  );
}

// ─── Node form modal (simplified) ───────────────────────────────────

interface NodeFormProps {
  existingLabels: string[];
  onCancel: () => void;
  onSave: (label: string, properties: GraphProperties) => Promise<void>;
}

function NodeFormModal({ existingLabels, onCancel, onSave }: NodeFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Equipment');
  const [customType, setCustomType] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [extras, setExtras] = useState<GraphProperties>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) { setError('Dê um nome ao nó'); return; }
    const label = (useCustom ? customType : type).trim();
    if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(label)) {
      setError('Tipo inválido — use letras/números, começando com letra');
      return;
    }
    setBusy(true);
    try {
      await onSave(label, { name: name.trim(), ...extras });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Novo nó" onCancel={onCancel}>
      <Field label="Nome">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) submit(); }}
          placeholder="Ex.: Ricardo, Pump-01, Sala B"
          className="w-full px-3 py-2.5 text-[14px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none focus:border-gray-300 dark:focus:border-gray-600"
        />
      </Field>

      <Field label="Tipo">
        <ChipRow
          options={NODE_TYPE_PRESETS}
          selected={type}
          onSelect={(v) => { setType(v); setUseCustom(false); }}
          customActive={useCustom}
          onCustom={() => setUseCustom(true)}
        />
        {useCustom && (
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            list="existing-labels"
            placeholder="Digite um tipo (ex.: Sensor, Cliente, Sala)"
            className="mt-2 w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none focus:border-gray-300"
          />
        )}
        <datalist id="existing-labels">
          {existingLabels.map((l) => <option key={l} value={l} />)}
        </datalist>
      </Field>

      <div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 inline-flex items-center gap-1"
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', showDetails && 'rotate-90')} />
          Mais informações (opcional)
        </button>
        {showDetails && (
          <div className="mt-2">
            <PropertyEditor value={extras} onChange={setExtras} />
          </div>
        )}
      </div>

      <ModalFooter error={error}>
        <button onClick={onCancel} disabled={busy} className="px-3 py-2 text-[12px] text-gray-500 hover:text-gray-700 rounded-lg">Cancelar</button>
        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className="px-4 py-2 text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Criar
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

// ─── Relationship form modal (simplified) ───────────────────────────

interface RelFormProps {
  sourceName: string;
  targetName: string;
  existingTypes: string[];
  onCancel: () => void;
  onSave: (type: string, properties: GraphProperties) => Promise<void>;
}

function RelationshipFormModal({ sourceName, targetName, existingTypes, onCancel, onSave }: RelFormProps) {
  const [type, setType] = useState('RELATED_TO');
  const [customType, setCustomType] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [props, setProps] = useState<GraphProperties>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const t = (useCustom ? customType : type).trim();
    if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(t)) {
      setError('Tipo inválido — use letras/números, começando com letra');
      return;
    }
    setBusy(true);
    try {
      await onSave(t, props);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Conectar" onCancel={onCancel}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg text-[13px] flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{sourceName}</span>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{targetName}</span>
      </div>

      <Field label="Como esses nós se relacionam?">
        <ChipRow
          options={REL_TYPE_PRESETS}
          selected={type}
          onSelect={(v) => { setType(v); setUseCustom(false); }}
          customActive={useCustom}
          onCustom={() => setUseCustom(true)}
        />
        {useCustom && (
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            list="existing-rel-types"
            placeholder="Ex.: PRODUCES, MONITORS, FEEDS"
            className="mt-2 w-full px-3 py-2 text-[13px] font-mono bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none focus:border-gray-300"
          />
        )}
        <datalist id="existing-rel-types">
          {existingTypes.map((t) => <option key={t} value={t} />)}
        </datalist>
      </Field>

      <div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 inline-flex items-center gap-1"
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', showDetails && 'rotate-90')} />
          Mais informações (opcional)
        </button>
        {showDetails && (
          <div className="mt-2">
            <PropertyEditor value={props} onChange={setProps} />
          </div>
        )}
      </div>

      <ModalFooter error={error}>
        <button onClick={onCancel} disabled={busy} className="px-3 py-2 text-[12px] text-gray-500 hover:text-gray-700 rounded-lg">Cancelar</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 inline-flex items-center gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Conectar
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

// ─── Node editor (inline panel) ─────────────────────────────────────

interface NodeEditorProps {
  node: GraphNode;
  onClose: () => void;
  onSave: (id: string, props: GraphProperties) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStartConnect: (id: string) => void;
}

function NodeEditor({ node, onClose, onSave, onDelete, onStartConnect }: NodeEditorProps) {
  const [props, setProps] = useState<GraphProperties>(node.properties);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setProps(node.properties); setError(null); }, [node.id]);
  const dirty = useMemo(() => JSON.stringify(props) !== JSON.stringify(node.properties), [props, node.properties]);
  const labelColor = colorForLabel(node.labels[0] ?? 'Node');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-lg p-4 min-w-[320px] max-w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: labelColor }}>
          {node.labels.join(', ')}
        </span>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-gray-400 mb-1">name</p>
        <input
          value={(props.name as string) ?? ''}
          onChange={(e) => setProps({ ...props, name: e.target.value })}
          className="w-full px-2 py-1.5 text-[13px] font-medium bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-md outline-none focus:border-gray-300"
        />
      </div>

      <p className="text-[10px] text-gray-400 mb-1.5">properties</p>
      <PropertyEditor
        value={props}
        onChange={setProps}
        excludedKeys={['name', 'id', 'tenant_id', 'created_at', 'updated_at']}
      />

      {error && (
        <p className="mt-2 text-[11px] text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5" /> {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={async () => {
            setBusy('save'); setError(null);
            try { await onSave(node.id, props); }
            catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
            finally { setBusy(null); }
          }}
          disabled={!dirty || busy !== null}
          className="px-3 py-1.5 text-[11px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 inline-flex items-center gap-1.5"
        >
          {busy === 'save' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
        <button
          onClick={() => onStartConnect(node.id)}
          disabled={busy !== null}
          className="px-3 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-30 inline-flex items-center gap-1.5"
        >
          <Link2 className="w-3 h-3" /> Connect
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Delete node "${props.name ?? node.id}"? Relationships will be removed.`)) return;
            setBusy('delete'); setError(null);
            try { await onDelete(node.id); }
            catch (e) { setError(e instanceof Error ? e.message : 'Erro'); setBusy(null); }
          }}
          disabled={busy !== null}
          className="ml-auto px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-30 inline-flex items-center gap-1.5"
        >
          {busy === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Relationship editor ────────────────────────────────────────────

interface RelEditorProps {
  rel: GraphRelationship;
  sourceName: string;
  targetName: string;
  onClose: () => void;
  onSave: (id: string, props: GraphProperties) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function RelationshipEditor({ rel, sourceName, targetName, onClose, onSave, onDelete }: RelEditorProps) {
  const [props, setProps] = useState<GraphProperties>(rel.properties);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setProps(rel.properties); setError(null); }, [rel.id]);
  const dirty = useMemo(() => JSON.stringify(props) !== JSON.stringify(rel.properties), [props, rel.properties]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-lg p-4 min-w-[320px] max-w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-500">Relationship</span>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg text-[11px] font-mono flex items-center gap-2">
        <span className="text-gray-700 dark:text-gray-300 truncate">{sourceName}</span>
        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
        <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold text-[10px]">{rel.type}</span>
        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
        <span className="text-gray-700 dark:text-gray-300 truncate">{targetName}</span>
      </div>

      <p className="text-[10px] text-gray-400 mb-1.5">properties</p>
      <PropertyEditor
        value={props}
        onChange={setProps}
        excludedKeys={['id', 'tenant_id', 'created_at', 'updated_at']}
      />

      {error && (
        <p className="mt-2 text-[11px] text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5" /> {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={async () => {
            setBusy('save'); setError(null);
            try { await onSave(rel.id, props); }
            catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
            finally { setBusy(null); }
          }}
          disabled={!dirty || busy !== null}
          className="px-3 py-1.5 text-[11px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 inline-flex items-center gap-1.5"
        >
          {busy === 'save' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Delete relationship ${rel.type}?`)) return;
            setBusy('delete'); setError(null);
            try { await onDelete(rel.id); }
            catch (e) { setError(e instanceof Error ? e.message : 'Erro'); setBusy(null); }
          }}
          disabled={busy !== null}
          className="ml-auto px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-30 inline-flex items-center gap-1.5"
        >
          {busy === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Modal shell ────────────────────────────────────────────────────

function ModalShell({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-2xl w-[440px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function ModalFooter({ error, children }: { error?: string | null; children: React.ReactNode }) {
  return (
    <div className="pt-2">
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg text-[11px] text-red-500 flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5" /> {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">{children}</div>
    </div>
  );
}

// ─── Tree Panel (ISA-95 view only) ──────────────────────────────────

function TreePanel({ data, onSelect }: { data: HierarchyData; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const Item = ({ id, name, type, children, depth }: { id: string; name: string; type: string; children?: React.ReactNode; depth: number }) => {
    const has = !!children;
    const open = expanded.has(id);
    return (
      <div>
        <button
          onClick={() => { if (has) toggle(id); onSelect(id); }}
          className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-[12px] transition-colors"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {has ? <ChevronRight className={cn('w-3 h-3 text-gray-300 transition-transform', open && 'rotate-90')} /> : <span className="w-3" />}
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[type]?.color }} />
          <span className="text-gray-600 truncate">{name}</span>
        </button>
        {has && open && children}
      </div>
    );
  };

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800 p-2 max-h-[55vh] overflow-y-auto w-56 shadow-sm">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-2">Hierarchy</p>
      {data.enterprises.map(ent => (
        <Item key={ent.id} id={`ent:${ent.id}`} name={ent.name} type="enterprise" depth={0}>
          {ent.sites.map(site => (
            <Item key={site.id} id={`site:${site.id}`} name={site.name} type="site" depth={1}>
              {site.areas.map(area => (
                <Item key={area.id} id={`area:${area.id}`} name={area.name} type="area" depth={2}>
                  {area.lines.map(line => (
                    <Item key={line.id} id={`line:${line.id}`} name={line.name} type="line" depth={3}>
                      {line.equipment.map(eq => (
                        <Item key={eq.id} id={`eq:${eq.id}`} name={eq.name} type="equipment" depth={4}>
                          {eq.tags.length > 0 ? <>{eq.tags.map(tag => (
                            <Item key={tag} id={`tag:${eq.id}:${tag}`} name={tag.split('/').pop() || tag} type="tag" depth={5} />
                          ))}</> : undefined}
                        </Item>
                      ))}
                    </Item>
                  ))}
                </Item>
              ))}
            </Item>
          ))}
        </Item>
      ))}
    </div>
  );
}

// ─── Legend ─────────────────────────────────────────────────────────

function Legend({ extra }: { extra: string[] }) {
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800 p-3 shadow-sm max-h-[55vh] overflow-y-auto">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Types</p>
      <div className="space-y-1.5">
        {['enterprise', 'site', 'area', 'line', 'equipment', 'tag'].map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[t].color }} />
            <span className="text-[12px] text-gray-500">{TYPE_COLORS[t].label}</span>
          </div>
        ))}
        {extra.length > 0 && <div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />}
        {extra.map((label) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorForLabel(label) }} />
            <span className="text-[12px] text-gray-500 truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cypher Console ─────────────────────────────────────────────────

const EXAMPLES = [
  { label: 'All nodes', query: 'MATCH (n) RETURN labels(n) AS label, count(n) AS count ORDER BY count DESC' },
  { label: 'Full hierarchy', query: 'MATCH path = (e:Enterprise)-[:HAS_SITE]->(s)-[:HAS_AREA]->(a)-[:HAS_LINE]->(l)-[:HAS_EQUIPMENT]->(eq) RETURN e.name AS enterprise, s.name AS site, a.name AS area, l.name AS line, eq.name AS equipment' },
  { label: 'Equipment + Tags', query: 'MATCH (eq:Equipment)-[:HAS_TAG]->(t:Tag) RETURN eq.name AS equipment, eq.type AS type, t.topic AS tag, t.last_value AS value' },
  { label: 'Relationships', query: 'MATCH ()-[r]->() RETURN type(r) AS relationship, count(r) AS count ORDER BY count DESC' },
];

function CypherConsole() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [result, setResult] = useState<CypherResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    if (!query.trim() || running) return;
    setRunning(true); setError(null); setResult(null);
    try { setResult(await hierarchyApi.cypher(query.trim())); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); }
    finally { setRunning(false); }
  }, [query, running]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  }, [run]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmt = (v: any): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4 shrink-0">
        <div className="flex gap-2.5">
          <textarea
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
            rows={3} spellCheck={false}
            className="flex-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-mono text-gray-700 dark:text-gray-300 resize-none outline-none placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all"
            placeholder="MATCH (n) RETURN n LIMIT 25"
          />
          <button
            onClick={run} disabled={running || !query.trim()}
            className="px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[13px] font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30 flex items-center gap-1.5 self-end"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="text-[11px] text-gray-300">Examples:</span>
          {EXAMPLES.map((eq) => (
            <button key={eq.label} onClick={() => setQuery(eq.query)}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {eq.label}
            </button>
          ))}
          <span className="text-[10px] text-gray-300 ml-auto hidden sm:inline">Ctrl+Enter to run</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {error && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <pre className="text-[12px] text-red-500 font-mono whitespace-pre-wrap break-all">{error}</pre>
          </div>
        )}
        {result && (
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3 text-[11px] text-gray-400">
              <span>{result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}</span>
              {result.resultAvailableAfter !== null && <span>{result.resultAvailableAfter}ms</span>}
              {Object.entries(result.counters).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="text-gray-500">{k}: {v}</span>
              ))}
            </div>
            {result.columns.length > 0 && result.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {result.columns.map(col => (
                        <th key={col} className="px-4 py-2.5 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50 dark:border-gray-800/50">
                        {result.columns.map(col => (
                          <td key={col} className="px-4 py-2 text-gray-600 font-mono whitespace-nowrap max-w-[400px] truncate" title={fmt(row[col])}>{fmt(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : result.rowCount === 0 ? (
              <p className="text-center py-8 text-[13px] text-gray-400">Query executed — no results returned</p>
            ) : null}
          </div>
        )}
        {!result && !error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-gray-300">Run a Cypher query to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────

function StatsIsa({ data }: { data: HierarchyData }) {
  let sites = 0, areas = 0, lines = 0, equip = 0, tags = 0;
  for (const e of data.enterprises) { sites += e.sites.length; for (const s of e.sites) { areas += s.areas.length; for (const a of s.areas) { lines += a.lines.length; for (const l of a.lines) { equip += l.equipment.length; for (const eq of l.equipment) tags += eq.tags.length; } } } }
  const items = [
    { v: data.enterprises.length, c: TYPE_COLORS.enterprise },
    { v: sites, c: TYPE_COLORS.site },
    { v: areas, c: TYPE_COLORS.area },
    { v: lines, c: TYPE_COLORS.line },
    { v: equip, c: TYPE_COLORS.equipment },
    { v: tags, c: TYPE_COLORS.tag },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.c.color }} />
          <span className="text-gray-400">{s.c.label}</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{s.v}</span>
        </div>
      ))}
    </div>
  );
}

function StatsRaw({ graph }: { graph: RawGraph }) {
  const labelCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of graph.nodes) {
      const l = n.labels[0] ?? 'Node';
      m.set(l, (m.get(l) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [graph]);
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      {labelCounts.map(([label, count]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorForLabel(label) }} />
          <span className="text-gray-400">{label}</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{count}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 text-gray-400">
        <span>·</span>
        <span>{graph.relationships.length} relationships</span>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────

type Tab = 'graph' | 'cypher';

export function PlantModel() {
  useTranslation();
  const { user } = useAuthStore();
  const canEdit = user?.role === 'admin' || user?.role === 'engineer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GLink | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [graphData, setGraphData] = useState<GData>({ nodes: [], links: [] });
  const [tab, setTab] = useState<Tab>('graph');

  // ─── Edit mode state ──
  const [editMode, setEditMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{ sourceId: string; targetId: string } | null>(null);
  const [newNodeOpen, setNewNodeOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries — only one is enabled at a time
  const isaQuery = useQuery({
    queryKey: ['plant-hierarchy'],
    queryFn: hierarchyApi.get,
    staleTime: 30000,
    enabled: !editMode,
  });
  const rawQuery = useQuery({
    queryKey: ['plant-graph'],
    queryFn: hierarchyApi.getGraph,
    staleTime: 10000,
    enabled: editMode,
  });
  const isLoading = editMode ? rawQuery.isLoading : isaQuery.isLoading;
  const refetch = () => editMode ? rawQuery.refetch() : isaQuery.refetch();

  // Rebuild graph data when source changes
  useEffect(() => {
    if (editMode) {
      if (rawQuery.data) setGraphData(buildRawGraph(rawQuery.data));
    } else {
      if (isaQuery.data) setGraphData(buildIsaGraph(isaQuery.data, showTags));
    }
  }, [editMode, isaQuery.data, rawQuery.data, showTags]);

  // Reset selection on mode toggle
  useEffect(() => {
    setSelectedNode(null);
    setSelectedLink(null);
    setConnectFrom(null);
    setActionError(null);
  }, [editMode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => { for (const e of entries) { const { width, height } = e.contentRect; if (width > 0 && height > 0) setDims({ width, height }); } });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, isaQuery.data, rawQuery.data]);

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) setTimeout(() => graphRef.current?.zoomToFit(400, 60), 500);
  }, [graphData]);

  // Build maps for fast lookup against raw graph (edit mode only)
  const rawNodeById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    if (rawQuery.data) for (const n of rawQuery.data.nodes) m.set(n.id, n);
    return m;
  }, [rawQuery.data]);
  const rawRelById = useMemo(() => {
    const m = new Map<string, GraphRelationship>();
    if (rawQuery.data) for (const r of rawQuery.data.relationships) m.set(r.id, r);
    return m;
  }, [rawQuery.data]);

  const labelsInUse = useMemo(() => {
    if (!rawQuery.data) return [];
    const s = new Set<string>();
    for (const n of rawQuery.data.nodes) for (const l of n.labels) s.add(l);
    return Array.from(s).sort();
  }, [rawQuery.data]);

  const relTypesInUse = useMemo(() => {
    if (!rawQuery.data) return [];
    const s = new Set<string>();
    for (const r of rawQuery.data.relationships) s.add(r.type);
    return Array.from(s).sort();
  }, [rawQuery.data]);

  const customLabelsForLegend = useMemo(() => {
    const builtin = new Set(['Enterprise', 'Site', 'Area', 'Line', 'Equipment', 'Tag']);
    return labelsInUse.filter((l) => !builtin.has(l));
  }, [labelsInUse]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNodeClick = useCallback((node: any) => {
    const n = node as GNode;
    setActionError(null);

    if (editMode && connectFrom) {
      if (connectFrom !== n.id) {
        setPendingTarget({ sourceId: connectFrom, targetId: n.id });
      }
      setConnectFrom(null);
      return;
    }

    setSelectedNode(n);
    setSelectedLink(null);
    if (graphRef.current && n.x !== undefined) { graphRef.current.centerAt(n.x, n.y, 500); graphRef.current.zoom(2.5, 500); }
  }, [editMode, connectFrom]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLinkClick = useCallback((link: any) => {
    if (!editMode) return;
    const l = link as GLink;
    if (!l.id) return;
    setSelectedLink(l);
    setSelectedNode(null);
  }, [editMode]);

  const onTreeSelect = useCallback((nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node && graphRef.current) { setSelectedNode(node); if (node.x !== undefined) { graphRef.current.centerAt(node.x, node.y, 500); graphRef.current.zoom(2.5, 500); } }
  }, [graphData.nodes]);

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const n = node as GNode;
    if (n.x === undefined || n.y === undefined) return;
    const sz = n.val || 8;
    const fs = Math.max(11 / scale, 3);
    const isSel = selectedNode?.id === n.id;
    const isConnectSource = connectFrom === n.id;
    if (isSel || isConnectSource) {
      ctx.beginPath(); ctx.arc(n.x, n.y, sz + 4, 0, 2 * Math.PI);
      ctx.fillStyle = isConnectSource ? '#fbbf24' + '40' : n.color + '30';
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(n.x, n.y, sz, 0, 2 * Math.PI); ctx.fillStyle = n.color; ctx.fill();
    if (isSel || isConnectSource) {
      ctx.strokeStyle = isConnectSource ? '#fbbf24' : '#ffffff';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
    ctx.font = `${isSel ? 'bold ' : ''}${fs}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#00000040'; ctx.fillText(n.name, n.x + 0.5, n.y + sz + 3.5);
    ctx.fillStyle = isSel ? '#ffffff' : '#d1d5db'; ctx.fillText(n.name, n.x, n.y + sz + 3);
  }, [selectedNode, connectFrom]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const s = link.source as GNode, e = link.target as GNode;
    if (!s.x || !s.y || !e.x || !e.y) return;
    const sel = selectedLink && (selectedLink.id === link.id);
    if (sel) {
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.stroke();
      return;
    }
    const g = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
    g.addColorStop(0, s.color + '50'); g.addColorStop(1, e.color + '50');
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();
  }, [selectedLink]);

  // ─── Mutations ──
  const reloadRaw = () => rawQuery.refetch();

  const handleCreateNode = async (label: string, props: GraphProperties) => {
    await hierarchyApi.createNode(label, props);
    setNewNodeOpen(false);
    await reloadRaw();
  };
  const handleUpdateNode = async (id: string, props: GraphProperties) => {
    const cleaned: GraphProperties = {};
    for (const [k, v] of Object.entries(props)) {
      if (['id', 'tenant_id', 'created_at', 'updated_at'].includes(k)) continue;
      cleaned[k] = v;
    }
    await hierarchyApi.updateNode(id, cleaned);
    await reloadRaw();
    setSelectedNode(null);
  };
  const handleDeleteNode = async (id: string) => {
    await hierarchyApi.deleteNode(id);
    setSelectedNode(null);
    await reloadRaw();
  };
  const handleCreateRel = async (type: string, props: GraphProperties) => {
    if (!pendingTarget) return;
    await hierarchyApi.createRelationship(pendingTarget.sourceId, pendingTarget.targetId, type, props);
    setPendingTarget(null);
    await reloadRaw();
  };
  const handleUpdateRel = async (id: string, props: GraphProperties) => {
    const cleaned: GraphProperties = {};
    for (const [k, v] of Object.entries(props)) {
      if (['id', 'tenant_id', 'created_at', 'updated_at'].includes(k)) continue;
      cleaned[k] = v;
    }
    await hierarchyApi.updateRelationship(id, cleaned);
    await reloadRaw();
    setSelectedLink(null);
  };
  const handleDeleteRel = async (id: string) => {
    await hierarchyApi.deleteRelationship(id);
    setSelectedLink(null);
    await reloadRaw();
  };

  const selectedRawNode = selectedNode && editMode ? rawNodeById.get(selectedNode.id) : undefined;
  const selectedRawRel = selectedLink?.id && editMode ? rawRelById.get(selectedLink.id) : undefined;
  const pendingSourceName = pendingTarget ? (rawNodeById.get(pendingTarget.sourceId)?.properties.name as string) ?? pendingTarget.sourceId : '';
  const pendingTargetName = pendingTarget ? (rawNodeById.get(pendingTarget.targetId)?.properties.name as string) ?? pendingTarget.targetId : '';

  return (
    <div className={cn('flex flex-col', fullscreen ? 'fixed inset-0 z-50 bg-[#fafafa] dark:bg-gray-950 p-4' : 'h-[calc(100vh-6rem)]')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Plant Model</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            Knowledge Graph — {editMode ? 'Editor' : 'ISA-95'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl p-0.5 mr-1">
            <button onClick={() => setTab('graph')} className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', tab === 'graph' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-500')}>Graph</button>
            <button onClick={() => setTab('cypher')} className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', tab === 'cypher' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-500')}>Cypher</button>
          </div>

          {tab === 'graph' && (
            <>
              {canEdit && (
                <Pill active={editMode} onClick={() => setEditMode(!editMode)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Pill>
              )}
              {!editMode && <Pill active={showTree} onClick={() => setShowTree(!showTree)}>Tree</Pill>}
              <Pill active={showLegend} onClick={() => setShowLegend(!showLegend)}>Legend</Pill>
              {!editMode && <Pill active={showTags} onClick={() => setShowTags(!showTags)}>Tags</Pill>}
              <button onClick={toggleFs} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          <button onClick={() => refetch()} disabled={isLoading} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {tab === 'graph' && (
        <div className="mb-3 shrink-0">
          {editMode ? (rawQuery.data && <StatsRaw graph={rawQuery.data} />)
                    : (isaQuery.data && <StatsIsa data={isaQuery.data} />)}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {tab === 'graph' ? (
          <>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : (editMode ? rawQuery.data && graphData.nodes.length > 0 : isaQuery.data && isaQuery.data.enterprises.length > 0) ? (
              <div ref={containerRef} className="absolute inset-0 rounded-2xl overflow-hidden bg-[#0f1117] border border-gray-200/60 dark:border-gray-800">
                <ForceGraph2D
                  ref={graphRef} graphData={graphData} width={dims.width} height={dims.height}
                  nodeCanvasObject={drawNode} linkCanvasObject={drawLink}
                  onNodeClick={onNodeClick}
                  onLinkClick={onLinkClick}
                  nodeLabel={(node: GNode) => `${(node.type || '').replace(/^./, c => c.toUpperCase())}: ${node.name}`}
                  linkDirectionalParticles={1} linkDirectionalParticleWidth={2}
                  linkDirectionalParticleColor={() => '#6366f1'} linkDirectionalParticleSpeed={0.003}
                  d3AlphaDecay={0.015} d3VelocityDecay={0.25} cooldownTicks={150}
                  backgroundColor="#0f1117" enableNodeDrag enableZoomInteraction enablePanInteraction
                />

                {/* Edit toolbar */}
                {editMode && (
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setNewNodeOpen(true)}
                        className="px-3 py-2 bg-gray-900/80 backdrop-blur-sm text-white text-[12px] font-medium rounded-lg hover:bg-gray-900 inline-flex items-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" /> Node
                      </button>
                    </div>
                    {showLegend && <Legend extra={customLabelsForLegend} />}
                  </div>
                )}

                {/* Tree (ISA-95 view only) */}
                {!editMode && showTree && isaQuery.data && (
                  <div className="absolute top-3 left-3 z-10">
                    <TreePanel data={isaQuery.data} onSelect={onTreeSelect} />
                  </div>
                )}
                {!editMode && showLegend && (
                  <div className="absolute top-3 right-3 z-10"><Legend extra={[]} /></div>
                )}

                {/* Selection panel */}
                {!editMode && selectedNode && selectedNode.id !== 'root' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-lg p-4 min-w-[240px]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: TYPE_COLORS[selectedNode.type]?.color }}>
                          {TYPE_COLORS[selectedNode.type]?.label}
                        </span>
                        <button onClick={() => setSelectedNode(null)} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2">{selectedNode.name}</p>
                      <div className="space-y-1.5 text-[12px]">
                        {selectedNode.metadata && Object.entries(selectedNode.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4">
                            <span className="text-gray-400 capitalize">{k}</span>
                            <span className="text-gray-700 dark:text-gray-300 font-mono truncate max-w-[160px]" title={v}>{v}</span>
                          </div>
                        ))}
                        {(selectedNode.tagCount ?? 0) > 0 && (
                          <div className="flex justify-between"><span className="text-gray-400">Tags</span><span className="text-gray-700 dark:text-gray-300">{selectedNode.tagCount}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {editMode && selectedRawNode && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <NodeEditor
                      node={selectedRawNode}
                      onClose={() => setSelectedNode(null)}
                      onSave={handleUpdateNode}
                      onDelete={handleDeleteNode}
                      onStartConnect={(id) => { setConnectFrom(id); setSelectedNode(null); }}
                    />
                  </div>
                )}

                {editMode && selectedRawRel && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <RelationshipEditor
                      rel={selectedRawRel}
                      sourceName={(rawNodeById.get(selectedRawRel.sourceId)?.properties.name as string) ?? selectedRawRel.sourceId}
                      targetName={(rawNodeById.get(selectedRawRel.targetId)?.properties.name as string) ?? selectedRawRel.targetId}
                      onClose={() => setSelectedLink(null)}
                      onSave={handleUpdateRel}
                      onDelete={handleDeleteRel}
                    />
                  </div>
                )}

                {/* Connect mode banner */}
                {editMode && connectFrom && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-amber-500 text-white text-[12px] font-medium rounded-full shadow-lg inline-flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    Click a target node to connect ({(rawNodeById.get(connectFrom)?.properties.name as string) ?? connectFrom})
                    <button onClick={() => setConnectFrom(null)} className="ml-2 hover:bg-amber-600 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {actionError && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-2 bg-red-50 text-red-700 text-[12px] rounded-lg shadow-md border border-red-100 inline-flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {actionError}
                  </div>
                )}

                <div className="absolute bottom-3 right-3 text-[11px] text-gray-500 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  {graphData.nodes.length} nodes &middot; {graphData.links.length} links
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[14px] text-gray-400 mb-1">
                    {editMode ? 'Empty graph' : 'No hierarchy configured'}
                  </p>
                  <p className="text-[12px] text-gray-300">
                    {editMode ? 'Click "+ Node" to start building your knowledge graph' : 'Configure the ISA-95 plant hierarchy to view the Knowledge Graph'}
                  </p>
                  {editMode && (
                    <button
                      onClick={() => setNewNodeOpen(true)}
                      className="mt-4 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add first node
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0"><CypherConsole /></div>
        )}
      </div>

      {/* Modals */}
      {newNodeOpen && (
        <NodeFormModal
          existingLabels={labelsInUse}
          onCancel={() => setNewNodeOpen(false)}
          onSave={handleCreateNode}
        />
      )}
      {pendingTarget && (
        <RelationshipFormModal
          sourceName={pendingSourceName}
          targetName={pendingTargetName}
          existingTypes={relTypesInUse}
          onCancel={() => setPendingTarget(null)}
          onSave={handleCreateRel}
        />
      )}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors inline-flex items-center gap-1',
        active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-500'
      )}
    >
      {children}
    </button>
  );
}
