import { ChevronRight, Folder, FolderOpen, FileText, Hash } from 'lucide-react';
import { TopicNode } from '../../types';
import { useExplorerStore, useUIStore } from '../../hooks/useStore';
import { clsx } from 'clsx';

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
    if (hasChildren) {
      toggleNode(node.fullPath);
    }
    if (node.hasValue) {
      setSelectedTopic(node.fullPath);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopic(node.fullPath);
  };

  return (
    <div>
      <div
        className={clsx(
          'topic-tree-item',
          isSelected && 'selected'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse icon */}
        <button
          className={clsx(
            'topic-tree-expand',
            isExpanded && 'expanded',
            !hasChildren && 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleNode(node.fullPath);
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Folder/File icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
          )
        ) : node.hasValue ? (
          <Hash className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        )}

        {/* Node name */}
        <span className="truncate flex-1 text-sm">{node.name}</span>

        {/* Message count badge */}
        {node.messageCount > 0 && (
          <span
            className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            title={`${node.messageCount} mensagens`}
          >
            {node.messageCount}
          </span>
        )}

        {/* Value indicator */}
        {node.hasValue && node.lastValue !== undefined && (
          <button
            onClick={handleSelect}
            className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
            title="Ver valor"
          >
            valor
          </button>
        )}
      </div>

      {/* Children */}
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
      <div className="p-4 text-center text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Nenhum tópico encontrado</p>
        <p className="text-sm">Aguardando mensagens MQTT...</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {topics.map((topic) => (
        <TopicTreeItem key={topic.fullPath} node={topic} level={0} />
      ))}
    </div>
  );
}
