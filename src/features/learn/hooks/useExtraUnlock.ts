import { useCallback, useState } from 'react';

import { useRewarded } from '@/shared/ads';

/** `unavailable`: no ad could be shown. `notEarned`: the ad was closed before the reward. */
export type UnlockStatus = 'idle' | 'loading' | 'unavailable' | 'notEarned';

/**
 * Unlock flow for one optional extra article. `isUnlocked` stays true for this screen once the
 * reward is earned, even before the ads module reports the persisted unlock.
 */
export function useExtraUnlock(articleId: string): {
  isUnlocked: boolean;
  status: UnlockStatus;
  unlock: () => Promise<boolean>;
} {
  const rewarded = useRewarded(articleId);
  const [earned, setEarned] = useState(false);
  const [status, setStatus] = useState<UnlockStatus>('idle');
  const isUnlocked = rewarded.isUnlocked || earned;
  const { isLoaded, show } = rewarded;

  const unlock = useCallback(async (): Promise<boolean> => {
    if (isUnlocked) {
      return true;
    }
    if (!isLoaded) {
      setStatus('unavailable');
      return false;
    }
    setStatus('loading');
    try {
      const rewardEarned = await show();
      setEarned(rewardEarned);
      setStatus(rewardEarned ? 'idle' : 'notEarned');
      return rewardEarned;
    } catch {
      setStatus('unavailable');
      return false;
    }
  }, [isUnlocked, isLoaded, show]);

  return { isUnlocked, status, unlock };
}
