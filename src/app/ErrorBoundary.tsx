import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { i18next } from '@/shared/i18n';
import { Button, colors, spacing, Text } from '@/shared/ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Catches render errors so the user sees a friendly message instead of a crash. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private readonly retry = () => this.setState({ hasError: false });

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <View style={styles.root} testID="error-boundary">
        <Text variant="title" center>
          {i18next.t('errors.title')}
        </Text>
        <Text center color={colors.textMuted}>
          {i18next.t('errors.body')}
        </Text>
        <Button title={i18next.t('common.retry')} onPress={this.retry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
});
