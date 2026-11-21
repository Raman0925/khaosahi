import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { colors, spacing } from './theme';

export type EmptyStateProps = {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({ title, body, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View testID={testID} style={styles.root}>
      <Text variant="heading" center>
        {title}
      </Text>
      {body ? (
        <Text color={colors.textMuted} center>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.xl, gap: spacing.md, alignItems: 'stretch', justifyContent: 'center' },
});
