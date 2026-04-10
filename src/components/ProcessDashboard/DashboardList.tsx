import { useState } from 'react';
import { Plus, ExternalLink, Copy, Trash2, Loader2, LayoutGrid, Share2, Check } from 'lucide-react';
import { useDashboards, useCreateDashboard, useDeleteDashboard, useDuplicateDashboard } from '../../hooks/useDashboards';
import { dashboardsApi } from '../../services/api';
import { ProcessDashboard } from '../../types';

interface Props {
  onOpen: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function DashboardList({ onOpen }: Props) {
  const { data: dashboards, isLoading, error } = useDashboards();
  const createMutation = useCreateDashboard();
  const deleteMutation = useDeleteDashboard();
  const duplicateMutation = useDuplicateDashboard();

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync({
        name: 'New Dashboard',
        description: '',
        canvasWidth: 1920,
        canvasHeight: 1080,
        backgroundColor: '#1a1a2e',
        widgets: [],
        isDefault: false,
      });
      if (result?.id) onOpen(result.id);
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this dashboard?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // handled
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
    } catch {
      // handled
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500">
        Failed to load dashboards: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Process Dashboards</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Build SCADA-like views with live data widgets</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          New Dashboard
        </button>
      </div>

      {(!dashboards || dashboards.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-[14px] text-gray-400">No dashboards yet</p>
          <p className="text-[12px] text-gray-300 mt-1">Create a dashboard to build custom process views</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden divide-y divide-gray-50">
          {dashboards.map((dashboard: ProcessDashboard) => (
            <div key={dashboard.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-gray-900">{dashboard.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {dashboard.description && (
                    <span className="text-[12px] text-gray-400 truncate max-w-xs">{dashboard.description}</span>
                  )}
                  <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
                    {dashboard.canvasWidth}x{dashboard.canvasHeight}
                  </span>
                  <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
                    {dashboard.widgets?.length ?? 0} widgets
                  </span>
                  <span className="text-[11px] text-gray-300">
                    {formatDate(dashboard.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpen(dashboard.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </button>
                <button
                  onClick={() => handleDuplicate(dashboard.id)}
                  disabled={duplicateMutation.isPending}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <ShareButton dashboardId={dashboard.id} />
                <button
                  onClick={() => handleDelete(dashboard.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareButton({ dashboardId }: { dashboardId: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const result = await dashboardsApi.share(dashboardId);
      const shareUrl = `${window.location.origin}/view/${result.shareToken}`;
      // Try clipboard API first, fallback to textarea method
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
      title={copied ? 'Link copied!' : 'Share link'}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
