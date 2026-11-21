import { z } from 'zod';

import { CONDITIONS, DIET_TYPES } from '@/shared/profile';

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** `${condition}:${dietType}` of the profile the plan was started for. */
export const planKeySchema = z.templateLiteral([z.enum(CONDITIONS), ':', z.enum(DIET_TYPES)]);

/** Ticks for the current day. `doneItemIds` are plan item ids. */
export const ticksSchema = z.object({
  dateKey: dateKeySchema,
  doneItemIds: z.array(z.string()),
});
export type Ticks = z.infer<typeof ticksSchema>;

/** One finished day in `checklist-history.json`. */
export const historyRowSchema = z.object({
  date: dateKeySchema,
  /** 1-based day since the plan started; above 90 after the plan is over. */
  planDay: z.number().int().positive(),
  done: z.number().int().min(0),
  total: z.number().int().min(0),
  /** Ids of the items that were done. */
  itemIds: z.array(z.string()),
});
export type HistoryRow = z.infer<typeof historyRowSchema>;

export const historySchema = z.array(historyRowSchema);
