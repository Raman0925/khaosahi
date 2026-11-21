/**
 * The only module that talks to react-native-notify-kit (Notifee fork). See docs/adr/001.
 */
import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  type TimestampTrigger,
  TriggerType,
} from 'react-native-notify-kit';

import { i18next } from '@/shared/i18n';
import { usePlanStore } from '@/shared/plan';
import { usePreferences } from '@/shared/preferences/store';

import {
  buildSchedule,
  REMINDER_ID_PREFIX,
  type ReminderKind,
  type ScheduledReminder,
} from './schedule';
import { selectReminderSettings, useReminderSettings } from './settings';

export const REMINDER_CHANNEL_ID = 'reminders';

const REPEAT: Record<ScheduledReminder['repeat'], RepeatFrequency | undefined> = {
  daily: RepeatFrequency.DAILY,
  weekly: RepeatFrequency.WEEKLY,
  none: undefined,
};

function trigger(reminder: ScheduledReminder): TimestampTrigger {
  return {
    type: TriggerType.TIMESTAMP,
    timestamp: reminder.timestamp,
    repeatFrequency: REPEAT[reminder.repeat],
    // Inexact, Doze-friendly alarm: needs no SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM permission.
    // Reminders may arrive a few minutes late, which is fine for diet reminders.
    alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE },
  };
}

function content(kind: ReminderKind): { title: string; body: string } {
  return {
    title: i18next.t(`reminders.notifications.${kind}.title`),
    body: i18next.t(`reminders.notifications.${kind}.body`),
  };
}

async function ourTriggerIds(): Promise<string[]> {
  const ids = await notifee.getTriggerNotificationIds();
  return ids.filter(id => id.startsWith(REMINDER_ID_PREFIX));
}

async function doSync(now: Date): Promise<void> {
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: i18next.t('reminders.channelName'),
    importance: AndroidImportance.DEFAULT,
  });
  await notifee.cancelTriggerNotifications(await ourTriggerIds());
  const schedule = buildSchedule(
    selectReminderSettings(useReminderSettings.getState()),
    usePlanStore.getState().startDate,
    now,
  );
  for (const reminder of schedule) {
    await notifee.createTriggerNotification(
      {
        id: reminder.id,
        ...content(reminder.kind),
        data: { target: reminder.target },
        android: {
          channelId: REMINDER_CHANNEL_ID,
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      },
      trigger(reminder),
    );
  }
}

let queue: Promise<void> = Promise.resolve();

/** Runs syncs one after another so overlapping calls never interleave cancel/create. */
export function runSync(now?: Date): Promise<void> {
  const next = queue.then(() => doSync(now ?? new Date()));
  queue = next.catch(() => undefined);
  return next;
}

let subscribed = false;

/**
 * Re-syncs when reminder settings, the plan start date or the language change.
 * Installed once, on the first sync (App start).
 */
export function subscribeToChanges(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  const resync = () => {
    runSync().catch(error => console.warn('[notifications] sync failed', error));
  };
  useReminderSettings.subscribe(resync);
  usePlanStore.subscribe((state, previous) => {
    if (state.startDate !== previous.startDate) {
      resync();
    }
  });
  usePreferences.subscribe((state, previous) => {
    if (state.language !== previous.language) {
      resync();
    }
  });
}

export async function cancelAll(): Promise<void> {
  await notifee.cancelAllNotifications();
}

/**
 * Asks for notification permission (Android 13+ shows the system dialog; older versions are
 * always allowed). Returns true when notifications may be shown.
 */
export async function requestPermission(): Promise<boolean> {
  const current = await notifee.getNotificationSettings();
  if (current.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    return true;
  }
  const result = await notifee.requestPermission();
  return result.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

/** Opens the system notification settings for this app. */
export async function openSettings(): Promise<void> {
  await notifee.openNotificationSettings();
}
