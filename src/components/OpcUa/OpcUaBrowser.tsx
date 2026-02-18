import { useState } from 'react';
import { ArrowLeft, Folder, FileText, Loader2, Plus, ChevronRight } from 'lucide-react';
import { useOpcUaBrowse, useCreateOpcUaSubscription } from '../../hooks/useOpcUa';
import { OpcUaConnection } from '../../types';

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

export function OpcUaBrowser({ connection, onBack }: OpcUaBrowserProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(undefined);
  const [path, setPath] = useState<{ nodeId?: string; name: string }[]>([{ name: 'Root' }]);
  const [subscribeTopic, setSubscribeTopic] = useState('');
  const [subscribeNodeId, setSubscribeNodeId] = useState<string | null>(null);

  const { data: nodes, isLoading } = useOpcUaBrowse(connection.id, currentNodeId);
  const createSubMutation = useCreateOpcUaSubscription();

  const handleNavigate = (node: BrowseNode) => {
    if (node.nodeClass === 'Object' || node.nodeClass === '1') {
      setCurrentNodeId(node.nodeId);
      setPath([...path, { nodeId: node.nodeId, name: node.displayName }]);
    }
  };

  const handleBreadcrumb = (index: number) => {
    const target = path[index];
    setCurrentNodeId(target.nodeId);
    setPath(path.slice(0, index + 1));
  };

  const handleSubscribe = async (nodeId: string) => {
    if (!subscribeTopic) return;
    try {
      await createSubMutation.mutateAsync({
        connectionId: connection.id,
        nodeId,
        mqttTopic: subscribeTopic,
      });
      setSubscribeNodeId(null);
      setSubscribeTopic('');
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-semibold text-gray-900">Browse: {connection.name}</h3>
          <p className="text-sm text-gray-500">{connection.endpointUrl}</p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto">
        {path.map((p, i) => (
          <div key={i} className="flex items-center gap-1 whitespace-nowrap">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <button
              onClick={() => handleBreadcrumb(i)}
              className={`hover:text-primary-600 ${i === path.length - 1 ? 'text-gray-900 font-medium' : ''}`}
            >
              {p.name}
            </button>
          </div>
        ))}
      </div>

      {/* Node List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {(nodes as BrowseNode[] || []).length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Nenhum nó encontrado
            </div>
          ) : (
            (nodes as BrowseNode[]).map((node, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <button
                  onClick={() => handleNavigate(node)}
                  className="flex items-center gap-2 text-left flex-1"
                >
                  {node.nodeClass === 'Object' || node.nodeClass === '1' ? (
                    <Folder className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900">{node.displayName}</span>
                    <span className="text-xs text-gray-400 ml-2">{node.nodeId}</span>
                  </div>
                </button>

                {node.nodeClass === 'Variable' || node.nodeClass === '2' ? (
                  subscribeNodeId === node.nodeId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subscribeTopic}
                        onChange={(e) => setSubscribeTopic(e.target.value)}
                        placeholder="mqtt/topic/path"
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-48 focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSubscribe(node.nodeId)}
                        disabled={!subscribeTopic || createSubMutation.isPending}
                        className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setSubscribeNodeId(null); setSubscribeTopic(''); }}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubscribeNodeId(node.nodeId)}
                      className="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                      title="Criar subscription"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
