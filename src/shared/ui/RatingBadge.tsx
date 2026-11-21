import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Rating } from '@/content/schema/food';

import { Text } from './Text';
import { colors, radius, spacing } from './theme';

const STYLE: Record<Rating, { fg: string; bg: string; symbol: string }> = {
  good: { fg: colors.good, bg: colors.goodSoft, symbol: '✓' },
  limit: { fg: colors.limit, bg: colors.limitSoft, symbol: '!' },
  avoid: { fg: colors.avoid, bg: colors.avoidSoft, symbol: '✕' },
};

/** Good / Limit / Avoid badge. Uses a symbol as well as colour so it is not colour-only. */
export function RatingBadge({ rating, testID }: { rating: Rating; testID?: string }) {
  const { t } = useTranslation();
  const s = STYLE[rating];
  const label = t(`common.ratings.${rating}`);
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={label}
      style={[styles.badge, { backgroundColor: s.bg }]}
    >
      <Text variant="caption" weight="bold" color={s.fg}>
        {`${s.symbol} ${label}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
