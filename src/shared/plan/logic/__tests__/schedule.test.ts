import {
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
} from '../schedule';

import { testPlan } from '../__fixtures__/plan';

describe('planIdFor / planKey', () => {
  it('maps each condition to its plan', () => {
    expect(planIdFor('fattyLiver')).toBe('fattyLiver');
    expect(planIdFor('uricAcid')).toBe('uricAcid');
    expect(planIdFor('both')).toBe('both');
  });

  it('round-trips the plan key', () => {
    const key = planKeyFor({ condition: 'both', dietType: 'jain' });
    expect(key).toBe('both:jain');
    expect(parsePlanKey(key)).toEqual({ condition: 'both', dietType: 'jain' });
  });
});

describe('planDay', () => {
  it('is 1 on the start date and counts calendar days', () => {
    expect(planDay('2026-11-21', '2026-11-21')).toBe(1);
    expect(planDay('2026-11-21', '2026-11-22')).toBe(2);
  });

  it('crosses month and year boundaries', () => {
    expect(planDay('2026-12-30', '2027-01-02')).toBe(4);
    expect(planDay('2026-01-31', '2026-02-01')).toBe(2);
  });

  it('handles leap days', () => {
    expect(planDay('2028-02-28', '2028-03-01')).toBe(3);
    expect(planDay('2027-02-28', '2027-03-01')).toBe(2);
  });

  it('is day 90 on the last day and stays at 90 afterwards, with a finished flag', () => {
    const start = '2026-11-21';
    expect(dateOfPlanDay(start, 90)).toBe('2027-02-18');
    expect(planDay(start, '2027-02-18')).toBe(90);
    expect(isPlanFinished(start, '2027-02-18')).toBe(false);
    expect(planDay(start, '2027-02-19')).toBe(90);
    expect(rawPlanDay(start, '2027-02-19')).toBe(91);
    expect(isPlanFinished(start, '2027-02-19')).toBe(true);
    expect(planDay(start, '2028-01-01')).toBe(90);
  });

  it('treats dates before the start (clock moved back) as day 1', () => {
    expect(planDay('2026-11-21', '2026-11-01')).toBe(1);
    expect(isPlanFinished('2026-11-21', '2026-11-01')).toBe(false);
  });
});

describe('weekFor', () => {
  it.each([
    [1, 1],
    [7, 1],
    [8, 2],
    [84, 12],
    [85, 13],
    [90, 13],
    [120, 13],
    [0, 1],
  ])('day %i is week %i', (day, expected) => {
    expect(weekFor(day)).toBe(expected);
  });

  it('gives week ranges; week 13 is six days', () => {
    expect(weekDayRange(1)).toEqual({ first: 1, last: 7 });
    expect(weekDayRange(12)).toEqual({ first: 78, last: 84 });
    expect(weekDayRange(13)).toEqual({ first: 85, last: 90 });
  });
});

describe('getPlanWeek', () => {
  it('returns the exact week when present', () => {
    expect(getPlanWeek(testPlan, 3).week).toBe(3);
  });

  it('falls back to the last available earlier week', () => {
    expect(getPlanWeek(testPlan, 2).week).toBe(1);
    expect(getPlanWeek(testPlan, 13).week).toBe(3);
  });
});
