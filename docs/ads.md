# Ads (Google AdMob)

Owner: A6. Code: `src/shared/ads/` (public API in `index.tsx`). All caps: `src/shared/ads/config.ts`.
SDK: `react-native-google-mobile-ads` 17.4.0 (classic create → load → show APIs).

## Placements

| Format       | Where                                                                | Rules                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner       | `<Banner placement="foodList" \| "learnList" \| "progress" />`       | Anchored adaptive, in layout flow (never an overlay). Hidden while the keyboard is open. Renders nothing when disabled or on load failure.                                                     |
| Native       | `<NativeAdCard placement="learnList" \| "foodSearch" />`             | One row after every `NATIVE_AD_INTERVAL` (8) list rows. Labelled "Ad" (`common.ad`), headline/body/icon/CTA, AdChoices top-right. Renders nothing while loading, on no-fill, or when disabled. |
| Interstitial | `useInterstitial().onTrigger('articleClosed' \| 'foodDetailViewed')` | `articleClosed`: every time; `foodDetailViewed`: every 4th view. Subject to the caps below. Preloaded; shown only if already loaded — never waits, never blocks navigation.                    |
| Rewarded     | `useRewarded(extraId)` → `{ isLoaded, isUnlocked, show }`            | Optional extras only ("7-day sample menu", "Festival food guide"). `show()` resolves `true` only after `EARNED_REWARD` (already unlocked → `true` with no ad). Unlocks persist in MMKV.        |
| App open     | Automatic (AdsProvider, AppState)                                    | Only when returning to the foreground after ≥ 4 h in the background. Subject to the caps below.                                                                                                |

**Never** on: onboarding, consent, profile/progress/reminder forms, delete/export, disclaimers.
Features simply do not place banner/native there; full-screen ads also check that onboarding is
complete. Ratings, reasons and safety info are never gated behind rewarded ads.

## Frequency caps (enforced in code)

Pure, unit-tested logic: `canShowFullScreenAd(state, now, kind)` and reducers in
`src/shared/ads/logic/caps.ts`. Counters are persisted in MMKV (`ads` key, zod-validated) and reset
by "Delete all data".

| Rule                                                        | Value                     | Applies to             |
| ----------------------------------------------------------- | ------------------------- | ---------------------- |
| Onboarding must be complete (`onboardingCompletedAt`)       | —                         | all full-screen        |
| Never while another full-screen ad is showing               | —                         | all full-screen        |
| User actions (navigation changes) since last full-screen ad | ≥ 2                       | interstitial           |
| Time since last interstitial                                | ≥ 3 min                   | interstitial           |
| Time since last full-screen ad (no back-to-back)            | ≥ 60 s                    | interstitial, app open |
| Food detail views per interstitial opportunity              | every 4th                 | interstitial           |
| Time in background before an app open ad                    | ≥ 4 h                     | app open               |
| App open on cold start / first launch                       | never                     | app open               |
| App open ad must be ready within                            | 3 s                       | app open               |
| Loaded ad expiry (then reloaded)                            | 1 h (app open 4 h)        | full-screen            |
| Load retry backoff                                          | 30 s doubling, max 10 min | full-screen            |

Notes:

- `recordUserAction()` is wired to the navigator's `onStateChange`.
- No interstitial on app load or exit: interstitials only show on the two triggers above.
- App open ads are loaded on demand when the app returns after ≥ 4 h (a preloaded one would have
  expired). It is shown only if it loads within 3 s, the app is still active and the user has not
  navigated meanwhile; otherwise it is skipped.
- A rewarded ad counts as a full-screen ad (resets the action count), so no interstitial follows it.

## Consent (UMP) and initialisation

`AdsProvider` (in `App.tsx`) runs once per process without blocking the UI:

1. `AdsConsent.gatherConsent()` — shows Google's consent form only where required (EEA/UK/CH and
   regulated US states); no-op elsewhere. On failure, the last known `getConsentInfo()` is used.
2. Only if `canRequestAds`: `mobileAds().setRequestConfiguration({ maxAdContentRating: PG,
tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false })`, then
   `mobileAds().initialize()`, then full-screen ads start preloading.
3. Any failure → ads stay disabled silently (`console.warn` in dev only).

Settings shows "Ad privacy options" when `useAdPrivacyOptionsRequired()` is true and calls
`openAdPrivacyOptions()` (UMP privacy options form). If the user withdraws consent, ads are disabled
for the rest of the session.

## Data and policy

- **No health data ever reaches the SDK.** Requests carry no keywords, `contentUrl`, neighbouring
  URLs, custom targeting or publisher ids (`AD_REQUEST_OPTIONS` is `{}` and a test enforces it).
- Health app: Google's personalised-ads policy prohibits targeting on health conditions; we send no
  such signals. Ad content rating capped at PG.
- Families: the app is 18+ (age gate) and not designed for children → not in the Families
  program; `tagForChildDirectedTreatment: false`.
- Native ads are clearly labelled "Ad"/"विज्ञापन" and keep the AdChoices icon.
- Never click your own live ads. Debug builds always use test ids.

## Ad unit IDs

| Build             | IDs                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------- |
| Debug (`__DEV__`) | Google `TestIds.*` always (ADAPTIVE_BANNER, NATIVE, INTERSTITIAL, REWARDED, APP_OPEN). |
| Release           | `.env` via react-native-config. A missing/blank id disables only that format.          |

`.env` keys (see `.env.example`; CI writes `.env` from secrets; never commit it):

| Key                     | Used for                                        |
| ----------------------- | ----------------------------------------------- |
| `ADMOB_APP_ID`          | Manifest App ID (Gradle, release only; ADR-002) |
| `ADMOB_BANNER_ID`       | Banner                                          |
| `ADMOB_NATIVE_ID`       | Native                                          |
| `ADMOB_INTERSTITIAL_ID` | Interstitial                                    |
| `ADMOB_REWARDED_ID`     | Rewarded                                        |
| `ADMOB_APP_OPEN_ID`     | App open                                        |

## AdMob / Play Console checklist

- [ ] AdMob app created and linked to the Play listing; one ad unit per format above.
- [ ] `app-ads.txt` published at the root of the developer website listed in Play
      (`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).
- [ ] AdMob → Privacy & messaging: GDPR (and US states) message published, so UMP has a form.
- [ ] AdMob blocking controls: block sensitive categories unsuitable for a health audience
      (e.g. dating, gambling, weight-loss/"miracle cure" style ads) and set max rating G/PG.
- [ ] Play Console → App content → **Ads: "Yes, my app contains ads"**.
- [ ] Data safety: **Device or other IDs (advertising ID)** collected and **shared** with Google
      AdMob for advertising/analytics; approximate location/app interactions/diagnostics as declared
      by the Google Mobile Ads SDK; data encrypted in transit; health data **not** collected by us
      off-device.
- [ ] Target audience 18+; not in the Families program.
- [ ] `com.google.android.gms.permission.AD_ID` is present (merged from the SDK) since we use ads.
- [ ] Release build tested with real ids on a physical device registered as a test device.
- [ ] Ad Inspector / native ad validator checked once on device.
