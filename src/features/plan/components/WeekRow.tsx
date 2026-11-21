import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WeekStatus } from '@/shared/plan';
import { colors, Icon, MIN_TOUCH, radius, spacing, Text } from '@/shared/ui';

type Props = {
  week: number;
  title: string;
  focus: string;
  status: WeekStatus;
  onPress: (week: number) => void;
};

/** A week in the plan overview. The current week has a border, tint and a "This week" label. */
export const WeekRow = memo(function WeekRowItem({ week, title, focus, status, onPress }: Props) {
  const { t } = useTranslation();
  const current = status === 'current';
  const statusText = t(`plan.status.${status}`);
  return (
    <Pressable
      testID={`week-row-${week}`}
      onPress={() => onPress(week)}
      accessibilityRole="button"
      accessibilityLabel={t('plan.weekA11y', { week, title, status: statusText })}
      accessibilityState={{ selected: current }}
      style={({ pressed }) => [
        styles.row,
        current ? styles.current : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.texts}>
        <Text variant="caption" weight="medium" color={current ? colors.primary : colors.textMuted}>
          {statusText}
        </Text>
        <Text weight="bold">{title}</Text>
        <Text color={colors.textMuted}>{focus}</Text>
      </View>
      <Icon name="chevronRight" color={colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  current: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.8 },
  texts: { flex: 1, gap: spacing.xs },
});
