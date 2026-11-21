import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, Icon, ListItem, radius, spacing, Text } from '@/shared/ui';

/** A titled group of settings rows. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      <View style={styles.box}>{children}</View>
    </View>
  );
}

/** A settings row that opens another screen or an external page. */
export function SettingsLink({
  title,
  subtitle,
  onPress,
  accessibilityHint,
  testID,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  accessibilityHint?: string;
  testID?: string;
}) {
  return (
    <ListItem
      testID={testID}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityHint={accessibilityHint}
      right={<Icon name="chevronRight" color={colors.textMuted} />}
    />
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
