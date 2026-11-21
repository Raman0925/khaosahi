import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { deviceLanguage } from '@/shared/i18n';
import { type Language, usePreferences } from '@/shared/preferences/store';
import { Button, colors, Icon, MIN_TOUCH, radius, Screen, spacing, Text } from '@/shared/ui';

import { routeAfterLanguage } from '../logic/steps';

function LanguageOption({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={[styles.option, selected ? styles.optionSelected : null]}
    >
      <Text variant="title" style={styles.optionLabel}>
        {label}
      </Text>
      {selected ? <Icon name="check" color={colors.primary} size={28} /> : null}
    </Pressable>
  );
}

/** First onboarding screen. Preselects the device language until the user picks one. */
export function LanguageScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const chosen = usePreferences(s => s.language);
  const selected: Language = chosen ?? deviceLanguage();

  const choose = (language: Language) => usePreferences.getState().setLanguage(language);

  const onContinue = () => {
    const prefs = usePreferences.getState();
    if (prefs.language === null) {
      prefs.setLanguage(selected);
    }
    navigation.navigate(routeAfterLanguage(usePreferences.getState()));
  };

  return (
    <Screen
      testID="onboarding-language"
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button testID="onboarding-next" title={t('common.continue')} onPress={onContinue} />}
    >
      <Text variant="title">{t('onboarding.language.title')}</Text>
      <Text color={colors.textMuted}>{t('onboarding.language.subtitle')}</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        <LanguageOption
          testID="language-en"
          label={t('onboarding.language.english')}
          selected={selected === 'en'}
          onPress={() => choose('en')}
        />
        <LanguageOption
          testID="language-hi"
          label={t('onboarding.language.hindi')}
          selected={selected === 'hi'}
          onPress={() => choose('hi')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.md },
  option: {
    minHeight: MIN_TOUCH * 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionLabel: { flex: 1 },
});
