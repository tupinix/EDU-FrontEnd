import { evaluateThresholds, normalizeRules, describeRule, ThresholdRule } from '../lib/widgetThresholds';

describe('evaluateThresholds', () => {
  const rules: ThresholdRule[] = [
    { id: 'r1', op: 'gt', value: 85, color: '#ef4444', label: 'CRÍTICO', blink: true },
    { id: 'r2', op: 'between', value: 60, value2: 85, color: '#f59e0b', label: 'ATENÇÃO' },
    { id: 'r3', op: 'lte', value: 60, color: '#10b981', label: 'OK' },
  ];

  it('returns the first matching rule (order matters)', () => {
    expect(evaluateThresholds(92, rules)).toEqual({ color: '#ef4444', label: 'CRÍTICO', blink: true });
    expect(evaluateThresholds(70, rules)).toEqual({ color: '#f59e0b', label: 'ATENÇÃO', blink: false });
    expect(evaluateThresholds(40, rules)).toEqual({ color: '#10b981', label: 'OK', blink: false });
  });

  it('coerces numeric strings', () => {
    expect(evaluateThresholds('92', rules)?.color).toBe('#ef4444');
  });

  it('returns null for non-numeric values', () => {
    expect(evaluateThresholds('abc', rules)).toBeNull();
    expect(evaluateThresholds(null, rules)).toBeNull();
    expect(evaluateThresholds(undefined, rules)).toBeNull();
  });

  it('returns null when there are no rules', () => {
    expect(evaluateThresholds(50, [])).toBeNull();
    expect(evaluateThresholds(50, undefined)).toBeNull();
    expect(evaluateThresholds(50, 'not-an-array')).toBeNull();
  });

  it('handles outside/eq operators', () => {
    const r: ThresholdRule[] = [{ id: 'o', op: 'outside', value: 10, value2: 20, color: '#f00' }];
    expect(evaluateThresholds(5, r)?.color).toBe('#f00');
    expect(evaluateThresholds(25, r)?.color).toBe('#f00');
    expect(evaluateThresholds(15, r)).toBeNull();
  });
});

describe('normalizeRules', () => {
  it('drops malformed entries', () => {
    const raw = [
      { op: 'gt', value: 10, color: '#fff' },
      { op: 'gt', value: 'not-a-number', color: '#fff' }, // bad value
      { op: 'gt', value: 10 }, // missing color
      { value: 10, color: '#fff' }, // missing op
      null,
      'nope',
    ];
    expect(normalizeRules(raw)).toHaveLength(1);
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeRules(undefined)).toEqual([]);
    expect(normalizeRules({})).toEqual([]);
  });
});

describe('describeRule', () => {
  it('formats operators readably', () => {
    expect(describeRule({ id: '1', op: 'gt', value: 85, color: '#f00' })).toBe('> 85');
    expect(describeRule({ id: '2', op: 'between', value: 85, value2: 60, color: '#f00' })).toBe('60…85');
  });
});
