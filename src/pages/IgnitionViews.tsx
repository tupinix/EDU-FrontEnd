import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ExternalLink, Loader2, RefreshCw, X, ArrowLeft, Copy, Check } from 'lucide-react';
import { ignitionApi } from '../services/api';
import { PerspectiveViewMeta } from '../types';
import { cn } from '@/lib/utils';

export function IgnitionViews() {
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list');
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['ignition-status'],
    queryFn: ignitionApi.getStatus,
    refetchInterval: 30000,
  });

  const { data: views, isLoading: viewsLoading, error: viewsError } = useQuery({
    queryKey: ['ignition-views'],
    queryFn: ignitionApi.getViews,
  });

  const { data: viewDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['ignition-view', selectedView],
    queryFn: () => selectedView ? ignitionApi.getView(selectedView) : null,
    enabled: !!selectedView,
  });

  const deleteMutation = useMutation({
    mutationFn: ignitionApi.deleteView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ignition-views'] });
      setSelectedView(null);
      setMobilePanel('list');
    },
  });

  const gatewayOnline = status?.running ?? false;

  const handleSelect = (path: string) => {
    setSelectedView(path);
    setMobilePanel('detail');
  };

  const handleCopyJson = async () => {
    if (!viewDetail?.viewJson) return;
    await navigator.clipboard.writeText(JSON.stringify(viewDetail.viewJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            Ignition Perspective
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              statusLoading ? 'bg-gray-300 animate-pulse' : gatewayOnline ? 'bg-emerald-400' : 'bg-red-400'
            )} />
            <span className="text-[12px] sm:text-[13px] text-gray-400">
              {statusLoading ? 'Checking...' : gatewayOnline ? 'Gateway online' : 'Gateway offline'}
              <span className="hidden sm:inline"> &middot; {status?.projectName || 'EDU'}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['ignition-views'] })}
            className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={`http://localhost:8088/data/perspective/client/${status?.projectName || 'EDU'}/view/Overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Perspective</span>
            <span className="sm:hidden">Open</span>
          </a>
        </div>
      </div>

      {/* Mobile panel switcher */}
      {selectedView && (
        <div className="flex lg:hidden mb-3 shrink-0">
          <button
            onClick={() => setMobilePanel('list')}
            className={cn(
              'flex-1 py-2 text-[13px] font-medium rounded-l-lg border transition-colors',
              mobilePanel === 'list' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            Views
          </button>
          <button
            onClick={() => setMobilePanel('detail')}
            className={cn(
              'flex-1 py-2 text-[13px] font-medium rounded-r-lg border border-l-0 transition-colors',
              mobilePanel === 'detail' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            Preview
          </button>
        </div>
      )}

      {/* Panels */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left — Views list */}
        <div className={cn(
          'bg-white rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden',
          'w-full lg:w-[320px] lg:shrink-0',
          selectedView && mobilePanel === 'detail' ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-gray-900">
              Views
              {views && <span className="text-gray-300 font-normal ml-1.5">{views.length}</span>}
            </h3>
            <a
              href="http://localhost:8088"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
            >
              Gateway
            </a>
          </div>

          <div className="flex-1 overflow-auto">
            {viewsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            ) : viewsError ? (
              <div className="p-6 text-center">
                <p className="text-[13px] text-red-400">Failed to load views</p>
              </div>
            ) : !views?.length ? (
              <div className="p-8 text-center">
                <p className="text-[13px] text-gray-400">No views yet</p>
                <p className="text-[12px] text-gray-300 mt-1">Use Claude MCP to create views</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {views.map((view: PerspectiveViewMeta) => {
                  const isSelected = selectedView === view.viewPath;
                  return (
                    <button
                      key={view.viewPath}
                      onClick={() => handleSelect(view.viewPath)}
                      className={cn(
                        'w-full text-left px-5 py-3.5 transition-colors',
                        isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                      )}
                    >
                      <p className={cn(
                        'text-[13px] font-medium truncate',
                        isSelected ? 'text-white' : 'text-gray-900'
                      )}>
                        {view.title || view.viewPath}
                      </p>
                      <p className={cn(
                        'text-[11px] font-mono truncate mt-0.5',
                        isSelected ? 'text-white/40' : 'text-gray-400'
                      )}>
                        {view.viewPath}
                      </p>
                      {view.tags && view.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {view.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded',
                                isSelected ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Preview */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          !selectedView || mobilePanel === 'list' ? 'hidden lg:flex' : 'flex'
        )}>
          {selectedView ? (
            <>
              {/* Mobile back */}
              <button
                onClick={() => setMobilePanel('list')}
                className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 lg:hidden shrink-0 mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to views
              </button>

              <div className="bg-white rounded-2xl border border-gray-200/60 flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">
                      {viewDetail?.meta?.title || selectedView}
                    </p>
                    {viewDetail?.meta?.description && (
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">{viewDetail.meta.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-3">
                    <button
                      onClick={handleCopyJson}
                      className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                      title="Copy JSON"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this view?')) deleteMutation.mutate(selectedView);
                      }}
                      className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setSelectedView(null); setMobilePanel('list'); }}
                      className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* JSON */}
                <div className="flex-1 overflow-auto">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                    </div>
                  ) : viewDetail ? (
                    <pre className="p-5 text-[12px] font-mono text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                      {JSON.stringify(viewDetail.viewJson, null, 2)}
                    </pre>
                  ) : (
                    <p className="p-5 text-[13px] text-gray-400">View not found</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] text-gray-400">Select a view to preview</p>
                <p className="text-[12px] text-gray-300 mt-1">JSON will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
