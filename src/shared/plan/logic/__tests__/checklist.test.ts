import { PLANS } from '@/content';
import { DIET_TYPES } from '@/shared/profile';
import { addDays } from '@/shared/utils/dates';

import { checklistForDate, generateDailyChecklist } from '../checklist';
import { seededShuffle } from '../random';

import { item, plan, testPlan, week } from '../__fixtures__/plan';

const ids = (items: { id: string }[]) => items.map(i => i.id);

describe('generateDailyChecklist', () => {
  it('is deterministic for the same input', () => {
    const a = generateDailyChecklist(testPlan, 1, 'veg', '2026-11-21');
    const b = generateDailyChecklist(testPlan, 1, 'veg', '2026-11-21');
    expect(ids(a)).toEqual(ids(b));
  });

  it('includes every daily item and fills to 6 with rotating items', () => {
    const list = generateDailyChecklist(testPlan, 1, 'veg', '2026-11-21');
    expect(list).toHaveLength(6);
    expect(ids(list).slice(0, 3)).toEqual(['d1', 'd2', 'd3']);
    expect(list.filter(i => i.frequency === 'rotating')).toHaveLength(3);
  });

  it('rotates items across dates', () => {
    const lists = new Set(
      Array.from({ length: 14 }, (_, n) =>
        ids(generateDailyChecklist(testPlan, 1, 'veg', addDays('2026-11-21', n))).join(','),
      ),
    );
    expect(lists.size).toBeGreaterThan(1);
  });

  it('filters items by diet (omitted diets = all diets)', () => {
    for (let n = 0; n < 30; n += 1) {
      const date = addDays('2026-11-21', n);
      expect(ids(generateDailyChecklist(testPlan, 1, 'veg', date))).not.toContain('r-fish');
      expect(ids(generateDailyChecklist(testPlan, 1, 'jain', date))).not.toContain('r-fish');
    }
    const nonvegDays = Array.from({ length: 30 }, (_, n) =>
      ids(generateDailyChecklist(testPlan, 1, 'nonveg', addDays('2026-11-21', n))),
    );
    expect(nonvegDays.some(list => list.includes('r-fish'))).toBe(true);
  });

  it('uses all items when fewer than 6 are available', () => {
    expect(ids(generateDailyChecklist(testPlan, 3, 'veg', '2026-11-21'))).toEqual([
      'w3-d1',
      'w3-r1',
      'w3-r2',
    ]);
  });

  it('caps the list at 8 even with more daily items', () => {
    const many = plan('uricAcid', [
      week(
        1,
        Array.from({ length: 10 }, (_, n) => item(`d${n}`, 'daily')).concat(item('r', 'rotating')),
      ),
    ]);
    const list = generateDailyChecklist(many, 1, 'veg', '2026-11-21');
    expect(ids(list)).toEqual(['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']);
  });

  it('falls back to the last available week for missing weeks', () => {
    expect(ids(generateDailyChecklist(testPlan, 2, 'veg', '2026-11-21'))).toContain('d1');
  });

  it('gives 5–8 items for every bundled plan, diet and week', () => {
    for (const p of Object.values(PLANS)) {
      for (const diet of DIET_TYPES) {
        for (let w = 1; w <= 13; w += 1) {
          const n = generateDailyChecklist(p, w, diet, '2026-11-21').length;
          expect(n).toBeGreaterThanOrEqual(5);
          expect(n).toBeLessThanOrEqual(8);
        }
      }
    }
  });
});

describe('checklistForDate', () => {
  it('uses the plan week of the date', () => {
    const plans = { fattyLiver: testPlan, uricAcid: testPlan, both: testPlan };
    expect(ids(checklistForDate('fattyLiver:veg', '2026-11-01', '2026-11-15', plans))).toEqual([
      'w3-d1',
      'w3-r1',
      'w3-r2',
    ]);
  });
});

describe('seededShuffle', () => {
  it('is a permutation and stable per seed', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = seededShuffle(input, 'seed');
    expect([...out].sort()).toEqual(input);
    expect(seededShuffle(input, 'seed')).toEqual(out);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
