import { useCallback, useMemo, useSyncExternalStore } from 'react';

import {
  handleInterstitialTrigger,
  isRewardedLoaded,
  showRewarded,
  subscribeFullScreenAds,
} from './fullScreenAds';
import type { InterstitialTriggerKind } from './logic/caps';
import { useAdsRuntime } from './runtime';
import { useAdsStore } from './store';

/** Events that may show an interstitial if `canShowFullScreenAd` allows it. */
export type InterstitialTrigger = InterstitialTriggerKind;
/** Optional extras unlocked with a rewarded ad (never safety info, ratings or disclaimers). */
export type RewardedExtraId = string;

/** Counts a user action (called by the navigator on every navigation change). */
export function recordUserAction(): void {
  useAdsStore.getState().recordAction();
}

/** Call `onTrigger` when the event happens; the hook decides whether an ad may be shown. */
export function useInterstitial(): { onTrigger: (trigger: InterstitialTrigger) => void } {
  const onTrigger = useCallback((trigger: InterstitialTrigger) => {
    handleInterstitialTrigger(trigger);
  }, []);
  return useMemo(() => ({ onTrigger }), [onTrigger]);
}

/**
 * Rewarded ad for one optional extra. `show()` resolves true when the reward was earned (the
 * unlock is persisted). If the extra is already unlocked it resolves true without showing an ad.
 */
export function useRewarded(extraId: RewardedExtraId): {
  isLoaded: boolean;
  isUnlocked: boolean;
  show: () => Promise<boolean>;
} {
  const isUnlocked = useAdsStore(state => state.unlockedExtras.includes(extraId));
  const isLoaded = useSyncExternalStore(subscribeFullScreenAds, isRewardedLoaded);
  const show = useCallback(async () => {
    if (useAdsStore.getState().unlockedExtras.includes(extraId)) {
      return true;
    }
    return showRewarded(extraId);
  }, [extraId]);
  return useMemo(() => ({ isLoaded, isUnlocked, show }), [isLoaded, isUnlocked, show]);
}

/** Whether Settings must show "Ad privacy options" (UMP privacy options required). */
export function useAdPrivacyOptionsRequired(): boolean {
  return useAdsRuntime(state => state.privacyOptionsRequired);
}
