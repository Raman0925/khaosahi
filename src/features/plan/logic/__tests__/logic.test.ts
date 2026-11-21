import type { ProgressEntry } from '@/shared/progress';

import { displayValue, toPercent } from '../format';
import { metricComparison } from '../metrics';

function entry(metric: ProgressEntry['metric'], date: string, value: number, n = 0): ProgressEntry {
  const createdAt = `2026-01-01T00:00:0${n}.000Z`;
  return { id: `${metric}-${date}-${n}`, metric, date, value, createdAt, updatedAt: createdAt };
}

describe('metricComparison', () => {
  const start = '2026-03-01';

  it('returns null when the metric was never logged', () => {
    expect(metricComparison([entry('alt', start, 50)], 'weight', start)).toBeNull();
  });

  it('uses the last reading on or before the start as the baseline', () => {
    const result = metricComparison(
      [
        entry('weight', '2026-05-20', 79),
        entry('weight', '2026-01-10', 90),
        entry('weight', '2026-02-27', 85),
        entry('weight', '2026-04-01', 82),
      ],
      'weight',
      start,
    );
    expect(result?.first.value).toBe(85);
    expect(result?.latest?.value).toBe(79);
  });

  it('falls back to the first reading after the start', () => {
    const result = metricComparison(
      [entry('waist', '2026-03-05', 98), entry('waist', '2026-05-01', 94)],
      'waist',
      start,
    );
    expect(result?.first.value).toBe(98);
    expect(result?.latest?.value).toBe(94);
  });

  it('reports a single reading without a latest value', () => {
    expect(metricComparison([entry('alt', '2026-04-01', 60)], 'alt', start)?.latest).toBeNull();
  });

  it('orders same-day readings by creation time', () => {
    const result = metricComparison(
      [entry('ast', '2026-04-01', 40, 2), entry('ast', '2026-04-01', 45, 1)],
      'ast',
      start,
    );
    expect(result?.first.value).toBe(45);
    expect(result?.latest?.value).toBe(40);
  });
});

describe('displayValue', () => {
  const metric = { weightUnit: 'kg', lengthUnit: 'cm' } as const;
  const imperial = { weightUnit: 'lb', lengthUnit: 'in' } as const;

  it('converts weight and waist to the user units', () => {
    expect(displayValue('weight', 80, metric)).toEqual({ amount: 80, unit: 'kg' });
    expect(displayValue('weight', 80, imperial)).toEqual({ amount: 176.4, unit: 'lb' });
    expect(displayValue('waist', 90, imperial)).toEqual({ amount: 35.4, unit: 'in' });
  });

  it('keeps lab units', () => {
    expect(displayValue('alt', 61.6, metric)).toEqual({ amount: 62, unit: 'ul' });
    expect(displayValue('uricAcid', 7.25, metric)).toEqual({ amount: 7.3, unit: 'mgdl' });
  });

  it('formats percentages', () => {
    expect(toPercent(0.666)).toBe(67);
    expect(toPercent(1)).toBe(100);
  });
});
