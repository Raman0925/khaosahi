import type { Metric } from '@/shared/progress';
import { round } from '@/shared/utils/numbers';
import { type LengthUnit, lengthFromCm, type WeightUnit, weightFromKg } from '@/shared/utils/units';

export type DisplayUnit = 'kg' | 'lb' | 'cm' | 'in' | 'ul' | 'mgdl';

/** Converts a canonical progress value (kg, cm, U/L, mg/dL) to what the user sees. */
export function displayValue(
  metric: Metric,
  value: number,
  units: { weightUnit: WeightUnit; lengthUnit: LengthUnit },
): { amount: number; unit: DisplayUnit | null } {
  switch (metric) {
    case 'weight':
      return { amount: round(weightFromKg(value, units.weightUnit), 1), unit: units.weightUnit };
    case 'waist':
      return { amount: round(lengthFromCm(value, units.lengthUnit), 1), unit: units.lengthUnit };
    case 'alt':
    case 'ast':
      return { amount: round(value, 0), unit: 'ul' };
    case 'uricAcid':
      return { amount: round(value, 1), unit: 'mgdl' };
    case 'ultrasound':
      return { amount: value, unit: null };
  }
}

/** Fraction 0..1 as a whole percentage. */
export function toPercent(fraction: number): number {
  return Math.round(fraction * 100);
}
