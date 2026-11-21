import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Food } from '@/content/schema';
import type { Language } from '@/shared/preferences/store';
import type { Condition } from '@/shared/profile';
import { ListItem, RatingBadge } from '@/shared/ui';

import { overallRating } from '../logic/ratings';

export type FoodRowProps = {
  food: Food;
  language: Language;
  /** User's condition; `null` before a profile exists (both conditions count). */
  condition: Condition | null;
  onPress: (foodId: string) => void;
  accessibilityHint: string;
};

/** Food name (current language), other-language name, and the overall rating badge. */
export const FoodRow = memo(function FoodRowItem({
  food,
  language,
  condition,
  onPress,
  accessibilityHint,
}: FoodRowProps) {
  const { t } = useTranslation();
  const rating = overallRating(food, condition);
  const name = food.name[language];
  const otherName = food.name[language === 'hi' ? 'en' : 'hi'];
  const handlePress = useCallback(() => onPress(food.id), [onPress, food.id]);
  return (
    <ListItem
      testID={`food-row-${food.id}`}
      title={name}
      subtitle={otherName}
      right={<RatingBadge rating={rating} />}
      onPress={handlePress}
      accessibilityLabel={t('food.list.rowA11y', {
        name,
        otherName,
        rating: t(`common.ratings.${rating}`),
      })}
      accessibilityHint={accessibilityHint}
    />
  );
});
