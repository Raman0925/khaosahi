import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import React from 'react';
import { Keyboard, Text } from 'react-native';

import { initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';
import { storage } from '@/shared/storage/mmkv';
import { resetAllStores } from '@/shared/storage/reset';

import {
  AdEventType,
  latestAd,
  makeNativeAd,
  NativeAd,
  resetAdsMock,
  RewardedAdEventType,
} from '../../../../jest/mocks/react-native-google-mobile-ads';
import { resetAdsForTests, startAds } from '../consent';
import {
  AdsProvider,
  Banner,
  NativeAdCard,
  useAdPrivacyOptionsRequired,
  useInterstitial,
  useRewarded,
} from '../index';
import { setAdsRuntime } from '../runtime';
import { useAdsStore } from '../store';

initI18n();

let warnSpy: jest.SpyInstance;

beforeEach(async () => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  resetAdsMock();
  resetAdsForTests();
  storage.clearAll();
  await act(() => resetAllStores());
});

afterEach(() => {
  resetAdsForTests();
  warnSpy.mockRestore();
});

const enableAds = () => act(() => setAdsRuntime({ status: 'enabled' }));

describe('Banner', () => {
  it('renders nothing until ads are enabled, and nothing when disabled', async () => {
    await render(<Banner placement="foodList" />);
    expect(screen.queryByTestId('mock-banner-ad')).toBeNull();
    await act(() => setAdsRuntime({ status: 'disabled' }));
    expect(screen.queryByTestId('mock-banner-ad')).toBeNull();
  });

  it('renders an anchored adaptive banner without targeting when enabled', async () => {
    await enableAds();
    await render(<Banner placement="foodList" />);
    const banner = screen.getByTestId('mock-banner-ad');
    expect(banner.props.size).toBe('ANCHORED_ADAPTIVE_BANNER');
    expect(banner.props.requestOptions).toEqual({});
  });

  it('collapses to nothing when the banner fails to load', async () => {
    await enableAds();
    await render(<Banner placement="learnList" />);
    await fireEvent(screen.getByTestId('mock-banner-ad'), 'adFailedToLoad', new Error('no fill'));
    expect(screen.queryByTestId('ad-banner-learnList')).toBeNull();
  });

  it('is hidden while the keyboard is open', async () => {
    await enableAds();
    const listeners: Record<string, () => void> = {};
    const spy = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
      listeners[event] = listener as () => void;
      return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
    });
    await render(<Banner placement="progress" />);
    expect(screen.getByTestId('ad-banner-progress')).toBeVisible();
    await act(() => listeners.keyboardDidShow?.());
    expect(
      screen.getByTestId('ad-banner-progress', { includeHiddenElements: true }),
    ).not.toBeVisible();
    await act(() => listeners.keyboardDidHide?.());
    expect(screen.getByTestId('ad-banner-progress')).toBeVisible();
    spy.mockRestore();
  });
});

describe('NativeAdCard', () => {
  it('renders nothing and requests nothing when ads are disabled', async () => {
    await render(<NativeAdCard placement="learnList" />);
    expect(screen.queryByTestId('ad-native-learnList')).toBeNull();
    expect(NativeAd.createForAdRequest).not.toHaveBeenCalled();
  });

  it('shows a labelled ad card with headline, body and CTA', async () => {
    await enableAds();
    await render(<NativeAdCard placement="learnList" />);
    expect(await screen.findByTestId('ad-native-learnList')).toBeTruthy();
    expect(screen.getByText('Ad')).toBeTruthy();
    expect(screen.getByText('Test headline')).toBeTruthy();
    expect(screen.getByText('Test body')).toBeTruthy();
    expect(screen.getByText('Install')).toBeTruthy();
    expect(NativeAd.createForAdRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.objectContaining({ keywords: expect.anything() }),
    );
  });

  it('renders nothing on no-fill', async () => {
    NativeAd.createForAdRequest.mockRejectedValueOnce(new Error('no fill'));
    await enableAds();
    await render(<NativeAdCard placement="foodSearch" />);
    await act(async () => undefined);
    expect(screen.queryByTestId('ad-native-foodSearch')).toBeNull();
  });

  it('destroys the ad on unmount', async () => {
    const nativeAd = makeNativeAd();
    NativeAd.createForAdRequest.mockResolvedValueOnce(nativeAd);
    await enableAds();
    const view = await render(<NativeAdCard placement="learnList" />);
    await screen.findByTestId('ad-native-learnList');
    await view.unmount();
    expect(nativeAd.destroy).toHaveBeenCalled();
  });
});

describe('hooks', () => {
  it('useInterstitial counts food views even when ads are off, and never throws', async () => {
    const { result } = await renderHook(() => useInterstitial());
    await act(() => result.current.onTrigger('foodDetailViewed'));
    expect(useAdsStore.getState().foodDetailViews).toBe(1);
  });

  it('useRewarded reflects loaded state and persisted unlocks', async () => {
    await act(() => usePreferences.getState().completeOnboarding());
    await act(() => startAds());
    const { result } = await renderHook(() => useRewarded('sampleMenu'));
    expect(result.current).toMatchObject({ isLoaded: false, isUnlocked: false });

    await act(() => latestAd('rewarded')?.emit(RewardedAdEventType.LOADED));
    expect(result.current.isLoaded).toBe(true);

    let earned: Promise<boolean> = Promise.resolve(false);
    await act(() => {
      earned = result.current.show();
    });
    await act(() => {
      const ad = latestAd('rewarded');
      ad?.emit(AdEventType.OPENED);
      ad?.emit(RewardedAdEventType.EARNED_REWARD, { type: 'x', amount: 1 });
      ad?.emit(AdEventType.CLOSED);
    });
    await expect(earned).resolves.toBe(true);
    expect(result.current.isUnlocked).toBe(true);
    await expect(result.current.show()).resolves.toBe(true); // already unlocked: no ad
  });

  it('useAdPrivacyOptionsRequired follows the runtime state', async () => {
    const { result } = await renderHook(() => useAdPrivacyOptionsRequired());
    expect(result.current).toBe(false);
    await act(() => setAdsRuntime({ privacyOptionsRequired: true }));
    expect(result.current).toBe(true);
  });
});

describe('AdsProvider', () => {
  it('renders children immediately and enables ads in the background', async () => {
    await render(
      <AdsProvider>
        <Text>content</Text>
      </AdsProvider>,
    );
    expect(screen.getByText('content')).toBeTruthy();
    await act(async () => undefined);
    expect(latestAd('interstitial')).toBeDefined();
  });
});
