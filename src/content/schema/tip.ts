import { z } from 'zod';

import { idSchema, localizedSchema, reviewSchema } from './common';

export const TIP_CONDITIONS = ['fattyLiver', 'uricAcid'] as const;

export const tipSchema = z
  .object({
    id: idSchema,
    text: localizedSchema,
  })
  .extend(reviewSchema.shape);

export type Tip = z.infer<typeof tipSchema>;

/** One file per condition: content/tips/<condition>.json */
export const tipsFileSchema = z.object({
  condition: z.enum(TIP_CONDITIONS),
  tips: z.array(tipSchema).min(1),
});

export type TipsFile = z.infer<typeof tipsFileSchema>;

export const TIPS_PER_CONDITION = 90;
