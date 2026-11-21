import { FileSystem } from 'react-native-file-access';
import { z } from 'zod';

import { toDateKey } from '@/shared/utils/dates';

import {
  BACKUP_DIR,
  DATA_FILES,
  deleteFileIfExists,
  envelopeSchema,
  filePath,
  flushWrites,
  parseEnvelope,
  readJsonWithStatus,
  readText,
  TMP_DIR,
  writeTextAtomic,
} from './files';
import { MMKV_KEYS, storage } from './mmkv';
import { SCHEMA_VERSION } from './schemaVersion';

export const SNAPSHOTS_TO_KEEP = 3;
const SNAPSHOT_RE = /^snapshot-(\d{4}-\d{2}-\d{2})\.json$/;

export const snapshotSchema = z.object({
  kind: z.literal('khaosahi-backup'),
  schemaVersion: z.number().int().positive(),
  createdAt: z.string(),
  mmkv: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  files: z.record(z.string(), envelopeSchema.nullable()),
});

export type Snapshot = z.infer<typeof snapshotSchema>;

function snapshotName(dateKey: string): string {
  return `${BACKUP_DIR}/snapshot-${dateKey}.json`;
}

/** Snapshot file names (relative), newest first. */
export async function listSnapshots(): Promise<string[]> {
  const dir = filePath(BACKUP_DIR);
  if (!(await FileSystem.exists(dir))) {
    return [];
  }
  const names = await FileSystem.ls(dir);
  return names
    .filter(name => SNAPSHOT_RE.test(name))
    .sort()
    .reverse()
    .map(name => `${BACKUP_DIR}/${name}`);
}

function collectMmkv(): Snapshot['mmkv'] {
  const result: Snapshot['mmkv'] = {};
  for (const key of storage.getAllKeys()) {
    const value = storage.getString(key) ?? storage.getNumber(key) ?? storage.getBoolean(key);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

async function collectFiles(): Promise<Snapshot['files']> {
  const files: Snapshot['files'] = {};
  for (const name of Object.values(DATA_FILES)) {
    const text = await readText(name);
    if (text === null) {
      files[name] = null;
      continue;
    }
    try {
      const parsed = envelopeSchema.safeParse(JSON.parse(text));
      files[name] = parsed.success ? parsed.data : null;
    } catch {
      files[name] = null;
    }
  }
  return files;
}

/** Builds a snapshot of all MMKV data and both data files. */
export async function buildSnapshot(now: Date = new Date()): Promise<Snapshot> {
  await flushWrites();
  return {
    kind: 'khaosahi-backup',
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    mmkv: collectMmkv(),
    files: await collectFiles(),
  };
}

export async function pruneSnapshots(keep: number = SNAPSHOTS_TO_KEEP): Promise<void> {
  const snapshots = await listSnapshots();
  for (const name of snapshots.slice(keep)) {
    await deleteFileIfExists(name);
  }
}

/**
 * Writes today's snapshot unless one was already written today (pass `force` to overwrite,
 * e.g. right before export). Prunes to the newest 3. Never throws; returns the relative path
 * of today's snapshot, or `null` on failure.
 */
export async function writeDailySnapshot(
  now: Date = new Date(),
  options: { force?: boolean } = {},
): Promise<string | null> {
  const dateKey = toDateKey(now);
  const name = snapshotName(dateKey);
  try {
    const alreadyDone =
      storage.getString(MMKV_KEYS.lastSnapshotDate) === dateKey &&
      (await FileSystem.exists(filePath(name)));
    if (alreadyDone && !options.force) {
      return name;
    }
    const snapshot = await buildSnapshot(now);
    // Record the date first so the snapshot itself contains it.
    storage.set(MMKV_KEYS.lastSnapshotDate, dateKey);
    snapshot.mmkv[MMKV_KEYS.lastSnapshotDate] = dateKey;
    await writeTextAtomic(name, JSON.stringify(snapshot));
    await pruneSnapshots();
    return name;
  } catch (error) {
    if (__DEV__) {
      console.warn('[snapshot] write failed', error);
    }
    return null;
  }
}

/** Absolute path of the newest snapshot file (used by Export), or `null`. */
export async function getNewestSnapshotPath(): Promise<string | null> {
  const [newest] = await listSnapshots();
  return newest ? filePath(newest) : null;
}

/** Finds `fileName` in the newest snapshot that holds a valid copy of it. */
export async function readFromNewestValidSnapshot<T>(
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  for (const name of await listSnapshots()) {
    const text = await readText(name);
    if (text === null) {
      continue;
    }
    try {
      const snapshot = snapshotSchema.safeParse(JSON.parse(text));
      const envelope = snapshot.success ? snapshot.data.files[fileName] : null;
      if (!envelope) {
        continue;
      }
      const data = parseEnvelope(fileName, JSON.stringify(envelope), schema);
      if (data !== null) {
        return data;
      }
    } catch {
      // Try the next older snapshot.
    }
  }
  return null;
}

/**
 * Loads a data file for a store at startup. Order: the file itself → newest valid snapshot →
 * `fallback`. Never throws.
 */
export async function loadDataFile<T>(
  fileName: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<T> {
  const result = await readJsonWithStatus(fileName, schema, fallback);
  if (result.status === 'ok') {
    return result.data;
  }
  const recovered = await readFromNewestValidSnapshot(fileName, schema);
  if (recovered !== null) {
    if (__DEV__) {
      console.warn(`[snapshot] recovered ${fileName} from backup`);
    }
    return recovered;
  }
  return fallback;
}

/**
 * Deletes ALL user data held by the storage layer: every MMKV key, every data file and every
 * snapshot. Callers must also cancel notifications and reset in-memory stores.
 */
export async function wipeAllStorage(): Promise<void> {
  await flushWrites();
  storage.clearAll();
  for (const name of Object.values(DATA_FILES)) {
    await deleteFileIfExists(name);
  }
  for (const dirName of [BACKUP_DIR, TMP_DIR]) {
    const dir = filePath(dirName);
    if (await FileSystem.exists(dir)) {
      for (const name of await FileSystem.ls(dir)) {
        await FileSystem.unlink(`${dir}/${name}`);
      }
      await FileSystem.unlink(dir);
    }
  }
}
