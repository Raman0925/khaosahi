export { usePlanStore } from './store';
export { useChecklistHistory } from './history';
export type { HistoryRow, Ticks } from './schema';
export {
  initPlanSync,
  reconcilePlanWithProfile,
  restartPlan,
  rolloverPlanDay,
  stopPlanSync,
  toggleChecklistItem,
} from './sync';
export {
  dateOfPlanDay,
  getPlanWeek,
  isPlanFinished,
  parsePlanKey,
  planDay,
  planIdFor,
  planKeyFor,
  rawPlanDay,
  weekDayRange,
  weekFor,
} from './logic/schedule';
export type { PlanKey } from './logic/schedule';
export { checklistForDate, generateDailyChecklist } from './logic/checklist';
export {
  completionRatio,
  computeStreak,
  day90Summary,
  isDayComplete,
  weekSummary,
} from './logic/stats';
export type { Day90Summary, DayResult, WeekStatus, WeekSummary } from './logic/stats';
export { tipOfTheDay } from './logic/tips';
