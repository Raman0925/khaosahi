import mobileAds, {
  AdsConsent,
  type AdsConsentInfo,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';

import { AD_REQUEST_CONFIGURATION, warnDev } from './config';
import { startFullScreenAds, stopFullScreenAds } from './fullScreenAds';
import { setAdsRuntime, useAdsRuntime } from './runtime';

let startPromise: Promise<void> | null = null;
let sdkInitialised = false;

/** UMP consent info: gathers consent (no-op where not required), falls back to the last session. */
async function gatherConsentInfo(): Promise<AdsConsentInfo | null> {
  try {
    return await AdsConsent.gatherConsent();
  } catch (error) {
    warnDev('gatherConsent failed', error);
  }
  try {
    // Consent from a previous session may still allow requesting ads (e.g. offline today).
    return await AdsConsent.getConsentInfo();
  } catch (error) {
    warnDev('getConsentInfo failed', error);
    return null;
  }
}

async function initialiseSdk(): Promise<boolean> {
  if (sdkInitialised) {
    return true;
  }
  try {
    await mobileAds().setRequestConfiguration(AD_REQUEST_CONFIGURATION);
    await mobileAds().initialize();
    sdkInitialised = true;
    return true;
  } catch (error) {
    warnDev('mobileAds().initialize() failed', error);
    return false;
  }
}

/** Applies a UMP result: initialise + enable ads only when `canRequestAds`, otherwise disable. */
async function applyConsentInfo(info: AdsConsentInfo | null): Promise<void> {
  setAdsRuntime({
    privacyOptionsRequired:
      info?.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
  if (!info?.canRequestAds || !(await initialiseSdk())) {
    stopFullScreenAds();
    setAdsRuntime({ status: 'disabled' });
    return;
  }
  setAdsRuntime({ status: 'enabled' });
  startFullScreenAds();
}

/**
 * Runs once per app process (AdsProvider calls it on mount): UMP consent, then SDK init only if
 * ads may be requested. Never throws, never blocks rendering; on failure ads stay disabled.
 */
export function startAds(): Promise<void> {
  startPromise ??= gatherConsentInfo()
    .then(applyConsentInfo)
    .catch(error => {
      warnDev('startAds failed', error);
      setAdsRuntime({ status: 'disabled' });
    });
  return startPromise;
}

/** Settings → "Ad privacy options": shows the UMP privacy options form and applies the result. */
export async function openAdPrivacyOptions(): Promise<void> {
  try {
    const info = await AdsConsent.showPrivacyOptionsForm();
    await applyConsentInfo(info);
  } catch (error) {
    warnDev('showPrivacyOptionsForm failed', error);
  }
}

/** Test helper: forget that ads were started. */
export function resetAdsForTests(): void {
  startPromise = null;
  sdkInitialised = false;
  stopFullScreenAds();
  useAdsRuntime.setState({
    status: 'pending',
    privacyOptionsRequired: false,
    isShowingFullScreenAd: false,
  });
}
