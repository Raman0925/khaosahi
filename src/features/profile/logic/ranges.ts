import { PROFILE_RANGES } from '@/shared/profile';
import { parseDecimal, round } from '@/shared/utils/numbers';
import { type LengthUnit, lengthFromCm, type WeightUnit, weightFromKg } from '@/shared/utils/units';

export type Units = { lengthUnit: LengthUnit; weightUnit: WeightUnit };

/** Numeric form fields. Height, weight and waist are typed in the user's chosen unit. */
export type NumberField =
  'ageYears' | 'height' | 'weight' | 'waist' | 'altUL' | 'astUL' | 'uricAcidMgDl';

const NUMBER_FIELDS: ReadonlyArray<string> = [
  'ageYears',
  'height',
  'weight',
  'waist',
  'altUL',
  'astUL',
  'uricAcidMgDl',
] satisfies NumberField[];

export function isNumberField(name: string): name is NumberField {
  return NUMBER_FIELDS.includes(name);
}

export type Range = { min: number; max: number };

/** Error codes put in zod issue messages; the UI turns them into translated text. */
export type FieldErrorCode = 'required' | 'number' | 'wholeNumber' | 'range' | 'futureDate';

/**
 * Converts a metric range to the display unit, rounded INWARD to one decimal, so that every value
 * accepted in the display unit is still inside the metric range after conversion.
 */
function inwardRange(range: Range, convert: (metric: number) => number): Range {
  return {
    min: Math.ceil(round(convert(range.min) * 10, 6)) / 10,
    max: Math.floor(round(convert(range.max) * 10, 6)) / 10,
  };
}

/** Allowed range for a field, in the unit the user types it in. */
export function displayRange(field: NumberField, units: Units): Range {
  switch (field) {
    case 'height':
      return inwardRange(PROFILE_RANGES.heightCm, cm => lengthFromCm(cm, units.lengthUnit));
    case 'waist':
      return inwardRange(PROFILE_RANGES.waistCm, cm => lengthFromCm(cm, units.lengthUnit));
    case 'weight':
      return inwardRange(PROFILE_RANGES.weightKg, kg => weightFromKg(kg, units.weightUnit));
    default:
      return PROFILE_RANGES[field];
  }
}

/** Validates one typed number. Empty text is an error only when the field is required. */
export function numberFieldError(
  text: string,
  range: Range,
  options: { required: boolean; integer?: boolean },
): FieldErrorCode | null {
  if (text.trim() === '') {
    return options.required ? 'required' : null;
  }
  const value = parseDecimal(text);
  if (value === null) {
    return 'number';
  }
  if (options.integer && !Number.isInteger(value)) {
    return 'wholeNumber';
  }
  if (value < range.min || value > range.max) {
    return 'range';
  }
  return null;
}

export type ErrorMessage =
  | { key: 'errors.required' | 'errors.number'; params?: undefined }
  | { key: 'errors.range'; params: Range }
  | { key: 'profile.errors.wholeNumber' | 'profile.errors.futureDate'; params?: undefined };

/** Translation key (+ params in the user's unit) for an error code on a field. */
export function describeFieldError(
  code: FieldErrorCode,
  field: NumberField | null,
  units: Units,
): ErrorMessage {
  switch (code) {
    case 'required':
      return { key: 'errors.required' };
    case 'number':
      return { key: 'errors.number' };
    case 'wholeNumber':
      return { key: 'profile.errors.wholeNumber' };
    case 'futureDate':
      return { key: 'profile.errors.futureDate' };
    case 'range':
      return field
        ? { key: 'errors.range', params: displayRange(field, units) }
        : { key: 'errors.number' };
  }
}

const ERROR_CODES: ReadonlyArray<string> = [
  'required',
  'number',
  'wholeNumber',
  'range',
  'futureDate',
];

export function isFieldErrorCode(value: unknown): value is FieldErrorCode {
  return typeof value === 'string' && ERROR_CODES.includes(value);
}
