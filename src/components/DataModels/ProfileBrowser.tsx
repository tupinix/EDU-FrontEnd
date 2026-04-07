import { useState, useMemo } from 'react';
import { X, Search, ChevronRight, Loader2, Database } from 'lucide-react';
import { useSmProfiles, useSmProfile } from '../../hooks/useSmProfiles';
import { SmProfile } from '../../types';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onSelect: (profile: SmProfile) => void;
}

export function ProfileBrowser({ onClose, onSelect }: Props) {
  const { data: profiles, isLoading, error } = useSmProfiles();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group profiles by category
  const grouped = useMemo(() => {
    if (!profiles) return {};
    const q = search.toLowerCase().trim();
    const filtered = q
      ? (profiles as SmProfile[]).filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        )
      : (profiles as SmProfile[]);

    const groups: Record<string, SmProfile[]> = {};
    for (const p of filtered) {
      const cat = p.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [profiles, search]);

  const categories = Object.keys(grouped).sort();

  // Fetch full profile with attributes when selected
  const { data: selectedProfile, isLoading: isLoadingProfile } = useSmProfile(selectedId);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-500" />
              <h3 className="text-[15px] font-semibold text-gray-900">Select SM Profile</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search profiles..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-100 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-200 transition-all"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Left: Profile list */}
          <div className="md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-gray-100 overflow-auto shrink-0 max-h-[35vh] md:max-h-none">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            )}
            {error && (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] text-red-400">Failed to load profiles</p>
                <p className="text-[11px] text-gray-300 mt-1">{(error as Error).message}</p>
              </div>
            )}
            {!isLoading && !error && categories.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-gray-400">No profiles found</p>
                <p className="text-[11px] text-gray-300 mt-1">
                  {search ? 'Try a different search term' : 'No SM profiles available'}
                </p>
              </div>
            )}
            {categories.map((cat) => {
              const isCollapsed = collapsedCategories.has(cat);
              const items = grouped[cat];
              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        'w-3 h-3 text-gray-300 transition-transform shrink-0',
                        !isCollapsed && 'rotate-90'
                      )}
                    />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                      {cat}
                    </span>
                    <span className="text-[10px] text-gray-300 ml-auto shrink-0">{items.length}</span>
                  </button>
                  {!isCollapsed &&
                    items.map((profile) => {
                      const isSelected = selectedId === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => setSelectedId(profile.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-4 pl-9 py-2 text-left transition-colors',
                            isSelected
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <span className="text-[12px] font-medium truncate flex-1">{profile.name}</span>
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                              isSelected
                                ? 'bg-white/20 text-white/80'
                                : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            {profile.attributeCount ?? profile.attributes?.length ?? 0}
                          </span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 overflow-auto">
            {!selectedId ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center">
                  <Database className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[13px] text-gray-400">Select a profile to preview</p>
                  <p className="text-[11px] text-gray-300 mt-1">
                    Browse CESMII SM profiles to use as a template
                  </p>
                </div>
              </div>
            ) : isLoadingProfile ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
              </div>
            ) : !selectedProfile ? (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-[13px] text-gray-400">Profile not found</p>
              </div>
            ) : (
              <div className="px-5 py-4">
                {/* Profile header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[15px] font-semibold text-gray-900">{selectedProfile.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                      {selectedProfile.source}
                    </span>
                  </div>
                  {selectedProfile.description && (
                    <p className="text-[12px] text-gray-400 leading-relaxed">
                      {selectedProfile.description}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-300 mt-1">
                    Category: {selectedProfile.category}
                  </p>
                </div>

                {/* Attributes table */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Attributes ({selectedProfile.attributes?.length ?? 0})
                    </p>
                  </div>
                  {(!selectedProfile.attributes || selectedProfile.attributes.length === 0) ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-[12px] text-gray-300">No attributes defined</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Table header */}
                      <div className="grid grid-cols-3 gap-3 px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Name</span>
                        <span>Data Type</span>
                        <span>Unit</span>
                      </div>
                      {selectedProfile.attributes.map((attr, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-3 gap-3 px-4 py-2 text-[12px] hover:bg-white transition-colors"
                        >
                          <span className="font-mono text-gray-700 truncate" title={attr.displayName || attr.name}>
                            {attr.name}
                          </span>
                          <span className="text-gray-500 truncate">{attr.dataType}</span>
                          <span className="text-gray-400 truncate">{attr.unit || '--'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-[13px] font-medium text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedProfile) onSelect(selectedProfile);
            }}
            disabled={!selectedProfile}
            className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Use This Profile
          </button>
        </div>
      </div>
    </div>
  );
}
