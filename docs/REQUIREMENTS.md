# KhaoSahi — Requirements (v1.0)

> Source of truth for scope and acceptance criteria. Reconstructed from the owner's build brief
> (21 Nov 2026). If the owner supplies a fuller requirements document, it replaces this file.

## Product

KhaoSahi is an India-first Android app for adults with **fatty liver (NAFLD/MASLD)** and/or
**high uric acid / gout**. In **Hindi and English** it shows which Indian foods are good, to limit
or to avoid; gives a personal **90-day plan** with a daily checklist; tracks **weight, waist and
lab values** on charts; sends **local reminders**; and has short **Learn** articles.

- Wellness and diet guide, **not a medical device**. Never diagnose, prescribe or claim to cure.
  Use wording like "may help improve".
- New, separate brand. Nothing from any other company (name, logo, colours, code, accounts).
- No backend, no login, no network API of our own. All user data stays on the phone.
- Revenue: Google AdMob ads. Languages: Hindi + English, switchable in-app without restart.
- Android launch target; iOS must keep compiling but is not released.

### Disclaimer (exact text)

- **en:** KhaoSahi gives general diet and lifestyle information. It does not diagnose or treat any
  disease. Always follow your doctor's advice and talk to them before changing your diet or
  medicines.
- **hi:** see `common.disclaimer` in `src/shared/i18n/hi.json`.

## Features and acceptance criteria

### F1 Onboarding & consent

1. First screen: language pick (English / हिन्दी). Default selection = device language.
2. Up to 3 intro slides, skippable.
3. Disclaimer screen; the user must tick/accept to continue.
4. Consent notice (DPDP-style): what is stored (profile, labs, logs, checklist), that it stays on
   the device only, why (to personalise the plan and track progress), how to delete (Settings →
   Delete all data). Explicit "I agree" required. Store the consent timestamp.
5. 18+ age gate: if the user says they are under 18, they cannot continue (friendly message).
6. No ads anywhere in onboarding.
7. Completing profile setup (F2) finishes onboarding and opens Today.

### F2 Profile & plan setup

1. Fields: condition (fatty liver / uric acid / both), age, sex, height, weight, waist (cm/in
   toggle; weight kg/lb), diet type (veg / egg / non-veg / Jain), region.
2. Optional labs: ALT (U/L), AST (U/L), ultrasound grade (1, 2, 3, not done), uric acid (mg/dL),
   test date.
3. Plausible ranges: age 18–100, height 120–220 cm, weight 25–250 kg, waist 50–200 cm,
   ALT/AST 1–2000 U/L, uric acid 1–20 mg/dL. Inline errors in the user's language.
4. Shows BMI (Asian-Indian cut-offs) after height + weight are entered.
5. Saving generates the 90-day plan locally (derived from the saved profile).
6. Profile is editable later from Settings; changing condition or diet type regenerates the plan
   (with confirmation, since progress in the plan restarts).
7. Stored values are metric; display follows the unit preference.

### F3 Today

1. Shows Day X / 90 and the current week's title.
2. 5–8 checklist items for today from the plan, filtered by diet type. Tick/untick persists.
3. Streak: consecutive days with ≥ 70% of items done. Today counts once it reaches 70%.
4. Tip of the day (rotates daily, condition-specific; for "both", alternates).
5. Quick links: Food checker, Log progress, Plan overview.
6. Resets at local midnight (device time zone), including if the app stays open over midnight.
7. Each finished day's result is stored in `checklist-history.json`.

### F4 Food checker

1. ~300 Indian foods. Search by English, Devanagari and Hinglish aliases; prefix and contains
   matches; ranked (exact > prefix > contains; name before alias). Diacritics/case/spaces ignored.
2. Browse by category. Filter by diet type (defaults to the user's diet).
3. Detail: rating per user condition (good / limit / avoid) with reason, portion tip and swaps
   (linking to other foods). When the user has both conditions, the stricter rating shows first.
4. Search of 300 items returns in < 100 ms on a low-end device.
5. Ratings, reasons and safety info are never gated behind ads.

### F5 90-day plan

1. 13 weeks per condition (fatty liver, uric acid, combined), with veg/non-veg item variants.
2. Deterministic: same profile + same day → same checklist.
3. Plan overview lists the 13 weeks with focus text; current week highlighted.
4. Weekly summary (days completed, average completion).
5. Day-90 summary + prompt to retest labs with the doctor; option to restart the plan.
6. Restartable at any time (confirmation).

### F6 Progress

1. Log, edit and delete entries for weight, waist, ALT, AST, ultrasound grade and uric acid, each
   with a date (not in the future).
2. Line chart per metric with a normal-range band where one applies (ALT/AST/uric acid; ranges
   may depend on sex) and unit labels on axes.
3. Empty state and single-point state; smooth with 200 points.
4. Data stored in `progress-log.json` (atomic writes, recovery from snapshot).

### F7 Reminders

1. Daily checklist reminder at a user-chosen time; optional water reminders; weekly weigh-in;
   90-day retest reminder.
2. Survive device reboot. Rescheduled on app start.
3. Notification permission (Android 13+) is requested only when the user first enables a
   reminder; graceful message if denied.
4. Tapping a notification opens the matching screen.

### F8 Learn

1. ~30 bundled articles in both languages (headings, paragraphs, bullets).
2. Each article ends with the disclaimer.
3. Optional extras ("7-day sample menu", "Festival food guide") may be unlocked with a rewarded ad.

### F9 Settings

Language, units, reminders, edit profile, export data (newest backup snapshot as JSON via the
share sheet), delete all data (confirm → wipe MMKV, files, snapshots, notifications → onboarding),
privacy policy link, disclaimer, consent notice, ad privacy options (UMP), rate app, version.

## Non-functional

- Offline-first; no network except ads.
- Accessibility: labels on all touchables, 48 dp targets, font scale up to 200%, contrast ≥ 4.5:1,
  TalkBack can complete every flow.
- Performance: FlashList for long lists, memoised rows, Zustand selectors; cold start on a
  low-end device should feel quick (splash hides when navigation is ready).
- Data safety: zod-validated storage, schemaVersion + migrations, atomic file writes, daily
  snapshots (keep 3), Android Auto Backup of MMKV + files.
- Ads policy: see `docs/ads.md`. No ads on onboarding, consent, forms, delete/export. Never pass
  health data to the ads SDK.

## Out of scope (v1)

Login/accounts, cloud sync, lab-report OCR, PDF report, step counting / Health Connect, chat,
iOS store release, in-app purchases.
