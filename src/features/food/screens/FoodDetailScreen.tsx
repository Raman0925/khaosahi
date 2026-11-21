import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Food } from '@/content/schema';
import { useInterstitial } from '@/shared/ads';
import { type RootScreenProps, useRootNavigation } from '@/shared/navigation';
import type { Language } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';
import { colors, EmptyState, radius, Screen, spacing, Text } from '@/shared/ui';

import { FoodRow } from '../components/FoodRow';
import { RatingCard } from '../components/RatingCard';
import { getFoodIndex } from '../foodIndex';
import { effectiveRatings } from '../logic/ratings';

export function FoodDetailScreen({ route }: RootScreenProps<'FoodDetail'>) {
  const navigation = useRootNavigation();
  const { t, i18n } = useTranslation();
  const language: Language = i18n.language === 'hi' ? 'hi' : 'en';
  const { foodId } = route.params;
  const condition = useProfileStore(state => state.profile?.condition ?? null);

  const index = getFoodIndex();
  const food = index.byId.get(foodId);
  const ratings = useMemo(() => (food ? effectiveRatings(food, condition) : []), [food, condition]);
  const swaps = useMemo(
    () =>
      (food?.swaps ?? [])
        .map(id => index.byId.get(id))
        .filter((swap): swap is Food => swap !== undefined),
    [food, index],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('food.detail.title') });
  }, [navigation, t]);

  // Count this view once per mount; the ads module decides whether an interstitial may show.
  const { onTrigger } = useInterstitial();
  const triggered = useRef(false);
  useEffect(() => {
    if (food && !triggered.current) {
      triggered.current = true;
      onTrigger('foodDetailViewed');
    }
  }, [food, onTrigger]);

  const openSwap = useCallback(
    (swapId: string) => navigation.push('FoodDetail', { foodId: swapId }),
    [navigation],
  );

  if (!food) {
    return (
      <Screen testID="food-detail-not-found">
        <EmptyState title={t('food.detail.notFoundTitle')} body={t('food.detail.notFoundBody')} />
      </Screen>
    );
  }

  const otherLanguage: Language = language === 'hi' ? 'en' : 'hi';
  return (
    <Screen testID="food-detail-screen">
      <View style={styles.names}>
        <Text variant="title">{food.name[language]}</Text>
        <Text variant="bodyLarge" color={colors.textMuted}>
          {food.name[otherLanguage]}
        </Text>
      </View>

      {condition === null ? (
        <Text variant="caption" color={colors.textMuted}>
          {t('food.list.noProfileNote')}
        </Text>
      ) : null}

      {ratings.map(rating => (
        <RatingCard key={rating.dimension} rating={rating} language={language} />
      ))}

      {swaps.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">{t('food.detail.swapsTitle')}</Text>
          <View style={styles.swaps}>
            {swaps.map(swap => (
              <FoodRow
                key={swap.id}
                food={swap}
                language={language}
                condition={condition}
                onPress={openSwap}
                accessibilityHint={t('food.detail.swapHint')}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Text variant="caption" color={colors.textMuted} testID="food-disclaimer">
        {t('common.disclaimer')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  names: { gap: spacing.xs },
  section: { gap: spacing.sm },
  swaps: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
