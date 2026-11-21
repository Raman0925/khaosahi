import type { Plan, PlanItem, PlanWeek } from '@/content/schema';

export function item(
  id: string,
  frequency: PlanItem['frequency'],
  diets?: PlanItem['diets'],
): PlanItem {
  return {
    id,
    text: { en: id, hi: id },
    frequency,
    ...(diets ? { diets } : {}),
    reviewedBy: 'PENDING',
    reviewedOn: null,
  };
}

export function week(n: number, items: PlanItem[]): PlanWeek {
  return {
    week: n,
    title: { en: `Week ${n}`, hi: `हफ़्ता ${n}` },
    focus: { en: `Focus ${n}`, hi: `ध्यान ${n}` },
    items,
  };
}

export function plan(id: Plan['id'], weeks: PlanWeek[]): Plan {
  return { id, title: { en: id, hi: id }, weeks };
}

/** 3 daily + 6 rotating (one non-veg only) in week 1; a different week 3. */
export const testPlan = plan('fattyLiver', [
  week(1, [
    item('d1', 'daily'),
    item('d2', 'daily'),
    item('d3', 'daily'),
    item('r1', 'rotating'),
    item('r2', 'rotating'),
    item('r3', 'rotating'),
    item('r4', 'rotating'),
    item('r5', 'rotating'),
    item('r-fish', 'rotating', ['nonveg']),
  ]),
  week(3, [item('w3-d1', 'daily'), item('w3-r1', 'rotating'), item('w3-r2', 'rotating')]),
]);
