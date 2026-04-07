import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, ArrowRight, Copy } from 'lucide-react';
import { useDataModels, useToggleDataModel, useDeleteDataModel } from '../../hooks/useDataModels';
import { DataModelForm } from './DataModelForm';
import { DataModel } from '../../types';
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

  if (editing.show) {
    return <DataModelForm model={editing.model} onClose={() => setEditing({ show: false, model: null })} />;
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
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500">
        Failed to load data models: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">Transform and enrich MQTT data for the UNS</p>
        <button
          onClick={() => setEditing({ show: true, model: null })}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Model
        </button>
      </div>

      {(!models || models.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No data models configured</p>
          <p className="text-[12px] text-gray-300 mt-1">Create a model to start transforming MQTT data</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden divide-y divide-gray-50">
          {models.map((model: DataModel) => (
            <div key={model.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', model.enabled ? 'bg-emerald-400' : 'bg-gray-300')} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900">{model.name}</p>
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
                <button onClick={() => setEditing({ show: true, model })} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const clone = { ...model, id: undefined, name: `${model.name} (copy)`, messagesProcessed: 0, lastProcessedAt: undefined } as unknown as DataModel;
                    setEditing({ show: true, model: { ...clone, id: '' } });
                  }}
                  className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this data model?')) deleteMutation.mutate(model.id); }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
