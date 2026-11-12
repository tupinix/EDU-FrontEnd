import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { topicsApi } from '../../services/api';
import type { TopicNode, TopicHistory } from '../../types';
import { cn } from '@/lib/utils';
import { extractDisplayValue, extractNumericValue, formatValue, isScalarPayload } from './value';

// A tag with no message for this long reads as stale (grey dot instead of green).
const STALE_MS = 5 * 60 * 1000;

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 26}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <polygon points={`0,32 ${pts} 100,32`} fill="#12a8b7" fillOpacity={0.1} />
      <polyline points={pts} fill="none" stroke="#12a8b7" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Unit carried inside the payload, when the source sends one. */
function payloadUnit(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    const u = (payload as Record<string, unknown>).unit ?? (payload as Record<string, unknown>).Unit;
    return typeof u === 'string' ? u : '';
  }
  return '';
}

export function TagTile({ node, selected, onOpen }: { node: TopicNode; selected: boolean; onOpen: () => void }) {
  const { t, i18n } = useTranslation();

  // Recent readings for the sparkline. Cached for a minute so a grid of tiles
  // doesn't poll the history endpoint once per tag on every refresh.
  const { data: history } = useQuery<TopicHistory[], Error>({
    queryKey: ['topic-history', node.fullPath, 30],
    queryFn: () => topicsApi.getHistory(node.fullPath, 30),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const series = useMemo(() => {
    const points = (history ?? [])
      .map((h) => ({ ts: new Date(h.receivedAt).getTime(), v: extractNumericValue(h.payload) }))
      .filter((p): p is { ts: number; v: number } => p.v !== null)
      .sort((a, b) => a.ts - b.ts)
      .map((p) => p.v);
    return points;
  }, [history]);

  const scalar = isScalarPayload(node.lastValue);
  const value = extractDisplayValue(node.lastValue);
  const unit = payloadUnit(node.lastValue);
  const updated = node.lastUpdate ? new Date(node.lastUpdate) : null;
  const fresh = updated ? Date.now() - updated.getTime() < STALE_MS : false;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        'flex flex-col rounded-2xl border bg-white p-5 text-left outline-none transition-colors hover:border-emerald-300 focus-visible:ring-4 focus-visible:ring-primary/20 dark:bg-gray-900',
        selected ? 'border-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-900/40' : 'border-gray-200/80 dark:border-gray-800'
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', fresh ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')} />
        <span className="truncate font-mono text-[12.5px] text-gray-500 dark:text-gray-400">{node.name}</span>
      </span>
      <span className="mt-2 break-all text-[26px] font-semibold leading-tight tracking-tight text-gray-950 dark:text-gray-50">
        {node.lastValue === undefined ? '-' : scalar ? (typeof value === 'boolean' ? String(value) : formatValue(node.lastValue, i18n.language)) : '{ }'}
        {scalar && unit && <span className="ml-1 text-[14px] font-medium text-gray-400">{unit}</span>}
      </span>
      <span className="mt-auto pt-3">
        {series.length >= 3 ? (
          <Sparkline data={series} />
        ) : (
          <span className="flex h-10 items-end text-[12.5px] text-gray-400">
            {scalar ? t('explorer.noTrend') : t('explorer.structuredShort')}
          </span>
        )}
      </span>
      <span className="mt-2 text-[12px] text-gray-400">
        {updated
          ? t('explorer.updatedAgo', {
              when: formatDistanceToNowStrict(updated, { addSuffix: true, locale: i18n.language.startsWith('pt') ? ptBR : enUS }),
            })
          : t('explorer.neverUpdated')}
      </span>
    </button>
  );
}
