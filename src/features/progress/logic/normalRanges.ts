/**
 * Reference ranges shown on charts. These are general, widely used values; every lab prints its
 * own range and the UI says so. Values are canonical units.
 *
 * Sources:
 * - ALT: American College of Gastroenterology clinical guideline (Kwo et al., Am J Gastroenterol
 *   2017): healthy upper limit ~29–33 U/L for men and ~19–25 U/L for women → 33 / 25.
 * - AST: MedlinePlus "Aspartate Aminotransferase (AST) Test": typical 8–33 U/L.
 * - Uric acid: commonly used lab reference ranges (e.g. MedlinePlus "Uric acid - blood"; Mayo
 *   Clinic Laboratories): men ~3.4–7.0 mg/dL, women ~2.4–6.0 mg/dL.
 * - Waist: IDF consensus cut-offs for South Asians: 90 cm men, 80 cm women (risk line, not a band).
 * When sex is "other" or unknown we use the wider of the two ranges and the lower waist cut-off.
 */
import type { Sex } from '@/shared/profile';
import type { Metric } from '@/shared/progress';

export type NormalRange = { min?: number; max: number };

type SexRanges = { male: NormalRange; female: NormalRange };

const RANGES: Partial<Record<Metric, SexRanges>> = {
  alt: { male: { max: 33 }, female: { max: 25 } },
  ast: { male: { min: 8, max: 33 }, female: { min: 8, max: 33 } },
  uricAcid: { male: { min: 3.4, max: 7 }, female: { min: 2.4, max: 6 } },
};

const WAIST_CUTOFF_CM = { male: 90, female: 80 } as const;

function widest(a: NormalRange, b: NormalRange): NormalRange {
  const min = a.min !== undefined && b.min !== undefined ? Math.min(a.min, b.min) : undefined;
  return min === undefined ? { max: Math.max(a.max, b.max) } : { min, max: Math.max(a.max, b.max) };
}

/** Normal range for a lab metric, or null when the metric has no band (weight, waist, ultrasound). */
export function normalRange(metric: Metric, sex: Sex | null | undefined): NormalRange | null {
  const ranges = RANGES[metric];
  if (!ranges) {
    return null;
  }
  if (sex === 'male' || sex === 'female') {
    return ranges[sex];
  }
  return widest(ranges.male, ranges.female);
}

/** Waist risk cut-off in cm (Asian cut-offs). */
export function waistCutoffCm(sex: Sex | null | undefined): number {
  return sex === 'male' ? WAIST_CUTOFF_CM.male : WAIST_CUTOFF_CM.female;
}

export type RangeStatus = 'below' | 'within' | 'above';

export function rangeStatus(value: number, range: NormalRange): RangeStatus {
  if (range.min !== undefined && value < range.min) {
    return 'below';
  }
  return value > range.max ? 'above' : 'within';
}
