import React from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { Button, PlaceholderScreen } from '@/shared/ui';

/** A0 placeholder: last onboarding step. A1 replaces it with the profile form. */
export function ProfileSetupScreen() {
  const { t } = useTranslation();
  const complete = usePreferences(s => s.completeOnboarding);
  return (
    <PlaceholderScreen name="ProfileSetupScreen">
      <Button testID="onboarding-finish" title={t('common.done')} onPress={() => complete()} />
    </PlaceholderScreen>
  );
}
