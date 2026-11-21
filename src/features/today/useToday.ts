import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { rolloverPlanDay } from '@/shared/plan';
import { type DateKey, msUntilNextMidnight, todayKey } from '@/shared/utils/dates';

/** Small buffer so the midnight timer never fires just before the date changes. */
const MIDNIGHT_BUFFER_MS = 1000;

/**
 * Today's local date key. Rolls the plan over to the new day on mount, at local midnight while
 * the app stays open, and whenever the app comes back to the foreground.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      const now = new Date();
      rolloverPlanDay(now);
      setToday(todayKey(now));
    };

    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, msUntilNextMidnight() + MIDNIGHT_BUFFER_MS);
    };

    refresh();
    scheduleMidnight();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        // Timers may be paused in the background; re-arm for the right midnight.
        if (timer) {
          clearTimeout(timer);
        }
        scheduleMidnight();
      }
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      subscription.remove();
    };
  }, []);

  return today;
}
