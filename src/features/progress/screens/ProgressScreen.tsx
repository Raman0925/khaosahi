import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Banner } from '@/shared/ads';
import { useProfile } from '@/shared/profile';
import {
  type Metric,
  METRICS,
  type ProgressEntry,
  selectMetricEntries,
  useProgressStore,
} from '@/shared/progress';
import { Button, Card, colors, Icon, MIN_TOUCH, Screen, spacing, Text } from '@/shared/ui';

import { useLocaleT, useUnitPrefs } from '../format';
import { summarise } from '../summary';

export function ProgressScreen() {
  const { t } = useLocaleT();
  const entries = useProgressStore(state => state.entries);
  const load = useProgressStore(state => state.load);

  useEffect(() => {
    load().catch(error => console.warn('[progress] load failed', error));
  }, [load]);

  return (
    <Screen testID="progress-screen" footer={<Banner placement="progress" />}>
      <Text color={colors.textMuted}>{t('progress.intro')}</Text>
      {METRICS.map(metric => (
        <MetricCard key={metric} metric={metric} entries={entries} />
      ))}
    </Screen>
  );
}

function MetricCard({ metric, entries }: { metric: Metric; entries: ProgressEntry[] }) {
  const navigation = useNavigation();
  const { t, language } = useLocaleT();
  const prefs = useUnitPrefs();
  const sex = useProfile()?.sex ?? null;
  const name = t(`progress.metrics.${metric}`);
  const summary = useMemo(
    () => summarise(t, language, metric, selectMetricEntries(entries, metric), prefs, sex),
    [t, language, metric, entries, prefs, sex],
  );
  const lines = [summary.latest ?? t('progress.noEntries'), summary.trend, summary.status].filter(
    (line): line is string => Boolean(line),
  );

  return (
    <Card testID={`progress-card-${metric}`}>
      <Pressable
        onPress={() => navigation.navigate('ProgressMetric', { metric })}
        accessibilityRole="button"
        accessibilityLabel={[name, ...lines].join('. ')}
        accessibilityHint={t('progress.openMetricHint')}
        style={({ pressed }) => [styles.summary, pressed ? styles.pressed : null]}
      >
        <View style={styles.texts}>
          <Text variant="heading">{name}</Text>
          {lines.map(line => (
            <Text key={line} color={colors.textMuted}>
              {line}
            </Text>
          ))}
        </View>
        <Icon name="chevronRight" color={colors.textMuted} />
      </Pressable>
      <Button
        testID={`progress-add-${metric}`}
        variant="secondary"
        title={t('progress.add')}
        accessibilityLabel={t('progress.addMetric', { metric: name })}
        onPress={() => navigation.navigate('ProgressEntry', { metric })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texts: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.7 },
});
