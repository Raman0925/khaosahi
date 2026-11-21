import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';
import type { z } from 'zod';

/**
 * The single MMKV instance for the app. Not encrypted on purpose: Android Auto Backup must be able
 * to restore it on a new phone (see docs/adr/003-storage-mmkv-and-files.md).
 */
export const storage = createMMKV({ id: 'khaosahi' });

/** MMKV keys used outside zustand stores. Keep every key here so wipe/snapshot logic sees them. */
export const MMKV_KEYS = {
  lastSnapshotDate: 'storage.lastSnapshotDate',
} as const;

function warnDev(message: string, detail?: unknown): void {
  if (__DEV__) {
    console.warn(`[storage] ${message}`, detail ?? '');
  }
}

/** Reads a JSON value from MMKV and validates it. Returns `fallback` when missing or invalid. */
export function readMmkvJson<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  const raw = storage.getString(key);
  if (raw === undefined) {
    return fallback;
  }
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      return parsed.data;
    }
    warnDev(`invalid value for "${key}", using default`, parsed.error.issues);
  } catch (error) {
    warnDev(`corrupt JSON for "${key}", using default`, error);
  }
  return fallback;
}

export function writeMmkvJson(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

/** Storage adapter for zustand's `persist` middleware (synchronous, backed by MMKV). */
export const zustandMmkvStorage: StateStorage = {
  getItem: name => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: name => {
    storage.remove(name);
  },
};
