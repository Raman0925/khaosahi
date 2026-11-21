import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { openAdPrivacyOptions, useAdPrivacyOptionsRequired } from '@/shared/ads';
import { useRootNavigation } from '@/shared/navigation';
import { usePreferences } from '@/shared/preferences/store';
import { colors, ListItem, Screen, Text } from '@/shared/ui';
import { APP_VERSION } from '@/shared/utils/appInfo';

import { ChoiceRow } from '../components/ChoiceRow';
import { DataSection } from '../components/DataSection';
import { SettingsLink, SettingsSection } from '../components/SettingsSection';
import { privacyPolicyUrl, RATE_APP_URLS } from '../constants';
import { openFirstUrl } from '../logic/openUrl';

/** Settings. No ads anywhere on this screen (policy). Title is set by the navigator. */
export function SettingsScreen() {
  const navigation = useRootNavigation();
  const { t, i18n } = useTranslation();
  const lengthUnit = usePreferences(state => state.lengthUnit);
  const weightUnit = usePreferences(state => state.weightUnit);
  const adPrivacyRequired = useAdPrivacyOptionsRequired();
  const [linkError, setLinkError] = useState(false);

  const open = (urls: readonly string[]) => {
    setLinkError(false);
    openFirstUrl(urls)
      .then(opened => setLinkError(!opened))
      .catch(() => setLinkError(true));
  };

  const unitLabel = (group: string, unit: string) => t('settings.unitOption', { group, unit });
  const lengthLabel = t('settings.lengthUnit');
  const weightLabel = t('settings.weightUnit');

  return (
    <Screen testID="settings-screen">
      <SettingsSection title={t('settings.sections.language')}>
        <ChoiceRow
          testID="settings-language"
          value={i18n.language === 'hi' ? 'hi' : 'en'}
          choices={[
            { value: 'en', label: t('settings.languageEnglish') },
            { value: 'hi', label: t('settings.languageHindi') },
          ]}
          onChange={language => usePreferences.getState().setLanguage(language)}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.units')}>
        <ChoiceRow
          testID="settings-length"
          label={lengthLabel}
          value={lengthUnit}
          choices={[
            {
              value: 'cm',
              label: t('common.units.cm'),
              accessibilityLabel: unitLabel(lengthLabel, t('common.units.cm')),
            },
            {
              value: 'in',
              label: t('common.units.in'),
              accessibilityLabel: unitLabel(lengthLabel, t('common.units.in')),
            },
          ]}
          onChange={unit => usePreferences.getState().setLengthUnit(unit)}
        />
        <ChoiceRow
          testID="settings-weight"
          label={weightLabel}
          value={weightUnit}
          choices={[
            {
              value: 'kg',
              label: t('common.units.kg'),
              accessibilityLabel: unitLabel(weightLabel, t('common.units.kg')),
            },
            {
              value: 'lb',
              label: t('common.units.lb'),
              accessibilityLabel: unitLabel(weightLabel, t('common.units.lb')),
            },
          ]}
          onChange={unit => usePreferences.getState().setWeightUnit(unit)}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.general')}>
        <SettingsLink
          testID="settings-reminders"
          title={t('settings.reminders')}
          onPress={() => navigation.navigate('Reminders')}
        />
        <SettingsLink
          testID="settings-edit-profile"
          title={t('settings.editProfile')}
          onPress={() => navigation.navigate('ProfileEdit')}
        />
      </SettingsSection>

      <DataSection />

      <SettingsSection title={t('settings.sections.about')}>
        <SettingsLink
          testID="settings-privacy-policy"
          title={t('settings.privacyPolicy')}
          accessibilityHint={t('settings.opensBrowser')}
          onPress={() => open([privacyPolicyUrl()])}
        />
        <SettingsLink
          testID="settings-privacy-notice"
          title={t('settings.privacyNotice')}
          onPress={() => navigation.navigate('SettingsPrivacyNotice')}
        />
        <SettingsLink
          testID="settings-disclaimer"
          title={t('settings.disclaimer')}
          onPress={() => navigation.navigate('SettingsDisclaimer')}
        />
        {adPrivacyRequired ? (
          <SettingsLink
            testID="settings-ad-privacy"
            title={t('settings.adPrivacy')}
            onPress={() => {
              openAdPrivacyOptions().catch(error =>
                console.warn('[settings] ad privacy options failed', error),
              );
            }}
          />
        ) : null}
        <SettingsLink
          testID="settings-rate"
          title={t('settings.rateApp')}
          onPress={() => open(RATE_APP_URLS)}
        />
        <ListItem
          testID="settings-version"
          title={t('settings.version')}
          subtitle={APP_VERSION}
          accessibilityLabel={`${t('settings.version')} ${APP_VERSION}`}
        />
      </SettingsSection>

      {linkError ? (
        <Text testID="settings-link-error" color={colors.danger} accessibilityLiveRegion="polite">
          {t('settings.linkFailed')}
        </Text>
      ) : null}
    </Screen>
  );
}
