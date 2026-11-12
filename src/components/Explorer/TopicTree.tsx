import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { TopicNode } from '../../types';
import { useExplorerStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';
import { folderChildren, valueChildren } from './tree';

interface TreeProps {
  nodes: TopicNode[];
  selected: string | null;
  onSelect: (node: TopicNode) => void;
  /** While searching every matching level is shown open. */
  forceOpen?: boolean;
}

function FolderItem({ node, level, selected, onSelect, forceOpen }: TreeProps & { node: TopicNode; level: number }) {
  const { t } = useTranslation();
  const { expandedNodes, toggleNode } = useExplorerStore();
  const folders = folderChildren(node);
  const tags = valueChildren(node).length;
  const isOpen = forceOpen || expandedNodes.has(node.fullPath);
  const isSelected = selected === node.fullPath;

  return (
    <div role="treeitem" aria-expanded={folders.length > 0 ? isOpen : undefined} aria-selected={isSelected}>
      <div
        className={cn(
          'group flex items-center rounded-full pr-2 text-[13px] transition-colors',
          isSelected
            ? 'bg-emerald-50 font-medium text-emerald-950 dark:bg-emerald-900/30 dark:text-emerald-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        )}
        style={{ paddingLeft: `${level * 14 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => toggleNode(node.fullPath)}
          aria-label={isOpen ? t('explorer.collapse') : t('explorer.expand')}
          className={cn('flex h-7 w-6 shrink-0 items-center justify-center rounded-full text-gray-400', folders.length === 0 && 'invisible')}
          tabIndex={folders.length === 0 ? -1 : 0}
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')} />
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect(node);
            if (folders.length > 0 && !isOpen) toggleNode(node.fullPath);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full py-[5px] text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="flex-1 truncate font-mono">{node.name}</span>
          {tags > 0 && (
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 text-[11px] tabular-nums',
                isSelected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200' : 'text-gray-400'
              )}
            >
              {tags}
            </span>
          )}
        </button>
      </div>

      {isOpen && folders.length > 0 && (
        <div role="group">
          {folders.map((child) => (
            <FolderItem key={child.fullPath} node={child} nodes={[]} level={level + 1} selected={selected} onSelect={onSelect} forceOpen={forceOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tree of namespace levels (folders only). The number is how many tags each
// level has directly under it; picking a level shows those tags as cards.
export function TopicTree({ nodes, selected, onSelect, forceOpen }: TreeProps) {
  const { t } = useTranslation();
  const folders = nodes.filter((n) => n.children.length > 0);

  if (folders.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-gray-400">{t('explorer.noTopics')}</p>
      </div>
    );
  }

  return (
    <div role="tree" className="space-y-px px-2 py-2">
      {folders.map((node) => (
        <FolderItem key={node.fullPath} node={node} nodes={[]} level={0} selected={selected} onSelect={onSelect} forceOpen={forceOpen} />
      ))}
    </div>
  );
}
