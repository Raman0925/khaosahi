import React, { useEffect, useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PLAN_DAYS } from '@/content/schema';
import { useRootNavigation } from '@/shared/navigation';
import { day90Summary, planDay, useChecklistHistory } from '@/shared/plan';
import { usePreferences } from '@/shared/preferences/store';
import { type ProgressEntry, useProgressStore } from '@/shared/progress';
import { Button, Card, colors, EmptyState, Screen, spacing, Text } from '@/shared/ui';

import { displayValue, toPercent } from '../logic/format';
import { metricComparison, SUMMARY_METRICS } from '../logic/metrics';
import { confirmRestartPlan } from '../restart';
import { usePlanInfo } from '../usePlanInfo';

export function Day90SummaryScreen() {
  const navigation = useRootNavigation();
  const { t } = useTranslation();
  const info = usePlanInfo();
  const history = useChecklistHistory(state => state.rows);
  const entries = useProgressStore(state => state.entries);
  const weightUnit = usePreferences(state => state.weightUnit);
  const lengthUnit = usePreferences(state => state.lengthUnit);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('plan.day90.title') });
  }, [navigation, t]);

  useEffect(() => {
    useProgressStore
      .getState()
      .load()
      .catch(() => undefined);
    useChecklistHistory
      .getState()
      .load()
      .catch(() => undefined);
  }, []);

  if (!info) {
    return (
      <Screen testID="day90-summary">
        <EmptyState title={t('plan.noPlanTitle')} body={t('plan.noPlanBody')} />
      </Screen>
    );
  }

  const day = planDay(info.startDate, info.today);
  const summary = day90Summary(history, info.startDate, info.today);
  const format = (entry: ProgressEntry) => {
    const { amount, unit } = displayValue(entry.metric, entry.value, { weightUnit, lengthUnit });
    return unit ? `${amount} ${t(`common.units.${unit}`)}` : String(amount);
  };

  return (
    <Screen testID="day90-summary">
      {day < PLAN_DAYS ? (
        <Text color={colors.textMuted}>{t('plan.day90.notYet', { day })}</Text>
      ) : null}

      <Card testID="day90-adherence">
        <Text variant="bodyLarge" weight="medium">
          {t('plan.day90.adherence', {
            complete: summary.daysComplete,
            total: PLAN_DAYS,
            percent: toPercent(summary.adherence),
          })}
        </Text>
        {summary.averageCompletion !== null ? (
          <Text>{t('plan.day90.average', { percent: toPercent(summary.averageCompletion) })}</Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">{t('plan.day90.measurements')}</Text>
        <Text variant="caption" color={colors.textMuted}>
          {t('plan.day90.measurementsNote')}
        </Text>
        {SUMMARY_METRICS.map(metric => {
          const name = t(`plan.day90.metrics.${metric}`);
          const comparison = metricComparison(entries, metric, info.startDate);
          let value: string;
          let label: string;
          if (!comparison) {
            value = t('plan.day90.notLogged');
            label = `${name}: ${value}`;
          } else if (!comparison.latest) {
            value = t('plan.day90.oneReading', { value: format(comparison.first) });
            label = `${name}: ${value}`;
          } else {
            const first = format(comparison.first);
            const latest = format(comparison.latest);
            value = t('plan.day90.firstLatest', { first, latest });
            label = t('plan.day90.firstLatestA11y', { metric: name, first, latest });
          }
          return (
            <View
              key={metric}
              testID={`day90-metric-${metric}`}
              style={styles.metricRow}
              accessible
              accessibilityLabel={label}
            >
              <Text weight="medium">{name}</Text>
              <Text>{value}</Text>
            </View>
          );
        })}
      </Card>

      <Card>
        <Text variant="heading">{t('plan.day90.doctorTitle')}</Text>
        <Text>{t('plan.day90.doctorBody')}</Text>
        <Text color={colors.textMuted}>{t('plan.day90.keepGoing')}</Text>
      </Card>

      <Button
        variant="secondary"
        title={t('plan.day90.logProgress')}
        onPress={() => navigation.navigate('Main', { screen: 'Progress' })}
      />
      <Button
        testID="restart-plan"
        variant="danger"
        title={t('plan.restart')}
        onPress={() =>
          confirmRestartPlan(t, () => navigation.navigate('Main', { screen: 'Today' }))
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
