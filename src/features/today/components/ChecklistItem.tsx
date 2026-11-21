import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, Icon, MIN_TOUCH, radius, spacing, Text } from '@/shared/ui';

type Props = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
};

/** One checklist row: a checkbox with a visible tick (not only colour) and the item text. */
export const ChecklistItem = memo(function ChecklistItemRow({
  id,
  label,
  checked,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      testID={`checklist-item-${id}`}
      onPress={() => onToggle(id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      accessibilityHint={t('today.itemHint')}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={[styles.box, checked ? styles.boxChecked : null]}>
        {checked ? <Icon name="check" size={20} color={colors.onPrimary} /> : null}
      </View>
      <Text style={styles.label} color={checked ? colors.textMuted : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  box: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary },
  label: { flex: 1 },
});
