import { RefreshCw } from 'lucide-react';
import { TopicDetail as TopicDetailType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TopicDetailProps {
  topic: string;
  detail: TopicDetailType;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function TopicDetail({ topic, detail, isLoading, onRefresh }: TopicDetailProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <p className="text-[13px] font-mono text-gray-900 dark:text-gray-100 font-medium truncate">{topic}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="px-5 py-4 flex flex-wrap gap-x-6 gap-y-3">
        <MetaField label="QoS" value={String(detail.qos)} />
        <MetaField label="Retained" value={detail.retain ? 'Yes' : 'No'} />
        <MetaField
          label="Updated"
          value={formatDistanceToNow(new Date(detail.updatedAt), { addSuffix: true, locale: ptBR })}
        />
        <MetaField label="Type" value={getPayloadType(detail.payload)} />
        {detail.metadata?.unit ? (
          <MetaField label="Unit" value={String(detail.metadata.unit)} />
        ) : null}
        {detail.metadata?.type ? (
          <MetaField label="Tag Type" value={String(detail.metadata.type)} />
        ) : null}
      </div>

      {/* Equipment */}
      {detail.metadata?.equipment ? (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 text-[12px] text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2.5">
            <span className="font-medium text-gray-500 dark:text-gray-400">Equipment</span>
            <span>{String((detail.metadata.equipment as Record<string, unknown>).name ?? '')}</span>
            {(detail.metadata.equipment as Record<string, unknown>).type ? (
              <>
                <span className="text-gray-200">&middot;</span>
                <span>{String((detail.metadata.equipment as Record<string, unknown>).type)}</span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mt-0.5">{value}</p>
    </div>
  );
}

function getPayloadType(payload: unknown): string {
  if (payload === null) return 'null';
  if (Array.isArray(payload)) return 'array';
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj.value !== undefined) return typeof obj.value;
    return 'object';
  }
  return typeof payload;
}
