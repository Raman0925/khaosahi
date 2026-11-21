import React, { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useRootNavigation } from '@/shared/navigation';
import { Card, Screen, Text } from '@/shared/ui';

const NOTICE_SECTIONS = ['what', 'where', 'why', 'howLong', 'delete', 'ads'] as const;

/** Read-only consent notice: what is stored, where, why, how long, how to delete, ads. */
export function SettingsPrivacyNoticeScreen() {
  const navigation = useRootNavigation();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settings.privacyNotice') });
  }, [navigation, t]);

  return (
    <Screen testID="settings-privacy-notice-screen">
      {NOTICE_SECTIONS.map(section => (
        <Card key={section}>
          <Text variant="heading">{t(`settings.notice.${section}Title`)}</Text>
          <Text>{t(`settings.notice.${section}Body`)}</Text>
        </Card>
      ))}
    </Screen>
  );
}
