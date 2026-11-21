import { PLAN_DAYS, PLAN_WEEKS, type Plan, type PlanId, type PlanWeek } from '@/content/schema';
import type { Condition, DietType } from '@/shared/profile';
import { addDays, type DateKey, daysBetween } from '@/shared/utils/dates';

export const DAYS_PER_WEEK = 7;

/** Identifies the plan a user is on. A change of condition or diet restarts the plan. */
export type PlanKey = `${Condition}:${DietType}`;

export function planKeyFor(profile: { condition: Condition; dietType: DietType }): PlanKey {
  return `${profile.condition}:${profile.dietType}`;
}

export function parsePlanKey(key: PlanKey): { condition: Condition; dietType: DietType } {
  const [condition, dietType] = key.split(':') as [Condition, DietType];
  return { condition, dietType };
}

export function planIdFor(condition: Condition): PlanId {
  switch (condition) {
    case 'fattyLiver':
      return 'fattyLiver';
    case 'uricAcid':
      return 'uricAcid';
    case 'both':
      return 'both';
  }
}

/**
 * Days since the plan started, 1-based and NOT clamped: day 1 is `startDate`, day 91 is the day
 * after the plan ends. Dates before the start (clock changed) count as day 1.
 */
export function rawPlanDay(startDate: DateKey, today: DateKey): number {
  return Math.max(1, daysBetween(startDate, today) + 1);
}

/** Plan day shown to the user, 1..90. After day 90 it stays at 90 (see `isPlanFinished`). */
export function planDay(startDate: DateKey, today: DateKey): number {
  return Math.min(PLAN_DAYS, rawPlanDay(startDate, today));
}

/** True once all 90 days are over (from day 91 on). */
export function isPlanFinished(startDate: DateKey, today: DateKey): boolean {
  return rawPlanDay(startDate, today) > PLAN_DAYS;
}

/** Week 1..13 for a plan day. Days 85–90 (and anything later) are week 13. */
export function weekFor(day: number): number {
  return Math.min(PLAN_WEEKS, Math.max(1, Math.ceil(day / DAYS_PER_WEEK)));
}

/** First and last plan day of a week. Week 13 is six days long (85–90). */
export function weekDayRange(week: number): { first: number; last: number } {
  const first = (week - 1) * DAYS_PER_WEEK + 1;
  return { first, last: Math.min(PLAN_DAYS, first + DAYS_PER_WEEK - 1) };
}

/** Local date of a plan day. */
export function dateOfPlanDay(startDate: DateKey, day: number): DateKey {
  return addDays(startDate, day - 1);
}

/**
 * Content for a week. Weeks missing from the content fall back to the last available week
 * before it (or the first week when none is earlier).
 */
export function getPlanWeek(plan: Plan, week: number): PlanWeek {
  const sorted = [...plan.weeks].sort((a, b) => a.week - b.week);
  const exact = sorted.find(item => item.week === week);
  if (exact) {
    return exact;
  }
  const earlier = sorted.filter(item => item.week < week);
  const fallback = earlier[earlier.length - 1] ?? sorted[0];
  if (!fallback) {
    throw new Error(`Plan ${plan.id} has no weeks`);
  }
  return fallback;
}
