import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, colors, radius, Screen, spacing, Text } from '@/shared/ui';

const SLIDES = [
  { title: 'onboarding.intro.foodTitle', body: 'onboarding.intro.foodBody' },
  { title: 'onboarding.intro.planTitle', body: 'onboarding.intro.planBody' },
  { title: 'onboarding.intro.progressTitle', body: 'onboarding.intro.progressBody' },
] as const;

/** Three short intro slides with Skip and Next. */
export function IntroScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index] ?? SLIDES[0];
  const isLast = index === SLIDES.length - 1;
  const position = t('onboarding.intro.position', { current: index + 1, total: SLIDES.length });

  const finish = () => navigation.navigate('OnboardingDisclaimer');
  const next = () => (isLast ? finish() : setIndex(index + 1));

  return (
    <Screen
      testID="onboarding-intro"
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View style={styles.buttons}>
          {isLast ? null : (
            <Button
              testID="intro-skip"
              variant="text"
              title={t('common.skip')}
              onPress={finish}
              style={styles.button}
            />
          )}
          <Button
            testID="intro-next"
            title={isLast ? t('onboarding.intro.getStarted') : t('common.next')}
            onPress={next}
            style={styles.button}
          />
        </View>
      }
    >
      <View style={styles.slide}>
        <Text variant="title" testID="intro-title">
          {t(slide.title)}
        </Text>
        <Text variant="bodyLarge">{t(slide.body)}</Text>
      </View>
      <View style={styles.dots} accessible accessibilityLabel={position}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
        <Text variant="caption" color={colors.textMuted}>
          {position}
        </Text>
      </View>
    </Screen>
  );
}

const DOT = 10;

const styles = StyleSheet.create({
  slide: { gap: spacing.md, paddingTop: spacing.xl },
  dots: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, backgroundColor: colors.border },
  dotActive: { width: DOT * 2.4, backgroundColor: colors.primary },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { flexGrow: 1 },
});
