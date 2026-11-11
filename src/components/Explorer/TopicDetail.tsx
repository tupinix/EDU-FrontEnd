import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { TopicDetail as TopicDetailType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { extractDisplayValue, formatValue, isScalarPayload } from './value';

interface TopicDetailProps {
  topic: string;
  detail: TopicDetailType;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// The topic's current state: where it lives in the namespace and what it reads now.
export function TopicDetail({ topic, detail, isLoading, onRefresh }: TopicDetailProps) {
  const { t, i18n } = useTranslation();
  const parts = topic.split('/');
  const leaf = parts.pop();
  const unit = detail.metadata?.unit ? String(detail.metadata.unit) : '';
  const equipment = detail.metadata?.equipment as Record<string, unknown> | undefined;
  const scalar = isScalarPayload(detail.payload);
  const value = extractDisplayValue(detail.payload);

  return (
    <section className="shrink-0 rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3 px-6 pt-5">
        <p className="min-w-0 break-all font-mono text-[12.5px] leading-relaxed" title={topic}>
          {parts.length > 0 && <span className="text-gray-400 dark:text-gray-500">{parts.join('/')}/</span>}
          <span className="font-semibold text-gray-950 dark:text-gray-50">{leaf}</span>
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={t('common.refresh')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Current value: the reason someone opens a topic. */}
      <div className="px-6 pb-5 pt-3">
        {scalar ? (
          <p className="break-all text-[36px] font-semibold leading-tight tracking-tight text-gray-950 dark:text-gray-50">
            {typeof value === 'boolean' ? String(value) : formatValue(detail.payload, i18n.language)}
            {unit && <span className="ml-1.5 text-[18px] font-medium text-gray-400">{unit}</span>}
          </p>
        ) : (
          <p className="text-[14px] text-gray-500 dark:text-gray-400">{t('explorer.structuredPayload')}</p>
        )}
        <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
          {t('explorer.updated')}{' '}
          {formatDistanceToNow(new Date(detail.updatedAt), { addSuffix: true, locale: i18n.language.startsWith('pt') ? ptBR : enUS })}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Tag label="QoS" value={String(detail.qos)} />
          <Tag label={t('explorer.retained')} value={detail.retain ? t('common.yes', 'Sim') : t('common.no', 'Não')} />
          <Tag label={t('explorer.type')} value={getPayloadType(detail.payload)} />
          {detail.metadata?.type ? <Tag label={t('explorer.tagType')} value={String(detail.metadata.type)} /> : null}
          {equipment?.name ? (
            <Tag
              label={t('explorer.equipment')}
              value={[equipment.name, equipment.type].filter(Boolean).map(String).join(', ')}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] dark:bg-gray-800">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </span>
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
