import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Language } from '@/shared/preferences/store';
import { Card, colors, RatingBadge, spacing, Text } from '@/shared/ui';

import type { EffectiveRating } from '../logic/ratings';

const CONDITION_KEY = { liver: 'fattyLiver', uricAcid: 'uricAcid' } as const;

/** One condition's rating with reason, portion tip and (for uric acid) purine level. */
export function RatingCard({ rating, language }: { rating: EffectiveRating; language: Language }) {
  const { t } = useTranslation();
  const condition = t(`common.conditions.${CONDITION_KEY[rating.dimension]}`);
  return (
    <Card testID={`food-rating-${rating.dimension}`}>
      <View
        style={styles.header}
        accessible
        accessibilityLabel={t('food.detail.ratingA11y', {
          condition,
          rating: t(`common.ratings.${rating.rating}`),
        })}
      >
        <Text variant="heading" style={styles.title}>
          {t('food.detail.ratingFor', { condition })}
        </Text>
        <RatingBadge rating={rating.rating} />
      </View>
      <Text>{rating.reason[language]}</Text>
      <Text weight="medium">{t('food.detail.portionTip')}</Text>
      <Text>{rating.portion[language]}</Text>
      {rating.purine ? (
        <Text color={colors.textMuted}>
          {t('food.detail.purine', { level: t(`food.detail.purineLevels.${rating.purine}`) })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
});
