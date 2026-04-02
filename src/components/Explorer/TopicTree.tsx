import { ChevronRight } from 'lucide-react';
import { TopicNode } from '../../types';
import { useExplorerStore, useUIStore } from '../../hooks/useStore';
import { cn } from '@/lib/utils';

interface TopicTreeItemProps {
  node: TopicNode;
  level: number;
}

function TopicTreeItem({ node, level }: TopicTreeItemProps) {
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
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1.5 w-full text-left py-1.5 pr-3 rounded-lg text-[13px] transition-colors group',
          isSelected
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:bg-gray-50'
        )}
        style={{ paddingLeft: `${level * 16 + 10}px` }}
      >
        <ChevronRight
          className={cn(
            'w-3 h-3 shrink-0 transition-transform',
            isExpanded && 'rotate-90',
            !hasChildren && 'invisible',
            isSelected ? 'text-white/50' : 'text-gray-300'
          )}
        />

        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          node.hasValue
            ? isSelected ? 'bg-emerald-400' : 'bg-emerald-300'
            : isSelected ? 'bg-white/20' : 'bg-gray-200'
        )} />

        <span className="truncate flex-1 font-mono">{node.name}</span>

        {node.messageCount > 0 && (
          <span className={cn(
            'text-[11px] tabular-nums shrink-0',
            isSelected ? 'text-white/40' : 'text-gray-300'
          )}>
            {node.messageCount}
          </span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div>
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
  if (!topics || topics.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-gray-300">No topics found</p>
      </div>
    );
  }

  return (
    <div className="py-1 px-1">
      {topics.map((topic) => (
        <TopicTreeItem key={topic.fullPath} node={topic} level={0} />
      ))}
    </div>
  );
}
