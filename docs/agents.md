# Agent ownership

Each agent owns folders. Edit only what you own; if you need a change elsewhere, make the smallest
possible change and call it out in your summary so the lead (A0) can review it.

| Agent   | Owns                                                                                                                                                                                                                                         | Feature                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| A0 Lead | `src/app/**`, `src/shared/{ui,storage,i18n,profile,preferences,navigation,utils}/**`, `src/content/schema/**`, `src/content/validate.ts`, `scripts/**`, `android/**`, `ios/**`, `.github/**`, root configs, `docs/**` (except `docs/ads.md`) | Foundation, review, merge |
| A1      | `src/features/onboarding/**`, `src/features/profile/**`                                                                                                                                                                                      | F1, F2                    |
| A2      | `src/features/food/**`                                                                                                                                                                                                                       | F4                        |
| A3      | `src/features/plan/**`, `src/features/today/**`, `src/shared/plan/**`                                                                                                                                                                        | F3, F5                    |
| A4      | `src/features/progress/**` (incl. `RemindersScreen`), `src/shared/notifications/**`, `src/shared/progress/**`                                                                                                                                | F6, F7                    |
| A5      | `src/features/learn/**`, `src/features/settings/**`                                                                                                                                                                                          | F8, F9                    |
| A6      | `src/shared/ads/**`, `docs/ads.md`                                                                                                                                                                                                           | Ads                       |
| A7      | `src/content/*.json`, `src/content/{plans,tips,articles}/**`, `src/content/index.ts` (article imports only), `.maestro/**`                                                                                                                   | Content, QA               |

## Shared files everyone may append to

- `src/shared/i18n/en.json` and `hi.json`: add keys **only under your own section**
  (`onboarding`, `profile`, `today`, `plan`, `food`, `progress`, `reminders`, `learn`, `settings`,
  `ads`). Never edit another section. Every key must exist in both files.
- `package.json`: do not add dependencies. Ask the lead.

## Why some feature state lives in `shared/`

Features may not import each other. State read by more than one feature therefore lives in
`shared/` and is owned by the agent who writes it:

- `shared/profile` — profile (written by A1; read by food, plan, today, progress).
- `shared/preferences` — language, units, onboarding flags (A0).
- `shared/plan` — plan generation + plan/checklist state (A3; read by today, settings,
  notifications).
- `shared/progress` — progress-log store (A4; read by plan's Day-90 summary).
- `shared/ads`, `shared/notifications` — public APIs are stubbed by A0; signatures are a contract.

## Navigation

All routes are declared by A0 in `src/shared/navigation/types.ts` and
`src/app/navigation/RootNavigator.tsx`. Replace the placeholder screens in your
`features/<x>/screens/` (keep the exported names). Need a new route? Ask the lead.
