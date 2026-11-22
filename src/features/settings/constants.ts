import Config from 'react-native-config';

/** Used when `PRIVACY_POLICY_URL` is not set in `.env`. */
export const DEFAULT_PRIVACY_POLICY_URL = 'https://raman0925.github.io/khaosahi/privacy/';

export const PLAY_STORE_PACKAGE = 'in.khaosahi.app';

/** Play Store app first, then the web page if the Play Store app is missing. */
export const RATE_APP_URLS = [
  `market://details?id=${PLAY_STORE_PACKAGE}`,
  `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`,
] as const;

export function privacyPolicyUrl(configured: string | undefined = Config.PRIVACY_POLICY_URL) {
  const trimmed = configured?.trim();
  return trimmed ? trimmed : DEFAULT_PRIVACY_POLICY_URL;
}
