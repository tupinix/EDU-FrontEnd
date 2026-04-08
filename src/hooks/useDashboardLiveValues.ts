import { useState, useEffect, useRef } from 'react';
import { topicsApi } from '../services/api';

function extractValue(payload: unknown): unknown {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === 'number' || typeof payload === 'boolean') return payload;
  if (typeof payload === 'string') {
    const n = parseFloat(payload);
    return isNaN(n) ? payload : n;
  }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['value', 'Value', 'val', 'data', 'measurement']) {
      if (key in obj) return extractValue(obj[key]);
    }
  }
  return payload;
}

export function useDashboardLiveValues(bindings: string[]): Map<string, unknown> {
  const [values, setValues] = useState<Map<string, unknown>>(new Map());
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    const uniqueTopics = [...new Set(bindings.filter(Boolean))];
    if (uniqueTopics.length === 0) {
      setValues(new Map());
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      const newMap = new Map<string, unknown>();
      const promises = uniqueTopics.map(async (topic) => {
        try {
          const detail = await topicsApi.getDetails(topic);
          if (!cancelled) {
            newMap.set(topic, extractValue(detail.payload));
          }
        } catch {
          // Topic may not exist yet — skip silently
        }
      });
      await Promise.allSettled(promises);
      if (!cancelled) {
        setValues(newMap);
      }
    };

    fetchAll();
    const interval = window.setInterval(fetchAll, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bindings.join(',')]);

  return values;
}
