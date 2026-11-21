import { Linking } from 'react-native';

/**
 * Tries each URL in order and stops at the first that opens. Returns false if none opened.
 * Never throws.
 */
export async function openFirstUrl(
  urls: readonly string[],
  openURL: (url: string) => Promise<unknown> = url => Linking.openURL(url),
): Promise<boolean> {
  for (const url of urls) {
    try {
      await openURL(url);
      return true;
    } catch {
      // Try the next URL.
    }
  }
  return false;
}
