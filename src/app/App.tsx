import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdsProvider } from '@/shared/ads';
import { initI18n } from '@/shared/i18n';
import { syncReminders } from '@/shared/notifications';
import { writeDailySnapshot } from '@/shared/storage';

import { ErrorBoundary } from './ErrorBoundary';
import { RootNavigator } from './navigation/RootNavigator';

initI18n();

export function App() {
  useEffect(() => {
    writeDailySnapshot().catch(() => undefined);
    syncReminders().catch(error => console.warn('[app] syncReminders failed', error));
  }, []);

  const onReady = useCallback(() => {
    BootSplash.hide({ fade: true }).catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ErrorBoundary>
        <AdsProvider>
          <RootNavigator onReady={onReady} />
        </AdsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
