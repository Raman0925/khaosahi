import { PROFILE_RANGES } from '@/shared/profile';
import { lengthToCm, weightToKg } from '@/shared/utils/units';

import {
  describeFieldError,
  displayRange,
  isFieldErrorCode,
  isNumberField,
  numberFieldError,
  type Units,
} from '../logic/ranges';

const METRIC: Units = { lengthUnit: 'cm', weightUnit: 'kg' };
const IMPERIAL: Units = { lengthUnit: 'in', weightUnit: 'lb' };

describe('displayRange', () => {
  it('uses the stored metric ranges for metric units', () => {
    expect(displayRange('height', METRIC)).toEqual({ min: 120, max: 220 });
    expect(displayRange('weight', METRIC)).toEqual({ min: 25, max: 250 });
    expect(displayRange('waist', METRIC)).toEqual({ min: 50, max: 200 });
    expect(displayRange('ageYears', METRIC)).toEqual({ min: 18, max: 100 });
    expect(displayRange('altUL', IMPERIAL)).toEqual({ min: 1, max: 2000 });
    expect(displayRange('uricAcidMgDl', IMPERIAL)).toEqual({ min: 1, max: 20 });
  });

  it('converts and rounds inward for inches and pounds', () => {
    expect(displayRange('height', IMPERIAL)).toEqual({ min: 47.3, max: 86.6 });
    expect(displayRange('waist', IMPERIAL)).toEqual({ min: 19.7, max: 78.7 });
    expect(displayRange('weight', IMPERIAL)).toEqual({ min: 55.2, max: 551.1 });
  });

  it('keeps every accepted imperial boundary inside the metric range', () => {
    const h = displayRange('height', IMPERIAL);
    const w = displayRange('weight', IMPERIAL);
    const waist = displayRange('waist', IMPERIAL);
    for (const value of [h.min, h.max]) {
      const cm = lengthToCm(value, 'in');
      expect(cm).toBeGreaterThanOrEqual(PROFILE_RANGES.heightCm.min);
      expect(cm).toBeLessThanOrEqual(PROFILE_RANGES.heightCm.max);
    }
    for (const value of [waist.min, waist.max]) {
      const cm = lengthToCm(value, 'in');
      expect(cm).toBeGreaterThanOrEqual(PROFILE_RANGES.waistCm.min);
      expect(cm).toBeLessThanOrEqual(PROFILE_RANGES.waistCm.max);
    }
    for (const value of [w.min, w.max]) {
      const kg = weightToKg(value, 'lb');
      expect(kg).toBeGreaterThanOrEqual(PROFILE_RANGES.weightKg.min);
      expect(kg).toBeLessThanOrEqual(PROFILE_RANGES.weightKg.max);
    }
  });
});

describe('numberFieldError', () => {
  const range = { min: 18, max: 100 };

  it('treats empty text as required or optional', () => {
    expect(numberFieldError('', range, { required: true })).toBe('required');
    expect(numberFieldError('   ', range, { required: true })).toBe('required');
    expect(numberFieldError('', range, { required: false })).toBeNull();
  });

  it('rejects text that is not a number', () => {
    expect(numberFieldError('abc', range, { required: true })).toBe('number');
    expect(numberFieldError('12abc', range, { required: false })).toBe('number');
  });

  it('accepts the boundaries and rejects values just outside', () => {
    expect(numberFieldError('18', range, { required: true })).toBeNull();
    expect(numberFieldError('100', range, { required: true })).toBeNull();
    expect(numberFieldError('17', range, { required: true })).toBe('range');
    expect(numberFieldError('100.1', range, { required: true })).toBe('range');
  });

  it('requires whole numbers when asked', () => {
    expect(numberFieldError('45.5', range, { required: true, integer: true })).toBe('wholeNumber');
    expect(numberFieldError('45', range, { required: true, integer: true })).toBeNull();
  });

  it('accepts a comma decimal and Devanagari digits', () => {
    expect(numberFieldError('६५,५', { min: 25, max: 250 }, { required: true })).toBeNull();
  });
});

describe('describeFieldError', () => {
  it('gives the range in the user unit', () => {
    expect(describeFieldError('range', 'height', IMPERIAL)).toEqual({
      key: 'errors.range',
      params: { min: 47.3, max: 86.6 },
    });
    expect(describeFieldError('range', 'weight', METRIC)).toEqual({
      key: 'errors.range',
      params: { min: 25, max: 250 },
    });
  });

  it('maps the other codes to translation keys', () => {
    expect(describeFieldError('required', null, METRIC).key).toBe('errors.required');
    expect(describeFieldError('number', 'ageYears', METRIC).key).toBe('errors.number');
    expect(describeFieldError('wholeNumber', 'ageYears', METRIC).key).toBe(
      'profile.errors.wholeNumber',
    );
    expect(describeFieldError('futureDate', null, METRIC).key).toBe('profile.errors.futureDate');
  });
});

describe('type guards', () => {
  it('recognises error codes and number fields', () => {
    expect(isFieldErrorCode('range')).toBe(true);
    expect(isFieldErrorCode('nope')).toBe(false);
    expect(isFieldErrorCode(undefined)).toBe(false);
    expect(isNumberField('height')).toBe(true);
    expect(isNumberField('condition')).toBe(false);
  });
});
