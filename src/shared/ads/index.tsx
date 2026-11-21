/**
 * Ads public API (react-native-google-mobile-ads). Signatures are a contract used by features.
 * Policy, placements and caps: docs/ads.md. All caps: ./config.ts.
 *
 * Rules: never pass health data to ads; no ads on onboarding, consent, forms, delete/export.
 */
export { AdsProvider } from './AdsProvider';
export { Banner, type BannerPlacement } from './Banner';
export { NativeAdCard, type NativePlacement } from './NativeAdCard';
export { NATIVE_AD_INTERVAL } from './config';
export { openAdPrivacyOptions } from './consent';
export {
  type InterstitialTrigger,
  recordUserAction,
  type RewardedExtraId,
  useAdPrivacyOptionsRequired,
  useInterstitial,
  useRewarded,
} from './hooks';
export { useAdsEnabled } from './runtime';
