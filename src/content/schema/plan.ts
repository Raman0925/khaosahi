import { z } from 'zod';

import { dietTypeSchema, idSchema, localizedSchema } from './common';

export const PLAN_IDS = ['fattyLiver', 'uricAcid', 'both'] as const;
export const planIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof planIdSchema>;

export const PLAN_WEEKS = 13;
export const PLAN_DAYS = 90;

export const planItemSchema = z.object({
  id: idSchema,
  text: localizedSchema,
  /** `daily` items appear every day of the week; `rotating` ones are picked to fill the list. */
  frequency: z.enum(['daily', 'rotating']),
  /** Diets this item applies to. Omit for all diets. */
  diets: z.array(dietTypeSchema).min(1).optional(),
});

export type PlanItem = z.infer<typeof planItemSchema>;

export const planWeekSchema = z.object({
  week: z.number().int().min(1).max(PLAN_WEEKS),
  title: localizedSchema,
  focus: localizedSchema,
  items: z.array(planItemSchema).min(1),
});

export type PlanWeek = z.infer<typeof planWeekSchema>;

export const planSchema = z.object({
  id: planIdSchema,
  title: localizedSchema,
  weeks: z.array(planWeekSchema),
});

export type Plan = z.infer<typeof planSchema>;
