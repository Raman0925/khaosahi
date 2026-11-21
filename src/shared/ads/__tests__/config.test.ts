import { TestIds } from 'react-native-google-mobile-ads';

import { AD_REQUEST_OPTIONS, AD_UNIT_IDS, resolveAdUnitIds } from '../config';

const RELEASE_ENV = {
  ADMOB_BANNER_ID: 'ca-app-pub-1/banner',
  ADMOB_NATIVE_ID: 'ca-app-pub-1/native',
  ADMOB_INTERSTITIAL_ID: 'ca-app-pub-1/interstitial',
  ADMOB_REWARDED_ID: 'ca-app-pub-1/rewarded',
  ADMOB_APP_OPEN_ID: 'ca-app-pub-1/app-open',
};

describe('resolveAdUnitIds', () => {
  it('dev builds always use Google test ids, even when real ids are set', () => {
    expect(resolveAdUnitIds(true, RELEASE_ENV)).toEqual({
      banner: TestIds.ADAPTIVE_BANNER,
      native: TestIds.NATIVE,
      interstitial: TestIds.INTERSTITIAL,
      rewarded: TestIds.REWARDED,
      appOpen: TestIds.APP_OPEN,
    });
    expect(resolveAdUnitIds(true, {}).banner).toBe(TestIds.ADAPTIVE_BANNER);
  });

  it('release builds use the .env ids', () => {
    expect(resolveAdUnitIds(false, RELEASE_ENV)).toEqual({
      banner: 'ca-app-pub-1/banner',
      native: 'ca-app-pub-1/native',
      interstitial: 'ca-app-pub-1/interstitial',
      rewarded: 'ca-app-pub-1/rewarded',
      appOpen: 'ca-app-pub-1/app-open',
    });
  });

  it('a missing or blank release id disables only that format', () => {
    const ids = resolveAdUnitIds(false, {
      ...RELEASE_ENV,
      ADMOB_NATIVE_ID: undefined,
      ADMOB_APP_OPEN_ID: '   ',
      ADMOB_REWARDED_ID: '',
    });
    expect(ids.native).toBeNull();
    expect(ids.appOpen).toBeNull();
    expect(ids.rewarded).toBeNull();
    expect(ids.banner).toBe('ca-app-pub-1/banner');
    expect(resolveAdUnitIds(false, {})).toEqual({
      banner: null,
      native: null,
      interstitial: null,
      rewarded: null,
      appOpen: null,
    });
  });

  it('never uses test ids in release', () => {
    const ids = Object.values(resolveAdUnitIds(false, {}));
    expect(ids.some(id => id !== null && id.startsWith('test-'))).toBe(false);
  });

  it('uses test ids under Jest (__DEV__)', () => {
    expect(AD_UNIT_IDS.interstitial).toBe(TestIds.INTERSTITIAL);
  });
});

describe('AD_REQUEST_OPTIONS', () => {
  it('carries no targeting at all (no keywords, contentUrl or custom targeting)', () => {
    expect(AD_REQUEST_OPTIONS).toEqual({});
  });
});
