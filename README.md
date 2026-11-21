# KhaoSahi

Hindi + English diet guide for adults with fatty liver and/or high uric acid. Android-first,
React Native (Community CLI, New Architecture), fully offline: no backend, no login, all data on
the phone. Revenue via AdMob.

> KhaoSahi gives general diet and lifestyle information. It does not diagnose or treat any disease.

## Setup

Requirements: Node ≥ 22.11, JDK 17, Android SDK (platform 36, build-tools 36.0.0, NDK 27.1).

```sh
npm ci
npm run android        # debug build on an emulator/device (Metro starts automatically)
```

Release builds read `.env` (copy `.env.example`; never commit it). Signing uses the env vars
`KHAOSAHI_UPLOAD_STORE_FILE`, `KHAOSAHI_UPLOAD_STORE_PASSWORD`, `KHAOSAHI_UPLOAD_KEY_ALIAS`,
`KHAOSAHI_UPLOAD_KEY_PASSWORD`; without them `bundleRelease` produces an unsigned AAB.

## Scripts

| Script                     | What                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run lint`             | ESLint (flat config), zero warnings                                                              |
| `npm run typecheck`        | TypeScript strict                                                                                |
| `npm test`                 | Jest + Testing Library                                                                           |
| `npm run validate-content` | Content schema/consistency check (`:release` also requires full counts and no `PENDING` reviews) |
| `npm run check`            | All of the above                                                                                 |
| `npm run format`           | Prettier                                                                                         |

E2E: Maestro flows in `.maestro/` (`maestro test .maestro`).

## Structure

```
src/
  app/          App.tsx, navigation (static API), error boundary
  features/     onboarding, profile, today, food, plan, progress, learn, settings
                  each: screens/ components/ hooks/ logic/ __tests__/
  shared/       ui, storage, i18n, ads, profile, preferences, plan, progress,
                notifications, navigation, utils
  content/      foods.json, plans/, tips/, articles/, schema/ (zod)
docs/           REQUIREMENTS.md, agents.md, ads.md, adr/
```

## Conventions

- Features import only from `shared/` and `content/` (enforced by ESLint).
- Business logic is pure TypeScript in `logic/` with unit tests; components stay thin.
- Every user-facing string goes through i18n (`en.json` + `hi.json`).
- Every stored object has a zod schema; storage falls back to defaults on bad data.
- Conventional Commits; see `CONTRIBUTING.md`.
