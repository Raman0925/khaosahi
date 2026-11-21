import { useTranslation } from 'react-i18next';

import { PLANS } from '@/content';
import type { Plan } from '@/content/schema';
import { getPlanWeek, parsePlanKey, planIdFor, usePlanStore } from '@/shared/plan';
import { type DateKey, todayKey } from '@/shared/utils/dates';

export type PlanInfo = {
  plan: Plan;
  startDate: DateKey;
  today: DateKey;
  /** Title and focus of a week in the current language. */
  weekText: (week: number) => { title: string; focus: string };
};

/** The current plan, or null before a plan exists. */
export function usePlanInfo(): PlanInfo | null {
  const { t, i18n } = useTranslation();
  const startDate = usePlanStore(state => state.startDate);
  const planKey = usePlanStore(state => state.planKey);
  if (!startDate || !planKey) {
    return null;
  }
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const plan = PLANS[planIdFor(parsePlanKey(planKey).condition)];
  return {
    plan,
    startDate,
    today: todayKey(),
    weekText: week => {
      const content = getPlanWeek(plan, week);
      return {
        // Weeks not written yet borrow an earlier week's items; show a plain title for them.
        title: content.week === week ? content.title[lang] : t('plan.weekLabel', { week }),
        focus: content.focus[lang],
      };
    },
  };
}
