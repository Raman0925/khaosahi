import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, colors, Text } from '@/shared/ui';

import { liveBmi } from '../logic/formValues';
import type { Units } from '../logic/ranges';

/** Live BMI with the Asian-Indian category, shown in words (not by colour). */
export function BmiSummary({
  height,
  weight,
  units,
}: {
  height: string;
  weight: string;
  units: Units;
}) {
  const { t } = useTranslation();
  const result = liveBmi(height, weight, units);
  return (
    <Card testID="bmi-summary">
      <Text variant="heading">{t('profile.bmi.title')}</Text>
      {result ? (
        <>
          <Text weight="medium" accessibilityLiveRegion="polite">
            {t('profile.bmi.value', {
              value: result.value,
              category: t(`profile.bmi.categories.${result.category}`),
            })}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {t('profile.bmi.note')}
          </Text>
        </>
      ) : (
        <Text color={colors.textMuted}>{t('profile.bmi.hint')}</Text>
      )}
    </Card>
  );
}
