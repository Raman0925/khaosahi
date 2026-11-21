import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { colors, MIN_TOUCH, radius, spacing } from './theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

/** Selectable pill used for filters and single/multi choice options. */
export function Chip({ label, selected = false, onPress, accessibilityLabel, testID }: ChipProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.selected : null]}
    >
      <Text weight="medium" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
