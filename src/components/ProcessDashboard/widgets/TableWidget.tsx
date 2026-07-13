import { useEffect, useState, useMemo } from 'react';
import { topicsApi } from '../../../services/api';
import { extractValue } from '../../../hooks/useDashboardLiveValues';
import { evaluateThresholds } from '@/lib/widgetThresholds';

export interface TableRow {
  id: string;
  topic: string;
  brokerId?: string;
  field?: string;
  label?: string;
  unit?: string;
  decimals?: number;
  rules?: unknown;
}

interface Props {
  config: Record<string, unknown>;
  value: unknown;
  width: number;
  height: number;
}

function fmtVal(v: unknown, decimals?: number): string {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  if (Number.isNaN(n)) return v === null || v === undefined ? '--' : String(v);
  return n.toFixed(decimals ?? 2);
}

// Multi-tag table. Unlike single-binding widgets it binds to MANY tags (one per
// row) and polls them itself via the batched endpoint (one request per broker).
export function TableWidget({ config }: Props) {
  const rows = useMemo<TableRow[]>(
    () => (Array.isArray(config.rows) ? (config.rows as TableRow[]) : []),
    [config.rows],
  );
  const showHeader = config.showHeader !== false;
  const [values, setValues] = useState<Map<string, unknown>>(new Map());

  // Re-poll when the set of rows (identity/topic/broker/field) changes.
  const depKey = rows.map((r) => `${r.id}:${r.topic}:${r.brokerId ?? ''}:${r.field ?? ''}`).join('|');

  useEffect(() => {
    const active = rows.filter((r) => r.topic);
    if (active.length === 0) {
      setValues(new Map());
      return;
    }
    let cancelled = false;

    const poll = async () => {
      const byBroker = new Map<string, TableRow[]>();
      for (const r of active) {
        const bk = r.brokerId ?? '';
        const list = byBroker.get(bk);
        if (list) list.push(r);
        else byBroker.set(bk, [r]);
      }

      const next = new Map<string, unknown>();
      await Promise.allSettled(
        Array.from(byBroker.entries()).map(async ([bk, group]) => {
          try {
            const topics = Array.from(new Set(group.map((r) => r.topic)));
            const result = await topicsApi.getBatchDetails(topics, bk || undefined);
            for (const r of group) {
              const entry = result[r.topic];
              if (entry) next.set(r.id, extractValue(entry.payload, r.field));
            }
          } catch {
            // Broker/topic unreachable — skip.
          }
        }),
      );
      if (!cancelled) setValues(next);
    };

    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span className="text-gray-600 text-[11px]">Adicione linhas na config</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto select-none">
      <table className="w-full border-collapse text-[11px]">
        {showHeader && (
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider" style={{ fontSize: 9 }}>
              <th className="text-left font-medium py-1 px-2">Tag</th>
              <th className="text-right font-medium py-1 px-2">Valor</th>
              <th className="w-5" />
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r) => {
            const v = values.get(r.id);
            const threshold = evaluateThresholds(v, r.rules);
            const name = r.label || r.topic.split('/').pop() || r.topic || '—';
            return (
              <tr key={r.id} className="border-b border-gray-100/60 dark:border-gray-800/60">
                <td className="py-1 px-2 text-gray-600 dark:text-gray-300 truncate max-w-0">{name}</td>
                <td
                  className={`py-1 px-2 text-right tabular-nums font-medium ${threshold?.blink ? 'animate-pulse' : ''}`}
                  style={{ color: threshold?.color ?? '#e5e7eb' }}
                >
                  {fmtVal(v, r.decimals)}
                  {r.unit ? <span className="text-gray-500 font-normal"> {r.unit}</span> : null}
                </td>
                <td className="py-1 px-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${threshold?.blink ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: threshold?.color ?? '#4b5563' }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
