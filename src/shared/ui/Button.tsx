import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { colors, MIN_TOUCH, radius, spacing } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Defaults to `title`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
};

const BG: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
  text: 'transparent',
};

const FG: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.primary,
  danger: colors.textInverse,
  text: colors.primary,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG[variant] },
        variant === 'secondary' ? styles.outlined : null,
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <Text weight="medium" color={FG[variant]} center>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
