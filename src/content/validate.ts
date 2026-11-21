import { z } from 'zod';

import {
  articleSchema,
  foodsFileSchema,
  PENDING,
  PLAN_IDS,
  PLAN_WEEKS,
  planSchema,
  TIPS_PER_CONDITION,
  tipsFileSchema,
} from './schema';

/** Words we must never use in content (medical-claim safety). */
const FORBIDDEN = [/\bcure[sd]?\b/i, /\bcuring\b/i, /guarantee/i, /गारंटी/, /पक्का इलाज/];

export type ContentInput = {
  foods: unknown;
  plans: Record<string, unknown>;
  tips: Record<string, unknown>;
  articles: unknown[];
};

export type ValidationResult = { errors: string[]; warnings: string[]; pendingCount: number };

function issues(prefix: string, error: z.ZodError): string[] {
  return error.issues.map(i => `${prefix}: ${i.path.join('.')} ${i.message}`);
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(v => collectStrings(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(v => collectStrings(v, out));
  }
}

function countPending(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, v) => sum + countPending(v), 0);
  }
  if (value && typeof value === 'object') {
    const own = (value as { reviewedBy?: unknown }).reviewedBy === PENDING ? 1 : 0;
    return own + Object.values(value).reduce<number>((sum, v) => sum + countPending(v), 0);
  }
  return 0;
}

/**
 * Validates all bundled content. `release` mode also enforces full counts
 * (13 plan weeks, 90 tips per condition). `reviewedBy` is informational only: content ships
 * without an external dietitian review (ADR-005), so PENDING items are reported, never errors.
 */
export function validateContent(
  input: ContentInput,
  options: { release: boolean },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const foods = foodsFileSchema.safeParse(input.foods);
  if (!foods.success) {
    errors.push(...issues('foods.json', foods.error));
  } else {
    const ids = new Set<string>();
    for (const food of foods.data) {
      if (ids.has(food.id)) {
        errors.push(`foods.json: duplicate id "${food.id}"`);
      }
      ids.add(food.id);
    }
    for (const food of foods.data) {
      for (const swap of food.swaps) {
        if (!ids.has(swap)) {
          errors.push(`foods.json: "${food.id}" swaps to unknown id "${swap}"`);
        }
        if (swap === food.id) {
          errors.push(`foods.json: "${food.id}" swaps to itself`);
        }
      }
    }
  }

  for (const planId of PLAN_IDS) {
    const raw = input.plans[planId];
    const plan = planSchema.safeParse(raw);
    if (!plan.success) {
      errors.push(...issues(`plans/${planId}.json`, plan.error));
      continue;
    }
    if (plan.data.id !== planId) {
      errors.push(`plans/${planId}.json: id is "${plan.data.id}"`);
    }
    const weekNumbers = plan.data.weeks.map(w => w.week);
    weekNumbers.forEach((week, index) => {
      if (week !== index + 1) {
        errors.push(`plans/${planId}.json: weeks must be numbered 1..n in order`);
      }
    });
    if (weekNumbers.length !== PLAN_WEEKS) {
      (options.release ? errors : warnings).push(
        `plans/${planId}.json: has ${weekNumbers.length}/${PLAN_WEEKS} weeks`,
      );
    }
    for (const week of plan.data.weeks) {
      const ids = week.items.map(i => i.id);
      if (new Set(ids).size !== ids.length) {
        errors.push(`plans/${planId}.json week ${week.week}: duplicate item ids`);
      }
    }
  }

  for (const condition of ['fattyLiver', 'uricAcid'] as const) {
    const tips = tipsFileSchema.safeParse(input.tips[condition]);
    if (!tips.success) {
      errors.push(...issues(`tips/${condition}.json`, tips.error));
      continue;
    }
    if (tips.data.condition !== condition) {
      errors.push(`tips/${condition}.json: condition is "${tips.data.condition}"`);
    }
    const ids = tips.data.tips.map(t => t.id);
    if (new Set(ids).size !== ids.length) {
      errors.push(`tips/${condition}.json: duplicate tip ids`);
    }
    if (ids.length < TIPS_PER_CONDITION) {
      (options.release ? errors : warnings).push(
        `tips/${condition}.json: has ${ids.length}/${TIPS_PER_CONDITION} tips`,
      );
    }
  }

  const articleIds = new Set<string>();
  input.articles.forEach((raw, index) => {
    const article = articleSchema.safeParse(raw);
    if (!article.success) {
      errors.push(...issues(`articles[${index}]`, article.error));
      return;
    }
    if (articleIds.has(article.data.id)) {
      errors.push(`articles: duplicate id "${article.data.id}"`);
    }
    articleIds.add(article.data.id);
  });

  const strings: string[] = [];
  collectStrings(input, strings);
  for (const text of strings) {
    for (const pattern of FORBIDDEN) {
      if (pattern.test(text)) {
        errors.push(`forbidden wording ${pattern} in: "${text.slice(0, 80)}"`);
      }
    }
  }

  const pendingCount = countPending(input);
  if (pendingCount > 0) {
    warnings.push(`${pendingCount} content items have no external review (reviewedBy "PENDING")`);
  }

  return { errors, warnings, pendingCount };
}
