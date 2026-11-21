import {
  buildSchedule,
  isReminderTarget,
  nextDailyTimestamp,
  nextWeeklyTimestamp,
  retestDate,
  retestTimestamp,
  waterHours,
} from '../schedule';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from '../settings';

/** Local wall-clock date (month is 1-based here for readability). */
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

describe('nextDailyTimestamp', () => {
  it('returns today when the time is still ahead', () => {
    const now = local(2026, 11, 21, 7, 30);
    expect(nextDailyTimestamp(now, { hour: 8, minute: 0 })).toBe(local(2026, 11, 21, 8).getTime());
  });

  it('moves to tomorrow when the time already passed today', () => {
    const now = local(2026, 11, 21, 20, 0);
    expect(nextDailyTimestamp(now, { hour: 8, minute: 0 })).toBe(local(2026, 11, 22, 8).getTime());
  });

  it('moves to tomorrow when the time is exactly now', () => {
    const now = local(2026, 11, 21, 8, 0);
    expect(nextDailyTimestamp(now, { hour: 8, minute: 0 })).toBe(local(2026, 11, 22, 8).getTime());
  });

  it('rolls over month and year ends', () => {
    expect(nextDailyTimestamp(local(2026, 12, 31, 23, 0), { hour: 6, minute: 15 })).toBe(
      local(2027, 1, 1, 6, 15).getTime(),
    );
    expect(nextDailyTimestamp(local(2028, 2, 28, 23, 0), { hour: 6, minute: 0 })).toBe(
      local(2028, 2, 29, 6).getTime(),
    );
  });

  it('keeps the local wall-clock time (built from calendar fields, not +24h)', () => {
    // Whatever the device time zone, the result is 08:00 local on the next day.
    const result = new Date(nextDailyTimestamp(local(2026, 3, 28, 22), { hour: 8, minute: 0 }));
    expect([result.getDate(), result.getHours(), result.getMinutes()]).toEqual([29, 8, 0]);
  });
});

describe('nextWeeklyTimestamp', () => {
  // 21 Nov 2026 is a Saturday (getDay() === 6).
  const saturdayMorning = local(2026, 11, 21, 7, 0);

  it('finds the same day later today', () => {
    expect(nextWeeklyTimestamp(saturdayMorning, 6, { hour: 9, minute: 0 })).toBe(
      local(2026, 11, 21, 9).getTime(),
    );
  });

  it('moves a week ahead when today’s time has passed', () => {
    expect(nextWeeklyTimestamp(saturdayMorning, 6, { hour: 6, minute: 0 })).toBe(
      local(2026, 11, 28, 6).getTime(),
    );
  });

  it('finds the next weekday across the week boundary', () => {
    expect(nextWeeklyTimestamp(saturdayMorning, 0, { hour: 8, minute: 0 })).toBe(
      local(2026, 11, 22, 8).getTime(),
    );
    expect(nextWeeklyTimestamp(saturdayMorning, 5, { hour: 8, minute: 0 })).toBe(
      local(2026, 11, 27, 8).getTime(),
    );
  });

  it('always lands on the requested weekday', () => {
    for (let weekday = 0; weekday < 7; weekday++) {
      const result = new Date(
        nextWeeklyTimestamp(saturdayMorning, weekday, { hour: 8, minute: 0 }),
      );
      expect(result.getDay()).toBe(weekday);
      expect(result.getTime()).toBeGreaterThan(saturdayMorning.getTime());
    }
  });
});

describe('waterHours', () => {
  it('spreads reminders between 9:00 and 21:00', () => {
    expect(waterHours(2)).toEqual([9, 11, 13, 15, 17, 19, 21]);
    expect(waterHours(3)).toEqual([9, 12, 15, 18, 21]);
    expect(waterHours(4)).toEqual([9, 13, 17, 21]);
  });
});

describe('retest', () => {
  it('is 90 days after the plan start', () => {
    expect(retestDate('2026-11-01')).toBe('2027-01-30');
    expect(retestDate(null)).toBeNull();
  });

  it('fires at 09:00 local on the retest date, only if still ahead', () => {
    expect(retestTimestamp('2026-11-01', local(2026, 11, 21))).toBe(
      local(2027, 1, 30, 9).getTime(),
    );
    expect(retestTimestamp('2026-11-01', local(2027, 1, 30, 10))).toBeNull();
    expect(retestTimestamp(null, local(2026, 11, 21))).toBeNull();
  });
});

describe('buildSchedule', () => {
  const now = local(2026, 11, 21, 10, 0);
  const all: ReminderSettings = {
    daily: { enabled: true, time: { hour: 20, minute: 30 } },
    water: { enabled: true, interval: 4 },
    weighIn: { enabled: true, weekday: 1, time: { hour: 7, minute: 0 } },
    retest: { enabled: true },
  };

  it('schedules nothing by default', () => {
    expect(buildSchedule(DEFAULT_REMINDER_SETTINGS, '2026-11-01', now)).toEqual([]);
  });

  it('schedules every enabled reminder with stable ids and targets', () => {
    const schedule = buildSchedule(all, '2026-11-01', now);
    expect(schedule.map(r => [r.id, r.repeat, r.target])).toEqual([
      ['reminder.daily', 'daily', 'today'],
      ['reminder.water.9', 'daily', 'today'],
      ['reminder.water.13', 'daily', 'today'],
      ['reminder.water.17', 'daily', 'today'],
      ['reminder.water.21', 'daily', 'today'],
      ['reminder.weighIn', 'weekly', 'weighIn'],
      ['reminder.retest', 'none', 'progress'],
    ]);
    expect(schedule.every(r => r.timestamp > now.getTime())).toBe(true);
    // 9:00 water already passed at 10:00 → tomorrow; 13:00 is today.
    const at = (id: string) => schedule.find(r => r.id === id)?.timestamp;
    expect(at('reminder.water.9')).toBe(local(2026, 11, 22, 9).getTime());
    expect(at('reminder.water.13')).toBe(local(2026, 11, 21, 13).getTime());
    expect(at('reminder.weighIn')).toBe(local(2026, 11, 23, 7).getTime());
  });

  it('skips the retest without a plan', () => {
    const schedule = buildSchedule(all, null, now);
    expect(schedule.find(r => r.kind === 'retest')).toBeUndefined();
  });
});

describe('isReminderTarget', () => {
  it('accepts only known targets', () => {
    expect(isReminderTarget('today')).toBe(true);
    expect(isReminderTarget('weighIn')).toBe(true);
    expect(isReminderTarget('progress')).toBe(true);
    expect(isReminderTarget('Settings')).toBe(false);
    expect(isReminderTarget(undefined)).toBe(false);
  });
});
