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
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if (field && field in obj) return coerce(obj[field]);
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
      const newMap = new Map<string, unknown>();
      await Promise.allSettled(
        active.map(async (b) => {
          try {
            const detail = await topicsApi.getDetails(b.topic, b.brokerId);
            if (!cancelled) newMap.set(b.key, extractValue(detail.payload, b.field));
          } catch {
            // Topic may not exist on that broker yet — skip silently.
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
