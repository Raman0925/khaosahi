/**
 * Notification taps → navigation. Handles foreground presses, background presses and cold
 * start (the navigator may not be mounted yet, so the target waits until it is ready).
 */
import notifee, { type Event, EventType } from 'react-native-notify-kit';

import { navigationRef } from '@/shared/navigation';

import { isReminderTarget, type ReminderTarget } from './schedule';

/** Navigates to the screen for a target. Returns false when the main app is not available. */
export function navigateToTarget(target: ReminderTarget): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }
  // During onboarding the main routes do not exist; ignore the tap.
  if (!navigationRef.getRootState()?.routeNames.includes('Main')) {
    return true;
  }
  switch (target) {
    case 'today':
      navigationRef.navigate('Main', { screen: 'Today' });
      break;
    case 'progress':
      navigationRef.navigate('Main', { screen: 'Progress' });
      break;
    case 'weighIn':
      navigationRef.navigate('ProgressEntry', { metric: 'weight' });
      break;
  }
  return true;
}

let pending: ReminderTarget | null = null;
let waiting = false;

/** Navigates now, or as soon as the navigation container is ready. */
export function openTarget(target: ReminderTarget): void {
  if (navigateToTarget(target)) {
    return;
  }
  pending = target;
  if (waiting) {
    return;
  }
  waiting = true;
  const unsubscribe = navigationRef.addListener('ready', () => {
    unsubscribe();
    waiting = false;
    const next = pending;
    pending = null;
    if (next) {
      navigateToTarget(next);
    }
  });
}

/** Handles a notify-kit event; only body presses on our reminders navigate. */
export function handleEvent({ type, detail }: Event): void {
  if (type !== EventType.PRESS) {
    return;
  }
  const target = detail.notification?.data?.target;
  if (isReminderTarget(target)) {
    openTarget(target);
  }
}

let registered = false;

/**
 * Registers tap handlers. Call once at module scope from index.js (Notifee requires the
 * background handler to be registered before the app component mounts).
 */
export function registerNotificationHandlers(): void {
  if (registered) {
    return;
  }
  registered = true;
  notifee.onBackgroundEvent(async event => handleEvent(event));
  notifee.onForegroundEvent(handleEvent);
  notifee
    .getInitialNotification()
    .then(initial => {
      const target = initial?.notification.data?.target;
      if (isReminderTarget(target)) {
        openTarget(target);
      }
    })
    .catch(error => console.warn('[notifications] initial notification failed', error));
}
