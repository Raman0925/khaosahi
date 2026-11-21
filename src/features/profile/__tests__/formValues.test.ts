import { type Profile, profileInputSchema } from '@/shared/profile';

import {
  convertLengthText,
  convertWeightText,
  createProfileFormSchema,
  EMPTY_FORM_VALUES,
  formatNumber,
  liveBmi,
  needsPlanRestart,
  type ProfileFormValues,
  profileToFormValues,
  toProfileInput,
} from '../logic/formValues';
import type { Units } from '../logic/ranges';

const METRIC: Units = { lengthUnit: 'cm', weightUnit: 'kg' };
const IMPERIAL: Units = { lengthUnit: 'in', weightUnit: 'lb' };
const TODAY = '2026-11-21';

const VALID: ProfileFormValues = {
  ...EMPTY_FORM_VALUES,
  condition: 'fattyLiver',
  ageYears: '45',
  sex: 'male',
  height: '170',
  weight: '80',
  waist: '95',
  dietType: 'veg',
  region: 'north',
};

function errorsOf(values: ProfileFormValues, units: Units = METRIC): Record<string, string> {
  const result = createProfileFormSchema(units, TODAY).safeParse(values);
  if (result.success) {
    return {};
  }
  return Object.fromEntries(result.error.issues.map(i => [String(i.path[0]), i.message]));
}

describe('createProfileFormSchema', () => {
  it('accepts a complete profile without labs', () => {
    expect(errorsOf(VALID)).toEqual({});
  });

  it('requires every main field', () => {
    expect(errorsOf(EMPTY_FORM_VALUES)).toEqual({
      condition: 'required',
      ageYears: 'required',
      sex: 'required',
      height: 'required',
      weight: 'required',
      waist: 'required',
      dietType: 'required',
      region: 'required',
    });
  });

  it('checks metric boundaries', () => {
    const atMin = { ...VALID, ageYears: '18', height: '120', weight: '25', waist: '50' };
    const atMax = { ...VALID, ageYears: '100', height: '220', weight: '250', waist: '200' };
    expect(errorsOf(atMin)).toEqual({});
    expect(errorsOf(atMax)).toEqual({});
    expect(
      errorsOf({ ...VALID, ageYears: '17', height: '119.9', weight: '250.1', waist: '201' }),
    ).toEqual({ ageYears: 'range', height: 'range', weight: 'range', waist: 'range' });
  });

  it('checks imperial boundaries in inches and pounds', () => {
    const imperial = { ...VALID, height: '67', weight: '176', waist: '37.4' };
    expect(errorsOf(imperial, IMPERIAL)).toEqual({});
    expect(errorsOf({ ...imperial, height: '47.3', weight: '551.1' }, IMPERIAL)).toEqual({});
    expect(errorsOf({ ...imperial, height: '47.2', weight: '551.2' }, IMPERIAL)).toEqual({
      height: 'range',
      weight: 'range',
    });
    // 170 is a fine height in cm but not in inches.
    expect(errorsOf({ ...imperial, height: '170' }, IMPERIAL)).toEqual({ height: 'range' });
  });

  it('rejects a non-whole age and non-numbers', () => {
    expect(errorsOf({ ...VALID, ageYears: '40.5', weight: 'eighty' })).toEqual({
      ageYears: 'wholeNumber',
      weight: 'number',
    });
  });

  it('validates optional labs only when filled in', () => {
    expect(
      errorsOf({
        ...VALID,
        altUL: '1',
        astUL: '2000',
        uricAcidMgDl: '20',
        ultrasoundGrade: 'notDone',
        testDate: TODAY,
      }),
    ).toEqual({});
    expect(errorsOf({ ...VALID, altUL: '0', astUL: '2001', uricAcidMgDl: '20.5' })).toEqual({
      altUL: 'range',
      astUL: 'range',
      uricAcidMgDl: 'range',
    });
  });

  it('rejects a future or invalid test date', () => {
    expect(errorsOf({ ...VALID, testDate: '2026-11-22' })).toEqual({ testDate: 'futureDate' });
    expect(errorsOf({ ...VALID, testDate: '2026-02-30' })).toEqual({ testDate: 'futureDate' });
  });
});

describe('toProfileInput', () => {
  it('converts metric form values', () => {
    expect(toProfileInput({ ...VALID, height: '170,5' }, METRIC)).toEqual({
      condition: 'fattyLiver',
      ageYears: 45,
      sex: 'male',
      heightCm: 170.5,
      weightKg: 80,
      waistCm: 95,
      dietType: 'veg',
      region: 'north',
      labs: {},
    });
  });

  it('converts inches and pounds to metric, rounded to 0.1', () => {
    const input = toProfileInput(
      { ...VALID, height: '67', weight: '176', waist: '37.4' },
      IMPERIAL,
    );
    expect(input.heightCm).toBe(170.2);
    expect(input.weightKg).toBe(79.8);
    expect(input.waistCm).toBe(95);
  });

  it('keeps imperial boundary values inside the stored metric ranges', () => {
    const min = toProfileInput(
      { ...VALID, height: '47.3', weight: '55.2', waist: '19.7' },
      IMPERIAL,
    );
    const max = toProfileInput(
      { ...VALID, height: '86.6', weight: '551.1', waist: '78.7' },
      IMPERIAL,
    );
    expect([min.heightCm, min.weightKg, min.waistCm]).toEqual([120.1, 25, 50]);
    expect([max.heightCm, max.weightKg, max.waistCm]).toEqual([220, 250, 199.9]);
  });

  it('includes only the labs that were entered', () => {
    const input = toProfileInput(
      { ...VALID, altUL: '56', uricAcidMgDl: '७.२', ultrasoundGrade: '2', testDate: TODAY },
      METRIC,
    );
    expect(input.labs).toEqual({
      altUL: 56,
      uricAcidMgDl: 7.2,
      ultrasoundGrade: '2',
      testDate: TODAY,
    });
    expect('astUL' in input.labs).toBe(false);
  });

  it('throws on unvalidated input', () => {
    expect(() => toProfileInput(EMPTY_FORM_VALUES, METRIC)).toThrow();
    expect(() => toProfileInput({ ...VALID, height: '500' }, METRIC)).toThrow();
  });
});

const SAVED: Profile = {
  condition: 'both',
  ageYears: 50,
  sex: 'female',
  heightCm: 160,
  weightKg: 70.5,
  waistCm: 88,
  dietType: 'jain',
  region: 'west',
  labs: { altUL: 48, ultrasoundGrade: '1', testDate: '2026-10-01' },
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

describe('profileToFormValues', () => {
  it('prefills metric values', () => {
    expect(profileToFormValues(SAVED, METRIC)).toEqual({
      condition: 'both',
      ageYears: '50',
      sex: 'female',
      height: '160',
      weight: '70.5',
      waist: '88',
      dietType: 'jain',
      region: 'west',
      altUL: '48',
      astUL: '',
      ultrasoundGrade: '1',
      uricAcidMgDl: '',
      testDate: '2026-10-01',
    });
  });

  it('prefills in the current units', () => {
    const values = profileToFormValues(SAVED, IMPERIAL);
    expect([values.height, values.weight, values.waist]).toEqual(['63', '155.4', '34.6']);
  });

  it('keeps boundary profiles valid when shown in other units', () => {
    const edge: Profile = { ...SAVED, heightCm: 120, weightKg: 25, waistCm: 50 };
    const values = profileToFormValues(edge, IMPERIAL);
    expect(errorsOf(values, IMPERIAL)).toEqual({});
  });

  it('round-trips through the form unchanged in metric', () => {
    const input = profileInputSchema.parse(SAVED);
    expect(toProfileInput(profileToFormValues(SAVED, METRIC), METRIC)).toEqual(input);
  });
});

describe('unit text conversion', () => {
  it('converts typed lengths and weights', () => {
    expect(convertLengthText('170', 'cm', 'in')).toBe('66.9');
    expect(convertLengthText('66.9', 'in', 'cm')).toBe('169.9');
    expect(convertWeightText('80', 'kg', 'lb')).toBe('176.4');
    expect(convertWeightText('176.4', 'lb', 'kg')).toBe('80');
  });

  it('leaves empty, invalid or same-unit text alone', () => {
    expect(convertLengthText('', 'cm', 'in')).toBe('');
    expect(convertLengthText('abc', 'cm', 'in')).toBe('abc');
    expect(convertWeightText('80', 'kg', 'kg')).toBe('80');
  });

  it('formats numbers without trailing zeros', () => {
    expect(formatNumber(80)).toBe('80');
    expect(formatNumber(80.04)).toBe('80');
    expect(formatNumber(80.06)).toBe('80.1');
  });
});

describe('liveBmi', () => {
  it('computes BMI with Asian-Indian categories', () => {
    expect(liveBmi('170', '80', METRIC)).toEqual({ value: 27.7, category: 'obese' });
    expect(liveBmi('170', '70', METRIC)).toEqual({ value: 24.2, category: 'overweight' });
    expect(liveBmi('170', '60', METRIC)).toEqual({ value: 20.8, category: 'normal' });
    expect(liveBmi('170', '50', METRIC)).toEqual({ value: 17.3, category: 'underweight' });
  });

  it('works in inches and pounds', () => {
    expect(liveBmi('67', '176', IMPERIAL)).toEqual({ value: 27.6, category: 'obese' });
  });

  it('returns null until height and weight are valid', () => {
    expect(liveBmi('', '80', METRIC)).toBeNull();
    expect(liveBmi('170', '', METRIC)).toBeNull();
    expect(liveBmi('17', '80', METRIC)).toBeNull();
  });
});

describe('needsPlanRestart', () => {
  const input = profileInputSchema.parse(SAVED);

  it('is true only when condition or diet type changes', () => {
    expect(needsPlanRestart(SAVED, input)).toBe(false);
    expect(needsPlanRestart(SAVED, { ...input, weightKg: 65, labs: {} })).toBe(false);
    expect(needsPlanRestart(SAVED, { ...input, condition: 'uricAcid' })).toBe(true);
    expect(needsPlanRestart(SAVED, { ...input, dietType: 'veg' })).toBe(true);
  });
});
