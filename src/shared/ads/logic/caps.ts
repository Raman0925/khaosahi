/**
 * Pure frequency-cap logic for full-screen ads. No React, no SDK, no clock: `now` is passed in.
 * All numbers come from `AD_CAPS` in ../config.ts.
 */
import { AD_CAPS } from '../config';

export type FullScreenAdKind = 'interstitial' | 'appOpen' | 'rewarded';
export type InterstitialTriggerKind = 'articleClosed' | 'foodDetailViewed';

/** Persisted counters (MMKV). Timestamps are epoch milliseconds. */
export type AdCounters = {
  /** User actions (navigation changes) since the last full-screen ad was shown. */
  actionsSinceFullScreenAd: number;
  lastFullScreenAdAt: number | null;
  lastInterstitialAt: number | null;
  /** Food detail views counted towards "every Nth view". */
  foodDetailViews: number;
};

export const INITIAL_AD_COUNTERS: AdCounters = {
  // Start "satisfied" so the first eligible trigger after onboarding is not blocked by the action rule.
  actionsSinceFullScreenAd: AD_CAPS.minActionsBetweenFullScreenAds,
  lastFullScreenAdAt: null,
  lastInterstitialAt: null,
  foodDetailViews: 0,
};

/** Everything `canShowFullScreenAd` needs: persisted counters + live app state. */
export type FullScreenAdState = AdCounters & {
  /** False until onboarding (incl. profile setup) is complete. */
  onboardingCompleted: boolean;
  /** A full-screen ad is currently on screen (or being presented). */
  isShowingFullScreenAd: boolean;
  /**
   * When the app last went to the background in this process. `null` on a cold start, so an app
   * open ad can never show on app launch / first launch of a fresh install.
   */
  backgroundedAt: number | null;
};

/** Upper bound so the persisted counter cannot grow forever. */
const MAX_COUNTED_ACTIONS = 1000;

/** Time since `at`. A clock that moved backwards counts as "long ago" so caps cannot lock forever. */
function elapsedSince(at: number | null, now: number): number {
  if (at === null) {
    return Number.POSITIVE_INFINITY;
  }
  const elapsed = now - at;
  return elapsed < 0 ? Number.POSITIVE_INFINITY : elapsed;
}

function isAdjacentToFullScreenAd(state: AdCounters, now: number): boolean {
  return elapsedSince(state.lastFullScreenAdAt, now) < AD_CAPS.fullScreenAdjacencyMs;
}

/**
 * Whether a full-screen ad of `kind` may be shown now.
 *
 * - all kinds: onboarding complete, no other full-screen ad on screen;
 * - interstitial: ≥ 2 user actions since the last full-screen ad, ≥ 3 min since the last
 *   interstitial, not within 60 s of any full-screen ad;
 * - appOpen: returning from ≥ 4 h in the background (never on cold start), not within 60 s of
 *   another full-screen ad;
 * - rewarded: user-initiated for an optional extra, so only the common rules apply.
 */
export function canShowFullScreenAd(
  state: FullScreenAdState,
  now: number,
  kind: FullScreenAdKind,
): boolean {
  if (!state.onboardingCompleted || state.isShowingFullScreenAd) {
    return false;
  }
  switch (kind) {
    case 'interstitial':
      return (
        state.actionsSinceFullScreenAd >= AD_CAPS.minActionsBetweenFullScreenAds &&
        elapsedSince(state.lastInterstitialAt, now) >= AD_CAPS.interstitialMinIntervalMs &&
        !isAdjacentToFullScreenAd(state, now)
      );
    case 'appOpen':
      return (
        state.backgroundedAt !== null &&
        now - state.backgroundedAt >= AD_CAPS.appOpenMinBackgroundMs &&
        !isAdjacentToFullScreenAd(state, now)
      );
    case 'rewarded':
      return true;
  }
}

/** Whether this trigger occurrence is a candidate for an interstitial (caps are checked separately). */
export function isInterstitialTriggerEligible(
  counters: AdCounters,
  trigger: InterstitialTriggerKind,
): boolean {
  switch (trigger) {
    case 'articleClosed':
      return true;
    case 'foodDetailViewed':
      return (
        counters.foodDetailViews > 0 &&
        counters.foodDetailViews % AD_CAPS.foodDetailViewsPerInterstitial === 0
      );
  }
}

// --- Reducers (pure) -------------------------------------------------------------------------

export function recordAction(counters: AdCounters): AdCounters {
  return {
    ...counters,
    actionsSinceFullScreenAd: Math.min(counters.actionsSinceFullScreenAd + 1, MAX_COUNTED_ACTIONS),
  };
}

export function recordFoodDetailView(counters: AdCounters): AdCounters {
  // Wrap at the cap multiple so the counter stays small; eligibility is unchanged.
  const next = counters.foodDetailViews + 1;
  return {
    ...counters,
    foodDetailViews:
      next > AD_CAPS.foodDetailViewsPerInterstitial
        ? next - AD_CAPS.foodDetailViewsPerInterstitial
        : next,
  };
}

/** Call when a full-screen ad actually opened. Resets the action count; stamps the time. */
export function recordFullScreenAdShown(
  counters: AdCounters,
  now: number,
  kind: FullScreenAdKind,
): AdCounters {
  return {
    ...counters,
    actionsSinceFullScreenAd: 0,
    lastFullScreenAdAt: now,
    lastInterstitialAt: kind === 'interstitial' ? now : counters.lastInterstitialAt,
  };
}

/** Exponential retry delay after `failures` consecutive load failures (≥ 1). */
export function retryDelayMs(failures: number): number {
  const exponent = Math.max(0, Math.min(failures - 1, 20));
  return Math.min(AD_CAPS.retryBaseMs * 2 ** exponent, AD_CAPS.retryMaxMs);
}

/** Whether an ad loaded at `loadedAt` is still fresh enough to show. */
export function isAdFresh(loadedAt: number | null, now: number, kind: FullScreenAdKind): boolean {
  if (loadedAt === null) {
    return false;
  }
  const age = now - loadedAt;
  return age >= 0 && age < AD_CAPS.maxAdAgeMs[kind];
}
