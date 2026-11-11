import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayloadViewerProps {
  payload: unknown;
  maxHeight?: string;
}

export function PayloadViewer({ payload, maxHeight = '300px' }: PayloadViewerProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="shrink-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 pb-3 pt-4">
        <h2 className="text-[15px] font-semibold text-gray-950 dark:text-gray-50">Payload</h2>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-full bg-gray-100 p-0.5 dark:bg-gray-800" role="group">
            <button
              onClick={() => setViewMode('tree')}
              aria-pressed={viewMode === 'tree'}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                viewMode === 'tree'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-500'
              )}
            >
              {t('explorer.payloadTree')}
            </button>
            <button
              onClick={() => setViewMode('raw')}
              aria-pressed={viewMode === 'raw'}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                viewMode === 'raw'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-500'
              )}
            >
              {t('explorer.payloadRaw')}
            </button>
          </div>
          <button
            onClick={handleCopy}
            aria-label={copied ? t('explorer.copied') : t('explorer.copyPayload')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div
        className="mx-3 mb-3 overflow-auto rounded-xl bg-gray-50 p-4 font-mono text-[12.5px] dark:bg-gray-800/40"
        style={{ maxHeight }}
      >
        {viewMode === 'tree' ? (
          <JsonTree data={payload} />
        ) : (
          <pre className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400">{jsonString}</pre>
        )}
      </div>
    </section>
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
