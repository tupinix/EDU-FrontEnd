import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Network,
  RefreshCw,
  Maximize2,
  Minimize2,
  Info,
  ServerOff,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTopicTree } from '../hooks/useTopics';
import { useActiveBroker } from '../hooks/useMetrics';
import { TopicGraph, GraphLegend, NodeDetails } from '../components/Discovery';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

interface GraphNode {
  id: string;
  name: string;
  fullPath: string;
  level: number;
  levelName: string;
  children: number;
  messageCount: number;
}

export function Discovery() {
  const { t } = useTranslation();
  const { data: activeBroker } = useActiveBroker();
  const { data: topics, isLoading, refetch } = useTopicTree();
  const queryClient = useQueryClient();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if there's an active and connected broker
  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['topics-tree'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    refetch();
  }, [queryClient, refetch]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // No active broker state
  if (!hasActiveBroker) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Network className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('discovery.title')}</h1>
              <p className="text-sm text-gray-500">{t('discovery.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* No Broker Message */}
        <div className="card h-[calc(100%-4rem)] flex items-center justify-center">
          <div className="text-center p-8">
            <ServerOff className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-2">{t('discovery.noBroker')}</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {t('discovery.noBrokerDesc')}
            </p>
            <Link to="/configuration" className="btn btn-primary">
              {t('dashboard.configureBrokers')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'flex flex-col',
      isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 p-4' : 'h-[calc(100vh-8rem)]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Network className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('discovery.title')}</h1>
            <p className="text-sm text-gray-500">
              {t('discovery.subtitle')}
              {activeBroker && (
                <span className="ml-2 text-primary-600">
                  ({activeBroker.name})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={clsx(
              'btn btn-sm',
              showLegend ? 'btn-primary' : 'btn-secondary'
            )}
            title={showLegend ? t('discovery.hideLegend') : t('discovery.showLegend')}
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary btn-sm"
            title={isFullscreen ? t('discovery.exitFullscreen') : t('discovery.fullscreen')}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">{t('discovery.loading')}</p>
            </div>
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="h-full rounded-xl overflow-hidden shadow-lg">
            <TopicGraph
              topics={topics}
              onNodeClick={handleNodeClick}
            />

            {/* Legend overlay */}
            {showLegend && (
              <div className="absolute top-4 right-4">
                <GraphLegend />
              </div>
            )}

            {/* Node details panel */}
            {selectedNode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <NodeDetails
                  node={selectedNode}
                  onClose={handleCloseDetails}
                />
              </div>
            )}

            {/* Help hint */}
            {!selectedNode && (
              <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm text-gray-300 text-sm px-3 py-2 rounded-lg">
                {t('discovery.clickNodeHint')}
              </div>
            )}
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center p-8">
              <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="font-semibold text-gray-700 mb-2">{t('discovery.noData')}</h3>
              <p className="text-gray-500 mb-4">
                {t('discovery.noDataDesc')}
              </p>
              <button
                onClick={handleRefresh}
                className="btn btn-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
