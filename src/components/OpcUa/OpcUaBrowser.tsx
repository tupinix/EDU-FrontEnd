import React, { useState, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, ChevronRight, Search, X, Copy, Check, Eye, EyeOff, Rss } from 'lucide-react';
import { useOpcUaBrowse, useCreateOpcUaSubscription, useOpcUaSubscriptions, useDeleteOpcUaSubscription } from '../../hooks/useOpcUa';
import { useQuery } from '@tanstack/react-query';
import { OpcUaConnection, BrokerConfig } from '../../types';
import apiClient from '../../services/api';
import { cn } from '@/lib/utils';

interface BrowseNode { nodeId: string; browseName: string; displayName: string; nodeClass: string; isForward: boolean; }
function isObject(n: BrowseNode) { return n.nodeClass === 'Object' || n.nodeClass === '1'; }
function isVariable(n: BrowseNode) { return n.nodeClass === 'Variable' || n.nodeClass === '2'; }

function nodeClassLabel(nc: string) {
  if (nc === 'Object' || nc === '1') return { text: 'Object', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' };
  if (nc === 'Variable' || nc === '2') return { text: 'Variable', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' };
  if (nc === 'Method' || nc === '4') return { text: 'Method', cls: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' };
  return { text: nc, cls: 'text-gray-500 bg-gray-50 dark:bg-gray-800/50' };
}

function suggestTopic(path: { name: string }[], nodeName: string): string {
  const parts = path.slice(1).map(p => p.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')).filter(Boolean);
  return [...parts, nodeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')].join('/');
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors">
      {copied ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
}

// ── Subscribe Modal ──────────────────────────────────────────────────

function SubscribeModal({ node, connectionId, path, onClose }: { node: BrowseNode; connectionId: string; path: { name: string }[]; onClose: () => void }) {
  const createSub = useCreateOpcUaSubscription();
  const [topic, setTopic] = useState(() => suggestTopic(path, node.displayName));
  const [interval, setInterval] = useState(1000);
  const [showPreview, setShowPreview] = useState(false);
  const [brokerId, setBrokerId] = useState('');

  const { data: brokersRaw } = useQuery<{ success: boolean; data?: BrokerConfig[] }>({
    queryKey: ['brokers-list-modal'], queryFn: async () => { const { data } = await apiClient.get('/brokers'); return data; }, staleTime: 15000,
  });
  const brokers: BrokerConfig[] = brokersRaw?.data ?? [];

  const handleSave = async () => {
    if (!topic.trim()) return;
    try { await createSub.mutateAsync({ connectionId, nodeId: node.nodeId, mqttTopic: topic.trim(), samplingIntervalMs: interval, brokerId: brokerId || undefined }); onClose(); } catch { /* handled */ }
  };

  const preview = JSON.stringify({ nodeId: node.nodeId, topic, value: '<live>', timestamp: new Date().toISOString() }, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Publish to MQTT</h3>
          <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Node info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400">Tag</span>
              {(() => { const l = nodeClassLabel(node.nodeClass); return <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', l.cls)}>{l.text}</span>; })()}
            </div>
            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{node.displayName}</p>
            <p className="text-[11px] font-mono text-gray-400 break-all mt-0.5">{node.nodeId}</p>
          </div>

          {/* Broker */}
          <Field label="MQTT Broker *">
            {brokers.length === 0 ? (
              <p className="text-[12px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">No brokers configured. Add one in MQTT Brokers.</p>
            ) : (
              <select value={brokerId} onChange={(e) => setBrokerId(e.target.value)} className="input-clean" required>
                <option value="">— Select a broker —</option>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.host}:{b.port}){b.status === 'connected' ? ' ✓' : ''}</option>)}
              </select>
            )}
          </Field>

          {/* Topic */}
          <Field label="MQTT Topic *">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="input-clean font-mono" placeholder="plant/area/equipment/tag" autoFocus />
            <p className="text-[11px] text-gray-300 mt-1">Auto-suggested from browsed path</p>
          </Field>

          {/* Interval */}
          <Field label="Sampling interval">
            <div className="flex gap-1.5">
              {[100, 500, 1000, 5000].map(ms => (
                <button key={ms} type="button" onClick={() => setInterval(ms)}
                  className={cn('flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-colors', interval === ms ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700')}>
                  {ms}ms
                </button>
              ))}
            </div>
          </Field>

          {/* Preview */}
          <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
            {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showPreview ? 'Hide payload preview' : 'Show payload preview'}
          </button>
          {showPreview && <pre className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3.5 py-2.5 text-[11px] font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">{preview}</pre>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!topic.trim() || !brokerId || createSub.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30">
            <Rss className="w-3.5 h-3.5" /> {createSub.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Browser ──────────────────────────────────────────────────────────

export function OpcUaBrowser({ connection, onBack }: { connection: OpcUaConnection; onBack: () => void }) {
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(undefined);
  const [path, setPath] = useState<{ nodeId?: string; name: string }[]>([{ name: 'Root' }]);
  const [search, setSearch] = useState('');
  const [subscribeNode, setSubscribeNode] = useState<BrowseNode | null>(null);
  const [showSubs, setShowSubs] = useState(false);

  const { data: nodes = [], isLoading } = useOpcUaBrowse(connection.id, currentNodeId);
  const { data: allSubs = [] } = useOpcUaSubscriptions(connection.id);
  const deleteSub = useDeleteOpcUaSubscription();

  const handleNav = (node: BrowseNode) => { if (isObject(node)) { setCurrentNodeId(node.nodeId); setPath([...path, { nodeId: node.nodeId, name: node.displayName }]); setSearch(''); } };
  const handleBreadcrumb = (i: number) => { setCurrentNodeId(path[i].nodeId); setPath(path.slice(0, i + 1)); setSearch(''); };

  const filteredNodes = useMemo(() => {
    const list = nodes as BrowseNode[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(n => n.displayName.toLowerCase().includes(q) || n.nodeId.toLowerCase().includes(q));
  }, [nodes, search]);

  const subscribedIds = new Set(allSubs.map(s => s.nodeId));

  return (
    <div className="space-y-4">
      {subscribeNode && <SubscribeModal node={subscribeNode} connectionId={connection.id} path={path} onClose={() => setSubscribeNode(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Browse — {connection.name}</h3>
          <p className="text-[11px] text-gray-400 font-mono truncate">{connection.endpointUrl}</p>
        </div>
        <button onClick={() => setShowSubs(!showSubs)}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors', showSubs ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-500')}>
          <Rss className="w-3 h-3" /> Subscriptions ({allSubs.length})
        </button>
      </div>

      {/* Subscriptions panel */}
      {showSubs && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800"><p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100">Active subscriptions</p></div>
          {allSubs.length === 0 ? (
            <div className="px-5 py-4 text-[12px] text-gray-400">No subscriptions configured</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {allSubs.map(sub => (
                <div key={sub.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-gray-600 truncate">{sub.nodeId}</p>
                    <p className="text-[11px] text-gray-400 truncate">→ {sub.mqttTopic}</p>
                  </div>
                  <span className="text-[10px] text-gray-300 shrink-0">{sub.samplingIntervalMs}ms</span>
                  <button onClick={() => deleteSub.mutate(sub.id)} className="p-1 text-red-300 hover:text-red-500 transition-colors shrink-0"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-[12px] text-gray-400 overflow-x-auto pb-1">
        {path.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-gray-300" />}
            <button onClick={() => handleBreadcrumb(i)} className={cn('whitespace-nowrap hover:text-gray-600 transition-colors', i === path.length - 1 && 'text-gray-900 font-medium')}>{p.name}</button>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name or NodeID..."
          className="w-full pl-9 pr-8 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 dark:focus:border-gray-700 dark:focus:ring-gray-800 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3 h-3" /></button>}
      </div>

      {/* Node list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
      ) : filteredNodes.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-gray-300">{search ? `No nodes for "${search}"` : 'No nodes found'}</div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            <span>Name / NodeID</span><span>Type</span><span className="w-8" />
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {filteredNodes.map((node, i) => {
              const subscribed = subscribedIds.has(node.nodeId);
              const ncl = nodeClassLabel(node.nodeClass);
              return (
                <div key={i} className={cn('grid grid-cols-[1fr_auto_auto] gap-2 items-center px-5 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800 transition-colors', subscribed && 'bg-blue-50/30 dark:bg-blue-900/10')}>
                  <button onClick={() => handleNav(node)} className={cn('flex items-center gap-2 text-left min-w-0', isObject(node) ? 'cursor-pointer' : 'cursor-default')}>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isObject(node) ? 'bg-amber-400' : isVariable(node) ? 'bg-blue-400' : 'bg-gray-300')} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{node.displayName}</span>
                        {subscribed && <Rss className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-400 truncate">{node.nodeId}</span>
                        <CopyBtn text={node.nodeId} />
                      </div>
                    </div>
                  </button>
                  <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0', ncl.cls)}>{ncl.text}</span>
                  <div className="w-8 shrink-0">
                    {isVariable(node) && (
                      <button onClick={() => setSubscribeNode(node)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && <p className="text-[11px] text-gray-300 text-right">{filteredNodes.length} node(s){search && ` (filtered from ${(nodes as BrowseNode[]).length})`}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
