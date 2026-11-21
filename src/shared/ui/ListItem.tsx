import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, MIN_TOUCH, spacing } from './theme';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  /** Element on the right, e.g. a rating badge or a switch. */
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export const ListItem = memo(function ListItemRow({
  title,
  subtitle,
  right,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ListItemProps) {
  const content = (
    <>
      <View style={styles.texts}>
        <Text weight="medium">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color={colors.textMuted}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={styles.row} accessible accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  texts: { flex: 1, gap: 2 },
  pressed: { backgroundColor: colors.primarySoft },
});
