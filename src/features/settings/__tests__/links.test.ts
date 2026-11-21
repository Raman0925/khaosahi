import { DEFAULT_PRIVACY_POLICY_URL, privacyPolicyUrl, RATE_APP_URLS } from '../constants';
import { openFirstUrl } from '../logic/openUrl';

describe('privacyPolicyUrl', () => {
  it('uses the configured URL, else the default', () => {
    expect(privacyPolicyUrl('https://example.org/privacy')).toBe('https://example.org/privacy');
    expect(privacyPolicyUrl('  ')).toBe(DEFAULT_PRIVACY_POLICY_URL);
    expect(privacyPolicyUrl(undefined)).toBe(DEFAULT_PRIVACY_POLICY_URL);
  });
});

describe('openFirstUrl', () => {
  it('falls back to the Play Store web page when the market link fails', async () => {
    const openURL = jest.fn(async (url: string) => {
      if (url.startsWith('market://')) {
        throw new Error('no store app');
      }
    });
    await expect(openFirstUrl(RATE_APP_URLS, openURL)).resolves.toBe(true);
    expect(openURL.mock.calls.map(([url]) => url)).toEqual([
      'market://details?id=app.khaosahi',
      'https://play.google.com/store/apps/details?id=app.khaosahi',
    ]);
  });

  it('stops at the first URL that opens', async () => {
    const openURL = jest.fn(async () => undefined);
    await expect(openFirstUrl(RATE_APP_URLS, openURL)).resolves.toBe(true);
    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it('returns false when nothing opens', async () => {
    const openURL = jest.fn(async () => {
      throw new Error('nope');
    });
    await expect(openFirstUrl(['a', 'b'], openURL)).resolves.toBe(false);
  });
});
