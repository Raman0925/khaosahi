import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, colors, spacing, Text } from '@/shared/ui';

export type ChoiceOption<T extends string> = { value: T; label: string };

export type ChoiceGroupProps<T extends string> = {
  label: string;
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T | null;
  onChange: (value: T | null) => void;
  /** Tapping the selected chip clears the choice (for optional fields). */
  allowDeselect?: boolean;
  error?: string;
  testID: string;
};

/** Single choice shown as a wrapping row of chips, with a label and error text. */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allowDeselect = false,
  error,
  testID,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.root}>
      <Text weight="medium">{label}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Chip
              key={option.value}
              testID={`${testID}-${option.value}`}
              label={option.label}
              selected={selected}
              onPress={() => onChange(selected && allowDeselect ? null : option.value)}
            />
          );
        })}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
