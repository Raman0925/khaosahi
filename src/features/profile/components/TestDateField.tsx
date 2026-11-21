import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, colors, spacing, Text } from '@/shared/ui';
import { fromDateKey, toDateKey } from '@/shared/utils/dates';

export type TestDateFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
};

/** Lab test date: Android date dialog, no future dates, can be cleared. */
export function TestDateField({ value, onChange, error }: TestDateFieldProps) {
  const { t, i18n } = useTranslation();
  const shown = value
    ? fromDateKey(value).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : t('profile.labs.noDate');

  const open = () => {
    DateTimePickerAndroid.open({
      value: value ? fromDateKey(value) : new Date(),
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, date) => onChange(toDateKey(date)),
    });
  };

  return (
    <View style={styles.root}>
      <Text weight="medium">{t('profile.labs.testDate')}</Text>
      <Text testID="test-date-value">{shown}</Text>
      <View style={styles.buttons}>
        <Button
          testID="test-date-pick"
          variant="secondary"
          title={t('profile.labs.pickDate')}
          accessibilityLabel={t('profile.labs.pickDateA11y')}
          onPress={open}
          style={styles.button}
        />
        {value ? (
          <Button
            testID="test-date-clear"
            variant="text"
            title={t('profile.labs.clearDate')}
            accessibilityLabel={t('profile.labs.clearDateA11y')}
            onPress={() => onChange(null)}
            style={styles.button}
          />
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { flexGrow: 1 },
});
