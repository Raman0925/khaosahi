import React, { type ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, colors, MIN_TOUCH, spacing, Text } from '@/shared/ui';

type Props = {
  testID: string;
  title: string;
  body: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
  /** Options shown while the reminder is on. */
  children?: ReactNode;
};

/** One reminder: title, explanation, on/off switch and its options. */
export function ReminderCard({
  testID,
  title,
  body,
  enabled,
  disabled = false,
  onToggle,
  children,
}: Props) {
  const { t } = useTranslation();
  return (
    <Card testID={testID}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <Text variant="heading">{title}</Text>
          <Text color={colors.textMuted}>{body}</Text>
        </View>
        <Switch
          testID={`${testID}-switch`}
          value={enabled}
          disabled={disabled}
          onValueChange={onToggle}
          accessibilityLabel={t('reminders.enable', { name: title })}
          accessibilityState={{ checked: enabled, disabled }}
          trackColor={{ true: colors.primary, false: colors.textMuted }}
          thumbColor={colors.surface}
          style={styles.switch}
        />
      </View>
      {enabled ? children : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: spacing.xs },
  switch: { minHeight: MIN_TOUCH, minWidth: MIN_TOUCH },
});
