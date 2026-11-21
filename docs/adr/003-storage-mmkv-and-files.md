# 003. Storage: MMKV for small state, atomic JSON files for logs

- Status: Accepted
- Date: 2026-11-21

## Context

All data is on-device. Small, hot state (preferences, profile, plan state, counters) is read on
every launch; logs (progress, checklist history) grow over time. Data must restore on a new phone.

## Decision

- One unencrypted MMKV instance (`shared/storage/mmkv.ts`); zustand stores persist to it via
  `mmkvPersistOptions`, which validates with zod and falls back to defaults.
- Logs are JSON files in `Dirs.DocumentDir` wrapped in `{ schemaVersion, updatedAt, data }`.
  Writes go to `.tmp/<name>.tmp` then `rename` (atomic), serialised per file.
- Daily snapshot of all MMKV keys + both files in `backup/snapshot-YYYY-MM-DD.json`, keep 3.
  A corrupt file is recovered from the newest valid snapshot, then defaults.
- Android Auto Backup includes the whole files dir (MMKV lives in `files/mmkv`) except `.tmp/`.
  Encryption with a Keystore key is deliberately not used because it breaks restore.
- Stores register a reset with `registerStoreReset` so "Delete all data" clears memory too.

## Consequences

Simple, testable (in-memory mocks), self-healing. Data is protected by the app sandbox but not
encrypted at rest; acceptable for v1 and disclosed in the privacy policy.
