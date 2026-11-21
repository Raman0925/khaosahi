import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, Icon, MIN_TOUCH, radius, spacing, Text } from '@/shared/ui';

export type CheckboxRowProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  testID?: string;
};

/** Checkbox with a text label; the whole row is the touch target. */
export function CheckboxRow({ label, checked, onToggle, testID }: CheckboxRowProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View style={[styles.box, checked ? styles.boxChecked : null]}>
        {checked ? <Icon name="check" size={20} color={colors.onPrimary} /> : null}
      </View>
      <Text weight="medium" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const BOX = 28;

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary },
  label: { flex: 1 },
});
