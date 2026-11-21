# Contributing

## Git workflow

- Conventional Commits (`feat(food): add hinglish alias search`), enforced by commitlint.
- Small focused commits. Husky runs lint-staged on commit and commitlint on the message.
- The owner chose to work directly on `main`: every change is reviewed (lint, typecheck, tests,
  content validation, code review) **before** it is pushed. CI runs on every push.
- Never commit secrets, keystores, `.env`, real ad unit IDs or build outputs.
- Tag `vX.Y.Z` to build a signed AAB in CI. Keep `CHANGELOG.md` updated.

## Definition of Done

- [ ] Meets the acceptance criteria in `docs/REQUIREMENTS.md`.
- [ ] Works offline; English and Hindi complete; no hard-coded strings.
- [ ] `npm run check` passes.
- [ ] Unit tests for all logic; at least one component test per screen; Maestro flow updated if
      a journey changed.
- [ ] Tested on an Android 16 emulator and a low-end profile (API 26-ish, 2–3 GB RAM) at font
      scale 1.0 and 2.0.
- [ ] No new Metro/Logcat warnings; no `console.log`.
- [ ] Accessibility labels present; TalkBack can complete the flow.

## Before adding anything

Ask before adding a dependency, an abstraction layer, base classes, DI containers, event buses,
feature-flag services, one-line wrapper hooks or anything "for later". New non-obvious decisions
get a short ADR in `docs/adr/`.
