import { AD_CAPS } from '../config';
import {
  type AdCounters,
  canShowFullScreenAd,
  type FullScreenAdState,
  INITIAL_AD_COUNTERS,
  isAdFresh,
  isInterstitialTriggerEligible,
  recordAction,
  recordFoodDetailView,
  recordFullScreenAdShown,
  retryDelayMs,
} from '../logic/caps';

const MIN = 60_000;
const HOUR = 60 * MIN;
const NOW = 1_800_000_000_000;

function state(overrides: Partial<FullScreenAdState> = {}): FullScreenAdState {
  return {
    ...INITIAL_AD_COUNTERS,
    onboardingCompleted: true,
    isShowingFullScreenAd: false,
    backgroundedAt: null,
    ...overrides,
  };
}

describe('config values', () => {
  it('matches the documented policy', () => {
    expect(AD_CAPS.minActionsBetweenFullScreenAds).toBe(2);
    expect(AD_CAPS.interstitialMinIntervalMs).toBe(3 * MIN);
    expect(AD_CAPS.foodDetailViewsPerInterstitial).toBe(4);
    expect(AD_CAPS.appOpenMinBackgroundMs).toBe(4 * HOUR);
    expect(AD_CAPS.fullScreenAdjacencyMs).toBe(MIN);
  });
});

describe('canShowFullScreenAd — common rules', () => {
  it.each(['interstitial', 'appOpen', 'rewarded'] as const)(
    '%s: never before onboarding is complete',
    kind => {
      const s = state({ onboardingCompleted: false, backgroundedAt: NOW - 5 * HOUR });
      expect(canShowFullScreenAd(s, NOW, kind)).toBe(false);
    },
  );

  it.each(['interstitial', 'appOpen', 'rewarded'] as const)(
    '%s: never while another full-screen ad is showing',
    kind => {
      const s = state({ isShowingFullScreenAd: true, backgroundedAt: NOW - 5 * HOUR });
      expect(canShowFullScreenAd(s, NOW, kind)).toBe(false);
    },
  );
});

describe('canShowFullScreenAd — interstitial', () => {
  it('is allowed on a fresh state after onboarding', () => {
    expect(canShowFullScreenAd(state(), NOW, 'interstitial')).toBe(true);
  });

  it('needs at least 2 user actions since the last full-screen ad', () => {
    const base = { lastFullScreenAdAt: NOW - 10 * MIN, lastInterstitialAt: NOW - 10 * MIN };
    expect(
      canShowFullScreenAd(state({ ...base, actionsSinceFullScreenAd: 0 }), NOW, 'interstitial'),
    ).toBe(false);
    expect(
      canShowFullScreenAd(state({ ...base, actionsSinceFullScreenAd: 1 }), NOW, 'interstitial'),
    ).toBe(false);
    expect(
      canShowFullScreenAd(state({ ...base, actionsSinceFullScreenAd: 2 }), NOW, 'interstitial'),
    ).toBe(true);
    expect(
      canShowFullScreenAd(state({ ...base, actionsSinceFullScreenAd: 9 }), NOW, 'interstitial'),
    ).toBe(true);
  });

  it('needs at least 3 minutes since the last interstitial', () => {
    const at = (ago: number) =>
      canShowFullScreenAd(
        state({
          actionsSinceFullScreenAd: 5,
          lastInterstitialAt: NOW - ago,
          lastFullScreenAdAt: NOW - ago,
        }),
        NOW,
        'interstitial',
      );
    expect(at(0)).toBe(false);
    expect(at(2 * MIN)).toBe(false);
    expect(at(3 * MIN - 1)).toBe(false);
    expect(at(3 * MIN)).toBe(true);
    expect(at(HOUR)).toBe(true);
  });

  it('is never right after another full-screen ad (e.g. an app open ad), even with actions', () => {
    const s = state({
      actionsSinceFullScreenAd: 3,
      lastFullScreenAdAt: NOW - 30_000,
      lastInterstitialAt: null,
    });
    expect(canShowFullScreenAd(s, NOW, 'interstitial')).toBe(false);
    expect(canShowFullScreenAd({ ...s, lastFullScreenAdAt: NOW - MIN }, NOW, 'interstitial')).toBe(
      true,
    );
  });

  it('does not lock forever when the clock moved backwards', () => {
    const s = state({
      actionsSinceFullScreenAd: 2,
      lastInterstitialAt: NOW + HOUR,
      lastFullScreenAdAt: NOW + HOUR,
    });
    expect(canShowFullScreenAd(s, NOW, 'interstitial')).toBe(true);
  });

  it('is blocked right after an interstitial was recorded, until actions and time pass', () => {
    let counters: AdCounters = recordFullScreenAdShown(INITIAL_AD_COUNTERS, NOW, 'interstitial');
    const can = (c: AdCounters, at: number) => canShowFullScreenAd(state(c), at, 'interstitial');
    expect(can(counters, NOW + 5 * MIN)).toBe(false); // 0 actions
    counters = recordAction(recordAction(counters));
    expect(can(counters, NOW + 2 * MIN)).toBe(false); // < 3 min
    expect(can(counters, NOW + 3 * MIN)).toBe(true);
  });
});

describe('canShowFullScreenAd — app open', () => {
  it('never on cold start / first launch (not backgrounded in this process)', () => {
    expect(canShowFullScreenAd(state({ backgroundedAt: null }), NOW, 'appOpen')).toBe(false);
  });

  it('only after at least 4 hours in the background', () => {
    const at = (ago: number) =>
      canShowFullScreenAd(state({ backgroundedAt: NOW - ago }), NOW, 'appOpen');
    expect(at(0)).toBe(false);
    expect(at(HOUR)).toBe(false);
    expect(at(4 * HOUR - 1)).toBe(false);
    expect(at(4 * HOUR)).toBe(true);
    expect(at(24 * HOUR)).toBe(true);
  });

  it('never during onboarding even after a long background', () => {
    const s = state({ onboardingCompleted: false, backgroundedAt: NOW - 10 * HOUR });
    expect(canShowFullScreenAd(s, NOW, 'appOpen')).toBe(false);
  });

  it('never within 60 s of another full-screen ad', () => {
    const s = state({ backgroundedAt: NOW - 5 * HOUR, lastFullScreenAdAt: NOW - 10_000 });
    expect(canShowFullScreenAd(s, NOW, 'appOpen')).toBe(false);
    expect(canShowFullScreenAd({ ...s, lastFullScreenAdAt: NOW - MIN }, NOW, 'appOpen')).toBe(true);
  });

  it('ignores the interstitial action and 3-minute rules', () => {
    const s = state({
      backgroundedAt: NOW - 5 * HOUR,
      actionsSinceFullScreenAd: 0,
      lastInterstitialAt: NOW - 2 * MIN,
      lastFullScreenAdAt: NOW - 2 * MIN,
    });
    expect(canShowFullScreenAd(s, NOW, 'appOpen')).toBe(true);
  });
});

describe('canShowFullScreenAd — rewarded', () => {
  it('is user-initiated, so action/time caps do not apply', () => {
    const s = state({
      actionsSinceFullScreenAd: 0,
      lastFullScreenAdAt: NOW - 1000,
      lastInterstitialAt: NOW - 1000,
    });
    expect(canShowFullScreenAd(s, NOW, 'rewarded')).toBe(true);
  });
});

describe('interstitial trigger eligibility', () => {
  it('articleClosed is eligible every time', () => {
    expect(isInterstitialTriggerEligible(INITIAL_AD_COUNTERS, 'articleClosed')).toBe(true);
  });

  it('foodDetailViewed is eligible on every 4th view only', () => {
    let counters = INITIAL_AD_COUNTERS;
    const eligible: boolean[] = [];
    for (let i = 0; i < 12; i++) {
      counters = recordFoodDetailView(counters);
      eligible.push(isInterstitialTriggerEligible(counters, 'foodDetailViewed'));
    }
    expect(eligible).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ]);
    expect(counters.foodDetailViews).toBeLessThanOrEqual(AD_CAPS.foodDetailViewsPerInterstitial);
  });

  it('foodDetailViewed is not eligible before any view was recorded', () => {
    expect(
      isInterstitialTriggerEligible(
        { ...INITIAL_AD_COUNTERS, foodDetailViews: 0 },
        'foodDetailViewed',
      ),
    ).toBe(false);
  });
});

describe('reducers', () => {
  it('recordAction counts up and is capped', () => {
    expect(
      recordAction({ ...INITIAL_AD_COUNTERS, actionsSinceFullScreenAd: 0 })
        .actionsSinceFullScreenAd,
    ).toBe(1);
    expect(
      recordAction({ ...INITIAL_AD_COUNTERS, actionsSinceFullScreenAd: 1000 })
        .actionsSinceFullScreenAd,
    ).toBe(1000);
  });

  it('recordFullScreenAdShown resets actions and stamps times per kind', () => {
    const before: AdCounters = {
      ...INITIAL_AD_COUNTERS,
      actionsSinceFullScreenAd: 7,
      lastInterstitialAt: 5,
    };
    expect(recordFullScreenAdShown(before, NOW, 'interstitial')).toEqual({
      ...before,
      actionsSinceFullScreenAd: 0,
      lastFullScreenAdAt: NOW,
      lastInterstitialAt: NOW,
    });
    expect(recordFullScreenAdShown(before, NOW, 'appOpen')).toEqual({
      ...before,
      actionsSinceFullScreenAd: 0,
      lastFullScreenAdAt: NOW,
      lastInterstitialAt: 5,
    });
    expect(recordFullScreenAdShown(before, NOW, 'rewarded').lastInterstitialAt).toBe(5);
  });

  it('reducers do not mutate their input', () => {
    const frozen = Object.freeze({ ...INITIAL_AD_COUNTERS });
    expect(() => {
      recordAction(frozen);
      recordFoodDetailView(frozen);
      recordFullScreenAdShown(frozen, NOW, 'interstitial');
    }).not.toThrow();
    expect(frozen).toEqual(INITIAL_AD_COUNTERS);
  });
});

describe('helpers', () => {
  it('retryDelayMs backs off exponentially up to the cap', () => {
    expect(retryDelayMs(1)).toBe(AD_CAPS.retryBaseMs);
    expect(retryDelayMs(2)).toBe(2 * AD_CAPS.retryBaseMs);
    expect(retryDelayMs(3)).toBe(4 * AD_CAPS.retryBaseMs);
    expect(retryDelayMs(50)).toBe(AD_CAPS.retryMaxMs);
  });

  it('isAdFresh honours per-format expiry', () => {
    expect(isAdFresh(null, NOW, 'interstitial')).toBe(false);
    expect(isAdFresh(NOW - 59 * MIN, NOW, 'interstitial')).toBe(true);
    expect(isAdFresh(NOW - HOUR, NOW, 'interstitial')).toBe(false);
    expect(isAdFresh(NOW - 3 * HOUR, NOW, 'appOpen')).toBe(true);
    expect(isAdFresh(NOW - 4 * HOUR, NOW, 'appOpen')).toBe(false);
    expect(isAdFresh(NOW + 1000, NOW, 'rewarded')).toBe(false);
  });
});
