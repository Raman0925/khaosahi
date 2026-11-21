import { z } from 'zod';

import { idSchema, localizedSchema } from './common';

/** Simple rich text: headings, paragraphs and bullet lists only. */
export const articleBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), text: z.string().trim().min(1) }),
  z.object({ type: z.literal('paragraph'), text: z.string().trim().min(1) }),
  z.object({ type: z.literal('bullets'), items: z.array(z.string().trim().min(1)).min(1) }),
]);

export type ArticleBlock = z.infer<typeof articleBlockSchema>;

export const ARTICLE_TOPICS = ['fattyLiver', 'uricAcid', 'general'] as const;

export const articleSchema = z.object({
  id: idSchema,
  topics: z.array(z.enum(ARTICLE_TOPICS)).min(1),
  title: localizedSchema,
  summary: localizedSchema,
  readMinutes: z.number().int().min(1).max(30),
  /**
   * Optional extras ("7-day sample menu", "Festival food guide") unlocked with a rewarded ad.
   * Never use this for safety information, ratings or the disclaimer.
   */
  rewardedExtra: z.boolean().default(false),
  body: z.object({
    en: z.array(articleBlockSchema).min(1),
    hi: z.array(articleBlockSchema).min(1),
  }),
});

export type Article = z.infer<typeof articleSchema>;
