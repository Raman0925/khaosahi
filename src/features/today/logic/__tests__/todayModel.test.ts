import { addDays } from '@/shared/utils/dates';

import { buildTodayModel } from '../todayModel';

const start = '2026-11-21';

describe('buildTodayModel', () => {
  it('builds day 1 with the week-1 title and no ticks', () => {
    const model = buildTodayModel({
      planKey: 'fattyLiver:veg',
      startDate: start,
      ticks: null,
      history: [],
      today: start,
    });
    expect(model).toMatchObject({ day: 1, week: 1, finished: false, done: 0, showDay90: false });
    expect(model.weekTitle?.en).toBe('Week 1: Small steps');
    expect(model.total).toBe(model.items.length);
  });

  it('ignores ticks from another day and ids not in today’s list', () => {
    const model = buildTodayModel({
      planKey: 'uricAcid:nonveg',
      startDate: start,
      ticks: { dateKey: addDays(start, -1), doneItemIds: ['drink-water'] },
      history: [],
      today: start,
    });
    expect(model.done).toBe(0);
    const first = model.items[0]!.id;
    const ticked = buildTodayModel({
      planKey: 'uricAcid:nonveg',
      startDate: start,
      ticks: { dateKey: start, doneItemIds: [first, 'unknown-id'] },
      history: [],
      today: start,
    });
    expect(ticked.done).toBe(1);
    expect(ticked.doneIds.has(first)).toBe(true);
  });

  it('marks the plan finished after day 90 and keeps a checklist', () => {
    const model = buildTodayModel({
      planKey: 'both:jain',
      startDate: start,
      ticks: null,
      history: [],
      today: addDays(start, 100),
    });
    expect(model).toMatchObject({ day: 90, week: 13, finished: true, showDay90: true });
    expect(model.items.length).toBeGreaterThanOrEqual(5);
  });
});
