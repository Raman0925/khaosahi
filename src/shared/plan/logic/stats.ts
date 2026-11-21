import { PLAN_DAYS } from '@/content/schema';
import { addDays, type DateKey } from '@/shared/utils/dates';

import type { HistoryRow } from '../schema';

import { dateOfPlanDay, weekDayRange } from './schedule';

/** Percentage of items needed for a day to count as complete. */
export const COMPLETE_PERCENT = 70;

export type DayResult = { done: number; total: number };

/** Fraction of items done, 0..1. A day without items counts as 0. */
export function completionRatio({ done, total }: DayResult): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, done / total));
}

/** A day is complete when at least 70% of its items are done. */
export function isDayComplete({ done, total }: DayResult): boolean {
  // Integer maths so 7 of 10 is exactly 70%.
  return total > 0 && done * 100 >= total * COMPLETE_PERCENT;
}

function rowsByDate(history: readonly HistoryRow[]): Map<DateKey, HistoryRow> {
  return new Map(history.map(row => [row.date, row]));
}

/**
 * Consecutive complete days ending today or yesterday. Today counts once it reaches 70%
 * (`todayResult`); until then the streak up to yesterday still shows. A day with no row
 * (app not opened and not finalised) or below 70% breaks the streak.
 */
export function computeStreak(
  history: readonly HistoryRow[],
  today: DateKey,
  todayResult?: DayResult,
): number {
  const byDate = rowsByDate(history);
  const todayDay = todayResult ?? byDate.get(today);
  let streak = todayDay && isDayComplete(todayDay) ? 1 : 0;
  let date = addDays(today, -1);
  for (let row = byDate.get(date); row && isDayComplete(row); row = byDate.get(date)) {
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}

export type PeriodSummary = {
  /** Days in the period (7, or 6 for week 13; 90 for the whole plan). */
  totalDays: number;
  /** Finished days (before today) in the period. */
  daysElapsed: number;
  daysComplete: number;
  /** Average completion over finished days, 0..1; `null` when no day has finished. */
  averageCompletion: number | null;
};

export type WeekStatus = 'notStarted' | 'current' | 'past';

export type WeekSummary = PeriodSummary & { week: number; status: WeekStatus };

/** Summary of plan days `first..last`, counting only days before `today`. */
function summarisePeriod(
  history: readonly HistoryRow[],
  startDate: DateKey,
  first: number,
  last: number,
  today: DateKey,
): PeriodSummary {
  const byDate = rowsByDate(history);
  let daysElapsed = 0;
  let daysComplete = 0;
  let completionSum = 0;
  for (let day = first; day <= last; day += 1) {
    const date = dateOfPlanDay(startDate, day);
    if (date >= today) {
      break;
    }
    daysElapsed += 1;
    const row = byDate.get(date);
    if (row) {
      completionSum += completionRatio(row);
      daysComplete += isDayComplete(row) ? 1 : 0;
    }
  }
  return {
    totalDays: last - first + 1,
    daysElapsed,
    daysComplete,
    averageCompletion: daysElapsed > 0 ? completionSum / daysElapsed : null,
  };
}

/** Days completed and average completion for one week of the plan (finished days only). */
export function weekSummary(
  history: readonly HistoryRow[],
  startDate: DateKey,
  week: number,
  today: DateKey,
): WeekSummary {
  const { first, last } = weekDayRange(week);
  const firstDate = dateOfPlanDay(startDate, first);
  const lastDate = dateOfPlanDay(startDate, last);
  const status: WeekStatus =
    today < firstDate ? 'notStarted' : today > lastDate ? 'past' : 'current';
  return { week, status, ...summarisePeriod(history, startDate, first, last, today) };
}

export type Day90Summary = PeriodSummary & {
  /** Complete days out of all 90 days, 0..1. */
  adherence: number;
};

/** Adherence over the whole 90-day plan (finished days only). */
export function day90Summary(
  history: readonly HistoryRow[],
  startDate: DateKey,
  today: DateKey,
): Day90Summary {
  const summary = summarisePeriod(history, startDate, 1, PLAN_DAYS, today);
  return { ...summary, adherence: summary.daysComplete / PLAN_DAYS };
}
