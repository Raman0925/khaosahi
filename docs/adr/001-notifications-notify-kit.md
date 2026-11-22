# 001. Local notifications with react-native-notify-kit

- Status: Accepted (reboot verification on Android 16 owned by A4 — see "Verification")
- Date: 2026-11-21

## Context

Reminders (F7) must be scheduled locally and survive reboot. Notifee is archived;
`react-native-notify-kit` (10.10.1) is its maintained fork with the same API, supports RN ≥ 0.73
and the New Architecture. The alternative, `expo-notifications`, would require Expo modules.

## Decision

Use `react-native-notify-kit` 10.10.1 behind `src/shared/notifications` (the only module that
imports it). Use timestamp triggers with `RepeatFrequency` and `AlarmManager` where exact time
matters; recreate all schedules on every app start (`syncReminders`) so state is self-healing.

## Consequences

- One native dependency, Notifee-compatible API and docs.
- If the reboot check fails, propose `expo-notifications` via `install-expo-modules` to the owner.

## Verification

A4, 2026-11-21. **Result: verified in source; the on-device reboot test is still a manual check.**

### How reminders are scheduled

`src/shared/notifications/native.ts` creates timestamp triggers with `repeatFrequency` DAILY or
WEEKLY (none for the one-off retest) and `alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE }`.
This is an inexact alarm that still fires in Doze. It needs no `SCHEDULE_EXACT_ALARM` or
`USE_EXACT_ALARM`, and reminders may arrive a few minutes late. notify-kit's library manifest
declares `SCHEDULE_EXACT_ALARM`, so the app manifest removes it with `tools:node="remove"`.
`POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` come from the library manifest through manifest
merging, so the app manifest does not repeat them.

### Reboot: verified in notify-kit 10.10.1 source

- `android/src/main/AndroidManifest.xml` registers `app.notifee.core.RebootBroadcastReceiver` for
  `BOOT_COMPLETED`, `QUICKBOOT_POWERON` and the HTC `QUICKBOOT_POWERON`, and declares
  `RECEIVE_BOOT_COMPLETED`.
- `RebootBroadcastReceiver.onReceive` calls `NotifeeAlarmManager.rescheduleNotifications()`.
  That method loads every trigger stored with `alarmManager = true` from notify-kit's Room
  database (`getAllWithAlarmManager(true)`) and sets each alarm again. Repeating triggers whose
  time has passed move forward with `setNextTimestamp()`. All our triggers use `alarmManager`.
- `InitProvider` adds a second recovery path. On the next app process start it compares
  `Settings.Global.BOOT_COUNT` with the last value it saw, and reschedules if the phone has
  rebooted. This covers devices where the boot broadcast is delayed or blocked.
- Our own safety net: `syncReminders()` runs on every app start (App.tsx). It cancels our
  `reminder.*` triggers and creates them again from the saved settings.

### Emulator run: not completed

- Device: AVD `panjika`, API 36 (Android 16), `google_apis` x86_64 image, 3 GB RAM. It booted.
- `./gradlew assembleDebug` failed after 10 minutes with "Could not add entry … executionHistory.bin"
  and "Could not write cache value … registry.bin". Drive C: had **0 MB free**. After the
  emulator was stopped it had about 4 GB, which is not enough for a full React Native debug build
  plus the emulator while other agents are also building. The run was stopped so the disk would
  not fill up again.

### Manual check still to do (about 10 minutes once there is disk space)

1. `npx react-native start`, then `npx react-native run-android` on an API 36 emulator.
   Run `adb reverse tcp:8081 tcp:8081` if needed.
2. Finish onboarding. In Settings → Reminders, turn on "Daily checklist", allow notifications
   and set the time 3 minutes ahead.
3. Check `adb shell dumpsys alarm | grep in.khaosahi.app`. There should be one RTC_WAKEUP alarm.
4. Run `adb reboot` and wait for `sys.boot_completed`. **Do not open the app.**
5. Run `dumpsys alarm` again: the alarm should be back, set by `RebootBroadcastReceiver`.
6. At the set time, check `adb shell dumpsys notification --noredact | grep -A3 in.khaosahi.app`,
   or take a screenshot with `adb exec-out screencap -p > shot.png`.
7. Tap the notification. The app should open on Today, both on a cold start and from the
   background.

If step 5 or 6 fails, propose `expo-notifications` as described under Consequences.
