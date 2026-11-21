import { create } from 'zustand';

/**
 * In-memory ads state for this app process (never persisted).
 * - `pending`: consent/initialisation still running → render no ads.
 * - `enabled`: UMP says ads may be requested and the SDK is initialised.
 * - `disabled`: consent not given, an error happened, or ads are unavailable → render no ads.
 *
 * A zustand store (rather than React context alone) because `openAdPrivacyOptions()` and the
 * full-screen ad controllers update it from outside React.
 */
export type AdsStatus = 'pending' | 'enabled' | 'disabled';

export type AdsRuntimeState = {
  status: AdsStatus;
  privacyOptionsRequired: boolean;
  isShowingFullScreenAd: boolean;
};

export const INITIAL_ADS_RUNTIME: AdsRuntimeState = {
  status: 'pending',
  privacyOptionsRequired: false,
  isShowingFullScreenAd: false,
};

export const useAdsRuntime = create<AdsRuntimeState>()(() => INITIAL_ADS_RUNTIME);

export function setAdsRuntime(patch: Partial<AdsRuntimeState>): void {
  useAdsRuntime.setState(patch);
}

/** True when banner/native ads may render. */
export function useAdsEnabled(): boolean {
  return useAdsRuntime(state => state.status === 'enabled');
}
