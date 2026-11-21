/**
 * Ads public API. A0 STUB: everything renders nothing / does nothing.
 * A6 implements these with react-native-google-mobile-ads WITHOUT changing the signatures,
 * so features can integrate now. See docs/agents.md and docs/ads.md.
 *
 * Rules: never pass health data to ads; no ads on onboarding, consent, forms, delete/export.
 */
import React, { type ReactNode } from 'react';

/** Where a banner or native ad is placed. Used for caps and placement docs. */
export type BannerPlacement = 'foodList' | 'learnList' | 'progress';
export type NativePlacement = 'learnList' | 'foodSearch';
/** Events that may show an interstitial if `canShowFullScreenAd` allows it. */
export type InterstitialTrigger = 'articleClosed' | 'foodDetailViewed';
/** Optional extras unlocked with a rewarded ad (never safety info, ratings or disclaimers). */
export type RewardedExtraId = string;

/** Show a native ad after every Nth list row. */
export const NATIVE_AD_INTERVAL = 8;

export function AdsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Anchored adaptive banner. Renders nothing while the keyboard is open. */
export function Banner(_props: { placement: BannerPlacement }) {
  return null;
}

/** Native ad row, clearly labelled "Ad". */
export function NativeAdCard(_props: { placement: NativePlacement }) {
  return null;
}

/** Counts a user action (called by the navigator on every navigation change). */
export function recordUserAction(): void {}

/** Call `onTrigger` when the event happens; the hook decides whether an ad may be shown. */
export function useInterstitial(): { onTrigger: (trigger: InterstitialTrigger) => void } {
  return { onTrigger: () => undefined };
}

/** Rewarded ad for one optional extra. `show()` resolves true when the reward was earned. */
export function useRewarded(_extraId: RewardedExtraId): {
  isLoaded: boolean;
  isUnlocked: boolean;
  show: () => Promise<boolean>;
} {
  return { isLoaded: false, isUnlocked: false, show: async () => false };
}

/** Whether Settings must show "Ad privacy options" (UMP privacy options required). */
export function useAdPrivacyOptionsRequired(): boolean {
  return false;
}

/** Opens the UMP privacy options form (Settings → Ad privacy options). */
export async function openAdPrivacyOptions(): Promise<void> {}
