import React, { type ReactNode, useEffect } from 'react';

import { startAds } from './consent';

/**
 * Starts ads once at app startup: UMP consent (no-op where not required), then SDK init only if
 * ads may be requested. Children render immediately; ads appear only once enabled. State is read
 * with `useAdsEnabled()` / `useAdPrivacyOptionsRequired()` (backed by the `useAdsRuntime` store).
 */
export function AdsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    startAds().catch(() => undefined);
  }, []);
  return <>{children}</>;
}
