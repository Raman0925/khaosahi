import React, { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { type RootScreenProps, useRootNavigation } from '@/shared/navigation';
import { useChecklistHistory, weekSummary } from '@/shared/plan';
import { Card, colors, EmptyState, Screen, Text } from '@/shared/ui';

import { toPercent } from '../logic/format';
import { usePlanInfo } from '../usePlanInfo';

export function WeekSummaryScreen({ route }: RootScreenProps<'WeekSummary'>) {
  const navigation = useRootNavigation();
  const { t } = useTranslation();
  const { week } = route.params;
  const info = usePlanInfo();
  const history = useChecklistHistory(state => state.rows);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('plan.weekLabel', { week }) });
  }, [navigation, t, week]);

  useEffect(() => {
    useChecklistHistory
      .getState()
      .load()
      .catch(() => undefined);
  }, []);

  if (!info) {
    return (
      <Screen testID="week-summary">
        <EmptyState title={t('plan.noPlanTitle')} body={t('plan.noPlanBody')} />
      </Screen>
    );
  }

  const { title, focus } = info.weekText(week);
  const summary = weekSummary(history, info.startDate, week, info.today);

  return (
    <Screen testID="week-summary">
      <Card>
        <Text variant="caption" weight="medium" color={colors.textMuted}>
          {t(`plan.status.${summary.status}`)}
        </Text>
        <Text variant="heading">{title}</Text>
        <Text>{focus}</Text>
      </Card>
      <Card testID="week-summary-stats">
        {summary.status === 'notStarted' ? (
          <Text>{t('plan.weekNotStarted')}</Text>
        ) : summary.averageCompletion === null ? (
          <Text>{t('plan.noFinishedDays')}</Text>
        ) : (
          <>
            <Text variant="bodyLarge" weight="medium">
              {t('plan.daysCompleted', {
                complete: summary.daysComplete,
                total: summary.totalDays,
              })}
            </Text>
            <Text variant="bodyLarge" weight="medium">
              {t('plan.averageCompletion', { percent: toPercent(summary.averageCompletion) })}
            </Text>
          </>
        )}
        <Text variant="caption" color={colors.textMuted}>
          {t('plan.countNote')}
        </Text>
      </Card>
    </Screen>
  );
}
