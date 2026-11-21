import { z } from 'zod';

import { dietTypeSchema, idSchema, localizedSchema } from './common';

export const RATINGS = ['good', 'limit', 'avoid'] as const;
export const ratingSchema = z.enum(RATINGS);
export type Rating = z.infer<typeof ratingSchema>;

/** Stricter ratings sort first: avoid > limit > good. */
export const RATING_SEVERITY: Record<Rating, number> = { good: 0, limit: 1, avoid: 2 };

export const PURINE_LEVELS = ['low', 'moderate', 'high'] as const;

export const FOOD_CATEGORIES = [
  'cereals',
  'pulses',
  'vegetables',
  'fruits',
  'dairy',
  'eggs',
  'meat',
  'fish',
  'nutsSeeds',
  'oilsFats',
  'sweets',
  'snacks',
  'beverages',
  'spices',
  'dishes',
] as const;
export const foodCategorySchema = z.enum(FOOD_CATEGORIES);
export type FoodCategory = z.infer<typeof foodCategorySchema>;

const conditionRatingSchema = z.object({
  rating: ratingSchema,
  reason: localizedSchema,
  portion: localizedSchema,
});

export const foodSchema = z.object({
  id: idSchema,
  category: foodCategorySchema,
  /** Most restrictive diet this food suits (jain ⊂ veg ⊂ egg ⊂ nonveg). */
  dietType: dietTypeSchema,
  name: localizedSchema,
  aliases: z.object({
    en: z.array(z.string().trim().min(1)),
    hi: z.array(z.string().trim().min(1)),
    hinglish: z.array(z.string().trim().min(1)),
  }),
  liver: conditionRatingSchema,
  uricAcid: conditionRatingSchema.extend({ purine: z.enum(PURINE_LEVELS) }),
  /** Ids of healthier alternatives. Must exist in foods.json. */
  swaps: z.array(idSchema),
});

export type Food = z.infer<typeof foodSchema>;

export const foodsFileSchema = z.array(foodSchema);
