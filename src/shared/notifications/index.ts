/**
 * Notifications public API (reminders, F7). Implemented with react-native-notify-kit; only
 * `native.ts` and `taps.ts` import it. See docs/adr/001-notifications-notify-kit.md.
 */
import { cancelAll, openSettings, requestPermission, runSync, subscribeToChanges } from './native';

/**
 * Re-creates channels and schedules from saved reminder settings (call on app start).
 * Idempotent: cancels our scheduled reminders and creates them again. After the first call,
 * changes to reminder settings, the plan start date or the language re-sync automatically.
 */
export async function syncReminders(): Promise<void> {
  subscribeToChanges();
  await runSync();
}

/** Cancels every scheduled and displayed notification (used by "Delete all data"). */
export async function cancelAllNotifications(): Promise<void> {
  await cancelAll();
}

/** Requests notification permission if needed. Resolves true when notifications are allowed. */
export const requestNotificationPermission = requestPermission;

/** Opens this app's notification settings in Android Settings. */
export const openNotificationSettings = openSettings;

export { registerNotificationHandlers } from './taps';
export { DEFAULT_REMINDER_SETTINGS, reminderSettingsSchema, useReminderSettings } from './settings';
export type { ReminderSection, ReminderSettings, ReminderTime } from './settings';
export { retestDate, WATER_INTERVALS, waterHours } from './schedule';
export type { WaterInterval } from './schedule';
