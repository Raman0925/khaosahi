import { PLANS } from '@/content';
import { type Localized, PLAN_DAYS, type PlanItem, type Tip } from '@/content/schema';
import {
  checklistForDate,
  computeStreak,
  getPlanWeek,
  type HistoryRow,
  isDayComplete,
  isPlanFinished,
  parsePlanKey,
  planDay,
  planIdFor,
  type PlanKey,
  rawPlanDay,
  type Ticks,
  tipOfTheDay,
  weekFor,
} from '@/shared/plan';
import type { DateKey } from '@/shared/utils/dates';

export type TodayModel = {
  day: number;
  finished: boolean;
  week: number;
  /** Week title from the content, or null when the week has no content yet. */
  weekTitle: Localized | null;
  items: PlanItem[];
  doneIds: ReadonlySet<string>;
  done: number;
  total: number;
  complete: boolean;
  streak: number;
  tip: Tip;
  /** Show the link to the Day-90 summary (from day 90 on). */
  showDay90: boolean;
};

export function buildTodayModel(input: {
  planKey: PlanKey;
  startDate: DateKey;
  ticks: Ticks | null;
  history: readonly HistoryRow[];
  today: DateKey;
}): TodayModel {
  const { planKey, startDate, ticks, history, today } = input;
  const { condition } = parsePlanKey(planKey);
  const day = planDay(startDate, today);
  const week = weekFor(day);
  const weekContent = getPlanWeek(PLANS[planIdFor(condition)], week);
  const items = checklistForDate(planKey, startDate, today);
  const ticked = new Set(ticks?.dateKey === today ? ticks.doneItemIds : []);
  const doneIds = new Set(items.filter(item => ticked.has(item.id)).map(item => item.id));
  const result = { done: doneIds.size, total: items.length };
  return {
    day,
    finished: isPlanFinished(startDate, today),
    week,
    weekTitle: weekContent.week === week ? weekContent.title : null,
    items,
    doneIds,
    ...result,
    complete: isDayComplete(result),
    streak: computeStreak(history, today, result),
    tip: tipOfTheDay(condition, rawPlanDay(startDate, today)),
    showDay90: day >= PLAN_DAYS,
  };
}
