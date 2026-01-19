import { useState } from 'react';
import { Copy, Check, Code, List, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Payload</h4>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={clsx(
                'px-2 py-1 rounded text-sm transition-colors',
                viewMode === 'tree' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
              title="Visualização em árvore"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={clsx(
                'px-2 py-1 rounded text-sm transition-colors',
                viewMode === 'raw' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
              title="JSON Raw"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copiar JSON"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div
        className="p-4 overflow-auto font-mono text-sm bg-gray-50"
        style={{ maxHeight }}
      >
        {viewMode === 'tree' ? (
          <JsonTree data={payload} />
        ) : (
          <pre className="whitespace-pre-wrap break-words">{jsonString}</pre>
        )}
      </div>
    </div>
  );
}

// JSON Tree Component
interface JsonTreeProps {
  data: unknown;
  depth?: number;
}

function JsonTree({ data, depth = 0 }: JsonTreeProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (data === null) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="json-boolean">{data.toString()}</span>;
  }

  if (typeof data === 'number') {
    return <span className="json-number">{data}</span>;
  }

  if (typeof data === 'string') {
    return <span className="json-string">"{data}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="ml-1">Array[{data.length}]</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 pl-4 mt-1">
            {data.map((item, index) => (
              <div key={index} className="py-0.5">
                <span className="text-gray-400">{index}: </span>
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

    if (entries.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>;
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="ml-1">Object{`{${entries.length}}`}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 pl-4 mt-1">
            {entries.map(([key, value]) => (
              <div key={key} className="py-0.5">
                <span className="json-key">"{key}"</span>
                <span className="text-gray-500">: </span>
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
