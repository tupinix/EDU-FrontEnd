import { useState } from 'react';
import {
  Plus, ExternalLink, Copy, Trash2, Loader2, LayoutGrid, Share2, Check, X,
  FileText, Sparkles, Factory, Container, Package, Droplets, type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDashboards, useDeleteDashboard, useDuplicateDashboard } from '../../hooks/useDashboards';
import { dashboardsApi } from '../../services/api';
import { ProcessDashboard, DashboardWidget } from '../../types';
import { cn } from '@/lib/utils';

interface Props {
  onOpen: (id: string) => void;
  onOpenDraft: (draft: ProcessDashboard) => void;
}

interface TemplateSummary {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

// Map backend icon names to Lucide components. Fall back to Sparkles.
const TEMPLATE_ICON_MAP: Record<string, LucideIcon> = {
  Factory, Container, Package, Droplets,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function generateId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildDraft(
  overrides: Partial<ProcessDashboard>,
): ProcessDashboard {
  return {
    id: '__draft__',
    userId: '',
    name: 'New Screen',
    description: '',
    canvasWidth: 1920,
    canvasHeight: 1080,
    backgroundColor: '#1a1a2e',
    widgets: [],
    isDefault: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function DashboardList({ onOpen, onOpenDraft }: Props) {
  const { data: dashboards, isLoading, error } = useDashboards();
  const deleteMutation = useDeleteDashboard();
  const duplicateMutation = useDuplicateDashboard();
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this screen?')) return;
    try { await deleteMutation.mutateAsync(id); } catch { /* handled */ }
  };

  const handleDuplicate = async (id: string) => {
    try { await duplicateMutation.mutateAsync(id); } catch { /* handled */ }
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">
        Failed to load screens: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Process Screens</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Build SCADA-like views with live data widgets</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Screen
          </button>
        </div>

        {(!dashboards || dashboards.length === 0) ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
            <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[14px] text-gray-400">No screens yet</p>
            <p className="text-[12px] text-gray-300 mt-1">Click "New Screen" to start from scratch or a template</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
            {dashboards.map((dashboard: ProcessDashboard) => (
              <div key={dashboard.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{dashboard.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {dashboard.description && (
                      <span className="text-[12px] text-gray-400 truncate max-w-xs">{dashboard.description}</span>
                    )}
                    <span className="text-[10px] text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
                      {dashboard.canvasWidth}x{dashboard.canvasHeight}
                    </span>
                    <span className="text-[10px] text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
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
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </button>
                  <button
                    onClick={() => handleDuplicate(dashboard.id)}
                    disabled={duplicateMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <ShareButton dashboardId={dashboard.id} />
                  <button
                    onClick={() => handleDelete(dashboard.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

      {modalOpen && (
        <NewScreenModal
          onClose={() => setModalOpen(false)}
          onChooseBlank={() => {
            setModalOpen(false);
            onOpenDraft(buildDraft({}));
          }}
          onChooseTemplate={async (template) => {
            // Fetch full template (widgets)
            try {
              const full = await dashboardsApi.getTemplate(template.id);
              const widgets: DashboardWidget[] = (full.widgets || []).map((w: Omit<DashboardWidget, 'id'>) => ({
                ...w,
                id: generateId(),
              }));
              setModalOpen(false);
              onOpenDraft(buildDraft({
                name: full.name,
                description: full.description,
                canvasWidth: full.canvasWidth,
                canvasHeight: full.canvasHeight,
                backgroundColor: full.backgroundColor,
                widgets,
              }));
            } catch {
              /* ignore */
            }
          }}
        />
      )}
    </>
  );
}

// ── New Screen Modal ────────────────────────────────────────────────

function NewScreenModal({
  onClose, onChooseBlank, onChooseTemplate,
}: {
  onClose: () => void;
  onChooseBlank: () => void;
  onChooseTemplate: (tpl: TemplateSummary) => void;
}) {
  const [tab, setTab] = useState<'start' | 'templates'>('start');
  const { data: templates, isLoading } = useQuery<TemplateSummary[]>({
    queryKey: ['dashboard-templates'],
    queryFn: dashboardsApi.listTemplates,
    enabled: tab === 'templates',
    staleTime: 60_000,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">New Screen</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Start from scratch or pick a template</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-gray-100 dark:border-gray-800">
          <TabButton active={tab === 'start'} onClick={() => setTab('start')}>
            <FileText className="w-3.5 h-3.5" /> Start
          </TabButton>
          <TabButton active={tab === 'templates'} onClick={() => setTab('templates')}>
            <Sparkles className="w-3.5 h-3.5" /> Templates
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {tab === 'start' && (
            <div>
              <button
                onClick={onChooseBlank}
                className="w-full text-left p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">Blank screen</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Start with an empty canvas — add widgets manually</p>
                  </div>
                </div>
              </button>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                Or switch to <button className="underline hover:text-gray-600" onClick={() => setTab('templates')}>Templates</button> to pick a pre-built screen
              </p>
            </div>
          )}

          {tab === 'templates' && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
              ) : !templates || templates.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">No templates available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((tpl) => {
                    const Icon = TEMPLATE_ICON_MAP[tpl.icon] ?? Sparkles;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => onChooseTemplate(tpl)}
                        className="text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{tpl.name}</p>
                              <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {tpl.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-1 leading-relaxed">{tpl.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Templates come with layout and visuals — you'll link your tags after.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-lg transition-colors',
        active
          ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-white -mb-px'
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
      )}
    >
      {children}
    </button>
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
    } catch { /* ignored */ } finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
      title={copied ? 'Link copied!' : 'Share link'}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
