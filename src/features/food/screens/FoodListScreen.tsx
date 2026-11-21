import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ContentDietType, Food, FoodCategory } from '@/content/schema';
import { Banner, NATIVE_AD_INTERVAL, NativeAdCard } from '@/shared/ads';
import type { Language } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';
import { colors, EmptyState, Screen, spacing, Text, TextField } from '@/shared/ui';

import { FoodFilters } from '../components/FoodFilters';
import { FoodRow } from '../components/FoodRow';
import { getFoodIndex } from '../foodIndex';
import { interleaveAds, type ListRow } from '../logic/interleaveAds';
import { searchFoods } from '../logic/search';

type Row = ListRow<Food>;

const keyExtractor = (row: Row) => row.key;
const getItemType = (row: Row) => row.type;

function Separator() {
  return <View style={styles.separator} />;
}

export function FoodListScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const language: Language = i18n.language === 'hi' ? 'hi' : 'en';
  const condition = useProfileStore(state => state.profile?.condition ?? null);
  const profileDiet = useProfileStore(state => state.profile?.dietType ?? null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | null>(null);
  // Session-only override; until the user picks one, follow the profile (all foods if none).
  const [dietOverride, setDietOverride] = useState<ContentDietType | null>(null);
  const diet: ContentDietType = dietOverride ?? profileDiet ?? 'nonveg';

  const results = useMemo(
    () =>
      searchFoods(query, getFoodIndex(), {
        dietType: diet,
        category: category ?? undefined,
        language,
      }),
    [query, diet, category, language],
  );
  const rows = useMemo(() => interleaveAds(results, NATIVE_AD_INTERVAL), [results]);

  const openFood = useCallback(
    (foodId: string) => navigation.navigate('FoodDetail', { foodId }),
    [navigation],
  );
  const rowHint = t('food.list.rowHint');

  const renderItem: ListRenderItem<Row> = useCallback(
    ({ item: row }) =>
      row.type === 'ad' ? (
        <NativeAdCard placement="foodSearch" />
      ) : (
        <FoodRow
          food={row.item}
          language={language}
          condition={condition}
          onPress={openFood}
          accessibilityHint={rowHint}
        />
      ),
    [language, condition, openFood, rowHint],
  );

  const listHeader = (
    <View style={styles.header}>
      <FoodFilters
        category={category}
        onCategoryChange={setCategory}
        diet={diet}
        onDietChange={setDietOverride}
      />
      <View style={styles.meta}>
        {condition === null ? (
          <Text variant="caption" color={colors.textMuted}>
            {t('food.list.noProfileNote')}
          </Text>
        ) : null}
        <Text variant="caption" color={colors.textMuted} accessibilityLiveRegion="polite">
          {t('food.list.resultCount', { count: results.length })}
        </Text>
      </View>
    </View>
  );

  const trimmed = query.trim();
  return (
    <Screen
      scroll={false}
      testID="food-list-screen"
      footer={<Banner placement="foodList" />}
      contentStyle={styles.content}
    >
      <View style={styles.search}>
        <TextField
          testID="food-search"
          label={t('food.list.searchLabel')}
          placeholder={t('food.list.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <View style={styles.list}>
        <FlashList
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          extraData={condition}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <EmptyState
              testID="food-empty"
              title={t('food.list.emptyTitle')}
              body={
                trimmed
                  ? t('food.list.emptySearch', { query: trimmed })
                  : t('food.list.emptyBrowse')
              }
            />
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingTop: spacing.md },
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  search: { paddingHorizontal: spacing.lg },
  meta: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  list: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
