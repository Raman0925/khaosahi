/**
 * Notifications public API. A0 STUB. A4 implements with react-native-notify-kit WITHOUT changing
 * these signatures (more exports may be added). See docs/agents.md.
 */

/** Re-creates channels and schedules from saved reminder settings (call on app start). */
export async function syncReminders(): Promise<void> {}

/** Cancels every scheduled and displayed notification (used by "Delete all data"). */
export async function cancelAllNotifications(): Promise<void> {}
