import { PLANS } from '@/content';
import type { Plan, PlanId } from '@/content/schema';
import { addDays, type DateKey } from '@/shared/utils/dates';

import type { HistoryRow, Ticks } from '../schema';

import { checklistForDate } from './checklist';
import { type PlanKey, rawPlanDay } from './schedule';

/** Missed days are back-filled for at most this many days (guards against clock jumps). */
export const MAX_BACKFILL_DAYS = 366;

export type FinaliseInput = {
  planKey: PlanKey;
  startDate: DateKey;
  /** Ticks of the last open day, or null if none were kept yet. */
  ticks: Ticks | null;
  today: DateKey;
};

/**
 * History rows for every day from the last open day (or the plan start) up to yesterday.
 * The last open day keeps its ticks; days the app was not opened get 0 done, with the total of
 * the checklist that day would have had. Returns [] when nothing has finished yet.
 */
export function finaliseDays(
  { planKey, startDate, ticks, today }: FinaliseInput,
  plans: Readonly<Record<PlanId, Plan>> = PLANS,
): HistoryRow[] {
  let date = ticks && ticks.dateKey > startDate ? ticks.dateKey : startDate;
  const earliest = addDays(today, -MAX_BACKFILL_DAYS);
  if (date < earliest) {
    date = earliest;
  }
  const rows: HistoryRow[] = [];
  for (; date < today; date = addDays(date, 1)) {
    const items = checklistForDate(planKey, startDate, date, plans);
    const ticked = ticks?.dateKey === date ? new Set(ticks.doneItemIds) : new Set<string>();
    const itemIds = items.filter(item => ticked.has(item.id)).map(item => item.id);
    rows.push({
      date,
      planDay: rawPlanDay(startDate, date),
      done: itemIds.length,
      total: items.length,
      itemIds,
    });
  }
  return rows;
}
