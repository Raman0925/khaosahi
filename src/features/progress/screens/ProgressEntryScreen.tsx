import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import type { RootScreenProps } from '@/shared/navigation';
import { useProgressStore } from '@/shared/progress';
import { Button, Chip, colors, Screen, spacing, Text, TextField } from '@/shared/ui';
import { fromDateKey, todayKey, toDateKey } from '@/shared/utils/dates';

import { formatDate, unitText, useLocaleT, useUnitPrefs } from '../format';
import {
  type EntryErrorCode,
  entryFormSchema,
  type EntryFormValues,
  toCanonical,
} from '../logic/entryForm';
import { formatValue, inputRange } from '../logic/units';
import { pickDate } from '../pickers';

const GRADES = ['0', '1', '2', '3'] as const;

export function ProgressEntryScreen({ navigation, route }: RootScreenProps<'ProgressEntry'>) {
  const { metric, entryId } = route.params;
  const { t, language } = useLocaleT();
  const prefs = useUnitPrefs();
  const load = useProgressStore(state => state.load);
  const add = useProgressStore(state => state.add);
  const update = useProgressStore(state => state.update);
  const existing = useProgressStore(state =>
    entryId ? state.entries.find(entry => entry.id === entryId) : undefined,
  );
  const name = t(`progress.metrics.${metric}`);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t(entryId ? 'progress.entry.titleEdit' : 'progress.entry.titleAdd', { metric: name }),
    });
  }, [navigation, t, entryId, name]);

  useEffect(() => {
    load().catch(error => console.warn('[progress] load failed', error));
  }, [load]);

  const schema = useMemo(() => entryFormSchema(metric, prefs), [metric, prefs]);
  const range = inputRange(metric, prefs);
  const { control, handleSubmit, reset } = useForm<EntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: '', date: todayKey() },
  });

  // Fill the form once when editing (the log may finish loading after the first render).
  const filledFor = useRef<string | null>(null);
  useEffect(() => {
    if (existing && filledFor.current !== existing.id) {
      filledFor.current = existing.id;
      reset({ value: formatValue(metric, existing.value, prefs), date: existing.date });
    }
  }, [existing, metric, prefs, reset]);

  const errorText = (code: string | undefined): string | undefined => {
    switch (code as EntryErrorCode | undefined) {
      case 'required':
        return t('errors.required');
      case 'number':
        return t('errors.number');
      case 'range':
        return t('errors.range', range);
      case 'futureDate':
        return t('progress.entry.futureDate');
      default:
        return undefined;
    }
  };

  const onSave = handleSubmit(values => {
    const value = toCanonical(metric, values.value, prefs);
    if (existing) {
      update(existing.id, { value, date: values.date });
    } else {
      add({ metric, value, date: values.date });
    }
    navigation.goBack();
  });

  return (
    <Screen
      testID="progress-entry-screen"
      footer={<Button testID="progress-entry-save" title={t('common.save')} onPress={onSave} />}
    >
      <Controller
        control={control}
        name="value"
        render={({ field, fieldState }) =>
          metric === 'ultrasound' ? (
            <View style={styles.group} accessibilityRole="radiogroup">
              <Text weight="medium">{t('progress.entry.grade')}</Text>
              <View style={styles.chips}>
                {GRADES.map(grade => (
                  <Chip
                    key={grade}
                    testID={`grade-${grade}`}
                    label={t(`progress.grades.${grade}`)}
                    selected={field.value === grade}
                    onPress={() => field.onChange(grade)}
                  />
                ))}
              </View>
              {fieldState.error ? (
                <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
                  {errorText(fieldState.error.message)}
                </Text>
              ) : null}
            </View>
          ) : (
            <TextField
              testID="progress-entry-value"
              label={name}
              suffix={unitText(t, metric, prefs)}
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errorText(fieldState.error?.message)}
              helper={t('errors.range', range)}
            />
          )
        }
      />
      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <View style={styles.group}>
            <Text weight="medium">{t('progress.entry.date')}</Text>
            <Button
              testID="progress-entry-date"
              variant="secondary"
              title={formatDate(field.value, language)}
              accessibilityLabel={t('progress.entry.changeDate', {
                date: formatDate(field.value, language),
              })}
              onPress={async () => {
                const picked = await pickDate(fromDateKey(field.value), new Date());
                if (picked) {
                  field.onChange(toDateKey(picked));
                }
              }}
            />
            {fieldState.error ? (
              <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
                {errorText(fieldState.error.message)}
              </Text>
            ) : null}
          </View>
        )}
      />
      {metric !== 'weight' && metric !== 'waist' ? (
        <Text variant="caption" color={colors.textMuted}>
          {t('progress.entry.note')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
