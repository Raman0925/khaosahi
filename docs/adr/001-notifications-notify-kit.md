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

To be filled in by A4 with emulator results (Android 16: schedule → reboot → fires).
