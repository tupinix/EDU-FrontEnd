import { useState } from 'react';
import { X, Loader2, FileCode, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { smProfilesApi } from '../../services/api';
import { SmProfile } from '../../types';
import { cn } from '@/lib/utils';

interface SmProfileSummary {
  id: string;
  name: string;
  namespace: string;
  source: string;
  version: string;
  description: string;
  fieldCount: number;
}

interface SmProfileFull {
  id: string;
  name: string;
  namespace: string;
  source: string;
  version: string;
  description: string;
  fields: { name: string; displayName: string; dataType: string; description: string; required: boolean; example?: unknown }[];
}

interface Props {
  onClose: () => void;
  onSelect: (profile: SmProfile) => void;
}

export function SmProfileBrowser({ onClose, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery<SmProfileSummary[]>({
    queryKey: ['sm-profiles-list'],
    queryFn: smProfilesApi.getAll,
    staleTime: 300000,
  });

  const { data: selectedProfile, isLoading: isLoadingDetail } = useQuery<SmProfileFull>({
    queryKey: ['sm-profile-detail', selectedId],
    queryFn: () => smProfilesApi.getById(selectedId!),
    enabled: !!selectedId,
    staleTime: 300000,
  });

  const handleUseProfile = () => {
    if (!selectedProfile) return;
    // Convert SM Profile fields to SmProfile format (same as templates)
    const asSmProfile: SmProfile = {
      id: selectedProfile.id,
      name: selectedProfile.name,
      category: selectedProfile.source,
      description: selectedProfile.description,
      source: `OPC-UA (${selectedProfile.version})`,
      attributes: selectedProfile.fields.map(f => ({
        name: f.name,
        displayName: f.displayName,
        dataType: f.dataType,
        unit: undefined,
        description: f.description,
      })),
    };
    onSelect(asSmProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-blue-500" />
              <h3 className="text-[15px] font-semibold text-gray-900">SM Profiles — OPC-UA / CESMII</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Official profiles from OPC-UA Companion Specifications</p>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Left: Profile list */}
          <div className="md:w-72 border-b md:border-b-0 md:border-r border-gray-100 overflow-auto shrink-0 max-h-[30vh] md:max-h-none">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            ) : !profiles?.length ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-gray-400">No SM Profiles available</p>
              </div>
            ) : (
              <div className="py-1">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors',
                      selectedId === p.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium truncate flex-1">{p.name}</span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full shrink-0',
                        selectedId === p.id ? 'bg-white/20 text-white/80' : 'bg-blue-50 text-blue-500'
                      )}>
                        {p.fieldCount}
                      </span>
                    </div>
                    <p className={cn('text-[10px] truncate mt-0.5', selectedId === p.id ? 'text-white/50' : 'text-gray-400')}>
                      {p.source} v{p.version}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Detail */}
          <div className="flex-1 overflow-auto">
            {!selectedId ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center">
                  <FileCode className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[13px] text-gray-400">Select a profile to preview</p>
                </div>
              </div>
            ) : isLoadingDetail ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            ) : !selectedProfile ? (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-[13px] text-gray-400">Profile not found</p>
              </div>
            ) : (
              <div className="px-5 py-4">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[15px] font-semibold text-gray-900">{selectedProfile.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                      {selectedProfile.source}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400 leading-relaxed">{selectedProfile.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-300 font-mono truncate">{selectedProfile.namespace}</span>
                    <a href={selectedProfile.namespace} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Fields table */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Fields ({selectedProfile.fields.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-[1fr_100px_60px] gap-2 px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Name</span>
                      <span>Data Type</span>
                      <span>Required</span>
                    </div>
                    {selectedProfile.fields.map((field, i) => (
                      <div key={i} className="grid grid-cols-[1fr_100px_60px] gap-2 px-4 py-2 text-[12px] hover:bg-white transition-colors">
                        <div>
                          <span className="font-mono text-gray-700">{field.name}</span>
                          {field.description && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={field.description}>{field.description}</p>
                          )}
                        </div>
                        <span className="text-gray-500 text-[11px]">{field.dataType}</span>
                        <span className={cn('text-[10px] font-medium', field.required ? 'text-emerald-500' : 'text-gray-300')}>
                          {field.required ? 'Yes' : 'No'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example */}
                {selectedProfile.fields.some(f => f.example !== undefined) && (
                  <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Example Payload</p>
                    </div>
                    <pre className="px-4 py-3 text-[11px] font-mono text-gray-600 overflow-x-auto">
                      {JSON.stringify(
                        Object.fromEntries(selectedProfile.fields.filter(f => f.example !== undefined).map(f => [f.name, f.example])),
                        null, 2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-3.5 py-2 text-[13px] font-medium text-gray-400 hover:text-gray-600 rounded-xl transition-colors">Cancel</button>
          <button
            onClick={handleUseProfile}
            disabled={!selectedProfile}
            className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            Use This Profile
          </button>
        </div>
      </div>
    </div>
  );
}
