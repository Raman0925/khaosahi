import { PLANS } from '@/content';
import type { Plan, PlanId, PlanItem } from '@/content/schema';
import type { DietType } from '@/shared/profile';
import type { DateKey } from '@/shared/utils/dates';

import { seededShuffle } from './random';
import {
  getPlanWeek,
  parsePlanKey,
  planIdFor,
  type PlanKey,
  rawPlanDay,
  weekFor,
} from './schedule';

export const TARGET_CHECKLIST_ITEMS = 6;
export const MAX_CHECKLIST_ITEMS = 8;

/** Items without `diets` suit every diet; otherwise the user's diet must be listed. */
export function itemSuitsDiet(item: PlanItem, dietType: DietType): boolean {
  return item.diets === undefined || item.diets.includes(dietType);
}

/**
 * Today's checklist. Deterministic: same plan + week + diet + date → same items.
 *
 * - Every `daily` item that suits the diet is included (at most 8).
 * - `rotating` items are picked with a PRNG seeded by (plan id, date) until the list has 6
 *   items (8 when there are more daily items). With fewer items available, all are used.
 * - Items keep the order they have in the content.
 */
export function generateDailyChecklist(
  plan: Plan,
  week: number,
  dietType: DietType,
  dateKey: DateKey,
): PlanItem[] {
  const items = getPlanWeek(plan, week).items.filter(item => itemSuitsDiet(item, dietType));
  const daily = new Set(
    items.filter(item => item.frequency === 'daily').slice(0, MAX_CHECKLIST_ITEMS),
  );
  const rotating = items.filter(item => item.frequency === 'rotating');
  const target = Math.min(MAX_CHECKLIST_ITEMS, Math.max(TARGET_CHECKLIST_ITEMS, daily.size));
  const picked = new Set(
    seededShuffle(rotating, `${plan.id}:${dateKey}`).slice(0, Math.max(0, target - daily.size)),
  );
  return items.filter(item => daily.has(item) || picked.has(item));
}

/** The checklist for a calendar date of the plan identified by `planKey`. */
export function checklistForDate(
  planKey: PlanKey,
  startDate: DateKey,
  dateKey: DateKey,
  plans: Readonly<Record<PlanId, Plan>> = PLANS,
): PlanItem[] {
  const { condition, dietType } = parsePlanKey(planKey);
  const plan = plans[planIdFor(condition)];
  return generateDailyChecklist(plan, weekFor(rawPlanDay(startDate, dateKey)), dietType, dateKey);
}
