import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';

/** Reminder settings (MMKV). Changing them triggers `syncReminders` (see sync.ts). */
const timeSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export type ReminderTime = z.infer<typeof timeSchema>;

export const reminderSettingsSchema = z.object({
  daily: z.object({ enabled: z.boolean(), time: timeSchema }),
  water: z.object({
    enabled: z.boolean(),
    interval: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  }),
  weighIn: z.object({
    enabled: z.boolean(),
    /** 0 = Sunday … 6 = Saturday (JS `Date#getDay`). */
    weekday: z.number().int().min(0).max(6),
    time: timeSchema,
  }),
  retest: z.object({ enabled: z.boolean() }),
});

export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export type ReminderSection = keyof ReminderSettings;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  daily: { enabled: false, time: { hour: 8, minute: 0 } },
  water: { enabled: false, interval: 3 },
  weighIn: { enabled: false, weekday: 0, time: { hour: 8, minute: 0 } },
  retest: { enabled: false },
};

type ReminderActions = {
  setEnabled: (section: ReminderSection, enabled: boolean) => void;
  setDailyTime: (time: ReminderTime) => void;
  setWaterInterval: (interval: ReminderSettings['water']['interval']) => void;
  setWeighInDay: (weekday: number) => void;
  setWeighInTime: (time: ReminderTime) => void;
  reset: () => void;
};

export type ReminderSettingsState = ReminderSettings & ReminderActions;

export const useReminderSettings = create<ReminderSettingsState>()(
  persist(
    set => ({
      ...DEFAULT_REMINDER_SETTINGS,
      setEnabled: (section, enabled) =>
        set(state => ({ [section]: { ...state[section], enabled } })),
      setDailyTime: time => set(state => ({ daily: { ...state.daily, time } })),
      setWaterInterval: interval => set(state => ({ water: { ...state.water, interval } })),
      setWeighInDay: weekday => set(state => ({ weighIn: { ...state.weighIn, weekday } })),
      setWeighInTime: time => set(state => ({ weighIn: { ...state.weighIn, time } })),
      reset: () => set(DEFAULT_REMINDER_SETTINGS),
    }),
    mmkvPersistOptions<ReminderSettingsState, ReminderSettings>(
      'reminders',
      reminderSettingsSchema,
      {
        partialize: state => ({
          daily: state.daily,
          water: state.water,
          weighIn: state.weighIn,
          retest: state.retest,
        }),
      },
    ),
  ),
);

/** Plain settings (without actions) for scheduling. */
export function selectReminderSettings(state: ReminderSettingsState): ReminderSettings {
  return { daily: state.daily, water: state.water, weighIn: state.weighIn, retest: state.retest };
}

registerStoreReset(() => useReminderSettings.getState().reset());
