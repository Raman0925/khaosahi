/**
 * Display/input units for progress metrics. Storage is canonical (kg, cm, U/L, mg/dL, grade);
 * only weight and waist follow the user's unit preference.
 */
import { PROFILE_RANGES } from '@/shared/profile';
import type { Metric } from '@/shared/progress';
import { round } from '@/shared/utils/numbers';
import {
  lengthFromCm,
  lengthToCm,
  type LengthUnit,
  weightFromKg,
  weightToKg,
  type WeightUnit,
} from '@/shared/utils/units';

export type UnitPrefs = { weightUnit: WeightUnit; lengthUnit: LengthUnit };

/** Unit label key under `common.units`, or null for ultrasound (a grade has no unit). */
export type UnitKey = 'kg' | 'lb' | 'cm' | 'in' | 'ul' | 'mgdl';

export function unitFor(metric: Metric, prefs: UnitPrefs): UnitKey | null {
  switch (metric) {
    case 'weight':
      return prefs.weightUnit;
    case 'waist':
      return prefs.lengthUnit;
    case 'alt':
    case 'ast':
      return 'ul';
    case 'uricAcid':
      return 'mgdl';
    case 'ultrasound':
      return null;
  }
}

/** Decimal places shown and accepted for each metric. */
export function decimalsFor(metric: Metric): number {
  switch (metric) {
    case 'weight':
    case 'waist':
    case 'uricAcid':
      return 1;
    default:
      return 0;
  }
}

/** Canonical value → value in the user's units (unrounded). */
export function toDisplay(metric: Metric, value: number, prefs: UnitPrefs): number {
  if (metric === 'weight') {
    return weightFromKg(value, prefs.weightUnit);
  }
  if (metric === 'waist') {
    return lengthFromCm(value, prefs.lengthUnit);
  }
  return value;
}

/** Value typed in the user's units → canonical value for storage. */
export function fromInput(metric: Metric, value: number, prefs: UnitPrefs): number {
  if (metric === 'weight') {
    return weightToKg(value, prefs.weightUnit);
  }
  if (metric === 'waist') {
    return lengthToCm(value, prefs.lengthUnit);
  }
  return value;
}

/** Rounded display value as text, e.g. "80.5". */
export function formatValue(metric: Metric, value: number, prefs: UnitPrefs): string {
  return String(round(toDisplay(metric, value, prefs), decimalsFor(metric)));
}

const CANONICAL_RANGES: Record<Metric, { min: number; max: number }> = {
  weight: PROFILE_RANGES.weightKg,
  waist: PROFILE_RANGES.waistCm,
  alt: PROFILE_RANGES.altUL,
  ast: PROFILE_RANGES.astUL,
  uricAcid: PROFILE_RANGES.uricAcidMgDl,
  ultrasound: { min: 0, max: 3 },
};

/** Plausible input range in the user's units (rounded inwards so both ends are valid). */
export function inputRange(metric: Metric, prefs: UnitPrefs): { min: number; max: number } {
  const range = CANONICAL_RANGES[metric];
  const factor = 10 ** decimalsFor(metric);
  return {
    // `+ 0` turns -0 into 0.
    min: Math.ceil(toDisplay(metric, range.min, prefs) * factor - 1e-9) / factor + 0,
    max: Math.floor(toDisplay(metric, range.max, prefs) * factor + 1e-9) / factor,
  };
}
