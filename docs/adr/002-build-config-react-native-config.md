# 002. Build-time config with react-native-config

- Status: Accepted
- Date: 2026-11-21

## Context

Real AdMob unit IDs and the AdMob App ID must not be committed and must reach both Gradle
(manifest meta-data) and JS (ad unit IDs). Options: `react-native-config`, or Gradle
`buildConfigField` plus a custom native module to expose it to JS.

## Decision

Use `react-native-config` 1.7.2. CI writes `.env` from GitHub secrets before release builds.
Gradle reads `ADMOB_APP_ID` into the `admobAppId` manifest placeholder for release; debug always
uses Google's sample App ID. JS uses Google `TestIds` whenever `__DEV__` is true, and reads
`Config.ADMOB_*_ID` only in release. Missing release IDs → ads are simply not shown.

## Consequences

- No custom native code. `.env` is git-ignored; `.env.example` documents keys.
- ProGuard keeps `app.khaosahi.BuildConfig` (read reflectively).
