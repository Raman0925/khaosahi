/**
 * Pure scheduling logic for reminders. No native code here, so it is easy to test.
 *
 * All times are LOCAL wall-clock times. Dates are built from calendar fields
 * (`new Date(y, m, d, h, min)`), never by adding 24 h in milliseconds, so they stay correct
 * across DST changes on devices that have them (India has none, but phones travel).
 */
import { addDays, fromDateKey, type DateKey } from '@/shared/utils/dates';

import type { ReminderSettings, ReminderTime } from './settings';

/** Where a notification tap should take the user. */
export type ReminderTarget = 'today' | 'weighIn' | 'progress';

export type ReminderKind = 'daily' | 'water' | 'weighIn' | 'retest';

export type ScheduledReminder = {
  /** Stable notification id; every id starts with REMINDER_ID_PREFIX. */
  id: string;
  kind: ReminderKind;
  /** First fire time (ms since epoch), always in the future. */
  timestamp: number;
  repeat: 'daily' | 'weekly' | 'none';
  target: ReminderTarget;
};

export const REMINDER_ID_PREFIX = 'reminder.';

/** Water reminders fall between these hours (inclusive). */
export const WATER_START_HOUR = 9;
export const WATER_END_HOUR = 21;
export const WATER_INTERVALS = [2, 3, 4] as const;
export type WaterInterval = (typeof WATER_INTERVALS)[number];

/** Days after the plan start date when the retest reminder fires. */
export const RETEST_AFTER_DAYS = 90;
/** Local time of day for the one-off retest reminder. */
export const RETEST_TIME: ReminderTime = { hour: 9, minute: 0 };

function atTime(base: Date, dayOffset: number, time: ReminderTime): Date {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + dayOffset,
    time.hour,
    time.minute,
  );
}

/** Next time today at `time`, or tomorrow if that moment is not after `now`. */
export function nextDailyTimestamp(now: Date, time: ReminderTime): number {
  const today = atTime(now, 0, time);
  return (today.getTime() > now.getTime() ? today : atTime(now, 1, time)).getTime();
}

/** Next `weekday` (0 = Sunday … 6 = Saturday) at `time`, strictly after `now`. */
export function nextWeeklyTimestamp(now: Date, weekday: number, time: ReminderTime): number {
  const daysAhead = (weekday - now.getDay() + 7) % 7;
  const candidate = atTime(now, daysAhead, time);
  return (
    candidate.getTime() > now.getTime() ? candidate : atTime(now, daysAhead + 7, time)
  ).getTime();
}

/** Hours of the day for water reminders, e.g. every 3 h → 9, 12, 15, 18, 21. */
export function waterHours(interval: WaterInterval): number[] {
  const hours: number[] = [];
  for (let hour = WATER_START_HOUR; hour <= WATER_END_HOUR; hour += interval) {
    hours.push(hour);
  }
  return hours;
}

/** Local date of the retest reminder for a plan, or null when there is no plan. */
export function retestDate(planStartDate: DateKey | null): DateKey | null {
  return planStartDate ? addDays(planStartDate, RETEST_AFTER_DAYS) : null;
}

/** When the retest reminder fires, or null when there is no plan or the moment has passed. */
export function retestTimestamp(planStartDate: DateKey | null, now: Date): number | null {
  const date = retestDate(planStartDate);
  if (!date) {
    return null;
  }
  const at = atTime(fromDateKey(date), 0, RETEST_TIME).getTime();
  return at > now.getTime() ? at : null;
}

/** Every notification that should be scheduled for these settings. */
export function buildSchedule(
  settings: ReminderSettings,
  planStartDate: DateKey | null,
  now: Date,
): ScheduledReminder[] {
  const result: ScheduledReminder[] = [];
  if (settings.daily.enabled) {
    result.push({
      id: `${REMINDER_ID_PREFIX}daily`,
      kind: 'daily',
      timestamp: nextDailyTimestamp(now, settings.daily.time),
      repeat: 'daily',
      target: 'today',
    });
  }
  if (settings.water.enabled) {
    for (const hour of waterHours(settings.water.interval)) {
      result.push({
        id: `${REMINDER_ID_PREFIX}water.${hour}`,
        kind: 'water',
        timestamp: nextDailyTimestamp(now, { hour, minute: 0 }),
        repeat: 'daily',
        target: 'today',
      });
    }
  }
  if (settings.weighIn.enabled) {
    result.push({
      id: `${REMINDER_ID_PREFIX}weighIn`,
      kind: 'weighIn',
      timestamp: nextWeeklyTimestamp(now, settings.weighIn.weekday, settings.weighIn.time),
      repeat: 'weekly',
      target: 'weighIn',
    });
  }
  if (settings.retest.enabled) {
    const timestamp = retestTimestamp(planStartDate, now);
    if (timestamp !== null) {
      result.push({
        id: `${REMINDER_ID_PREFIX}retest`,
        kind: 'retest',
        timestamp,
        repeat: 'none',
        target: 'progress',
      });
    }
  }
  return result;
}

export function isReminderTarget(value: unknown): value is ReminderTarget {
  return value === 'today' || value === 'weighIn' || value === 'progress';
}
