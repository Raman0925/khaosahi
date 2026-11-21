import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

import { usePreferences } from '@/shared/preferences/store';

import { AD_CAPS, AD_REQUEST_OPTIONS, AD_UNIT_IDS, type AdUnitIds } from './config';
import {
  createFullScreenController,
  type FullScreenAdFactory,
  type FullScreenController,
} from './fullScreenController';
import {
  canShowFullScreenAd,
  type FullScreenAdKind,
  type FullScreenAdState,
  type InterstitialTriggerKind,
  isInterstitialTriggerEligible,
} from './logic/caps';
import { useAdsRuntime } from './runtime';
import { getAdCounters, useAdsStore } from './store';

// --- SDK factories (no targeting, no health data: AD_REQUEST_OPTIONS only) -------------------

const interstitialFactory =
  (unitId: string): FullScreenAdFactory =>
  handlers => {
    const ad = InterstitialAd.createForAdRequest(unitId, AD_REQUEST_OPTIONS);
    ad.addAdEventListener(AdEventType.LOADED, handlers.loaded);
    ad.addAdEventListener(AdEventType.ERROR, handlers.error);
    ad.addAdEventListener(AdEventType.OPENED, handlers.opened);
    ad.addAdEventListener(AdEventType.CLOSED, handlers.closed);
    return ad;
  };

const rewardedFactory =
  (unitId: string): FullScreenAdFactory =>
  handlers => {
    const ad = RewardedAd.createForAdRequest(unitId, AD_REQUEST_OPTIONS);
    ad.addAdEventListener(RewardedAdEventType.LOADED, handlers.loaded);
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, handlers.earnedReward);
    ad.addAdEventListener(AdEventType.ERROR, handlers.error);
    ad.addAdEventListener(AdEventType.OPENED, handlers.opened);
    ad.addAdEventListener(AdEventType.CLOSED, handlers.closed);
    return ad;
  };

const appOpenFactory =
  (unitId: string): FullScreenAdFactory =>
  handlers => {
    const ad = AppOpenAd.createForAdRequest(unitId, AD_REQUEST_OPTIONS);
    ad.addAdEventListener(AdEventType.LOADED, handlers.loaded);
    ad.addAdEventListener(AdEventType.ERROR, handlers.error);
    ad.addAdEventListener(AdEventType.OPENED, handlers.opened);
    ad.addAdEventListener(AdEventType.CLOSED, handlers.closed);
    return ad;
  };

// --- Registry -------------------------------------------------------------------------------

let controllers: Partial<Record<FullScreenAdKind, FullScreenController>> = {};
let appStateSubscription: NativeEventSubscription | null = null;
let backgroundedAt: number | null = null;
let appOpenInFlight = false;
const registryListeners = new Set<() => void>();

const notifyRegistry = () => registryListeners.forEach(listener => listener());

/** Notified when full-screen controllers start/stop or the rewarded ad's loaded state changes. */
export function subscribeFullScreenAds(listener: () => void): () => void {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

export function isRewardedLoaded(): boolean {
  return controllers.rewarded?.isLoaded() ?? false;
}

/** Creates the controllers for every format that has an ad unit id, preloads, listens to AppState. */
export function startFullScreenAds(ids: AdUnitIds = AD_UNIT_IDS): void {
  if (appStateSubscription) {
    return;
  }
  if (ids.interstitial) {
    controllers.interstitial = createFullScreenController(
      'interstitial',
      interstitialFactory(ids.interstitial),
    );
    controllers.interstitial.load();
  }
  if (ids.rewarded) {
    controllers.rewarded = createFullScreenController('rewarded', rewardedFactory(ids.rewarded));
    controllers.rewarded.subscribe(notifyRegistry);
    controllers.rewarded.load();
  }
  if (ids.appOpen) {
    // Not preloaded: after ≥ 4 h in the background a preloaded app open ad would have expired.
    controllers.appOpen = createFullScreenController('appOpen', appOpenFactory(ids.appOpen), {
      reloadAfterClose: false,
    });
  }
  backgroundedAt = null;
  appStateSubscription = AppState.addEventListener('change', status =>
    handleAppStateChange(status),
  );
  notifyRegistry();
}

/** Disposes all full-screen ads (consent withdrawn, or tests). */
export function stopFullScreenAds(): void {
  Object.values(controllers).forEach(controller => controller.dispose());
  controllers = {};
  appStateSubscription?.remove();
  appStateSubscription = null;
  backgroundedAt = null;
  appOpenInFlight = false;
  notifyRegistry();
}

function fullScreenState(background: number | null): FullScreenAdState {
  return {
    ...getAdCounters(),
    onboardingCompleted: usePreferences.getState().onboardingCompletedAt !== null,
    isShowingFullScreenAd: useAdsRuntime.getState().isShowingFullScreenAd,
    backgroundedAt: background,
  };
}

// --- Interstitial ---------------------------------------------------------------------------

/**
 * Records the trigger and shows a preloaded interstitial if this occurrence is eligible and every
 * cap allows it. Never waits for a load: returns false at once if no ad is ready.
 */
export function handleInterstitialTrigger(
  trigger: InterstitialTriggerKind,
  now: number = Date.now(),
): boolean {
  if (trigger === 'foodDetailViewed') {
    useAdsStore.getState().recordFoodDetailView();
  }
  const controller = controllers.interstitial;
  controller?.ensureFresh(now);
  if (
    !controller ||
    !isInterstitialTriggerEligible(getAdCounters(), trigger) ||
    !canShowFullScreenAd(fullScreenState(null), now, 'interstitial') ||
    !controller.isReady(now)
  ) {
    return false;
  }
  controller.show().catch(() => undefined);
  return true;
}

// --- Rewarded -------------------------------------------------------------------------------

/** Shows the rewarded ad for `extraId`; resolves true only when the reward was earned. */
export async function showRewarded(extraId: string): Promise<boolean> {
  const controller = controllers.rewarded;
  if (!controller || !canShowFullScreenAd(fullScreenState(null), Date.now(), 'rewarded')) {
    return false;
  }
  const { earned } = await controller.show();
  if (earned) {
    useAdsStore.getState().unlockExtra(extraId);
  }
  return earned;
}

// --- App open -------------------------------------------------------------------------------

export function handleAppStateChange(status: AppStateStatus, now: number = Date.now()): void {
  if (status === 'background') {
    backgroundedAt = now;
    return;
  }
  if (status !== 'active') {
    return;
  }
  const since = backgroundedAt;
  backgroundedAt = null;
  maybeShowAppOpen(since, now).catch(() => undefined);
}

/**
 * On return from ≥ 4 h in the background: load a fresh app open ad and show it only if it is
 * ready within `appOpenLoadTimeoutMs`, the user has not navigated meanwhile and every cap still
 * allows it. Never blocks the UI.
 */
export async function maybeShowAppOpen(since: number | null, now: number): Promise<boolean> {
  const controller = controllers.appOpen;
  if (
    !controller ||
    appOpenInFlight ||
    !canShowFullScreenAd(fullScreenState(since), now, 'appOpen')
  ) {
    return false;
  }
  appOpenInFlight = true;
  try {
    const actionsBefore = getAdCounters().actionsSinceFullScreenAd;
    const ready = await controller.waitUntilLoaded(AD_CAPS.appOpenLoadTimeoutMs);
    const stillAllowed =
      ready &&
      AppState.currentState === 'active' &&
      getAdCounters().actionsSinceFullScreenAd === actionsBefore &&
      canShowFullScreenAd(fullScreenState(since), Date.now(), 'appOpen');
    if (!stillAllowed) {
      return false;
    }
    const { opened } = await controller.show();
    return opened;
  } finally {
    appOpenInFlight = false;
  }
}
