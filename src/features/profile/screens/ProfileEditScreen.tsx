import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { type ProfileInput, useProfileStore } from '@/shared/profile';
import { EmptyState, Screen } from '@/shared/ui';

import { ProfileForm } from '../components/ProfileForm';
import { needsPlanRestart, profileToFormValues } from '../logic/formValues';

/** Settings → Edit profile. Changing condition or diet type asks before the plan restarts. */
export function ProfileEditScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [saved] = useState(() => useProfileStore.getState().profile);
  const [initialValues] = useState(() => {
    const { lengthUnit, weightUnit } = usePreferences.getState();
    return saved ? profileToFormValues(saved, { lengthUnit, weightUnit }) : null;
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.editTitle') });
  }, [navigation, t]);

  const save = (input: ProfileInput) => {
    try {
      useProfileStore.getState().saveProfile(input);
    } catch {
      Alert.alert(t('errors.title'), t('profile.errors.saveFailed'));
      return;
    }
    navigation.goBack();
  };

  const onSubmit = (input: ProfileInput) => {
    if (saved && needsPlanRestart(saved, input)) {
      Alert.alert(t('profile.restart.title'), t('profile.restart.body'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.restart.confirm'), onPress: () => save(input) },
      ]);
      return;
    }
    save(input);
  };

  if (!initialValues) {
    return (
      <Screen testID="profile-edit">
        <EmptyState title={t('profile.missing')} />
      </Screen>
    );
  }

  return (
    <Screen testID="profile-edit">
      <ProfileForm
        initialValues={initialValues}
        submitLabel={t('common.save')}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
