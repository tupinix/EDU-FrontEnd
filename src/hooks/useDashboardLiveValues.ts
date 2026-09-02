import { useState, useEffect, useRef } from 'react';
import { topicsApi } from '../services/api';
import { DashboardWidget } from '../types';

// A widget's data link: topic + broker (undefined = active) + payload field.
export interface LiveBinding {
  key: string;
  topic: string;
  brokerId?: string;
  field?: string;
}

// Stable identity for a widget's binding: broker + topic + field together
// uniquely identify what to fetch, so two widgets binding the same topic on
// different brokers/fields don't collide. Used as the live-values map key.
export function widgetBindingKey(widget: DashboardWidget): string {
  const broker = (widget.config.tagBrokerId as string) || '';
  const field = (widget.config.tagField as string) || 'value';
  return `${broker}::${String(widget.config.tagBinding ?? '')}::${field}`;
}

export function widgetToBinding(widget: DashboardWidget): LiveBinding | null {
  const topic = widget.config.tagBinding as string | undefined;
  if (!topic) return null;
  return {
    key: widgetBindingKey(widget),
    topic,
    brokerId: (widget.config.tagBrokerId as string) || undefined,
    field: (widget.config.tagField as string) || undefined,
  };
}

function coerce(v: unknown): unknown {
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? v : n;
  }
  return v;
}

// Resolve the bound value from a topic payload. If `field` is given and present,
// use it; otherwise fall back to the common value keys; else the raw scalar.
export function extractValue(payload: unknown, field?: string): unknown {
  if (payload === null || payload === undefined) return null;
  // A dot-path field lets a widget pull a NESTED datum, e.g. "raw.OEE" from
  // { raw: { OEE: 0.53, ... } }. A plain key (e.g. "value") is just a 1-part path.
  if (field) {
    const parts = field.split('.');
    let cur: unknown = payload;
    let found = true;
    for (const part of parts) {
      if (cur && typeof cur === 'object') {
        if (Array.isArray(cur)) {
          const idx = Number(part);
          if (Number.isInteger(idx) && idx >= 0 && idx < cur.length) { cur = cur[idx]; }
          else { found = false; break; }
        } else if (part in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[part];
        } else { found = false; break; }
      } else { found = false; break; }
    }
    if (found) return coerce(cur);
    // path not present — fall through to the common default keys below
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    for (const key of ['value', 'Value', 'val', 'data', 'measurement']) {
      if (key in obj) return coerce(obj[key]);
    }
    return payload;
  }
  return coerce(payload);
}

// Polls each binding's topic on its chosen broker every 5s and returns a map
// keyed by `binding.key`. Broker-scoped + field-aware (was: flat topic-only).
export function useDashboardLiveValues(bindings: LiveBinding[]): Map<string, unknown> {
  const [values, setValues] = useState<Map<string, unknown>>(new Map());
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  // Re-run when the set of bindings changes (key encodes topic+broker+field).
  const depKey = bindings.map((b) => b.key).sort().join(',');

  useEffect(() => {
    const active = bindingsRef.current.filter((b) => b.topic);
    if (active.length === 0) {
      setValues(new Map());
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      // Group bindings by broker so we issue ONE batch request per distinct
      // broker instead of one /details request per widget (was the N+1 storm
      // that took the server down on large/shared dashboards).
      const byBroker = new Map<string, LiveBinding[]>();
      for (const b of active) {
        const bk = b.brokerId ?? '';
        const list = byBroker.get(bk);
        if (list) list.push(b);
        else byBroker.set(bk, [b]);
      }

      const newMap = new Map<string, unknown>();
      await Promise.allSettled(
        Array.from(byBroker.entries()).map(async ([bk, group]) => {
          try {
            const topics = Array.from(new Set(group.map((b) => b.topic)));
            const result = await topicsApi.getBatchDetails(topics, bk || undefined);
            for (const b of group) {
              const entry = result[b.topic];
              if (entry) newMap.set(b.key, extractValue(entry.payload, b.field));
            }
          } catch {
            // Broker/topic may not be reachable yet — skip silently.
          }
        }),
      );
      if (!cancelled) setValues(newMap);
    };

    fetchAll();
    const interval = window.setInterval(fetchAll, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [depKey]);

  return values;
}
