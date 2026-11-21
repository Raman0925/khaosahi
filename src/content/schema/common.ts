import { z } from 'zod';

/** Text in both languages. Both are required: a missing translation fails validation. */
export const localizedSchema = z.object({
  en: z.string().trim().min(1),
  hi: z.string().trim().min(1),
});
export type Localized = z.infer<typeof localizedSchema>;

export const PENDING = 'PENDING';

/** Every content item records who reviewed it. Drafts use reviewedBy "PENDING". */
export const reviewSchema = z.object({
  reviewedBy: z.string().trim().min(1),
  /** YYYY-MM-DD, or null while PENDING. */
  reviewedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});

export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are lowercase kebab-case, e.g. "moong-dal"');

/** Diets in order of restriction. A food tagged `veg` suits veg, egg and nonveg users, etc. */
export const DIET_ORDER = ['jain', 'veg', 'egg', 'nonveg'] as const;
export const dietTypeSchema = z.enum(DIET_ORDER);
export type ContentDietType = z.infer<typeof dietTypeSchema>;

/** True if a user on `userDiet` can eat something tagged `itemDiet`. */
export function suitsDiet(itemDiet: ContentDietType, userDiet: ContentDietType): boolean {
  return DIET_ORDER.indexOf(itemDiet) <= DIET_ORDER.indexOf(userDiet);
}
