import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  type ContentDietType,
  DIET_ORDER,
  FOOD_CATEGORIES,
  type FoodCategory,
} from '@/content/schema';
import { colors, Chip, spacing, Text } from '@/shared/ui';

export type FoodFiltersProps = {
  category: FoodCategory | null;
  onCategoryChange: (category: FoodCategory | null) => void;
  diet: ContentDietType;
  onDietChange: (diet: ContentDietType) => void;
};

/** Horizontal category chips (with "All") and diet chips. */
export function FoodFilters({ category, onCategoryChange, diet, onDietChange }: FoodFiltersProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityLabel={t('food.list.categoriesLabel')}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          testID="food-category-all"
          label={t('food.list.allCategories')}
          selected={category === null}
          onPress={() => onCategoryChange(null)}
        />
        {FOOD_CATEGORIES.map(c => (
          <Chip
            key={c}
            testID={`food-category-${c}`}
            label={t(`food.categories.${c}`)}
            selected={category === c}
            onPress={() => onCategoryChange(c)}
          />
        ))}
      </ScrollView>
      <Text variant="caption" color={colors.textMuted} style={styles.label}>
        {t('food.list.dietLabel')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {DIET_ORDER.map(d => (
          <Chip
            key={d}
            testID={`food-diet-${d}`}
            label={t(`common.dietTypes.${d}`)}
            selected={diet === d}
            onPress={() => onDietChange(d)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  label: { paddingHorizontal: spacing.lg },
});
