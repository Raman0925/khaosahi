import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { Button, colors, Screen, Text } from '@/shared/ui';

import { nextIncompleteRoute } from '../logic/steps';

/** 18+ gate. "No" shows a friendly blocking message; the user cannot continue from there. */
export function AgeGateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [blocked, setBlocked] = useState(false);

  const onYes = () => {
    usePreferences.getState().confirmAge();
    navigation.navigate(nextIncompleteRoute(usePreferences.getState()));
  };

  if (blocked) {
    return (
      <Screen
        testID="age-blocked"
        edges={['top', 'left', 'right', 'bottom']}
        footer={
          <Button
            testID="age-back"
            variant="secondary"
            title={t('onboarding.ageGate.goBack')}
            onPress={() => setBlocked(false)}
          />
        }
      >
        <Text variant="title" accessibilityLiveRegion="polite">
          {t('onboarding.ageGate.blockedTitle')}
        </Text>
        <Text variant="bodyLarge">{t('onboarding.ageGate.blockedBody')}</Text>
      </Screen>
    );
  }

  return (
    <Screen testID="onboarding-age" edges={['top', 'left', 'right', 'bottom']}>
      <Text variant="title">{t('onboarding.ageGate.title')}</Text>
      <Text color={colors.textMuted}>{t('onboarding.ageGate.body')}</Text>
      <Button testID="age-yes" title={t('onboarding.ageGate.yes')} onPress={onYes} />
      <Button
        testID="age-no"
        variant="secondary"
        title={t('onboarding.ageGate.no')}
        onPress={() => setBlocked(true)}
      />
    </Screen>
  );
}
