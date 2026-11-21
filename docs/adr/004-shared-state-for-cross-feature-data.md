# 004. Cross-feature state lives in shared/

- Status: Accepted
- Date: 2026-11-21

## Context

Features must not import each other, but some state is read by several features: preferences
(language/units/onboarding), profile, plan state (Today, Settings, reminders) and the progress
log (Progress, Day-90 summary).

## Decision

Such state lives in `src/shared/{preferences,profile,plan,progress}` with an owning agent
(`docs/agents.md`). Ads and notifications expose stable public APIs from `shared/` that A0
stubbed first so features could integrate in parallel. Route params are declared in
`shared/navigation/types.ts` rather than inferred from the static navigator in `app/`.

## Consequences

A few more folders in `shared/` than the original sketch, but the no-cross-feature-import rule
holds and is enforced by ESLint.
