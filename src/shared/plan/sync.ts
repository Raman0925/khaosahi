import { useProfileStore } from '@/shared/profile';
import { toDateKey } from '@/shared/utils/dates';

import { useChecklistHistory } from './history';
import { finaliseDays } from './logic/rollover';
import { planKeyFor } from './logic/schedule';
import { usePlanStore } from './store';

/**
 * Moves the plan to the current local day: finalises the last open day (and any days the app
 * was not opened) into the checklist history and starts today with no ticks. Idempotent; call
 * on app start, on foreground and at midnight.
 */
export function rolloverPlanDay(now: Date = new Date()): void {
  const today = toDateKey(now);
  const { startDate, planKey, ticks, setTicks } = usePlanStore.getState();
  if (!startDate || !planKey || ticks?.dateKey === today) {
    return;
  }
  if (!ticks || ticks.dateKey < today) {
    useChecklistHistory.getState().addRows(finaliseDays({ planKey, startDate, ticks, today }));
  }
  // A clock moved backwards just starts the day fresh without touching history.
  setTicks({ dateKey: today, doneItemIds: [] });
}

/** Ticks or unticks an item for today. */
export function toggleChecklistItem(itemId: string, now: Date = new Date()): void {
  rolloverPlanDay(now);
  const { ticks, setTicks } = usePlanStore.getState();
  if (!ticks) {
    return;
  }
  const done = ticks.doneItemIds.includes(itemId);
  setTicks({
    dateKey: ticks.dateKey,
    doneItemIds: done
      ? ticks.doneItemIds.filter(id => id !== itemId)
      : [...ticks.doneItemIds, itemId],
  });
}

/** Restarts the plan at day 1 today for the current profile. Past days stay in history. */
export function restartPlan(now: Date = new Date()): void {
  const profile = useProfileStore.getState().profile;
  const planKey = profile ? planKeyFor(profile) : usePlanStore.getState().planKey;
  if (!planKey) {
    return;
  }
  rolloverPlanDay(now);
  usePlanStore.getState().startPlan(planKey, toDateKey(now));
}

/**
 * Keeps the plan in step with the profile: a first profile starts the plan today; a change of
 * condition or diet restarts it; otherwise the day is rolled over.
 */
export function reconcilePlanWithProfile(now: Date = new Date()): void {
  const profile = useProfileStore.getState().profile;
  if (!profile) {
    return;
  }
  const key = planKeyFor(profile);
  const plan = usePlanStore.getState();
  if (!plan.startDate) {
    plan.startPlan(key, toDateKey(now));
  } else if (!plan.planKey) {
    // startDate was set without a plan key (older data or set by another module): adopt it.
    plan.setPlanKey(key);
    rolloverPlanDay(now);
  } else if (plan.planKey !== key) {
    rolloverPlanDay(now);
    usePlanStore.getState().startPlan(key, toDateKey(now));
  } else {
    rolloverPlanDay(now);
  }
}

let unsubscribe: (() => void) | null = null;

/**
 * Starts plan syncing once per app run: loads the checklist history, reconciles with the
 * profile now and whenever it changes. Safe to call more than once.
 */
export function initPlanSync(): void {
  useChecklistHistory
    .getState()
    .load()
    .catch(error => console.warn('[plan] history load failed', error));
  reconcilePlanWithProfile();
  if (!unsubscribe) {
    unsubscribe = useProfileStore.subscribe((state, previous) => {
      if (state.profile !== previous.profile) {
        reconcilePlanWithProfile();
      }
    });
  }
}

/** Stops the profile subscription (tests). */
export function stopPlanSync(): void {
  unsubscribe?.();
  unsubscribe = null;
}
