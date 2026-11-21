import { addDays } from '@/shared/utils/dates';

import type { HistoryRow } from '../../schema';
import { completionRatio, computeStreak, day90Summary, isDayComplete, weekSummary } from '../stats';

function row(date: string, done: number, total = 6): HistoryRow {
  return { date, planDay: 1, done, total, itemIds: [] };
}

describe('completion', () => {
  it('computes the ratio and treats empty days as 0', () => {
    expect(completionRatio({ done: 3, total: 6 })).toBe(0.5);
    expect(completionRatio({ done: 0, total: 0 })).toBe(0);
  });

  it('marks a day complete at 70% or more', () => {
    expect(isDayComplete({ done: 7, total: 10 })).toBe(true);
    expect(isDayComplete({ done: 6, total: 10 })).toBe(false);
    expect(isDayComplete({ done: 5, total: 6 })).toBe(true); // 83%
    expect(isDayComplete({ done: 4, total: 6 })).toBe(false); // 67%
    expect(isDayComplete({ done: 4, total: 5 })).toBe(true); // 80%
    expect(isDayComplete({ done: 3, total: 5 })).toBe(false); // 60%
    expect(isDayComplete({ done: 0, total: 0 })).toBe(false);
  });
});

describe('computeStreak', () => {
  const today = '2026-03-02';

  it('counts consecutive complete days ending yesterday when today is not done yet', () => {
    const history = [row('2026-02-27', 6), row('2026-02-28', 5), row('2026-03-01', 6)];
    expect(computeStreak(history, today, { done: 1, total: 6 })).toBe(3);
  });

  it('adds today once it reaches 70%', () => {
    const history = [row('2026-02-28', 5), row('2026-03-01', 6)];
    expect(computeStreak(history, today, { done: 5, total: 6 })).toBe(3);
    expect(computeStreak(history, today, { done: 4, total: 6 })).toBe(2);
  });

  it('is broken by a missed (absent) day', () => {
    const history = [row('2026-02-26', 6), row('2026-02-28', 6), row('2026-03-01', 6)];
    expect(computeStreak(history, today)).toBe(2);
  });

  it('is broken by a day below 70%', () => {
    const history = [row('2026-02-27', 6), row('2026-02-28', 2), row('2026-03-01', 6)];
    expect(computeStreak(history, today)).toBe(1);
  });

  it('is 0 when yesterday was missed even if today is not done', () => {
    expect(computeStreak([row('2026-02-28', 6)], today, { done: 0, total: 6 })).toBe(0);
    expect(computeStreak([row('2026-02-28', 6)], today, { done: 6, total: 6 })).toBe(1);
  });

  it('continues across month, year and leap-day boundaries', () => {
    const leap = ['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01'].map(d => row(d, 6));
    expect(computeStreak(leap, '2028-03-02')).toBe(4);
    const newYear = ['2026-12-30', '2026-12-31', '2027-01-01'].map(d => row(d, 6));
    expect(computeStreak(newYear, '2027-01-02', { done: 6, total: 6 })).toBe(4);
  });

  it('counts a long streak', () => {
    const history = Array.from({ length: 120 }, (_, n) => row(addDays('2026-01-01', n), 6));
    expect(computeStreak(history, addDays('2026-01-01', 120))).toBe(120);
  });
});

describe('weekSummary', () => {
  const start = '2026-11-21';
  const history = [
    row('2026-11-21', 6), // day 1: 100%
    row('2026-11-22', 3), // day 2: 50%
    row('2026-11-23', 0), // day 3: 0% (missed)
  ];

  it('summarises finished days of the current week', () => {
    const summary = weekSummary(history, start, 1, '2026-11-24');
    expect(summary).toMatchObject({
      week: 1,
      status: 'current',
      totalDays: 7,
      daysElapsed: 3,
      daysComplete: 1,
    });
    expect(summary.averageCompletion).toBeCloseTo(0.5);
  });

  it('counts days without a row as 0%', () => {
    const summary = weekSummary(history, start, 1, '2026-11-26');
    expect(summary.daysElapsed).toBe(5);
    expect(summary.averageCompletion).toBeCloseTo(1.5 / 5);
  });

  it('reports future weeks as not started', () => {
    const summary = weekSummary(history, start, 2, '2026-11-24');
    expect(summary).toMatchObject({ status: 'notStarted', daysElapsed: 0, daysComplete: 0 });
    expect(summary.averageCompletion).toBeNull();
  });

  it('reports past weeks and week 13 as six days', () => {
    expect(weekSummary(history, start, 1, '2026-12-01').status).toBe('past');
    expect(weekSummary(history, start, 13, '2027-03-01')).toMatchObject({
      status: 'past',
      totalDays: 6,
      daysElapsed: 6,
    });
  });

  it('ignores rows from before the plan start (restart)', () => {
    const withOld = [row('2026-11-20', 6), ...history];
    expect(weekSummary(withOld, start, 1, '2026-11-24').daysComplete).toBe(1);
  });
});

describe('day90Summary', () => {
  it('computes adherence over 90 days and ignores days after the plan', () => {
    const start = '2026-01-01';
    const history = Array.from({ length: 100 }, (_, n) =>
      row(addDays(start, n), n % 2 === 0 ? 6 : 0),
    );
    const summary = day90Summary(history, start, addDays(start, 120));
    expect(summary.daysElapsed).toBe(90);
    expect(summary.daysComplete).toBe(45);
    expect(summary.adherence).toBeCloseTo(0.5);
    expect(summary.averageCompletion).toBeCloseTo(0.5);
  });

  it('counts only finished days on day 90 itself', () => {
    const start = '2026-01-01';
    const history = Array.from({ length: 89 }, (_, n) => row(addDays(start, n), 6));
    const summary = day90Summary(history, start, addDays(start, 89));
    expect(summary.daysElapsed).toBe(89);
    expect(summary.daysComplete).toBe(89);
  });
});
