import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';

import { colors, MIN_TOUCH, radius, spacing, Text } from '@/shared/ui';

import { AD_REQUEST_OPTIONS, AD_UNIT_IDS, warnDev } from './config';
import { useAdsEnabled } from './runtime';

export type NativePlacement = 'learnList' | 'foodSearch';

const ICON_SIZE = 48;

/** Loads one native ad while mounted and ads are enabled; destroys it on unmount. */
function useNativeAdLoad(enabled: boolean, unitId: string | null): NativeAd | null {
  const [ad, setAd] = useState<NativeAd | null>(null);
  useEffect(() => {
    if (!enabled || !unitId) {
      return;
    }
    let cancelled = false;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(unitId, {
      ...AD_REQUEST_OPTIONS,
      adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
      startVideoMuted: true,
    })
      .then(nativeAd => {
        if (cancelled) {
          nativeAd.destroy();
          return;
        }
        loaded = nativeAd;
        setAd(nativeAd);
      })
      .catch(error => warnDev('native ad failed to load', error)); // no-fill → render nothing
    return () => {
      cancelled = true;
      loaded?.destroy();
      setAd(null);
    };
  }, [enabled, unitId]);
  return ad;
}

/**
 * Native ad row for lists (features place one every NATIVE_AD_INTERVAL rows), clearly labelled
 * "Ad". Renders nothing while loading, on no-fill, or when ads are disabled.
 */
export function NativeAdCard({ placement }: { placement: NativePlacement }) {
  const { t } = useTranslation();
  const enabled = useAdsEnabled();
  const ad = useNativeAdLoad(enabled, AD_UNIT_IDS.native);

  if (!enabled || !ad) {
    return null;
  }
  return (
    <NativeAdView
      nativeAd={ad}
      testID={`ad-native-${placement}`}
      accessibilityLabel={t('ads.advertisement')}
      style={styles.card}
    >
      <View style={styles.badge}>
        <Text variant="caption" weight="bold" color={colors.limit}>
          {t('common.ad')}
        </Text>
      </View>
      <View style={styles.row}>
        {ad.icon ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image
              source={{ uri: ad.icon.url }}
              style={styles.icon}
              accessibilityIgnoresInvertColors
            />
          </NativeAsset>
        ) : null}
        <View style={styles.texts}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text weight="bold" numberOfLines={2}>
              {ad.headline}
            </Text>
          </NativeAsset>
          {ad.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text variant="caption" color={colors.textMuted} numberOfLines={3}>
                {ad.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>
      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text weight="medium" color={colors.onPrimary} center style={styles.cta}>
            {ad.callToAction}
          </Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.limitSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: radius.sm },
  texts: { flex: 1, gap: spacing.xs },
  cta: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    textAlignVertical: 'center',
  },
});
