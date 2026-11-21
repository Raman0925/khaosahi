import React, { useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PLAN_WEEKS } from '@/content/schema';
import type { RootScreenProps } from '@/shared/navigation';
import { useChecklistHistory, weekSummary } from '@/shared/plan';
import { Button, colors, EmptyState, Screen, Text } from '@/shared/ui';

import { WeekRow } from '../components/WeekRow';
import { confirmRestartPlan } from '../restart';
import { usePlanInfo } from '../usePlanInfo';

const WEEKS = Array.from({ length: PLAN_WEEKS }, (_, index) => index + 1);

export function PlanOverviewScreen({ navigation }: RootScreenProps<'PlanOverview'>) {
  const { t } = useTranslation();
  const info = usePlanInfo();
  const history = useChecklistHistory(state => state.rows);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('plan.overviewTitle') });
  }, [navigation, t]);

  const openWeek = useCallback(
    (week: number) => navigation.navigate('WeekSummary', { week }),
    [navigation],
  );

  if (!info) {
    return (
      <Screen testID="plan-overview">
        <EmptyState title={t('plan.noPlanTitle')} body={t('plan.noPlanBody')} />
      </Screen>
    );
  }

  return (
    <Screen testID="plan-overview">
      <Text color={colors.textMuted}>{t('plan.overviewIntro')}</Text>
      {WEEKS.map(week => {
        const { title, focus } = info.weekText(week);
        return (
          <WeekRow
            key={week}
            week={week}
            title={title}
            focus={focus}
            status={weekSummary(history, info.startDate, week, info.today).status}
            onPress={openWeek}
          />
        );
      })}
      <Button
        testID="restart-plan"
        variant="danger"
        title={t('plan.restart')}
        onPress={() => confirmRestartPlan(t)}
      />
    </Screen>
  );
}
