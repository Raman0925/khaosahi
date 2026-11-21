import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from './theme';

export type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). Use false for screens with their own list. */
  scroll?: boolean;
  /** Safe-area edges to pad. Screens under a native header/tab bar usually need only some. */
  edges?: Edge[];
  /** Content pinned below the scroll area (e.g. a primary button or a banner ad). */
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  testID?: string;
};

/** Edge-to-edge aware screen container. */
export function Screen({
  children,
  scroll = true,
  edges = ['left', 'right', 'bottom'],
  footer,
  contentStyle,
  testID,
}: ScreenProps) {
  return (
    <SafeAreaView testID={testID} edges={edges} style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
});
