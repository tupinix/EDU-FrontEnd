import { useState, useMemo } from 'react';
import { ArrowLeft, Loader2, Search, X, Rss, Plus, RefreshCw } from 'lucide-react';
import { useEthipDiscoverTags, useEthipSubscribedTags, useCreateEthipTag, useDeleteEthipTag } from '../../hooks/useEthernetIp';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { EthipConnection, EthipDiscoveredTag, BrokerConfig } from '../../types';
import apiClient from '../../services/api';
import { cn } from '@/lib/utils';

// ── Subscribe Modal ──────────────────────────────────────────────────

function SubscribeModal({ tag, connectionId, onClose }: { tag: EthipDiscoveredTag; connectionId: string; onClose: () => void }) {
  const createTag = useCreateEthipTag(connectionId);
  const [topic, setTopic] = useState(() => `EthernetIP/${tag.tag_name.replace(/\./g, '/').replace(/\[/g, '/').replace(/\]/g, '')}`);
  const [interval, setInterval] = useState(1000);
  const [brokerId, setBrokerId] = useState('');

  const { data: brokersRaw } = useQuery<{ success: boolean; data?: BrokerConfig[] }>({
    queryKey: ['brokers-list-modal'],
    queryFn: async () => { const { data } = await apiClient.get('/brokers'); return data; },
    staleTime: 15000,
  });
  const brokers: BrokerConfig[] = brokersRaw?.data ?? [];

  const handleSave = async () => {
    if (!topic.trim() || !brokerId) return;
    try {
      await createTag.mutateAsync({
        tagName: tag.tag_name,
        mqttTopic: topic.trim(),
        samplingIntervalMs: interval,
        displayName: tag.tag_name,
        brokerId: brokerId || undefined,
      });
      onClose();
    } catch { /* handled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900">Publish to MQTT</h3>
          <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Tag info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400">Tag</span>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{tag.data_type}</span>
            </div>
            <p className="text-[13px] font-medium text-gray-900 font-mono">{tag.tag_name}</p>
            {tag.dim > 0 && <p className="text-[11px] text-gray-400 mt-0.5">Array dimension: {tag.dim}</p>}
          </div>

          {/* Broker selector */}
          <Field label="MQTT Broker *">
            {brokers.length === 0 ? (
              <p className="text-[12px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">No brokers configured. Add one in MQTT Brokers.</p>
            ) : (
              <select value={brokerId} onChange={(e) => setBrokerId(e.target.value)} className="input-clean" required>
                <option value="">— Select a broker —</option>
                {brokers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.host}:{b.port}){b.status === 'connected' ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Topic */}
          <Field label="MQTT Topic *">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="input-clean font-mono" placeholder="EthernetIP/tag_name" autoFocus />
            <p className="text-[11px] text-gray-300 mt-1">Auto-suggested from tag name</p>
          </Field>

          {/* Interval */}
          <Field label="Sampling interval">
            <div className="flex gap-1.5">
              {[100, 500, 1000, 5000].map(ms => (
                <button key={ms} type="button" onClick={() => setInterval(ms)}
                  className={cn('flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-colors', interval === ms ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200')}>
                  {ms}ms
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!topic.trim() || !brokerId || createTag.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-30">
            <Rss className="w-3.5 h-3.5" /> {createTag.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tag Browser ──────────────────────────────────────────────────────

export function EthernetIpTagBrowser({ connection, onBack }: { connection: EthipConnection; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [subscribeTag, setSubscribeTag] = useState<EthipDiscoveredTag | null>(null);
  const [showSubs, setShowSubs] = useState(false);
  const queryClient = useQueryClient();

  const { data: discoveredTags = [], isLoading, isFetching } = useEthipDiscoverTags(connection.id);
  const { data: subscribedTags = [] } = useEthipSubscribedTags(connection.id);
  const deleteTag = useDeleteEthipTag();

  const subscribedNames = useMemo(() => new Set(subscribedTags.map(t => t.tagName)), [subscribedTags]);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return discoveredTags;
    const q = search.toLowerCase();
    return discoveredTags.filter(t =>
      t.tag_name.toLowerCase().includes(q) || t.data_type.toLowerCase().includes(q)
    );
  }, [discoveredTags, search]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ethip-discover-tags', connection.id] });
  };

  return (
    <div className="space-y-4">
      {subscribeTag && <SubscribeModal tag={subscribeTag} connectionId={connection.id} onClose={() => setSubscribeTag(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900">Tag Browser — {connection.name}</h3>
          <p className="text-[11px] text-gray-400 font-mono truncate">{connection.host} &middot; Slot {connection.slot}</p>
        </div>
        <button onClick={handleRefresh} disabled={isFetching}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors bg-gray-50 text-gray-400 hover:text-gray-500', isFetching && 'opacity-50')}>
          <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} /> Refresh
        </button>
        <button onClick={() => setShowSubs(!showSubs)}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors', showSubs ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400 hover:text-gray-500')}>
          <Rss className="w-3 h-3" /> Subscriptions ({subscribedTags.length})
        </button>
      </div>

      {/* Subscriptions panel */}
      {showSubs && (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><p className="text-[12px] font-semibold text-gray-900">Subscribed tags</p></div>
          {subscribedTags.length === 0 ? (
            <div className="px-5 py-4 text-[12px] text-gray-400">No tags subscribed yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {subscribedTags.map(sub => (
                <div key={sub.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-gray-600 truncate">{sub.tagName}</p>
                    <p className="text-[11px] text-gray-400 truncate">→ {sub.mqttTopic}</p>
                  </div>
                  <span className="text-[10px] text-gray-300 shrink-0">{sub.samplingIntervalMs}ms</span>
                  <button onClick={() => deleteTag.mutate(sub.id)} className="p-1 text-red-300 hover:text-red-500 transition-colors shrink-0"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by tag name or data type..."
          className="w-full pl-9 pr-8 py-2 text-[13px] bg-gray-50 border border-gray-100 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3 h-3" /></button>}
      </div>

      {/* Tag list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
      ) : filteredTags.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">{search ? `No tags for "${search}"` : 'No tags discovered'}</p>
          <p className="text-[12px] text-gray-300 mt-1">{search ? 'Try a different search term' : 'Click Refresh to scan the PLC for tags'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            <span>Tag Name</span><span>Data Type</span><span>Dim</span><span className="w-8" />
          </div>
          <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
            {filteredTags.map((tag, i) => {
              const subscribed = subscribedNames.has(tag.tag_name);
              return (
                <div key={i} className={cn('grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-5 py-2 hover:bg-gray-50/50 transition-colors', subscribed && 'bg-blue-50/30')}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', subscribed ? 'bg-blue-400' : 'bg-gray-300')} />
                    <span className="text-[12px] font-medium text-gray-900 font-mono truncate">{tag.tag_name}</span>
                    {subscribed && <Rss className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{tag.data_type}</span>
                  <span className="text-[11px] font-mono text-gray-400 w-8 text-center shrink-0">{tag.dim > 0 ? tag.dim : '-'}</span>
                  <div className="w-8 shrink-0">
                    <button onClick={() => setSubscribeTag(tag)} className={cn('p-1.5 rounded-lg transition-colors', subscribed ? 'text-blue-400 hover:bg-blue-50' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50')}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && <p className="text-[11px] text-gray-300 text-right">{filteredTags.length} tag(s){search && ` (filtered from ${discoveredTags.length})`}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
