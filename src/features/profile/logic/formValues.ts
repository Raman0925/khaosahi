import { z } from 'zod';

import {
  type Condition,
  CONDITIONS,
  type DietType,
  DIET_TYPES,
  type Labs,
  type Profile,
  type ProfileInput,
  profileInputSchema,
  type Region,
  REGIONS,
  type Sex,
  SEXES,
  type UltrasoundGrade,
  ULTRASOUND_GRADES,
} from '@/shared/profile';
import { isDateKey, todayKey } from '@/shared/utils/dates';
import { clamp, parseDecimal, round } from '@/shared/utils/numbers';
import {
  bmi,
  type BmiCategory,
  bmiCategory,
  type LengthUnit,
  lengthFromCm,
  lengthToCm,
  type WeightUnit,
  weightFromKg,
  weightToKg,
} from '@/shared/utils/units';

import {
  displayRange,
  type FieldErrorCode,
  type NumberField,
  numberFieldError,
  type Units,
} from './ranges';

/** What the form holds: numbers as typed text (in the user's units), choices as `null` until picked. */
export type ProfileFormValues = {
  condition: Condition | null;
  ageYears: string;
  sex: Sex | null;
  height: string;
  weight: string;
  waist: string;
  dietType: DietType | null;
  region: Region | null;
  altUL: string;
  astUL: string;
  ultrasoundGrade: UltrasoundGrade | null;
  uricAcidMgDl: string;
  /** YYYY-MM-DD or null. */
  testDate: string | null;
};

export const EMPTY_FORM_VALUES: ProfileFormValues = {
  condition: null,
  ageYears: '',
  sex: null,
  height: '',
  weight: '',
  waist: '',
  dietType: null,
  region: null,
  altUL: '',
  astUL: '',
  ultrasoundGrade: null,
  uricAcidMgDl: '',
  testDate: null,
};

const REQUIRED_NUMBERS: ReadonlyArray<NumberField> = ['ageYears', 'height', 'weight', 'waist'];

const issue = (message: FieldErrorCode) => ({ code: 'custom' as const, message });

/**
 * zod schema for the form in the given units. Issue messages are `FieldErrorCode`s; the form
 * turns them into translated text with the range in the user's unit.
 */
export function createProfileFormSchema(units: Units, today: string = todayKey()) {
  const numberText = (field: NumberField) =>
    z.string().superRefine((text, ctx) => {
      const code = numberFieldError(text, displayRange(field, units), {
        required: REQUIRED_NUMBERS.includes(field),
        integer: field === 'ageYears',
      });
      if (code) {
        ctx.addIssue(issue(code));
      }
    });
  const required = { message: 'required' satisfies FieldErrorCode };
  return z.object({
    condition: z
      .enum(CONDITIONS)
      .nullable()
      .refine(v => v !== null, required),
    ageYears: numberText('ageYears'),
    sex: z
      .enum(SEXES)
      .nullable()
      .refine(v => v !== null, required),
    height: numberText('height'),
    weight: numberText('weight'),
    waist: numberText('waist'),
    dietType: z
      .enum(DIET_TYPES)
      .nullable()
      .refine(v => v !== null, required),
    region: z
      .enum(REGIONS)
      .nullable()
      .refine(v => v !== null, required),
    altUL: numberText('altUL'),
    astUL: numberText('astUL'),
    ultrasoundGrade: z.enum(ULTRASOUND_GRADES).nullable(),
    uricAcidMgDl: numberText('uricAcidMgDl'),
    testDate: z
      .string()
      .nullable()
      .superRefine((value, ctx) => {
        if (value !== null && (!isDateKey(value) || value > today)) {
          ctx.addIssue(issue('futureDate'));
        }
      }),
  });
}

function requireChoice<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`Profile form: ${name} is missing`);
  }
  return value;
}

function requireNumber(text: string, name: string): number {
  const value = parseDecimal(text);
  if (value === null) {
    throw new Error(`Profile form: ${name} is not a number`);
  }
  return value;
}

function optionalNumber(text: string): number | undefined {
  return parseDecimal(text) ?? undefined;
}

/** Converts validated form values (display units) to the metric `ProfileInput` that is stored. */
export function toProfileInput(values: ProfileFormValues, units: Units): ProfileInput {
  const labs: Labs = {};
  const alt = optionalNumber(values.altUL);
  const ast = optionalNumber(values.astUL);
  const uricAcid = optionalNumber(values.uricAcidMgDl);
  if (alt !== undefined) {
    labs.altUL = alt;
  }
  if (ast !== undefined) {
    labs.astUL = ast;
  }
  if (values.ultrasoundGrade !== null) {
    labs.ultrasoundGrade = values.ultrasoundGrade;
  }
  if (uricAcid !== undefined) {
    labs.uricAcidMgDl = uricAcid;
  }
  if (values.testDate !== null) {
    labs.testDate = values.testDate;
  }
  return profileInputSchema.parse({
    condition: requireChoice(values.condition, 'condition'),
    ageYears: requireNumber(values.ageYears, 'age'),
    sex: requireChoice(values.sex, 'sex'),
    heightCm: round(lengthToCm(requireNumber(values.height, 'height'), units.lengthUnit), 1),
    weightKg: round(weightToKg(requireNumber(values.weight, 'weight'), units.weightUnit), 1),
    waistCm: round(lengthToCm(requireNumber(values.waist, 'waist'), units.lengthUnit), 1),
    dietType: requireChoice(values.dietType, 'dietType'),
    region: requireChoice(values.region, 'region'),
    labs,
  });
}

/** Number → text for an input, at most one decimal and no trailing ".0". */
export function formatNumber(value: number): string {
  return String(round(value, 1));
}

/** Display value for a measurement, kept inside the accepted display range. */
function displayMeasurement(field: NumberField, value: number, units: Units): string {
  const range = displayRange(field, units);
  return formatNumber(clamp(round(value, 1), range.min, range.max));
}

const optionalText = (value: number | undefined) =>
  value === undefined ? '' : formatNumber(value);

/** Prefills the form from a saved (metric) profile, in the user's current units. */
export function profileToFormValues(profile: Profile, units: Units): ProfileFormValues {
  return {
    condition: profile.condition,
    ageYears: String(profile.ageYears),
    sex: profile.sex,
    height: displayMeasurement('height', lengthFromCm(profile.heightCm, units.lengthUnit), units),
    weight: displayMeasurement('weight', weightFromKg(profile.weightKg, units.weightUnit), units),
    waist: displayMeasurement('waist', lengthFromCm(profile.waistCm, units.lengthUnit), units),
    dietType: profile.dietType,
    region: profile.region,
    altUL: optionalText(profile.labs.altUL),
    astUL: optionalText(profile.labs.astUL),
    ultrasoundGrade: profile.labs.ultrasoundGrade ?? null,
    uricAcidMgDl: optionalText(profile.labs.uricAcidMgDl),
    testDate: profile.labs.testDate ?? null,
  };
}

/** Re-expresses typed text when the user switches cm ↔ in. Unparseable text is left as is. */
export function convertLengthText(text: string, from: LengthUnit, to: LengthUnit): string {
  const value = parseDecimal(text);
  if (value === null || from === to) {
    return text;
  }
  return formatNumber(lengthFromCm(lengthToCm(value, from), to));
}

/** Re-expresses typed text when the user switches kg ↔ lb. Unparseable text is left as is. */
export function convertWeightText(text: string, from: WeightUnit, to: WeightUnit): string {
  const value = parseDecimal(text);
  if (value === null || from === to) {
    return text;
  }
  return formatNumber(weightFromKg(weightToKg(value, from), to));
}

/** BMI shown live once height and weight are valid; `null` otherwise. */
export function liveBmi(
  heightText: string,
  weightText: string,
  units: Units,
): { value: number; category: BmiCategory } | null {
  const heightError = numberFieldError(heightText, displayRange('height', units), {
    required: true,
  });
  const weightError = numberFieldError(weightText, displayRange('weight', units), {
    required: true,
  });
  if (heightError || weightError) {
    return null;
  }
  const heightCm = lengthToCm(requireNumber(heightText, 'height'), units.lengthUnit);
  const weightKg = weightToKg(requireNumber(weightText, 'weight'), units.weightUnit);
  const value = bmi(weightKg, heightCm);
  return value === null ? null : { value: round(value, 1), category: bmiCategory(value) };
}

/** Changing condition or diet type changes the plan, so it restarts (needs confirmation). */
export function needsPlanRestart(saved: Profile, next: ProfileInput): boolean {
  return saved.condition !== next.condition || saved.dietType !== next.dietType;
}
