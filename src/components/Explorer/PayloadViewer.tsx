import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayloadViewerProps {
  payload: unknown;
  maxHeight?: string;
}

export function PayloadViewer({ payload, maxHeight = '300px' }: PayloadViewerProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Payload</h4>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                viewMode === 'tree'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-500'
              )}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                viewMode === 'raw'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-500'
              )}
            >
              Raw
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div
        className="p-4 overflow-auto font-mono text-[12px] bg-gray-50/50 dark:bg-gray-800/30"
        style={{ maxHeight }}
      >
        {viewMode === 'tree' ? (
          <JsonTree data={payload} />
        ) : (
          <pre className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400">{jsonString}</pre>
        )}
      </div>
    </div>
  );
}

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (data === null) return <span className="text-gray-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-amber-600">{data.toString()}</span>;
  if (typeof data === 'number') return <span className="text-blue-600">{data}</span>;
  if (typeof data === 'string') return <span className="text-emerald-600">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-400">[]</span>;
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="ml-1">Array[{data.length}]</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-100 dark:border-gray-800 pl-3 mt-0.5">
            {data.map((item, i) => (
              <div key={i} className="py-0.5">
                <span className="text-gray-300">{i}: </span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>;
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="ml-1">{`{${entries.length}}`}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-100 dark:border-gray-800 pl-3 mt-0.5">
            {entries.map(([key, value]) => (
              <div key={key} className="py-0.5">
                <span className="text-purple-600">"{key}"</span>
                <span className="text-gray-300">: </span>
                <JsonTree data={value} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">{String(data)}</span>;
}
