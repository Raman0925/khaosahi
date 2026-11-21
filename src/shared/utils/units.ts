/** Unit conversion. Storage is always metric (kg, cm); conversion happens only for display/input. */

export type LengthUnit = 'cm' | 'in';
export type WeightUnit = 'kg' | 'lb';

export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export function cmToIn(cm: number): number {
  return cm / CM_PER_INCH;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function lengthFromCm(cm: number, unit: LengthUnit): number {
  return unit === 'cm' ? cm : cmToIn(cm);
}

export function lengthToCm(value: number, unit: LengthUnit): number {
  return unit === 'cm' ? value : inToCm(value);
}

export function weightFromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

export function weightToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Body mass index from metric values. Returns `null` for impossible input. */
export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) {
    return null;
  }
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

/**
 * BMI category using the Asian-Indian cut-offs commonly used in India
 * (normal < 23, overweight 23–24.9, obese >= 25).
 */
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) {
    return 'underweight';
  }
  if (value < 23) {
    return 'normal';
  }
  if (value < 25) {
    return 'overweight';
  }
  return 'obese';
}
