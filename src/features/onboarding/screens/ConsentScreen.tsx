import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import { Button, Card, colors, Screen, spacing, Text } from '@/shared/ui';

import { nextIncompleteRoute } from '../logic/steps';

const SECTIONS = [
  { title: 'onboarding.consent.whatTitle', body: 'onboarding.consent.whatBody' },
  { title: 'onboarding.consent.whereTitle', body: 'onboarding.consent.whereBody' },
  { title: 'onboarding.consent.whyTitle', body: 'onboarding.consent.whyBody' },
  { title: 'onboarding.consent.howLongTitle', body: 'onboarding.consent.howLongBody' },
  { title: 'onboarding.consent.deleteTitle', body: 'onboarding.consent.deleteBody' },
  { title: 'onboarding.consent.adsTitle', body: 'onboarding.consent.adsBody' },
] as const;

/** DPDP-style notice: what, where, why, how long, how to delete, ads. Explicit "I agree". */
export function ConsentScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onAgree = () => {
    usePreferences.getState().acceptConsent();
    navigation.navigate(nextIncompleteRoute(usePreferences.getState()));
  };

  return (
    <Screen
      testID="onboarding-consent"
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <Button testID="consent-agree" title={t('onboarding.consent.agree')} onPress={onAgree} />
      }
    >
      <Text variant="title">{t('onboarding.consent.title')}</Text>
      <Text color={colors.textMuted}>{t('onboarding.consent.intro')}</Text>
      <Card>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text variant="heading">{t(section.title)}</Text>
            <Text>{t(section.body)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs, paddingVertical: spacing.xs },
});
