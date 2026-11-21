import { z } from 'zod';

/** Plausible ranges for profile and lab input. Stored values are always metric. */
export const PROFILE_RANGES = {
  ageYears: { min: 18, max: 100 },
  heightCm: { min: 120, max: 220 },
  weightKg: { min: 25, max: 250 },
  waistCm: { min: 50, max: 200 },
  altUL: { min: 1, max: 2000 },
  astUL: { min: 1, max: 2000 },
  uricAcidMgDl: { min: 1, max: 20 },
} as const;

export const CONDITIONS = ['fattyLiver', 'uricAcid', 'both'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const SEXES = ['male', 'female', 'other'] as const;
export type Sex = (typeof SEXES)[number];

export const DIET_TYPES = ['veg', 'egg', 'nonveg', 'jain'] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const REGIONS = ['north', 'south', 'east', 'west', 'central', 'northeast'] as const;
export type Region = (typeof REGIONS)[number];

export const ULTRASOUND_GRADES = ['1', '2', '3', 'notDone'] as const;
export type UltrasoundGrade = (typeof ULTRASOUND_GRADES)[number];

const ranged = (range: { min: number; max: number }) => z.number().min(range.min).max(range.max);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const labsSchema = z.object({
  altUL: ranged(PROFILE_RANGES.altUL).optional(),
  astUL: ranged(PROFILE_RANGES.astUL).optional(),
  ultrasoundGrade: z.enum(ULTRASOUND_GRADES).optional(),
  uricAcidMgDl: ranged(PROFILE_RANGES.uricAcidMgDl).optional(),
  /** Local date of the lab test, YYYY-MM-DD. */
  testDate: isoDate.optional(),
});

export type Labs = z.infer<typeof labsSchema>;

export const profileSchema = z.object({
  condition: z.enum(CONDITIONS),
  ageYears: z.number().int().min(PROFILE_RANGES.ageYears.min).max(PROFILE_RANGES.ageYears.max),
  sex: z.enum(SEXES),
  heightCm: ranged(PROFILE_RANGES.heightCm),
  weightKg: ranged(PROFILE_RANGES.weightKg),
  waistCm: ranged(PROFILE_RANGES.waistCm),
  dietType: z.enum(DIET_TYPES),
  region: z.enum(REGIONS),
  labs: labsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

/** Profile fields the user enters (timestamps are set by the store). */
export const profileInputSchema = profileSchema.omit({ createdAt: true, updatedAt: true });
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Which food-rating dimensions apply to a condition. */
export function conditionsFor(condition: Condition): ReadonlyArray<'liver' | 'uricAcid'> {
  switch (condition) {
    case 'fattyLiver':
      return ['liver'];
    case 'uricAcid':
      return ['uricAcid'];
    case 'both':
      return ['liver', 'uricAcid'];
  }
}
