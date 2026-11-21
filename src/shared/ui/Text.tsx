import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, type FontWeightName, fontSize, fonts, lineHeight } from './theme';

export type TextVariant = 'title' | 'heading' | 'bodyLarge' | 'body' | 'caption';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  weight?: FontWeightName;
  color?: string;
  center?: boolean;
};

const DEFAULT_WEIGHT: Record<TextVariant, FontWeightName> = {
  title: 'bold',
  heading: 'bold',
  bodyLarge: 'regular',
  body: 'regular',
  caption: 'regular',
};

/** App text. Picks the bundled Noto font for the current language; scales with system font size. */
export function Text({
  variant = 'body',
  weight,
  color = colors.text,
  center,
  style,
  ...rest
}: TextProps) {
  const { i18n } = useTranslation();
  const family = (i18n.language === 'hi' ? fonts.hi : fonts.en)[weight ?? DEFAULT_WEIGHT[variant]];
  return (
    <RNText
      accessibilityRole={variant === 'title' || variant === 'heading' ? 'header' : undefined}
      {...rest}
      style={[
        styles.base,
        { fontFamily: family, fontSize: fontSize[variant], lineHeight: lineHeight[variant], color },
        center ? styles.center : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  center: { textAlign: 'center' },
});
