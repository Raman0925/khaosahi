import { Dirs, FileSystem } from 'react-native-file-access';
import { z } from 'zod';

import { migrate } from './migrations';
import { SCHEMA_VERSION } from './schemaVersion';

/** Data files in the app's private documents folder. No storage permission needed. */
export const DATA_FILES = {
  progressLog: 'progress-log.json',
  checklistHistory: 'checklist-history.json',
} as const;

export type DataFileName = (typeof DATA_FILES)[keyof typeof DATA_FILES];

export const BACKUP_DIR = 'backup';
/** Temp files for atomic writes. Excluded from Android Auto Backup (see backup_rules.xml). */
export const TMP_DIR = '.tmp';

export function filePath(relative: string): string {
  return `${Dirs.DocumentDir}/${relative}`;
}

/** Temp path for an atomic write of `relative` (same volume, so rename is atomic). */
export function tmpPath(relative: string): string {
  return filePath(`${TMP_DIR}/${relative.replaceAll('/', '__')}.tmp`);
}

/** Every data file is wrapped in this envelope. */
export const envelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  updatedAt: z.string(),
  data: z.unknown(),
});

export type Envelope = z.infer<typeof envelopeSchema>;

export type ReadStatus = 'ok' | 'missing' | 'invalid';

function warnDev(message: string, detail?: unknown): void {
  if (__DEV__) {
    console.warn(`[files] ${message}`, detail ?? '');
  }
}

/**
 * Parses raw file text into validated data. Applies migrations from older schema versions.
 * Returns `null` when the text is not valid for the schema.
 */
export function parseEnvelope<T>(fileName: string, text: string, schema: z.ZodType<T>): T | null {
  try {
    const envelope = envelopeSchema.safeParse(JSON.parse(text));
    if (!envelope.success) {
      warnDev(`${fileName}: bad envelope`, envelope.error.issues);
      return null;
    }
    const migrated = migrate(fileName, envelope.data.schemaVersion, envelope.data.data);
    const parsed = schema.safeParse(migrated);
    if (!parsed.success) {
      warnDev(`${fileName}: data failed validation`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (error) {
    warnDev(`${fileName}: unreadable`, error);
    return null;
  }
}

/** Reads raw text of a file, or `null` when it does not exist or cannot be read. */
export async function readText(relative: string): Promise<string | null> {
  const path = filePath(relative);
  try {
    if (!(await FileSystem.exists(path))) {
      return null;
    }
    return await FileSystem.readFile(path, 'utf8');
  } catch (error) {
    warnDev(`${relative}: read failed`, error);
    return null;
  }
}

/**
 * Reads and validates a JSON data file. Never throws.
 * Returns `fallback` when the file is missing or invalid; `status` tells which.
 */
export async function readJsonWithStatus<T>(
  relative: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<{ data: T; status: ReadStatus }> {
  const text = await readText(relative);
  if (text === null) {
    return { data: fallback, status: 'missing' };
  }
  const data = parseEnvelope(relative, text, schema);
  return data === null ? { data: fallback, status: 'invalid' } : { data, status: 'ok' };
}

export async function readJson<T>(relative: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  return (await readJsonWithStatus(relative, schema, fallback)).data;
}

// One promise chain per file so two writes to the same file never interleave.
const writeQueues = new Map<string, Promise<void>>();

async function ensureParentDir(path: string): Promise<void> {
  const parent = path.slice(0, path.lastIndexOf('/'));
  if (parent && !(await FileSystem.exists(parent))) {
    await FileSystem.mkdir(parent);
  }
}

async function writeAtomic(relative: string, text: string): Promise<void> {
  const path = filePath(relative);
  const tmp = tmpPath(relative);
  await ensureParentDir(tmp);
  await ensureParentDir(path);
  await FileSystem.writeFile(tmp, text, 'utf8');
  // rename() replaces the target atomically, so a crash leaves either the old or the new file.
  await FileSystem.mv(tmp, path);
}

async function writeNow(relative: string, data: unknown): Promise<void> {
  const envelope: Envelope = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data,
  };
  await writeAtomic(relative, JSON.stringify(envelope));
}

/**
 * Writes `data` wrapped in an envelope via `<file>.tmp` + rename. Writes to the same file are
 * serialised. Rejects if the write fails; the previous file stays intact.
 */
export function writeJsonAtomic(relative: string, data: unknown): Promise<void> {
  const previous = writeQueues.get(relative) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => writeNow(relative, data));
  writeQueues.set(relative, next);
  return next.finally(() => {
    if (writeQueues.get(relative) === next) {
      writeQueues.delete(relative);
    }
  });
}

/** Writes raw text atomically (used for snapshots that already contain envelopes). */
export function writeTextAtomic(relative: string, text: string): Promise<void> {
  return writeAtomic(relative, text);
}

/** Resolves once every pending write has settled (used by delete-all and tests). */
export async function flushWrites(): Promise<void> {
  await Promise.allSettled([...writeQueues.values()]);
}

export async function deleteFileIfExists(relative: string): Promise<void> {
  const path = filePath(relative);
  if (await FileSystem.exists(path)) {
    await FileSystem.unlink(path);
  }
}
