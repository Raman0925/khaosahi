import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, spacing, Text } from '@/shared/ui';

export type Choice<T extends string> = { value: T; label: string; accessibilityLabel?: string };

/** A label with single-choice chips, e.g. "Weight: kg / lb". Selection is announced as state. */
export function ChoiceRow<T extends string>({
  label,
  choices,
  value,
  onChange,
  testID,
}: {
  /** Omit when the section title already says it. */
  label?: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View style={styles.row} testID={testID}>
      {label ? <Text weight="medium">{label}</Text> : null}
      <View style={styles.chips}>
        {choices.map(choice => (
          <Chip
            key={choice.value}
            testID={testID ? `${testID}-${choice.value}` : undefined}
            label={choice.label}
            accessibilityLabel={choice.accessibilityLabel}
            selected={choice.value === value}
            onPress={() => onChange(choice.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: spacing.lg, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
