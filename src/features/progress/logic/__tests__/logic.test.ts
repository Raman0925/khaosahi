import type { ProgressEntry } from '@/shared/progress';

import { chartModel, MAX_CHART_POINTS } from '../chartModel';
import { entryFormSchema, toCanonical } from '../entryForm';
import { normalRange, rangeStatus, waistCutoffCm } from '../normalRanges';
import { chartScale, downsample, trend } from '../series';
import { formatValue, fromInput, inputRange, toDisplay, unitFor, type UnitPrefs } from '../units';

const metric: UnitPrefs = { weightUnit: 'kg', lengthUnit: 'cm' };
const imperial: UnitPrefs = { weightUnit: 'lb', lengthUnit: 'in' };

describe('units', () => {
  it('picks the unit per metric and preference', () => {
    expect(unitFor('weight', imperial)).toBe('lb');
    expect(unitFor('waist', metric)).toBe('cm');
    expect(unitFor('alt', imperial)).toBe('ul');
    expect(unitFor('uricAcid', metric)).toBe('mgdl');
    expect(unitFor('ultrasound', metric)).toBeNull();
  });

  it('converts weight and waist for display and back', () => {
    expect(formatValue('weight', 80, imperial)).toBe('176.4');
    expect(formatValue('waist', 90, imperial)).toBe('35.4');
    expect(fromInput('weight', 176.4, imperial)).toBeCloseTo(80.01, 2);
    expect(fromInput('waist', 35.4, imperial)).toBeCloseTo(89.92, 2);
    expect(toDisplay('alt', 42, imperial)).toBe(42);
    expect(formatValue('uricAcid', 6.25, metric)).toBe('6.3');
  });

  it('gives input ranges in the user units that convert back inside the profile range', () => {
    expect(inputRange('weight', metric)).toEqual({ min: 25, max: 250 });
    const lb = inputRange('weight', imperial);
    expect(lb).toEqual({ min: 55.2, max: 551.1 });
    expect(fromInput('weight', lb.min, imperial)).toBeGreaterThanOrEqual(25);
    expect(fromInput('weight', lb.max, imperial)).toBeLessThanOrEqual(250);
    expect(inputRange('waist', imperial)).toEqual({ min: 19.7, max: 78.7 });
    expect(inputRange('uricAcid', metric)).toEqual({ min: 1, max: 20 });
    expect(inputRange('ultrasound', metric)).toEqual({ min: 0, max: 3 });
  });
});

describe('entry form', () => {
  const now = new Date(2026, 10, 21, 12);
  const errors = (m: Parameters<typeof entryFormSchema>[0], value: string, date = '2026-11-21') => {
    const result = entryFormSchema(m, metric, now).safeParse({ value, date });
    return result.success ? [] : result.error.issues.map(i => `${String(i.path[0])}:${i.message}`);
  };

  it('accepts valid values including comma decimals and Devanagari digits', () => {
    expect(errors('weight', '80.5')).toEqual([]);
    expect(errors('weight', '80,5')).toEqual([]);
    expect(errors('alt', '४२')).toEqual([]);
    expect(errors('ultrasound', '0')).toEqual([]);
  });

  it('rejects empty, non-numeric and out-of-range values', () => {
    expect(errors('weight', ' ')).toEqual(['value:required']);
    expect(errors('weight', 'abc')).toEqual(['value:number']);
    expect(errors('weight', '20')).toEqual(['value:range']);
    expect(errors('uricAcid', '25')).toEqual(['value:range']);
    expect(errors('alt', '2001')).toEqual(['value:range']);
  });

  it('rejects future and invalid dates', () => {
    expect(errors('weight', '80', '2026-11-22')).toEqual(['date:futureDate']);
    expect(errors('weight', '80', '2026-02-30')).toEqual(['date:required']);
    expect(errors('weight', '80', '2026-11-20')).toEqual([]);
  });

  it('stores canonical values', () => {
    expect(toCanonical('weight', '80.5', metric)).toBe(80.5);
    expect(toCanonical('weight', '176.4', imperial)).toBe(80.014);
    expect(toCanonical('waist', '35,5', imperial)).toBe(90.17);
    expect(() => toCanonical('weight', 'x', metric)).toThrow();
  });
});

describe('normal ranges', () => {
  it('depends on sex where it applies', () => {
    expect(normalRange('alt', 'male')).toEqual({ max: 33 });
    expect(normalRange('alt', 'female')).toEqual({ max: 25 });
    expect(normalRange('uricAcid', 'female')).toEqual({ min: 2.4, max: 6 });
    expect(normalRange('ast', 'male')).toEqual({ min: 8, max: 33 });
  });

  it('uses the widest range when sex is other or unknown', () => {
    expect(normalRange('uricAcid', 'other')).toEqual({ min: 2.4, max: 7 });
    expect(normalRange('alt', null)).toEqual({ max: 33 });
  });

  it('has no band for weight, waist and ultrasound', () => {
    expect(normalRange('weight', 'male')).toBeNull();
    expect(normalRange('waist', 'male')).toBeNull();
    expect(normalRange('ultrasound', 'female')).toBeNull();
  });

  it('gives Asian waist cut-offs', () => {
    expect(waistCutoffCm('male')).toBe(90);
    expect(waistCutoffCm('female')).toBe(80);
    expect(waistCutoffCm('other')).toBe(80);
  });

  it('classifies values', () => {
    expect(rangeStatus(2, { min: 2.4, max: 6 })).toBe('below');
    expect(rangeStatus(6, { min: 2.4, max: 6 })).toBe('within');
    expect(rangeStatus(40, { max: 33 })).toBe('above');
  });
});

describe('trend', () => {
  it('compares the last two values', () => {
    expect(trend([])).toBeNull();
    expect(trend([80])).toBeNull();
    expect(trend([80, 79])).toBe('down');
    expect(trend([79, 80, 81])).toBe('up');
    expect(trend([80, 80.04], 0.05)).toBe('same');
  });
});

describe('chartScale', () => {
  const covers = (values: number[]) => {
    const s = chartScale(values);
    expect(s.offset).toBeLessThanOrEqual(Math.min(...values));
    expect(s.offset + s.span).toBeGreaterThanOrEqual(Math.max(...values));
    expect(s.offset).toBeGreaterThanOrEqual(0);
    expect(s.span).toBeCloseTo(s.step * s.sections);
    return s;
  };

  it('uses round ticks that cover data and reference lines', () => {
    expect(covers([78.2, 81.5, 80])).toEqual({ offset: 76, span: 8, step: 2, sections: 4 });
    covers([42, 33, 55, 120]);
    covers([5.8, 7.4, 2.4]);
    covers([0, 3]);
  });

  it('handles a single value', () => {
    const s = covers([80]);
    expect(s.span).toBeGreaterThan(0);
  });
});

describe('downsample', () => {
  const series = Array.from({ length: 200 }, (_, i) => ({
    i,
    v: 80 + Math.sin(i / 7) * 3 + (i === 57 ? 20 : 0) - (i === 133 ? 15 : 0),
  }));

  it('returns small series unchanged', () => {
    expect(downsample(series.slice(0, 10), 60, p => p.v)).toHaveLength(10);
  });

  it('keeps first, last and extremes in order, within the limit', () => {
    const result = downsample(series, 60, p => p.v);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.length).toBeGreaterThan(40);
    const indexes = result.map(p => p.i);
    expect(indexes[0]).toBe(0);
    expect(indexes[indexes.length - 1]).toBe(199);
    expect(indexes).toContain(57);
    expect(indexes).toContain(133);
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
  });
});

describe('chartModel', () => {
  const entry = (i: number, value: number, m: ProgressEntry['metric'] = 'waist') => ({
    id: String(i),
    metric: m,
    date: `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    value,
    createdAt: '',
    updatedAt: '',
  });

  it('converts to display units, adds the waist risk line and labels three dates', () => {
    const entries = [entry(0, 100), entry(1, 98), entry(2, 96)];
    const model = chartModel('waist', entries, imperial, 'male', 'en');
    expect(model.data.map(d => d.value)).toEqual([39.4, 38.6, 37.8]);
    expect(model.lines).toEqual([35.4]);
    expect(model.data.filter(d => d.label !== '')).toHaveLength(3);
    expect(model.scale.offset).toBeLessThanOrEqual(35.4);
  });

  it('draws normal-range limits for labs and caps 200 points', () => {
    const many = Array.from({ length: 200 }, (_, i) => entry(i, 3 + (i % 20) / 4, 'uricAcid'));
    const model = chartModel('uricAcid', many, metric, 'female', 'hi');
    expect(model.lines).toEqual([6, 2.4]);
    expect(model.data.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
  });

  it('handles a single point', () => {
    const model = chartModel('weight', [entry(0, 80, 'weight')], metric, null, 'en');
    expect(model.data).toEqual([{ value: 80, label: expect.any(String) }]);
    expect(model.lines).toEqual([]);
    expect(model.scale.span).toBeGreaterThan(0);
  });
});
