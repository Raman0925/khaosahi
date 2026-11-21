import React, { type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from './Text';
import { colors, fontSize, fonts, MIN_TOUCH, radius, spacing } from './theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Unit or hint shown after the label, e.g. "kg". */
  suffix?: string;
  error?: string;
  helper?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** Labelled text input with error text, announced to screen readers. */
export function TextField({
  label,
  suffix,
  error,
  helper,
  accessibilityLabel,
  ref,
  ...rest
}: TextFieldProps) {
  const { i18n } = useTranslation();
  const family = i18n.language === 'hi' ? fonts.hi.regular : fonts.en.regular;
  const fullLabel = suffix ? `${label} (${suffix})` : label;
  return (
    <View style={styles.root}>
      <Text weight="medium">{fullLabel}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={accessibilityLabel ?? fullLabel}
        accessibilityHint={error ?? helper}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { fontFamily: family }, error ? styles.inputError : null]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color={colors.textMuted}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
});
