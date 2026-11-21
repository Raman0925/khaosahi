import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { AD_REQUEST_OPTIONS, AD_UNIT_IDS, warnDev } from './config';
import { useAdsEnabled } from './runtime';

/** Where a banner or native ad is placed. Used for caps and placement docs. */
export type BannerPlacement = 'foodList' | 'learnList' | 'progress';

/** True while the software keyboard is shown. */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * Anchored adaptive banner, in the normal layout flow (never an overlay).
 * Renders nothing when ads are disabled, no banner id is configured, or loading failed.
 * Hidden (kept mounted, so it does not re-request) while the keyboard is open.
 */
export function Banner({ placement }: { placement: BannerPlacement }) {
  const enabled = useAdsEnabled();
  const keyboardVisible = useKeyboardVisible();
  const [failed, setFailed] = useState(false);
  const unitId = AD_UNIT_IDS.banner;

  if (!enabled || !unitId || failed) {
    return null;
  }
  return (
    <View
      testID={`ad-banner-${placement}`}
      style={[styles.container, keyboardVisible ? styles.hidden : null]}
    >
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={AD_REQUEST_OPTIONS}
        onAdFailedToLoad={error => {
          warnDev(`banner (${placement}) failed to load`, error);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  hidden: { display: 'none' },
});
