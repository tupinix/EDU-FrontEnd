import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Folder, Tag, Loader2, Plus, ChevronRight,
  Search, X, Radio, Copy, Check, Eye, EyeOff, Rss,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOpcUaBrowse, useCreateOpcUaSubscription, useOpcUaSubscriptions, useDeleteOpcUaSubscription } from '../../hooks/useOpcUa';
import { useQuery } from '@tanstack/react-query';
import { OpcUaConnection, BrokerConfig } from '../../types';
import apiClient from '../../services/api';

interface OpcUaBrowserProps {
  connection: OpcUaConnection;
  onBack: () => void;
}

interface BrowseNode {
  nodeId: string;
  browseName: string;
  displayName: string;
  nodeClass: string;
  isForward: boolean;
}

function isObject(n: BrowseNode) {
  return n.nodeClass === 'Object' || n.nodeClass === '1';
}
function isVariable(n: BrowseNode) {
  return n.nodeClass === 'Variable' || n.nodeClass === '2';
}

function nodeClassBadge(nodeClass: string) {
  if (nodeClass === 'Object' || nodeClass === '1')
    return <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-mono">Object</span>;
  if (nodeClass === 'Variable' || nodeClass === '2')
    return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">Variable</span>;
  if (nodeClass === 'Method' || nodeClass === '4')
    return <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">Method</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">{nodeClass}</span>;
}

// Build auto-suggested MQTT topic from breadcrumb path + node name
function suggestTopic(path: { name: string }[], nodeName: string): string {
  const parts = path
    .slice(1) // skip 'Root'
    .map((p) => p.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
    .filter(Boolean);
  const tag = nodeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return [...parts, tag].join('/');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
      title="Copiar NodeID"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// Modal to create a subscription with broker selection + preview
interface SubscribeModalProps {
  node: BrowseNode;
  connectionId: string;
  path: { name: string }[];
  onClose: () => void;
}

function SubscribeModal({ node, connectionId, path, onClose }: SubscribeModalProps) {
  const createSub = useCreateOpcUaSubscription();
  const [topic, setTopic] = useState(() => suggestTopic(path, node.displayName));
  const [interval, setInterval] = useState(1000);
  const [showPreview, setShowPreview] = useState(false);
  const [brokerId, setBrokerId] = useState<string>('');

  // Load configured brokers
  const { data: brokersRaw } = useQuery<{ success: boolean; data?: BrokerConfig[] }>({
    queryKey: ['brokers-list-modal'],
    queryFn: async () => {
      const { data } = await apiClient.get('/brokers');
      return data;
    },
    staleTime: 15000,
  });
  const brokers: BrokerConfig[] = brokersRaw?.data ?? [];

  const selectedBroker = brokers.find((b) => b.id === brokerId);

  const payloadPreview = JSON.stringify(
    { nodeId: node.nodeId, topic, value: '<live>', timestamp: new Date().toISOString() },
    null,
    2
  );

  const handleSave = async () => {
    if (!topic.trim()) return;
    try {
      await createSub.mutateAsync({
        connectionId,
        nodeId: node.nodeId,
        mqttTopic: topic.trim(),
        samplingIntervalMs: interval,
        brokerId: brokerId || undefined,
      });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Publicar no MQTT
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Node info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tag</span>
              {nodeClassBadge(node.nodeClass)}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{node.displayName}</p>
            <p className="text-xs font-mono text-gray-500 break-all">{node.nodeId}</p>
          </div>

          {/* Broker selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Broker MQTT *
            </label>
            {brokers.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Nenhum broker configurado. Adicione um broker em Configuração → MQTT Brokers.
              </p>
            ) : (
              <select
                value={brokerId}
                onChange={(e) => setBrokerId(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">— Selecione um broker —</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.host}:{b.port}){b.status === 'connected' ? ' ✓' : ' ✗'}
                  </option>
                ))}
              </select>
            )}
            {selectedBroker && (
              <p className={clsx(
                'text-xs mt-1',
                selectedBroker.status === 'connected' ? 'text-green-600' : 'text-red-500'
              )}>
                {selectedBroker.status === 'connected'
                  ? '● Broker conectado — publicação ativa'
                  : '● Broker desconectado — conecte o broker antes de publicar'}
              </p>
            )}
          </div>

          {/* MQTT topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tópico MQTT *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input w-full font-mono text-sm"
              placeholder="planta/setor/equipamento/tag"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Sugerido com base no caminho navegado</p>
          </div>

          {/* Sampling interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Intervalo de amostragem (ms)
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="input w-full"
            >
              <option value={100}>100 ms (10 Hz)</option>
              <option value={500}>500 ms (2 Hz)</option>
              <option value={1000}>1000 ms (1 Hz)</option>
              <option value={5000}>5000 ms (0.2 Hz)</option>
              <option value={10000}>10000 ms (0.1 Hz)</option>
            </select>
          </div>

          {/* Payload preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Ocultar preview do payload' : 'Ver preview do payload MQTT'}
            </button>
            {showPreview && (
              <pre className="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto font-mono">
                {payloadPreview}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary text-sm">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!topic.trim() || !brokerId || createSub.isPending}
            className="btn btn-primary text-sm flex items-center gap-1.5"
          >
            <Rss className="w-3.5 h-3.5" />
            {createSub.isPending ? 'Publicando...' : 'Ativar Publicação'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OpcUaBrowser({ connection, onBack }: OpcUaBrowserProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(undefined);
  const [path, setPath] = useState<{ nodeId?: string; name: string }[]>([{ name: 'Root' }]);
  const [search, setSearch] = useState('');
  const [subscribeNode, setSubscribeNode] = useState<BrowseNode | null>(null);
  const [showSubs, setShowSubs] = useState(false);

  const { data: nodes = [], isLoading } = useOpcUaBrowse(connection.id, currentNodeId);
  const { data: allSubs = [] } = useOpcUaSubscriptions(connection.id);
  const deleteSub = useDeleteOpcUaSubscription();

  const handleNavigate = (node: BrowseNode) => {
    if (isObject(node)) {
      setCurrentNodeId(node.nodeId);
      setPath([...path, { nodeId: node.nodeId, name: node.displayName }]);
      setSearch('');
    }
  };

  const handleBreadcrumb = (index: number) => {
    const target = path[index];
    setCurrentNodeId(target.nodeId);
    setPath(path.slice(0, index + 1));
    setSearch('');
  };

  const filteredNodes = useMemo(() => {
    const list = nodes as BrowseNode[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (n) =>
        n.displayName.toLowerCase().includes(q) ||
        n.nodeId.toLowerCase().includes(q) ||
        n.browseName.toLowerCase().includes(q)
    );
  }, [nodes, search]);

  // Check which nodeIds are already subscribed
  const subscribedNodeIds = new Set(allSubs.map((s) => s.nodeId));

  return (
    <div className="space-y-4">
      {/* Subscription modal */}
      {subscribeNode && (
        <SubscribeModal
          node={subscribeNode}
          connectionId={connection.id}
          path={path}
          onClose={() => setSubscribeNode(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Browse: {connection.name}</h3>
          <p className="text-xs text-gray-500 font-mono truncate">{connection.endpointUrl}</p>
        </div>
        <button
          onClick={() => setShowSubs(!showSubs)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            showSubs
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Rss className="w-3.5 h-3.5" />
          Subscriptions ({allSubs.length})
        </button>
      </div>

      {/* Subscriptions panel */}
      {showSubs && (
        <div className="border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
            Publicações ativas nesta conexão
          </p>
          {allSubs.length === 0 ? (
            <p className="text-xs text-blue-600">Nenhuma subscription configurada</p>
          ) : (
            <div className="space-y-1">
              {allSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{sub.nodeId}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">→ {sub.mqttTopic}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-400">{sub.samplingIntervalMs}ms</span>
                    <button
                      onClick={() => deleteSub.mutate(sub.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto pb-1">
        {path.map((p, i) => (
          <div key={i} className="flex items-center gap-1 whitespace-nowrap">
            {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            <button
              onClick={() => handleBreadcrumb(i)}
              className={clsx(
                'hover:text-blue-600 transition-colors',
                i === path.length - 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : ''
              )}
            >
              {p.name}
            </button>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nome ou NodeID..."
          className="input w-full pl-9 pr-8 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Node list */}
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          {search ? `Nenhum nó encontrado para "${search}"` : 'Nenhum nó encontrado'}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome / NodeID</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-8" />
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNodes.map((node, i) => {
              const alreadySubscribed = subscribedNodeIds.has(node.nodeId);
              return (
                <div
                  key={i}
                  className={clsx(
                    'grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors',
                    alreadySubscribed && 'bg-blue-50/50 dark:bg-blue-950/30'
                  )}
                >
                  {/* Name + NodeID */}
                  <button
                    onClick={() => handleNavigate(node)}
                    className={clsx(
                      'flex items-center gap-2 text-left min-w-0',
                      isObject(node) ? 'cursor-pointer' : 'cursor-default'
                    )}
                  >
                    {isObject(node) ? (
                      <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <Tag className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {node.displayName}
                        </span>
                        {alreadySubscribed && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 flex-shrink-0">
                            <Rss className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-mono text-gray-400 truncate">{node.nodeId}</span>
                        <CopyButton text={node.nodeId} />
                      </div>
                    </div>
                  </button>

                  {/* Type badge */}
                  <div className="flex-shrink-0">{nodeClassBadge(node.nodeClass)}</div>

                  {/* Subscribe action */}
                  <div className="w-8 flex-shrink-0">
                    {isVariable(node) && (
                      <button
                        onClick={() => setSubscribeNode(node)}
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          alreadySubscribed
                            ? 'text-blue-500 hover:bg-blue-100'
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        )}
                        title={alreadySubscribed ? 'Já publicado (adicionar outro)' : 'Publicar no MQTT'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer count */}
      {!isLoading && (
        <p className="text-xs text-gray-400 text-right">
          {filteredNodes.length} {filteredNodes.length === 1 ? 'nó' : 'nós'}
          {search && ` (filtrado de ${(nodes as BrowseNode[]).length})`}
        </p>
      )}
    </div>
  );
}
