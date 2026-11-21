/**
 * A0 navigation-shell placeholders: a navigable onboarding chain so the app can be exercised end
 * to end before A1 builds the real screens. A1 replaces this file.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootRouteName } from '@/shared/navigation';
import { usePreferences } from '@/shared/preferences/store';
import { Button, Chip, PlaceholderScreen, spacing } from '@/shared/ui';

function NextButton({ to }: { to: RootRouteName }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  return (
    <Button
      testID="onboarding-next"
      title={t('common.continue')}
      onPress={() => navigation.navigate(to as never)}
    />
  );
}

export function LanguageScreen() {
  const language = usePreferences(s => s.language);
  const setLanguage = usePreferences(s => s.setLanguage);
  return (
    <PlaceholderScreen name="LanguageScreen">
      <View style={styles.row}>
        <Chip label="English" selected={language === 'en'} onPress={() => setLanguage('en')} />
        <Chip label="हिन्दी" selected={language === 'hi'} onPress={() => setLanguage('hi')} />
      </View>
      <NextButton to="OnboardingIntro" />
    </PlaceholderScreen>
  );
}

export function IntroScreen() {
  return (
    <PlaceholderScreen name="IntroScreen">
      <NextButton to="OnboardingDisclaimer" />
    </PlaceholderScreen>
  );
}

export function DisclaimerScreen() {
  return (
    <PlaceholderScreen name="DisclaimerScreen">
      <NextButton to="OnboardingConsent" />
    </PlaceholderScreen>
  );
}

export function ConsentScreen() {
  return (
    <PlaceholderScreen name="ConsentScreen">
      <NextButton to="OnboardingAgeGate" />
    </PlaceholderScreen>
  );
}

export function AgeGateScreen() {
  return (
    <PlaceholderScreen name="AgeGateScreen">
      <NextButton to="OnboardingProfile" />
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.sm } });
