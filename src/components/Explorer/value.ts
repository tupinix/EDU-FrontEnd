// Reading a topic's value out of whatever shape the payload has.

const VALUE_KEYS = ['value', 'Value', 'val', 'data', 'measurement'];

export function extractNumericValue(payload: unknown): number | null {
  if (typeof payload === 'number') return payload;
  if (typeof payload === 'boolean') return payload ? 1 : 0;
  if (typeof payload === 'string') {
    const n = parseFloat(payload);
    return isNaN(n) ? null : n;
  }
  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;
    for (const key of VALUE_KEYS) {
      if (key in obj) return extractNumericValue(obj[key]);
    }
  }
  return null;
}

/** The scalar a person reads as "the value": the payload itself or its value field. */
export function extractDisplayValue(payload: unknown): unknown {
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    for (const key of VALUE_KEYS) {
      if (key in obj && (typeof obj[key] !== 'object' || obj[key] === null)) return obj[key];
    }
  }
  return payload;
}

export function formatValue(payload: unknown, locale?: string): string {
  const v = extractDisplayValue(payload);
  if (v === null || v === undefined) return '-';
  if (typeof v === 'number') return v.toLocaleString(locale, { maximumFractionDigits: 4 });
  if (typeof v === 'object') {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 60)}...` : s;
  }
  return String(v);
}

/** Whether the payload boils down to a scalar worth showing big. */
export function isScalarPayload(payload: unknown): boolean {
  const v = extractDisplayValue(payload);
  return v === null || ['number', 'string', 'boolean'].includes(typeof v);
}
