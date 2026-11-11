import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { TopicNode } from '../../types';
import { useExplorerStore, useUIStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';

interface TopicTreeItemProps {
  node: TopicNode;
  level: number;
}

function TopicTreeItem({ node, level }: TopicTreeItemProps) {
  const { i18n } = useTranslation();
  const { expandedNodes, toggleNode } = useExplorerStore();
  const { selectedTopic, setSelectedTopic } = useUIStore();

  const isExpanded = expandedNodes.has(node.fullPath);
  const isSelected = selectedTopic === node.fullPath;
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    if (hasChildren) toggleNode(node.fullPath);
    if (node.hasValue) setSelectedTopic(node.fullPath);
  };

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <button
        onClick={handleClick}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-full py-[5px] pr-2 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40',
          isSelected
            ? 'bg-emerald-50 font-medium text-emerald-950 dark:bg-emerald-900/30 dark:text-emerald-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform',
            isExpanded && 'rotate-90',
            !hasChildren && 'invisible'
          )}
        />

        {/* Green: this level carries a value; grey: only a folder in the namespace. */}
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            node.hasValue ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
          )}
        />

        <span className="flex-1 truncate font-mono">{node.name}</span>

        {node.messageCount > 0 && (
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 text-[11px] tabular-nums',
              isSelected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200' : 'text-gray-400'
            )}
          >
            {node.messageCount.toLocaleString(i18n.language)}
          </span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div role="group">
          {node.children.map((child) => (
            <TopicTreeItem key={child.fullPath} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TopicTreeProps {
  topics: TopicNode[];
}

export function TopicTree({ topics }: TopicTreeProps) {
  const { t } = useTranslation();

  if (!topics || topics.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-gray-400">{t('explorer.noTopics')}</p>
      </div>
    );
  }

  return (
    <div role="tree" className="space-y-px px-2 py-2">
      {topics.map((topic) => (
        <TopicTreeItem key={topic.fullPath} node={topic} level={0} />
      ))}
    </div>
  );
}
