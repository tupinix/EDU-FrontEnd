import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, ArrowLeft, Plus, Trash2, ChevronRight, Search, ArrowRight, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCreateDataModel, useUpdateDataModel } from '../../hooks/useDataModels';
import { DataModel, BrokerConfig, TopicNode } from '../../types';
import { topicsApi } from '../../services/api';
import apiClient from '../../services/api';
import { cn } from '@/lib/utils';

interface Props {
  model: DataModel | null;
  onClose: () => void;
}

interface Attribute {
  key: string;
  value: string;
  fromPayload: boolean; // true = mapped from source payload field, false = user-defined
  sourceField?: string; // original payload field name (if fromPayload)
  transform: string;
  valueMode?: 'manual' | 'tag'; // for ctx attributes: manual text or linked to another tag
  linkedTopic?: string; // topic to pull value from (when valueMode === 'tag')
  linkedField?: string; // field inside that topic's payload (default: 'value')
}

const TRANSFORMS = ['none', 'round', 'scale', 'toNumber', 'toString', 'toBool'] as const;

/** Parse a ctx value — detects {{topic.field}} tag references */
function parseCtxAttribute(key: string, val: string): Attribute {
  if (val.startsWith('{{') && val.endsWith('}}')) {
    const inner = val.slice(2, -2); // "OPCUA/TagCount.value"
    const lastDot = inner.lastIndexOf('.');
    const linkedTopic = lastDot > 0 ? inner.slice(0, lastDot) : inner;
    const linkedField = lastDot > 0 ? inner.slice(lastDot + 1) : 'value';
    return { key, value: val, fromPayload: false, transform: 'none', valueMode: 'tag', linkedTopic, linkedField };
  }
  return { key, value: val, fromPayload: false, transform: 'none', valueMode: 'manual' };
}

// ── Mini Topic Tree ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChildren(node: any): TopicNode[] {
  if (!node.children) return [];
  if (Array.isArray(node.children)) return node.children;
  if (node.children instanceof Map) return Array.from(node.children.values());
  if (typeof node.children === 'object') return Object.values(node.children);
  return [];
}

function MiniTreeItem({ node, level, onSelect, selected }: { node: TopicNode; level: number; onSelect: (path: string) => void; selected: string }) {
  const [expanded, setExpanded] = useState(level < 1);
  const children = getChildren(node);
  const hasChildren = children.length > 0;
  const isSelected = selected === node.fullPath;

  const handleDragStart = (e: React.DragEvent) => {
    if (!node.hasValue) return;
    e.dataTransfer.setData('text/plain', node.fullPath);
    e.dataTransfer.setData('application/x-edu-topic', node.fullPath);
    e.dataTransfer.effectAllowed = 'link';
  };

  return (
    <div>
      <div
        draggable={node.hasValue}
        onDragStart={handleDragStart}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (node.hasValue) onSelect(node.fullPath);
        }}
        className={cn(
          'flex items-center gap-1 w-full text-left py-1 pr-2 rounded-md text-[11px] transition-colors cursor-pointer',
          isSelected ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
          node.hasValue && 'cursor-grab active:cursor-grabbing'
        )}
        style={{ paddingLeft: `${level * 12 + 6}px` }}
      >
        <ChevronRight className={cn(
          'w-2.5 h-2.5 shrink-0 transition-transform',
          expanded && 'rotate-90',
          !hasChildren && 'invisible'
        )} />
        <span className={cn('w-1 h-1 rounded-full shrink-0', node.hasValue ? isSelected ? 'bg-emerald-400' : 'bg-emerald-300' : 'bg-gray-200')} />
        <span className="truncate font-mono">{node.name}</span>
        {node.hasValue && (
          <span className="ml-auto text-[9px] text-gray-300 shrink-0 hidden group-hover:inline">drag</span>
        )}
      </div>
      {expanded && hasChildren && children.map((child) => (
        <MiniTreeItem key={child.fullPath} node={child} level={level + 1} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

// ── Main Form ────────────────────────────────────────────────────────

export function DataModelForm({ model, onClose }: Props) {
  const createMutation = useCreateDataModel();
  const updateMutation = useUpdateDataModel();
  const isEditing = !!model;

  // Core state
  const [name, setName] = useState(model?.name ?? '');
  const [sourceTopic, setSourceTopic] = useState(model?.sourceTopic ?? '');
  const [targetTopic, setTargetTopic] = useState(model?.targetTopic ?? '');
  const [sourceBrokerId, setSourceBrokerId] = useState(model?.sourceBrokerId ?? '');
  const [targetBrokerId, setTargetBrokerId] = useState(model?.targetBrokerId ?? '');
  const [treeSearch, setTreeSearch] = useState('');

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverNew, setDragOverNew] = useState(false);

  // Attributes: free-form key/value pairs (enrichment + field mappings combined)
  const [attributes, setAttributes] = useState<Attribute[]>(() => {
    if (!model) return [];
    const attrs: Attribute[] = [];
    // Restore field mappings (src)
    for (const m of model.fieldMappings ?? []) {
      attrs.push({ key: m.target, value: '', fromPayload: true, sourceField: m.source, transform: m.transform });
    }
    // Restore known ISA-95 / enrichment fields as ctx
    const knownFields: [string, string | undefined][] = [
      ['enterprise', model.enterprise], ['site', model.site], ['area', model.area],
      ['line', model.line], ['equipment', model.equipment], ['unit', model.unit],
      ['dataType', model.dataType], ['description', model.tagDescription], ['tagName', model.tagName],
    ];
    for (const [key, val] of knownFields) {
      if (!val) continue;
      attrs.push(parseCtxAttribute(key, val));
    }
    // Restore extraFields (custom ctx — including tag-linked ones)
    for (const [key, val] of Object.entries(model.extraFields ?? {})) {
      attrs.push(parseCtxAttribute(key, String(val)));
    }
    return attrs;
  });

  // Source payload preview
  const [sourcePayload, setSourcePayload] = useState<Record<string, unknown> | null>(null);
  const [payloadFields, setPayloadFields] = useState<string[]>([]);

  // Data fetching
  const { data: topicTree = [] } = useQuery<TopicNode[]>({
    queryKey: ['topics-tree'], queryFn: topicsApi.getTree, staleTime: 15000,
  });

  const { data: topicList = [] } = useQuery<string[]>({
    queryKey: ['topics-list'], queryFn: topicsApi.getList, staleTime: 15000,
  });

  const { data: brokersRaw } = useQuery<{ success: boolean; data?: BrokerConfig[] }>({
    queryKey: ['brokers-list-modal'],
    queryFn: async () => { const { data } = await apiClient.get('/brokers'); return data; },
    staleTime: 15000,
  });
  const brokers: BrokerConfig[] = brokersRaw?.data ?? [];

  // Fetch payload when source topic changes
  useEffect(() => {
    if (!sourceTopic.trim()) { setSourcePayload(null); setPayloadFields([]); return; }
    let cancelled = false;
    const fetch = async () => {
      try {
        const { data } = await apiClient.get(`/topics/${encodeURIComponent(sourceTopic)}/details`);
        if (!cancelled && data.data?.payload != null) {
          const p = typeof data.data.payload === 'object' ? data.data.payload : { value: data.data.payload };
          setSourcePayload(p);
          setPayloadFields(Object.keys(p));
        }
      } catch { if (!cancelled) { setSourcePayload(null); setPayloadFields([]); } }
    };
    const timer = setTimeout(fetch, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sourceTopic]);

  // Filter topic tree
  const filteredTree = useMemo(() => {
    if (!treeSearch.trim()) return topicTree;
    const q = treeSearch.toLowerCase();
    const filterNode = (node: TopicNode): TopicNode | null => {
      if (node.fullPath.toLowerCase().includes(q) || node.name.toLowerCase().includes(q)) return node;
      const children = getChildren(node);
      const filteredChildren = children.map(filterNode).filter(Boolean) as TopicNode[];
      if (filteredChildren.length > 0) return { ...node, children: filteredChildren as unknown as TopicNode['children'] };
      return null;
    };
    return topicTree.map(filterNode).filter(Boolean) as TopicNode[];
  }, [topicTree, treeSearch]);

  // Add a payload field as attribute
  const addPayloadField = useCallback((field: string) => {
    if (attributes.some(a => a.fromPayload && a.sourceField === field)) return;
    setAttributes(prev => [...prev, { key: field, value: '', fromPayload: true, sourceField: field, transform: 'none' }]);
  }, [attributes]);

  // Add a free-form attribute
  const addCustomAttribute = () => {
    setAttributes(prev => [...prev, { key: '', value: '', fromPayload: false, transform: 'none', valueMode: 'manual' }]);
  };

  const removeAttribute = (index: number) => setAttributes(prev => prev.filter((_, i) => i !== index));
  const updateAttribute = (index: number, updates: Partial<Attribute>) => {
    setAttributes(prev => prev.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  // Drop a topic onto an existing ctx attribute row
  const handleDropOnAttribute = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    const topic = e.dataTransfer.getData('application/x-edu-topic') || e.dataTransfer.getData('text/plain');
    if (!topic) return;
    updateAttribute(index, { valueMode: 'tag', linkedTopic: topic, linkedField: 'value', value: `{{${topic}.value}}` });
  };

  // Drop a topic to create a new ctx attribute linked to that tag
  const handleDropNewAttribute = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverNew(false);
    const topic = e.dataTransfer.getData('application/x-edu-topic') || e.dataTransfer.getData('text/plain');
    if (!topic) return;
    const tagName = topic.split('/').pop() || topic;
    setAttributes(prev => [...prev, {
      key: tagName, value: `{{${topic}.value}}`, fromPayload: false, transform: 'none',
      valueMode: 'tag', linkedTopic: topic, linkedField: 'value',
    }]);
  };

  // Fetch live values for linked tags
  const linkedTopics = useMemo(() =>
    [...new Set(attributes.filter(a => a.valueMode === 'tag' && a.linkedTopic).map(a => a.linkedTopic!))],
    [attributes]
  );

  const [linkedValues, setLinkedValues] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (linkedTopics.length === 0) { setLinkedValues({}); return; }
    let cancelled = false;
    const fetchAll = async () => {
      const results: Record<string, Record<string, unknown>> = {};
      for (const topic of linkedTopics) {
        try {
          const { data } = await apiClient.get(`/topics/${encodeURIComponent(topic)}/details`);
          if (!cancelled && data.data?.payload != null) {
            results[topic] = typeof data.data.payload === 'object' ? data.data.payload : { value: data.data.payload };
          }
        } catch { /* skip */ }
      }
      if (!cancelled) setLinkedValues(results);
    };
    fetchAll();
    const interval = window.setInterval(fetchAll, 5000); // refresh every 5s
    return () => { cancelled = true; clearInterval(interval); };
  }, [linkedTopics]);

  // Build output preview
  const outputPreview = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const attr of attributes) {
      if (attr.fromPayload && attr.sourceField && sourcePayload) {
        out[attr.key || attr.sourceField] = sourcePayload[attr.sourceField] ?? null;
      } else if (!attr.fromPayload && attr.key) {
        if (attr.valueMode === 'tag' && attr.linkedTopic) {
          const topicPayload = linkedValues[attr.linkedTopic];
          const field = attr.linkedField || 'value';
          if (topicPayload && topicPayload[field] !== undefined) {
            out[attr.key] = topicPayload[field];
          } else {
            out[attr.key] = `← ${attr.linkedTopic}.${field} (loading...)`;
          }
        } else {
          out[attr.key] = attr.value;
        }
      }
    }
    out.source = sourceTopic || '...';
    out.quality = 'good';
    out.timestamp = new Date().toISOString();
    return out;
  }, [attributes, sourcePayload, sourceTopic, linkedValues]);

  // Auto-suggest target topic from attributes
  useEffect(() => {
    if (isEditing) return;
    const parts = ['enterprise', 'site', 'area', 'line', 'equipment']
      .map(k => attributes.find(a => a.key === k)?.value)
      .filter(Boolean);
    const tag = attributes.find(a => a.key === 'tagName')?.value;
    if (tag) parts.push(tag);
    if (parts.length > 0) setTargetTopic(parts.join('/'));
  }, [attributes, isEditing]);

  // Submit
  const handleSubmit = async () => {
    const fieldMappings = attributes
      .filter(a => a.fromPayload && a.sourceField)
      .map(a => ({ source: a.sourceField!, target: a.key || a.sourceField!, transform: a.transform }));

    const extraFromAttrs = attributes.filter(a => !a.fromPayload && a.key);
    const body: Record<string, unknown> = {
      name: name.trim(),
      sourceTopic: sourceTopic.trim(),
      targetTopic: targetTopic.trim(),
      sourceBrokerId: sourceBrokerId || undefined,
      targetBrokerId: targetBrokerId || undefined,
      fieldMappings,
      extraFields: Object.fromEntries(extraFromAttrs.filter(a => !['enterprise', 'site', 'area', 'line', 'equipment', 'unit', 'dataType', 'description', 'tagName'].includes(a.key)).map(a => [a.key, a.value])),
    };
    // Extract known ISA-95 / enrichment fields
    for (const a of extraFromAttrs) {
      if (a.key === 'enterprise') body.enterprise = a.value;
      else if (a.key === 'site') body.site = a.value;
      else if (a.key === 'area') body.area = a.value;
      else if (a.key === 'line') body.line = a.value;
      else if (a.key === 'equipment') body.equipment = a.value;
      else if (a.key === 'unit') body.unit = a.value;
      else if (a.key === 'dataType') body.dataType = a.value;
      else if (a.key === 'description' || a.key === 'tagDescription') body.tagDescription = a.value;
      else if (a.key === 'tagName') body.tagName = a.value;
    }

    try {
      if (isEditing) await updateMutation.mutateAsync({ id: model.id, ...body });
      else await createMutation.mutateAsync(body);
      onClose();
    } catch { /* handled */ }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">{isEditing ? 'Edit Model' : 'New Data Model'}</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter model name..."
              autoFocus
              className="text-[16px] font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300 border-b border-gray-200 focus:border-gray-400 transition-colors w-64 pb-0.5"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !sourceTopic.trim() || !targetTopic.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* Three-panel workspace */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT — Mini Explorer */}
        <div className="w-56 lg:w-64 bg-white rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden shrink-0 hidden md:flex">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Source Topic</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
              <input type="text" value={treeSearch} onChange={e => setTreeSearch(e.target.value)} placeholder="Search topics..."
                className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-gray-50 border border-gray-100 rounded-lg outline-none placeholder:text-gray-300 focus:border-gray-200 transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-auto py-1 px-1">
            {filteredTree.length === 0 ? (
              <p className="text-[11px] text-gray-300 text-center py-4">No topics</p>
            ) : (
              filteredTree.map(node => (
                <MiniTreeItem key={node.fullPath} node={node} level={0} onSelect={setSourceTopic} selected={sourceTopic} />
              ))
            )}
          </div>
          {sourceTopic && (
            <div className="px-3 py-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">Selected:</p>
              <p className="text-[11px] font-mono text-gray-700 truncate">{sourceTopic}</p>
            </div>
          )}
        </div>

        {/* CENTER — Attributes */}
        <div className="flex-1 flex flex-col gap-4 overflow-auto min-w-0">
          {/* Source topic (mobile) */}
          <div className="md:hidden bg-white rounded-2xl border border-gray-200/60 px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Source Topic</p>
            <input type="text" value={sourceTopic} onChange={e => setSourceTopic(e.target.value)} placeholder="Select from tree or type..."
              className="input-clean font-mono text-[12px]" />
          </div>

          {/* Source Payload Fields */}
          {sourcePayload && payloadFields.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Source Payload</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Click a field to add it to the model</p>
              </div>
              <div className="px-4 py-2 flex flex-wrap gap-1.5">
                {payloadFields.map(field => {
                  const alreadyAdded = attributes.some(a => a.fromPayload && a.sourceField === field);
                  const val = sourcePayload[field];
                  return (
                    <button
                      key={field} onClick={() => addPayloadField(field)}
                      disabled={alreadyAdded}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors',
                        alreadyAdded
                          ? 'bg-emerald-50 text-emerald-600 cursor-default'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer'
                      )}
                    >
                      <span className="font-semibold">{field}</span>
                      <span className="text-gray-400">: {typeof val === 'number' ? val : typeof val === 'string' ? `"${val.slice(0, 15)}"` : String(val)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Model Attributes</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Mapped fields + custom enrichment</p>
              </div>
              <button onClick={addCustomAttribute} className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="w-3 h-3" /> Add field
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {attributes.length === 0 && (
                <div
                  className={cn(
                    'px-4 py-6 text-center transition-colors border-2 border-dashed mx-3 my-3 rounded-xl',
                    dragOverNew ? 'border-purple-300 bg-purple-50' : 'border-gray-100'
                  )}
                  onDragOver={e => { e.preventDefault(); setDragOverNew(true); }}
                  onDragLeave={() => setDragOverNew(false)}
                  onDrop={handleDropNewAttribute}
                >
                  <p className="text-[12px] text-gray-300">{dragOverNew ? 'Drop to link tag' : 'No attributes yet'}</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Click payload fields, add custom fields, or drag tags from the tree</p>
                </div>
              )}
              {attributes.map((attr, i) => (
                <div
                  key={i}
                  className={cn(
                    'px-4 py-2.5 flex items-center gap-2 transition-colors',
                    dragOverIndex === i && !attr.fromPayload && 'bg-purple-50 border-l-2 border-purple-400'
                  )}
                  onDragOver={e => { if (!attr.fromPayload) { e.preventDefault(); setDragOverIndex(i); } }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={e => !attr.fromPayload ? handleDropOnAttribute(i, e) : undefined}
                >
                  {attr.fromPayload ? (
                    <>
                      <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">src</span>
                      <span className="text-[11px] font-mono text-gray-400 shrink-0">{attr.sourceField}</span>
                      <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                      <input type="text" value={attr.key} onChange={e => updateAttribute(i, { key: e.target.value })}
                        placeholder="output name" className="flex-1 text-[11px] font-mono text-gray-700 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-gray-300 transition-colors min-w-0" />
                      <select value={attr.transform} onChange={e => updateAttribute(i, { transform: e.target.value })}
                        className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-1.5 py-1 outline-none shrink-0">
                        {TRANSFORMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      {/* Mode toggle: manual / tag */}
                      <button
                        onClick={() => updateAttribute(i, { valueMode: attr.valueMode === 'tag' ? 'manual' : 'tag', value: '', linkedTopic: '', linkedField: '' })}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded shrink-0 transition-colors',
                          attr.valueMode === 'tag' ? 'text-purple-500 bg-purple-50' : 'text-blue-500 bg-blue-50'
                        )}
                        title={attr.valueMode === 'tag' ? 'Linked to tag — click for manual' : 'Manual value — click to link tag'}
                      >
                        {attr.valueMode === 'tag' ? 'tag' : 'ctx'}
                      </button>
                      <input type="text" value={attr.key} onChange={e => updateAttribute(i, { key: e.target.value })}
                        placeholder="key" className="w-24 text-[11px] font-mono text-gray-700 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-gray-300 transition-colors shrink-0" />
                      <span className="text-gray-300 text-[11px] shrink-0">:</span>
                      {attr.valueMode === 'tag' ? (
                        <CtxTagPicker
                          topics={topicList}
                          linkedTopic={attr.linkedTopic || ''}
                          linkedField={attr.linkedField || 'value'}
                          onChange={(topic, field) => updateAttribute(i, { linkedTopic: topic, linkedField: field, value: `{{${topic}.${field}}}` })}
                        />
                      ) : (
                        <input type="text" value={attr.value} onChange={e => updateAttribute(i, { value: e.target.value })}
                          placeholder="value" className="flex-1 text-[11px] text-gray-600 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-gray-300 transition-colors min-w-0" />
                      )}
                    </>
                  )}
                  <button onClick={() => removeAttribute(i)} className="p-1 text-red-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Drop zone for new linked attributes */}
              {attributes.length > 0 && (
                <div
                  className={cn(
                    'mx-3 my-2 py-2 text-center rounded-lg border-2 border-dashed transition-colors',
                    dragOverNew ? 'border-purple-300 bg-purple-50' : 'border-transparent'
                  )}
                  onDragOver={e => { e.preventDefault(); setDragOverNew(true); }}
                  onDragLeave={() => setDragOverNew(false)}
                  onDrop={handleDropNewAttribute}
                >
                  <p className={cn('text-[10px]', dragOverNew ? 'text-purple-400' : 'text-transparent')}>
                    Drop tag here to link
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Target + Broker */}
          <div className="bg-white rounded-2xl border border-gray-200/60 px-4 py-3 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Target</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 mb-1 block">UNS Topic</label>
                <input type="text" value={targetTopic} onChange={e => setTargetTopic(e.target.value)}
                  placeholder="enterprise/site/area/equipment/tag" className="input-clean font-mono text-[12px]" />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-[11px] text-gray-400 mb-1 block">Broker</label>
                <select value={targetBrokerId} onChange={e => setTargetBrokerId(e.target.value)} className="input-clean text-[12px]">
                  <option value="">Default</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name}{b.status === 'connected' ? ' ✓' : ''}</option>)}
                </select>
              </div>
              <div className="w-full sm:w-48">
                <label className="text-[11px] text-gray-400 mb-1 block">Source Broker</label>
                <select value={sourceBrokerId} onChange={e => setSourceBrokerId(e.target.value)} className="input-clean text-[12px]">
                  <option value="">Any</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name}{b.status === 'connected' ? ' ✓' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Output Preview */}
        <div className="w-64 lg:w-72 bg-white rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden shrink-0 hidden lg:flex">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Output Preview</p>
            <p className="text-[11px] font-mono text-gray-500 truncate mt-1">{targetTopic || '...'}</p>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3">
            <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
              {JSON.stringify(outputPreview, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tag Picker for ctx attributes ────────────────────────────────────

function CtxTagPicker({ topics, linkedTopic, linkedField, onChange }: {
  topics: string[];
  linkedTopic: string;
  linkedField: string;
  onChange: (topic: string, field: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pickedPayloadFields, setPickedPayloadFields] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return topics.slice(0, 30);
    const q = search.toLowerCase();
    return topics.filter(t => t.toLowerCase().includes(q)).slice(0, 30);
  }, [topics, search]);

  // Fetch payload fields when topic selected
  useEffect(() => {
    if (!linkedTopic) { setPickedPayloadFields([]); return; }
    let cancelled = false;
    const fetchFields = async () => {
      try {
        const { data } = await apiClient.get(`/topics/${encodeURIComponent(linkedTopic)}/details`);
        if (!cancelled && data.data?.payload && typeof data.data.payload === 'object') {
          setPickedPayloadFields(Object.keys(data.data.payload));
        }
      } catch { if (!cancelled) setPickedPayloadFields([]); }
    };
    fetchFields();
    return () => { cancelled = true; };
  }, [linkedTopic]);

  if (linkedTopic && !open) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-[11px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors truncate">
          {linkedTopic}
          <span className="text-purple-400">.{linkedField}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 relative">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search topic to link..."
        className="w-full text-[11px] font-mono text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-purple-400 transition-colors"
      />
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-gray-300">No topics found</p>
          ) : (
            filtered.map(t => (
              <button
                key={t}
                onClick={() => {
                  onChange(t, 'value');
                  setSearch('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t}
              </button>
            ))
          )}
          {/* If we have a linked topic, show field picker */}
          {linkedTopic && pickedPayloadFields.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <p className="text-[10px] text-gray-400 mb-1">Select field from payload:</p>
              <div className="flex flex-wrap gap-1">
                {pickedPayloadFields.map(f => (
                  <button
                    key={f}
                    onClick={() => { onChange(linkedTopic, f); setOpen(false); }}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-mono rounded transition-colors',
                      f === linkedField ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
