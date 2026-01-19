import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Loader2, ChevronDown, ChevronUp, ServerOff } from 'lucide-react';
import { useTopicTree, useTopicDetails, useTopicHistory } from '../hooks/useTopics';
import { useActiveBroker } from '../hooks/useMetrics';
import { useUIStore, useExplorerStore } from '../hooks/useStore';
import { TopicTree, TopicDetail, PayloadViewer } from '../components/Explorer';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function Explorer() {
  const { t } = useTranslation();
  const { data: activeBroker } = useActiveBroker();
  const { data: topics, isLoading: isLoadingTree, refetch: refetchTree } = useTopicTree();
  const { selectedTopic } = useUIStore();
  const { searchQuery, setSearchQuery, collapseAll } = useExplorerStore();
  const queryClient = useQueryClient();

  const { data: topicDetail, isLoading: isLoadingDetail, refetch: refetchDetail } = useTopicDetails(selectedTopic);
  const { data: topicHistory } = useTopicHistory(selectedTopic, 50);

  const [showHistory, setShowHistory] = useState(true);

  // Check if there's an active and connected broker
  const hasActiveBroker = activeBroker && activeBroker.status === 'connected';

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['topics-tree'] });
    queryClient.invalidateQueries({ queryKey: ['active-broker'] });
    refetchTree();
  };

  const handleRefreshDetail = () => {
    if (selectedTopic) {
      queryClient.invalidateQueries({ queryKey: ['topic-details', selectedTopic] });
      queryClient.invalidateQueries({ queryKey: ['topic-history', selectedTopic] });
      refetchDetail();
    }
  };

  // Filter topics based on search
  const filteredTopics = topics?.filter((topic) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return topic.fullPath.toLowerCase().includes(searchLower) ||
      topic.name.toLowerCase().includes(searchLower);
  });

  // No active broker state
  if (!hasActiveBroker) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('explorer.title')}</h1>
            <p className="text-gray-500 mt-1">{t('explorer.subtitle')}</p>
          </div>
        </div>

        {/* No Broker Message */}
        <div className="card h-[calc(100%-4rem)] flex items-center justify-center">
          <div className="text-center p-8">
            <ServerOff className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-2">{t('explorer.noBroker')}</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {t('explorer.noBrokerDesc')}
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
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('explorer.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('explorer.subtitle')}
            {activeBroker && (
              <span className="ml-2 text-primary-600">
                ({activeBroker.name})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingTree}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={clsx('w-4 h-4', isLoadingTree && 'animate-spin')} />
          {t('common.refresh')}
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Left Panel - Topic Tree */}
        <div className="w-1/3 card flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('explorer.searchTopics')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{filteredTopics?.length || 0} {t('explorer.topics').toLowerCase()}</span>
              <button
                onClick={() => collapseAll()}
                className="hover:text-gray-700"
              >
                {t('explorer.collapseAll')}
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-auto">
            {isLoadingTree ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            ) : filteredTopics && filteredTopics.length > 0 ? (
              <TopicTree topics={filteredTopics} />
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">{t('explorer.noTopics')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Topic Details */}
        <div className="flex-1 flex flex-col gap-4 overflow-auto">
          {selectedTopic ? (
            <>
              {/* Topic Detail */}
              {isLoadingDetail ? (
                <div className="card p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              ) : topicDetail ? (
                <TopicDetail
                  topic={selectedTopic}
                  detail={topicDetail}
                  isLoading={isLoadingDetail}
                  onRefresh={handleRefreshDetail}
                />
              ) : null}

              {/* Payload Viewer */}
              {topicDetail && (
                <PayloadViewer payload={topicDetail.payload} maxHeight="200px" />
              )}

              {/* History */}
              {topicHistory && topicHistory.length > 0 && (
                <div className="card flex-1 flex flex-col min-h-0">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="card-header flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h4 className="font-medium text-gray-900">{t('explorer.history')} ({topicHistory.length})</h4>
                    {showHistory ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {showHistory && (
                    <div className="flex-1 overflow-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t('explorer.time')}</th>
                            <th>{t('explorer.value')}</th>
                            <th>{t('explorer.qos')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {topicHistory.map((item, index) => (
                            <tr key={`${item.receivedAt}-${index}`}>
                              <td className="text-gray-500">
                                {new Date(item.receivedAt).toLocaleTimeString('pt-BR')}
                              </td>
                              <td className="font-mono text-sm">
                                {formatValue(item.payload)}
                              </td>
                              <td>{item.qos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card flex-1 flex items-center justify-center text-center">
              <div>
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('explorer.selectTopic')}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t('explorer.selectTopicHint')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatValue(payload: unknown): string {
  if (payload === null || payload === undefined) return '-';

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj.value !== undefined) {
      return String(obj.value);
    }
    return JSON.stringify(payload).substring(0, 50) + '...';
  }

  return String(payload);
}
