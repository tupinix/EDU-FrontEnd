import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, ArrowRight, Copy, Layers, FileCode } from 'lucide-react';
import { useDataModels, useToggleDataModel, useDeleteDataModel } from '../../hooks/useDataModels';
import { DataModelForm } from './DataModelForm';
import { TemplateBrowser } from './TemplateBrowser';
import { SmProfileBrowser } from './SmProfileBrowser';
import { DataModel, SmProfile } from '../../types';
import { cn } from '@/lib/utils';

function formatTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function DataModelList() {
  const { data: models, isLoading, error } = useDataModels();
  const toggleMutation = useToggleDataModel();
  const deleteMutation = useDeleteDataModel();
  const [editing, setEditing] = useState<{ show: boolean; model: DataModel | null }>({ show: false, model: null });
  const [showChoice, setShowChoice] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showSmProfileBrowser, setShowSmProfileBrowser] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SmProfile | null>(null);

  if (editing.show) {
    return (
      <DataModelForm
        model={editing.model}
        profile={selectedProfile}
        onClose={() => { setEditing({ show: false, model: null }); setSelectedProfile(null); }}
      />
    );
  }

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
        Failed to load data models: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowChoice(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Model
        </button>
      </div>

      {(!models || models.length === 0) ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No data models configured</p>
          <p className="text-[12px] text-gray-300 mt-1">Create a model to start transforming MQTT data</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
          {models.map((model: DataModel) => (
            <div key={model.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', model.enabled ? 'bg-emerald-400' : 'bg-gray-300')} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{model.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-gray-400 font-mono truncate max-w-[180px]">{model.sourceTopic}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                    <span className="text-[11px] text-gray-400 font-mono truncate max-w-[180px]">{model.targetTopic}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-300 shrink-0">
                <span className="tabular-nums">{model.messagesProcessed.toLocaleString()} msgs</span>
                <span>{formatTime(model.lastProcessedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-4 sm:ml-0 shrink-0">
                <div
                  onClick={() => toggleMutation.mutate(model.id)}
                  className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', model.enabled ? 'bg-gray-900' : 'bg-gray-200')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', model.enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <button onClick={() => setEditing({ show: true, model })} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const clone = { ...model, id: undefined, name: `${model.name} (copy)`, messagesProcessed: 0, lastProcessedAt: undefined } as unknown as DataModel;
                    setEditing({ show: true, model: { ...clone, id: '' } });
                  }}
                  className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this data model?')) deleteMutation.mutate(model.id); }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Choice modal */}
      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowChoice(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl w-full max-w-md p-6">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Model</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { setShowChoice(false); setSelectedProfile(null); setEditing({ show: true, model: null }); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <Pencil className="w-5 h-5 text-gray-400" />
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Manual</span>
                <span className="text-[9px] text-gray-400 text-center leading-tight">Create from scratch</span>
              </button>
              <button
                onClick={() => { setShowChoice(false); setShowTemplateBrowser(true); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors"
              >
                <Layers className="w-5 h-5 text-emerald-500" />
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Template</span>
                <span className="text-[9px] text-gray-400 text-center leading-tight">Equipment templates</span>
              </button>
              <button
                onClick={() => { setShowChoice(false); setShowSmProfileBrowser(true); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
              >
                <FileCode className="w-5 h-5 text-blue-500" />
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">SM Profile</span>
                <span className="text-[9px] text-gray-400 text-center leading-tight">OPC-UA / CESMII</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template browser */}
      {showTemplateBrowser && (
        <TemplateBrowser
          onClose={() => setShowTemplateBrowser(false)}
          onSelect={(profile) => {
            setShowTemplateBrowser(false);
            setSelectedProfile(profile);
            setEditing({ show: true, model: null });
          }}
        />
      )}

      {/* SM Profile browser */}
      {showSmProfileBrowser && (
        <SmProfileBrowser
          onClose={() => setShowSmProfileBrowser(false)}
          onSelect={(profile) => {
            setShowSmProfileBrowser(false);
            setSelectedProfile(profile);
            setEditing({ show: true, model: null });
          }}
        />
      )}
    </div>
  );
}
