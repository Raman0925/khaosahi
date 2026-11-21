import React, { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { RootScreenProps } from '@/shared/navigation';
import { Card, Screen, Text } from '@/shared/ui';

export function SettingsDisclaimerScreen({ navigation }: RootScreenProps<'SettingsDisclaimer'>) {
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settings.disclaimer') });
  }, [navigation, t]);

  return (
    <Screen testID="settings-disclaimer-screen">
      <Card>
        <Text variant="bodyLarge">{t('common.disclaimer')}</Text>
      </Card>
    </Screen>
  );
}
