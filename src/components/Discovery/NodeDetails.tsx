import { useTranslation } from 'react-i18next';
import { X, GitBranch, MessageSquare, Layers } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  fullPath: string;
  level: number;
  levelName: string;
  children: number;
  messageCount: number;
}

interface NodeDetailsProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  const { t } = useTranslation();

  if (!node) return null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{t('discovery.nodeDetails')}</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Topic path */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">
            {t('discovery.topic')}
          </label>
          <p className="mt-1 font-mono text-sm text-gray-900 break-all">
            {node.fullPath || 'UNS (Root)'}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-medium">{t('discovery.level')}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {t(`discovery.levels.${node.levelName}`)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <GitBranch className="w-4 h-4" />
              <span className="text-xs font-medium">{t('discovery.children')}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {node.children}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-medium">{t('discovery.messageCount')}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {node.messageCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Level indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{
              backgroundColor: getLevelColor(node.level),
            }}
          />
          <span className="text-sm text-gray-600">
            {t(`discovery.levels.${node.levelName}`)} (Level {node.level})
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get level color
function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: '#064e3b',
    1: '#059669',
    2: '#10b981',
    3: '#34d399',
    4: '#6ee7b7',
    5: '#a7f3d0',
    6: '#d1fae5',
  };
  return colors[level] || '#9ca3af';
}
