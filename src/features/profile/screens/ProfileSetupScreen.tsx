import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { type ProfileInput, useProfileStore } from '@/shared/profile';
import { colors, Screen, Text } from '@/shared/ui';

import { ProfileForm } from '../components/ProfileForm';
import { EMPTY_FORM_VALUES, profileToFormValues } from '../logic/formValues';

/**
 * Last onboarding step. Saving the profile completes onboarding; the navigator then switches to
 * the main app, and the plan store derives the 90-day plan from the saved profile.
 */
export function ProfileSetupScreen() {
  const { t } = useTranslation();
  const [initialValues] = useState(() => {
    const saved = useProfileStore.getState().profile;
    const { lengthUnit, weightUnit } = usePreferences.getState();
    return saved ? profileToFormValues(saved, { lengthUnit, weightUnit }) : EMPTY_FORM_VALUES;
  });

  const onSubmit = (input: ProfileInput) => {
    try {
      useProfileStore.getState().saveProfile(input);
    } catch {
      Alert.alert(t('errors.title'), t('profile.errors.saveFailed'));
      return;
    }
    usePreferences.getState().completeOnboarding();
  };

  return (
    <Screen testID="profile-setup" edges={['top', 'left', 'right', 'bottom']}>
      <Text variant="title">{t('profile.setupTitle')}</Text>
      <Text color={colors.textMuted}>{t('profile.setupSubtitle')}</Text>
      <ProfileForm
        initialValues={initialValues}
        submitLabel={t('profile.saveAndStart')}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
