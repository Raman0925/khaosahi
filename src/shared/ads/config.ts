import Config from 'react-native-config';
import { MaxAdContentRating, type RequestOptions, TestIds } from 'react-native-google-mobile-ads';

/**
 * Every ad frequency cap and timing rule lives here. Policy notes: docs/ads.md.
 */

/** Features render a native ad after every Nth list row. */
export const NATIVE_AD_INTERVAL = 8;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const AD_CAPS = {
  /** User actions (navigation changes) required since the last full-screen ad before an interstitial. */
  minActionsBetweenFullScreenAds: 2,
  /** Minimum time between two interstitials. */
  interstitialMinIntervalMs: 3 * MINUTE,
  /** No full-screen ad (interstitial or app open) within this time after another one closed/opened. */
  fullScreenAdjacencyMs: 60 * SECOND,
  /** An interstitial may follow every Nth food detail view. */
  foodDetailViewsPerInterstitial: 4,
  /** App open ad only when returning to the foreground after at least this long in the background. */
  appOpenMinBackgroundMs: 4 * HOUR,
  /** On return, an app open ad that is not ready within this time is skipped (never blocks the UI). */
  appOpenLoadTimeoutMs: 3 * SECOND,
  /** Loaded ads older than this are treated as expired and reloaded (Google: 1 h / app open 4 h). */
  maxAdAgeMs: { interstitial: 1 * HOUR, rewarded: 1 * HOUR, appOpen: 4 * HOUR },
  /** Retry after a failed load: base delay doubled per failure, capped. */
  retryBaseMs: 30 * SECOND,
  retryMaxMs: 10 * MINUTE,
} as const;

export type AdFormat = 'banner' | 'native' | 'interstitial' | 'rewarded' | 'appOpen';
/** `null` = format disabled (no ad unit id configured for this build). */
export type AdUnitIds = Record<AdFormat, string | null>;

export const TEST_AD_UNIT_IDS: Record<AdFormat, string> = {
  banner: TestIds.ADAPTIVE_BANNER,
  native: TestIds.NATIVE,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
  appOpen: TestIds.APP_OPEN,
};

/** `.env` keys (react-native-config) read in release builds. See .env.example. */
export const AD_UNIT_ENV_KEYS: Record<AdFormat, string> = {
  banner: 'ADMOB_BANNER_ID',
  native: 'ADMOB_NATIVE_ID',
  interstitial: 'ADMOB_INTERSTITIAL_ID',
  rewarded: 'ADMOB_REWARDED_ID',
  appOpen: 'ADMOB_APP_OPEN_ID',
};

const FORMATS = Object.keys(AD_UNIT_ENV_KEYS) as AdFormat[];

/**
 * Dev builds always use Google's test ids (never real ones: clicking your own live ads is a
 * policy violation). Release builds use the `.env` ids; a missing or blank id disables that format.
 */
export function resolveAdUnitIds(
  isDev: boolean,
  env: Readonly<Record<string, string | undefined>>,
): AdUnitIds {
  const ids = {} as AdUnitIds;
  for (const format of FORMATS) {
    if (isDev) {
      ids[format] = TEST_AD_UNIT_IDS[format];
    } else {
      const value = env[AD_UNIT_ENV_KEYS[format]]?.trim();
      ids[format] = value ? value : null;
    }
  }
  return ids;
}

export const AD_UNIT_IDS: AdUnitIds = resolveAdUnitIds(__DEV__, Config);

/**
 * The only request options ever sent. Deliberately empty of targeting: no keywords, contentUrl,
 * neighboringContentUrls, customTargeting or ids — and never any health data.
 */
export const AD_REQUEST_OPTIONS: RequestOptions = Object.freeze({});

/** Global SDK request configuration (adult wellness app: not child-directed; G/PG ads only). */
export const AD_REQUEST_CONFIGURATION = {
  maxAdContentRating: MaxAdContentRating.PG,
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
} as const;

export function warnDev(message: string, detail?: unknown): void {
  if (__DEV__) {
    console.warn(`[ads] ${message}`, detail ?? '');
  }
}
