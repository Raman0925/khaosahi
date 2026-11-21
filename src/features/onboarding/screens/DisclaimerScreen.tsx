import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { Button, Card, Screen, Text } from '@/shared/ui';

import { CheckboxRow } from '../components/CheckboxRow';
import { nextIncompleteRoute } from '../logic/steps';

/** The user must tick "I have read and understood" before continuing. */
export function DisclaimerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [ticked, setTicked] = useState(
    () => usePreferences.getState().disclaimerAcceptedAt !== null,
  );

  const onContinue = () => {
    usePreferences.getState().acceptDisclaimer();
    navigation.navigate(nextIncompleteRoute(usePreferences.getState()));
  };

  return (
    <Screen
      testID="onboarding-disclaimer"
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <Button
          testID="onboarding-next"
          title={t('common.continue')}
          onPress={onContinue}
          disabled={!ticked}
        />
      }
    >
      <Text variant="title">{t('onboarding.disclaimer.title')}</Text>
      <Card>
        <Text weight="bold">{t('onboarding.disclaimer.notMedical')}</Text>
        <Text variant="bodyLarge">{t('common.disclaimer')}</Text>
      </Card>
      <CheckboxRow
        testID="disclaimer-ack"
        label={t('onboarding.disclaimer.acknowledge')}
        checked={ticked}
        onToggle={() => setTicked(value => !value)}
      />
    </Screen>
  );
}
