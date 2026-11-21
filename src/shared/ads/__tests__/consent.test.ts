import {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  CONSENT_NOT_REQUIRED,
  latestAd,
  mobileAdsModule,
  resetAdsMock,
} from '../../../../jest/mocks/react-native-google-mobile-ads';
import { openAdPrivacyOptions, resetAdsForTests, startAds } from '../consent';
import { useAdsRuntime } from '../runtime';

const NO_CONSENT = { ...CONSENT_NOT_REQUIRED, status: 'REQUIRED', canRequestAds: false };
const PRIVACY_REQUIRED = {
  ...CONSENT_NOT_REQUIRED,
  status: 'OBTAINED',
  privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
};

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  resetAdsMock();
  resetAdsForTests();
});

afterEach(() => {
  resetAdsForTests();
  warnSpy.mockRestore();
});

describe('startAds', () => {
  it('gathers consent, then configures and initialises the SDK and enables ads', async () => {
    expect(useAdsRuntime.getState().status).toBe('pending');
    await startAds();
    expect(AdsConsent.gatherConsent).toHaveBeenCalledTimes(1);
    expect(mobileAdsModule.setRequestConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ tagForChildDirectedTreatment: false, maxAdContentRating: 'PG' }),
    );
    expect(mobileAdsModule.initialize).toHaveBeenCalledTimes(1);
    expect(useAdsRuntime.getState().status).toBe('enabled');
    expect(latestAd('interstitial')?.load).toHaveBeenCalled();
    expect(latestAd('rewarded')?.load).toHaveBeenCalled();
  });

  it('runs only once per process', async () => {
    await Promise.all([startAds(), startAds()]);
    await startAds();
    expect(AdsConsent.gatherConsent).toHaveBeenCalledTimes(1);
  });

  it('does not initialise the SDK when ads may not be requested', async () => {
    AdsConsent.gatherConsent.mockResolvedValueOnce(NO_CONSENT);
    await startAds();
    expect(mobileAdsModule.initialize).not.toHaveBeenCalled();
    expect(useAdsRuntime.getState().status).toBe('disabled');
    expect(latestAd('interstitial')).toBeUndefined();
  });

  it('falls back to the last known consent when gathering fails', async () => {
    AdsConsent.gatherConsent.mockRejectedValueOnce(new Error('offline'));
    await startAds();
    expect(AdsConsent.getConsentInfo).toHaveBeenCalled();
    expect(useAdsRuntime.getState().status).toBe('enabled');
  });

  it('stays disabled silently when everything fails', async () => {
    AdsConsent.gatherConsent.mockRejectedValueOnce(new Error('offline'));
    AdsConsent.getConsentInfo.mockRejectedValueOnce(new Error('broken'));
    await expect(startAds()).resolves.toBeUndefined();
    expect(useAdsRuntime.getState().status).toBe('disabled');
  });

  it('stays disabled when SDK initialisation fails', async () => {
    mobileAdsModule.initialize.mockRejectedValueOnce(new Error('init failed'));
    await startAds();
    expect(useAdsRuntime.getState().status).toBe('disabled');
  });

  it('exposes whether privacy options are required', async () => {
    AdsConsent.gatherConsent.mockResolvedValueOnce(PRIVACY_REQUIRED);
    await startAds();
    expect(useAdsRuntime.getState().privacyOptionsRequired).toBe(true);
  });
});

describe('openAdPrivacyOptions', () => {
  it('shows the form and disables ads when consent is withdrawn', async () => {
    AdsConsent.gatherConsent.mockResolvedValueOnce(PRIVACY_REQUIRED);
    await startAds();
    AdsConsent.showPrivacyOptionsForm.mockResolvedValueOnce({
      ...PRIVACY_REQUIRED,
      canRequestAds: false,
    });
    await openAdPrivacyOptions();
    expect(AdsConsent.showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
    expect(useAdsRuntime.getState().status).toBe('disabled');
    expect(useAdsRuntime.getState().privacyOptionsRequired).toBe(true);
  });

  it('enables ads when consent is given in the form', async () => {
    AdsConsent.gatherConsent.mockResolvedValueOnce(NO_CONSENT);
    await startAds();
    AdsConsent.showPrivacyOptionsForm.mockResolvedValueOnce(PRIVACY_REQUIRED);
    await openAdPrivacyOptions();
    expect(mobileAdsModule.initialize).toHaveBeenCalledTimes(1);
    expect(useAdsRuntime.getState().status).toBe('enabled');
  });

  it('never throws when the form fails', async () => {
    AdsConsent.showPrivacyOptionsForm.mockRejectedValueOnce(new Error('no form'));
    await expect(openAdPrivacyOptions()).resolves.toBeUndefined();
  });
});
