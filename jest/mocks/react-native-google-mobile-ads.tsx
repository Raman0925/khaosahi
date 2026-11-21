/**
 * Manual mock of react-native-google-mobile-ads (mapped in jest.config.js). Covers the subset the
 * app uses. Full-screen ads never load by themselves: tests drive them with `emit(...)`.
 */
import { jest } from '@jest/globals';
import React, { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

export const TestIds = {
  APP_OPEN: 'test-app-open',
  ADAPTIVE_BANNER: 'test-adaptive-banner',
  BANNER: 'test-banner',
  INTERSTITIAL: 'test-interstitial',
  REWARDED: 'test-rewarded',
  REWARDED_INTERSTITIAL: 'test-rewarded-interstitial',
  NATIVE: 'test-native',
  NATIVE_VIDEO: 'test-native-video',
};

export const AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  PAID: 'paid',
  CLICKED: 'clicked',
  CLOSED: 'closed',
  IMPRESSION: 'impression',
} as const;

export const RewardedAdEventType = {
  LOADED: 'rewarded_loaded',
  EARNED_REWARD: 'rewarded_earned_reward',
} as const;

export const BannerAdSize = {
  BANNER: 'BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
} as const;

export const MaxAdContentRating = { G: 'G', PG: 'PG', T: 'T', MA: 'MA' } as const;

export const AdsConsentPrivacyOptionsRequirementStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
} as const;

export const AdsConsentStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  OBTAINED: 'OBTAINED',
} as const;

export type MockConsentInfo = {
  status: string;
  canRequestAds: boolean;
  privacyOptionsRequirementStatus: string;
  isConsentFormAvailable: boolean;
};

export const CONSENT_NOT_REQUIRED: MockConsentInfo = {
  status: AdsConsentStatus.NOT_REQUIRED,
  canRequestAds: true,
  privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.NOT_REQUIRED,
  isConsentFormAvailable: false,
};

export const AdsConsent = {
  gatherConsent: jest.fn(async (): Promise<MockConsentInfo> => CONSENT_NOT_REQUIRED),
  getConsentInfo: jest.fn(async (): Promise<MockConsentInfo> => CONSENT_NOT_REQUIRED),
  showPrivacyOptionsForm: jest.fn(async (): Promise<MockConsentInfo> => CONSENT_NOT_REQUIRED),
  requestInfoUpdate: jest.fn(async (): Promise<MockConsentInfo> => CONSENT_NOT_REQUIRED),
};

export const mobileAdsModule = {
  initialize: jest.fn(async () => []),
  setRequestConfiguration: jest.fn(async (_config: unknown) => undefined),
};

const mobileAds = () => mobileAdsModule;
export default mobileAds;
export const MobileAds = mobileAds;

type Listener = (payload?: unknown) => void;

/** Fake full-screen ad. `emit(type)` simulates an SDK event. */
export class MockFullScreenAd {
  readonly listeners = new Map<string, Set<Listener>>();
  readonly load = jest.fn();
  readonly show = jest.fn(async () => undefined);
  readonly destroy = jest.fn(() => this.listeners.clear());
  readonly removeAllListeners = jest.fn(() => this.listeners.clear());

  constructor(
    readonly format: 'interstitial' | 'rewarded' | 'appOpen',
    readonly adUnitId: string,
    readonly requestOptions: unknown,
  ) {}

  addAdEventListener(type: string, listener: Listener): () => void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
    return () => set.delete(listener);
  }

  emit(type: string, payload?: unknown): void {
    this.listeners.get(type)?.forEach(listener => listener(payload));
  }
}

/** Every full-screen ad created since the last `resetAdsMock()`. */
export const createdAds: MockFullScreenAd[] = [];

function fullScreenFactory(format: MockFullScreenAd['format']) {
  return {
    createForAdRequest: jest.fn((adUnitId: string, requestOptions?: unknown) => {
      const ad = new MockFullScreenAd(format, adUnitId, requestOptions);
      createdAds.push(ad);
      return ad;
    }),
  };
}

export const InterstitialAd = fullScreenFactory('interstitial');
export const RewardedAd = fullScreenFactory('rewarded');
export const AppOpenAd = fullScreenFactory('appOpen');

export function latestAd(format: MockFullScreenAd['format']): MockFullScreenAd | undefined {
  return [...createdAds].reverse().find(ad => ad.format === format);
}

export function BannerAd(props: ViewProps & Record<string, unknown>) {
  return <View testID="mock-banner-ad" {...props} />;
}

// --- Native ---------------------------------------------------------------------------------

export const NativeAssetType = {
  ADVERTISER: 'advertiser',
  BODY: 'body',
  CALL_TO_ACTION: 'callToAction',
  HEADLINE: 'headline',
  ICON: 'icon',
  IMAGE: 'image',
} as const;

export const NativeAdChoicesPlacement = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_RIGHT: 2,
  BOTTOM_LEFT: 3,
};

export type MockNativeAd = {
  headline: string;
  body: string;
  callToAction: string;
  icon: { url: string; scale: number } | null;
  destroy: () => void;
};

export function makeNativeAd(overrides: Partial<MockNativeAd> = {}): MockNativeAd {
  return {
    headline: 'Test headline',
    body: 'Test body',
    callToAction: 'Install',
    icon: { url: 'https://example.com/icon.png', scale: 1 },
    destroy: jest.fn(),
    ...overrides,
  };
}

export const NativeAd = {
  createForAdRequest: jest.fn(
    async (_adUnitId: string, _options?: unknown): Promise<MockNativeAd> => makeNativeAd(),
  ),
};

export function NativeAdView({ children, ...props }: ViewProps & { nativeAd: unknown }) {
  return <View {...props}>{children}</View>;
}

export function NativeAsset({ children }: { assetType: string; children: ReactNode }) {
  return <>{children}</>;
}

export function NativeMediaView() {
  return null;
}

/** Restores default behaviour and forgets created ads. Call in `beforeEach`. */
export function resetAdsMock(): void {
  createdAds.length = 0;
  AdsConsent.gatherConsent.mockImplementation(async () => CONSENT_NOT_REQUIRED);
  AdsConsent.getConsentInfo.mockImplementation(async () => CONSENT_NOT_REQUIRED);
  AdsConsent.showPrivacyOptionsForm.mockImplementation(async () => CONSENT_NOT_REQUIRED);
  mobileAdsModule.initialize.mockImplementation(async () => []);
  mobileAdsModule.setRequestConfiguration.mockImplementation(async () => undefined);
  NativeAd.createForAdRequest.mockImplementation(async () => makeNativeAd());
  jest.clearAllMocks();
}
