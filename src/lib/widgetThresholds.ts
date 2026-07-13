// Conditional-formatting engine for dashboard widgets ("regras de negócio").
//
// A widget can carry an ordered list of threshold rules in `config.rules`.
// The FIRST rule that matches the current value wins and drives the widget's
// color / label / blink. This is shared by every value-bearing widget so the
// business logic lives in one place instead of being hardcoded per widget.

export type ThresholdOp = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'between' | 'outside';

export interface ThresholdRule {
  id: string;
  op: ThresholdOp;
  value: number;
  value2?: number; // second bound for 'between' / 'outside'
  color: string;
  label?: string;
  blink?: boolean;
}

export interface ThresholdResult {
  color: string;
  label?: string;
  blink: boolean;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isNaN(n) ? NaN : n;
  }
  return NaN;
}

function ruleMatches(v: number, rule: ThresholdRule): boolean {
  const a = rule.value;
  const b = rule.value2 ?? rule.value;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  switch (rule.op) {
    case 'lt': return v < a;
    case 'lte': return v <= a;
    case 'gt': return v > a;
    case 'gte': return v >= a;
    case 'eq': return v === a;
    case 'between': return v >= lo && v <= hi;
    case 'outside': return v < lo || v > hi;
    default: return false;
  }
}

// Coerce an unknown `config.rules` into a typed, usable rule list. Tolerant of
// persisted JSON: drops entries missing an op/color/numeric value.
export function normalizeRules(raw: unknown): ThresholdRule[] {
  if (!Array.isArray(raw)) return [];
  const out: ThresholdRule[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const op = o.op as ThresholdOp;
    const value = toNumber(o.value);
    const color = typeof o.color === 'string' ? o.color : '';
    if (!op || !color || Number.isNaN(value)) continue;
    out.push({
      id: typeof o.id === 'string' ? o.id : `${op}-${value}-${color}`,
      op,
      value,
      value2: o.value2 === undefined ? undefined : toNumber(o.value2),
      color,
      label: typeof o.label === 'string' ? o.label : undefined,
      blink: o.blink === true,
    });
  }
  return out;
}

// Evaluate a value against a widget's rules. Returns the first match, or null
// when there are no rules or the value isn't numeric — callers then fall back
// to their own default styling.
export function evaluateThresholds(value: unknown, rawRules: unknown): ThresholdResult | null {
  const rules = normalizeRules(rawRules);
  if (rules.length === 0) return null;
  const v = toNumber(value);
  if (Number.isNaN(v)) return null;
  for (const rule of rules) {
    if (ruleMatches(v, rule)) {
      return { color: rule.color, label: rule.label, blink: rule.blink === true };
    }
  }
  return null;
}

// Human-readable summary of a rule for the config UI.
export function describeRule(rule: ThresholdRule): string {
  switch (rule.op) {
    case 'lt': return `< ${rule.value}`;
    case 'lte': return `≤ ${rule.value}`;
    case 'gt': return `> ${rule.value}`;
    case 'gte': return `≥ ${rule.value}`;
    case 'eq': return `= ${rule.value}`;
    case 'between': return `${Math.min(rule.value, rule.value2 ?? rule.value)}…${Math.max(rule.value, rule.value2 ?? rule.value)}`;
    case 'outside': return `fora de ${Math.min(rule.value, rule.value2 ?? rule.value)}…${Math.max(rule.value, rule.value2 ?? rule.value)}`;
    default: return '';
  }
}
