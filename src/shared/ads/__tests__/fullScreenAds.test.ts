import { AppState } from 'react-native';

import { usePreferences } from '@/shared/preferences/store';
import { storage } from '@/shared/storage/mmkv';
import { resetAllStores } from '@/shared/storage/reset';

import {
  AdEventType,
  latestAd,
  type MockFullScreenAd,
  resetAdsMock,
  RewardedAdEventType,
  TestIds,
} from '../../../../jest/mocks/react-native-google-mobile-ads';
import { AD_CAPS, type AdUnitIds } from '../config';
import { resetAdsForTests } from '../consent';
import {
  handleAppStateChange,
  handleInterstitialTrigger,
  isRewardedLoaded,
  maybeShowAppOpen,
  showRewarded,
  startFullScreenAds,
  stopFullScreenAds,
} from '../fullScreenAds';
import { recordUserAction } from '../hooks';
import { useAdsRuntime } from '../runtime';
import { useAdsStore } from '../store';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = new Date('2026-11-21T10:00:00Z').getTime();

const IDS: AdUnitIds = {
  banner: TestIds.ADAPTIVE_BANNER,
  native: TestIds.NATIVE,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
  appOpen: TestIds.APP_OPEN,
};

function ad(format: MockFullScreenAd['format']): MockFullScreenAd {
  const found = latestAd(format);
  if (!found) {
    throw new Error(`no ${format} ad created`);
  }
  return found;
}

function setAppState(status: string) {
  Object.defineProperty(AppState, 'currentState', { value: status, configurable: true });
}

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers({ now: T0 });
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  resetAdsMock();
  resetAdsForTests();
  storage.clearAll();
  resetAllStores();
  usePreferences.getState().completeOnboarding(new Date(T0 - HOUR));
  setAppState('active');
});

afterEach(() => {
  stopFullScreenAds();
  warnSpy.mockRestore();
  jest.useRealTimers();
});

describe('interstitial', () => {
  function startLoaded() {
    startFullScreenAds(IDS);
    const interstitial = ad('interstitial');
    expect(interstitial.load).toHaveBeenCalledTimes(1);
    expect(interstitial.requestOptions).toEqual({});
    interstitial.emit(AdEventType.LOADED);
    return interstitial;
  }

  it('preloads and shows on articleClosed, then records it and reloads after close', () => {
    const interstitial = startLoaded();
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(true);
    expect(interstitial.show).toHaveBeenCalledTimes(1);
    expect(useAdsRuntime.getState().isShowingFullScreenAd).toBe(true);

    interstitial.emit(AdEventType.OPENED);
    expect(useAdsStore.getState()).toMatchObject({
      actionsSinceFullScreenAd: 0,
      lastFullScreenAdAt: T0,
      lastInterstitialAt: T0,
    });
    interstitial.emit(AdEventType.CLOSED);
    expect(useAdsRuntime.getState().isShowingFullScreenAd).toBe(false);
    expect(interstitial.load).toHaveBeenCalledTimes(2);
  });

  it('enforces the 2-action rule and the 3-minute cap between interstitials', () => {
    const interstitial = startLoaded();
    handleInterstitialTrigger('articleClosed', Date.now());
    interstitial.emit(AdEventType.OPENED);
    interstitial.emit(AdEventType.CLOSED);
    interstitial.emit(AdEventType.LOADED);

    jest.setSystemTime(T0 + 5 * MIN);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false); // 0 actions
    recordUserAction();
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false); // 1 action
    recordUserAction();
    jest.setSystemTime(T0 + 2 * MIN);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false); // < 3 min
    jest.setSystemTime(T0 + 3 * MIN);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(true);
    expect(interstitial.show).toHaveBeenCalledTimes(2);
  });

  it('shows only on every 4th food detail view', () => {
    const interstitial = startLoaded();
    const results = [1, 2, 3, 4].map(() =>
      handleInterstitialTrigger('foodDetailViewed', Date.now()),
    );
    expect(results).toEqual([false, false, false, true]);
    expect(interstitial.show).toHaveBeenCalledTimes(1);
  });

  it('never before onboarding is complete', () => {
    usePreferences.getState().reset();
    const interstitial = startLoaded();
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false);
    expect(interstitial.show).not.toHaveBeenCalled();
  });

  it('never blocks: returns false when no ad is loaded yet', () => {
    startFullScreenAds(IDS);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false);
    expect(ad('interstitial').show).not.toHaveBeenCalled();
  });

  it('retries failed loads with backoff', () => {
    startFullScreenAds(IDS);
    const first = ad('interstitial');
    first.emit(AdEventType.ERROR, new Error('no fill'));
    expect(first.load).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(AD_CAPS.retryBaseMs);
    expect(first.load).toHaveBeenCalledTimes(2);
  });

  it('does not show an expired ad; replaces it with a fresh one', () => {
    const interstitial = startLoaded();
    jest.setSystemTime(T0 + AD_CAPS.maxAdAgeMs.interstitial);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false);
    expect(interstitial.show).not.toHaveBeenCalled();
    expect(interstitial.destroy).toHaveBeenCalled();
    expect(ad('interstitial')).not.toBe(interstitial);
    expect(ad('interstitial').load).toHaveBeenCalled();
  });

  it('is not created when the format has no ad unit id', () => {
    startFullScreenAds({ ...IDS, interstitial: null });
    expect(latestAd('interstitial')).toBeUndefined();
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false);
  });
});

describe('rewarded', () => {
  function startLoaded() {
    startFullScreenAds(IDS);
    const rewarded = ad('rewarded');
    rewarded.emit(RewardedAdEventType.LOADED);
    expect(isRewardedLoaded()).toBe(true);
    return rewarded;
  }

  it('resolves true only after EARNED_REWARD and persists the unlocked extra', async () => {
    const rewarded = startLoaded();
    const result = showRewarded('festivalGuide');
    rewarded.emit(AdEventType.OPENED);
    rewarded.emit(RewardedAdEventType.EARNED_REWARD, { type: 'reward', amount: 1 });
    rewarded.emit(AdEventType.CLOSED);
    await expect(result).resolves.toBe(true);
    expect(useAdsStore.getState().unlockedExtras).toEqual(['festivalGuide']);
    expect(JSON.parse(storage.getString('ads') ?? '{}').state.unlockedExtras).toEqual([
      'festivalGuide',
    ]);
  });

  it('resolves false when closed without earning the reward', async () => {
    const rewarded = startLoaded();
    const result = showRewarded('sampleMenu');
    rewarded.emit(AdEventType.OPENED);
    rewarded.emit(AdEventType.CLOSED);
    await expect(result).resolves.toBe(false);
    expect(useAdsStore.getState().unlockedExtras).toEqual([]);
  });

  it('resolves false when not loaded, on show failure, or before onboarding', async () => {
    startFullScreenAds(IDS);
    await expect(showRewarded('x')).resolves.toBe(false);

    const rewarded = ad('rewarded');
    rewarded.emit(RewardedAdEventType.LOADED);
    rewarded.show.mockRejectedValueOnce(new Error('show failed'));
    await expect(showRewarded('x')).resolves.toBe(false);

    usePreferences.getState().reset();
    ad('rewarded').emit(RewardedAdEventType.LOADED);
    await expect(showRewarded('x')).resolves.toBe(false);
  });

  it('counts as a full-screen ad, so no interstitial right after it', async () => {
    const rewarded = startLoaded();
    ad('interstitial').emit(AdEventType.LOADED);
    const result = showRewarded('x');
    rewarded.emit(AdEventType.OPENED);
    rewarded.emit(AdEventType.CLOSED);
    await result;
    recordUserAction();
    recordUserAction();
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(false); // < 60 s
    jest.setSystemTime(T0 + MIN);
    expect(handleInterstitialTrigger('articleClosed', Date.now())).toBe(true);
  });
});

describe('app open', () => {
  it('shows after returning from ≥ 4 h in the background', async () => {
    startFullScreenAds(IDS);
    expect(latestAd('appOpen')).toBeUndefined(); // not preloaded
    handleAppStateChange('background', T0);
    jest.setSystemTime(T0 + 4 * HOUR);
    const shown = maybeShowAppOpen(T0, Date.now());
    const appOpen = ad('appOpen');
    expect(appOpen.load).toHaveBeenCalled();
    appOpen.emit(AdEventType.LOADED);
    await flush();
    expect(appOpen.show).toHaveBeenCalledTimes(1);
    appOpen.emit(AdEventType.OPENED);
    appOpen.emit(AdEventType.CLOSED);
    await expect(shown).resolves.toBe(true);
    expect(useAdsStore.getState().lastFullScreenAdAt).toBe(T0 + 4 * HOUR);
    expect(appOpen.load).toHaveBeenCalledTimes(1); // no reload after close
  });

  it('is wired to AppState background → active', async () => {
    startFullScreenAds(IDS);
    handleAppStateChange('background', T0);
    handleAppStateChange('active', T0 + 5 * HOUR);
    jest.setSystemTime(T0 + 5 * HOUR);
    ad('appOpen').emit(AdEventType.LOADED);
    await flush();
    expect(ad('appOpen').show).toHaveBeenCalled();
  });

  it('never on cold start or after a short background', async () => {
    startFullScreenAds(IDS);
    handleAppStateChange('active', T0); // cold start: never backgrounded
    handleAppStateChange('background', T0);
    handleAppStateChange('active', T0 + 4 * HOUR - 1);
    await flush();
    expect(latestAd('appOpen')).toBeUndefined();
  });

  it('never during onboarding', async () => {
    usePreferences.getState().reset();
    startFullScreenAds(IDS);
    await expect(maybeShowAppOpen(T0 - 5 * HOUR, T0)).resolves.toBe(false);
    expect(latestAd('appOpen')).toBeUndefined();
  });

  it('never adjacent to another full-screen ad', async () => {
    startFullScreenAds(IDS);
    useAdsStore.getState().recordFullScreenAdShown('interstitial', T0 - 30_000);
    await expect(maybeShowAppOpen(T0 - 5 * HOUR, T0)).resolves.toBe(false);
    expect(latestAd('appOpen')).toBeUndefined();
  });

  it('is skipped when the ad is not ready in time or the user navigated meanwhile', async () => {
    startFullScreenAds(IDS);
    const slow = maybeShowAppOpen(T0 - 5 * HOUR, T0);
    jest.advanceTimersByTime(AD_CAPS.appOpenLoadTimeoutMs);
    await expect(slow).resolves.toBe(false);
    expect(ad('appOpen').show).not.toHaveBeenCalled();

    const navigated = maybeShowAppOpen(T0 - 5 * HOUR, Date.now());
    recordUserAction();
    ad('appOpen').emit(AdEventType.LOADED);
    await expect(navigated).resolves.toBe(false);
    expect(ad('appOpen').show).not.toHaveBeenCalled();
  });

  it('a full-screen ad backgrounding the app does not trigger an app open ad', async () => {
    startFullScreenAds(IDS);
    handleAppStateChange('background', T0);
    handleAppStateChange('active', T0 + 20_000);
    await flush();
    expect(latestAd('appOpen')).toBeUndefined();
  });
});
