/**
 * Shared visual system for the 2D dashboard widgets.
 *
 * One palette, one state-color rule, so every widget reads as one family:
 * neutral surfaces with depth (gradients + soft shadows), and strong color
 * reserved for state. Explicit widget `rules` win over the automatic band, so a
 * widget colors exactly as configured; otherwise a calm emerald that shifts to
 * amber then red as the value approaches the top of its range.
 */

import { evaluateThresholds } from '@/lib/widgetThresholds';

export const V = {
  accent: '#10b981',
  accentLight: '#5eead4',
  track: '#212a37',
  trackEdge: '#151c26',
  warn: '#f59e0b',
  warnLight: '#fcd34d',
  bad: '#ef4444',
  badLight: '#fca5a5',
  text: '#f1f5f9',
  sub: '#94a3b8',
  dim: '#5b6472',
  glass: '#d6e6f7',
};

export function toNum(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

export interface Duo { main: string; light: string; }

/** The color pair (base + highlight) a widget should show for its value. */
export function stateDuo(value: unknown, rules: unknown, frac: number): Duo {
  const t = evaluateThresholds(value, rules);
  if (t?.color) return { main: t.color, light: t.color };
  if (frac >= 0.9) return { main: V.bad, light: V.badLight };
  if (frac >= 0.75) return { main: V.warn, light: V.warnLight };
  return { main: V.accent, light: V.accentLight };
}
