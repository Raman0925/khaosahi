import {
  addDays,
  daysBetween,
  fromDateKey,
  isDateKey,
  msUntilNextMidnight,
  toDateKey,
} from '../dates';
import { parseDecimal, round } from '../numbers';
import { bmi, bmiCategory, cmToIn, inToCm, kgToLb, lbToKg, lengthFromCm } from '../units';

describe('dates', () => {
  it('formats local calendar dates', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 0, 6, 0, 0))).toBe('2026-01-06');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days between keys', () => {
    expect(daysBetween('2026-01-01', '2026-03-31')).toBe(89);
    expect(daysBetween('2026-03-31', '2026-01-01')).toBe(-89);
    expect(daysBetween('2026-05-05', '2026-05-05')).toBe(0);
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2026-1-1')).toBe(false);
    expect(fromDateKey('2026-07-04').getDate()).toBe(4);
  });

  it('computes time until local midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 0, 1, 23, 0, 0))).toBe(3_600_000);
  });
});

describe('units', () => {
  it('converts length and weight both ways', () => {
    expect(round(cmToIn(100), 2)).toBe(39.37);
    expect(round(inToCm(cmToIn(87)), 6)).toBe(87);
    expect(round(kgToLb(70), 1)).toBe(154.3);
    expect(round(lbToKg(kgToLb(70)), 6)).toBe(70);
    expect(lengthFromCm(90, 'cm')).toBe(90);
  });

  it('computes BMI and Asian-Indian category', () => {
    expect(round(bmi(70, 170)!, 1)).toBe(24.2);
    expect(bmi(70, 0)).toBeNull();
    expect(bmiCategory(18)).toBe('underweight');
    expect(bmiCategory(22.9)).toBe('normal');
    expect(bmiCategory(24.2)).toBe('overweight');
    expect(bmiCategory(25)).toBe('obese');
  });
});

describe('numbers', () => {
  it('parses decimals, commas and Devanagari digits', () => {
    expect(parseDecimal('72.5')).toBe(72.5);
    expect(parseDecimal(' 72,5 ')).toBe(72.5);
    expect(parseDecimal('७२')).toBe(72);
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('1e5')).toBeNull();
  });
});
