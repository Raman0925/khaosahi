import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { RootScreenProps } from '@/shared/navigation';
import { useProfile } from '@/shared/profile';
import { type ProgressEntry, selectMetricEntries, useProgressStore } from '@/shared/progress';
import { Button, Card, colors, EmptyState, Screen, spacing, Text } from '@/shared/ui';

import { MetricChart } from '../components/MetricChart';
import { formatDate, unitText, useLocaleT, useUnitPrefs, valueText } from '../format';
import { MAX_CHART_POINTS } from '../logic/chartModel';
import { normalRange, rangeStatus, waistCutoffCm } from '../logic/normalRanges';
import { formatValue } from '../logic/units';
import { summarise } from '../summary';

export function ProgressMetricScreen({ navigation, route }: RootScreenProps<'ProgressMetric'>) {
  const { metric } = route.params;
  const { t, language } = useLocaleT();
  const prefs = useUnitPrefs();
  const sex = useProfile()?.sex ?? null;
  const allEntries = useProgressStore(state => state.entries);
  const load = useProgressStore(state => state.load);
  const remove = useProgressStore(state => state.remove);
  const name = t(`progress.metrics.${metric}`);

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  useEffect(() => {
    load().catch(error => console.warn('[progress] load failed', error));
  }, [load]);

  const entries = useMemo(() => selectMetricEntries(allEntries, metric), [allEntries, metric]);
  const newestFirst = useMemo(() => [...entries].reverse(), [entries]);
  const summary = useMemo(
    () => summarise(t, language, metric, entries, prefs, sex),
    [t, language, metric, entries, prefs, sex],
  );

  const range = normalRange(metric, sex);
  const unit = unitText(t, metric, prefs);
  const rangeText = range
    ? range.min === undefined
      ? t('progress.chart.upTo', { max: range.max, unit })
      : t('progress.chart.between', { min: range.min, max: range.max, unit })
    : null;

  const addEntry = useCallback(
    () => navigation.navigate('ProgressEntry', { metric }),
    [navigation, metric],
  );
  const editEntry = useCallback(
    (entry: ProgressEntry) => navigation.navigate('ProgressEntry', { metric, entryId: entry.id }),
    [navigation, metric],
  );
  const deleteEntry = useCallback(
    (entry: ProgressEntry, label: string) => {
      Alert.alert(t('progress.deleteTitle'), t('progress.deleteBody', { label }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => remove(entry.id) },
      ]);
    },
    [t, remove],
  );

  if (entries.length === 0) {
    return (
      <Screen testID="progress-metric-screen">
        <EmptyState
          testID="progress-metric-empty"
          title={t('progress.chart.emptyTitle')}
          body={t('progress.chart.emptyBody')}
          actionLabel={t('progress.addMetric', { metric: name })}
          onAction={addEntry}
        />
      </Screen>
    );
  }

  const header = (
    <View style={styles.header}>
      <Card>
        {metric !== 'ultrasound' && entries.length > 1 ? (
          <MetricChart
            metric={metric}
            entries={entries}
            prefs={prefs}
            sex={sex}
            accessibilityLabel={t('progress.chart.a11y', {
              metric: name,
              count: entries.length,
              value: summary.latestValue,
              date: summary.latestDate,
              trend: summary.trend ?? '',
            })}
          />
        ) : (
          <>
            <Text variant="title">{summary.latestValue}</Text>
            <Text color={colors.textMuted}>{summary.latest}</Text>
            {entries.length === 1 && metric !== 'ultrasound' ? (
              <Text testID="progress-single-point">{t('progress.chart.single')}</Text>
            ) : null}
          </>
        )}
        {summary.trend ? <Text>{summary.trend}</Text> : null}
        {rangeText ? <Text>{t('progress.chart.normalRange', { range: rangeText })}</Text> : null}
        {metric === 'waist' ? (
          <Text>
            {t('progress.chart.waistLine', {
              value: `${formatValue('waist', waistCutoffCm(sex), prefs)} ${unit}`,
            })}
          </Text>
        ) : null}
        {range ? (
          <Text variant="caption" color={colors.textMuted}>
            {t('progress.chart.labsVary')}
          </Text>
        ) : null}
        {metric !== 'ultrasound' && entries.length > MAX_CHART_POINTS ? (
          <Text variant="caption" color={colors.textMuted}>
            {t('progress.chart.showingSome', { shown: MAX_CHART_POINTS, count: entries.length })}
          </Text>
        ) : null}
      </Card>
      <Button title={t('progress.addMetric', { metric: name })} onPress={addEntry} />
      <Text variant="heading">{t('progress.history')}</Text>
    </View>
  );

  return (
    <Screen testID="progress-metric-screen" scroll={false}>
      <FlashList
        data={newestFirst}
        keyExtractor={entry => entry.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => {
          const value = valueText(t, metric, item.value, prefs);
          const date = formatDate(item.date, language);
          const status = range ? t(`progress.status.${rangeStatus(item.value, range)}`) : null;
          return (
            <EntryRow
              entry={item}
              label={`${value}, ${date}`}
              status={status}
              onEdit={editEntry}
              onDelete={deleteEntry}
            />
          );
        }}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

type EntryRowProps = {
  entry: ProgressEntry;
  label: string;
  status: string | null;
  onEdit: (entry: ProgressEntry) => void;
  onDelete: (entry: ProgressEntry, label: string) => void;
};

const EntryRow = memo(function EntryRowView({
  entry,
  label,
  status,
  onEdit,
  onDelete,
}: EntryRowProps) {
  const { t } = useLocaleT();
  return (
    <View style={styles.row} testID={`entry-${entry.id}`}>
      <View style={styles.rowText} accessible>
        <Text weight="medium">{label}</Text>
        {status ? (
          <Text variant="caption" color={colors.textMuted}>
            {status}
          </Text>
        ) : null}
      </View>
      <Button
        variant="text"
        title={t('progress.edit')}
        accessibilityLabel={t('progress.editEntry', { label })}
        onPress={() => onEdit(entry)}
      />
      <Button
        variant="text"
        title={t('common.delete')}
        accessibilityLabel={t('progress.deleteEntry', { label })}
        onPress={() => onDelete(entry, label)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  header: { gap: spacing.lg, paddingBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  rowText: { flexGrow: 1, flexBasis: 160, gap: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
