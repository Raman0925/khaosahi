import { addDays } from '@/shared/utils/dates';

import { checklistForDate } from '../checklist';
import { finaliseDays, MAX_BACKFILL_DAYS } from '../rollover';

import { testPlan } from '../__fixtures__/plan';

const plans = { fattyLiver: testPlan, uricAcid: testPlan, both: testPlan };
const start = '2026-12-30';

describe('finaliseDays', () => {
  it('returns nothing on the same day', () => {
    const ticks = { dateKey: '2026-12-30', doneItemIds: ['d1'] };
    expect(
      finaliseDays({ planKey: 'fattyLiver:veg', startDate: start, ticks, today: start }, plans),
    ).toEqual([]);
  });

  it('finalises the last open day with its ticks', () => {
    const ticks = { dateKey: '2026-12-30', doneItemIds: ['d1', 'd2', 'not-today'] };
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: start, ticks, today: '2026-12-31' },
      plans,
    );
    expect(rows).toEqual([
      { date: '2026-12-30', planDay: 1, done: 2, total: 6, itemIds: ['d1', 'd2'] },
    ]);
  });

  it('adds missed days across a year boundary with 0 done', () => {
    const ticks = { dateKey: '2026-12-30', doneItemIds: ['d1'] };
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: start, ticks, today: '2027-01-02' },
      plans,
    );
    expect(rows.map(r => [r.date, r.planDay, r.done])).toEqual([
      ['2026-12-30', 1, 1],
      ['2026-12-31', 2, 0],
      ['2027-01-01', 3, 0],
    ]);
    rows.forEach(r =>
      expect(r.total).toBe(checklistForDate('fattyLiver:veg', start, r.date, plans).length),
    );
  });

  it('starts from the plan start when there are no ticks', () => {
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: '2028-02-28', ticks: null, today: '2028-03-01' },
      plans,
    );
    expect(rows.map(r => r.date)).toEqual(['2028-02-28', '2028-02-29']);
  });

  it('uses the right week content for long gaps', () => {
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: start, ticks: null, today: addDays(start, 20) },
      plans,
    );
    expect(rows).toHaveLength(20);
    expect(rows[15]?.total).toBe(3); // week 3 has 3 items
  });

  it('keeps counting plan days after day 90', () => {
    const ticks = { dateKey: addDays(start, 95), doneItemIds: [] };
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: start, ticks, today: addDays(start, 96) },
      plans,
    );
    expect(rows[0]?.planDay).toBe(96);
  });

  it('caps back-fill after a big clock jump', () => {
    const rows = finaliseDays(
      { planKey: 'fattyLiver:veg', startDate: start, ticks: null, today: addDays(start, 5000) },
      plans,
    );
    expect(rows).toHaveLength(MAX_BACKFILL_DAYS);
  });
});
