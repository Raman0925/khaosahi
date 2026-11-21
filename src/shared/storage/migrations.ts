import { SCHEMA_VERSION } from './schemaVersion';

/**
 * A migration turns data stored at version N into data for version N + 1.
 * Register them per data file name, indexed by the version they migrate FROM.
 *
 * Example (when SCHEMA_VERSION becomes 2):
 *   'progress-log.json': { 1: data => ({ ...data, newField: [] }) }
 */
type Migration = (data: unknown) => unknown;

export const FILE_MIGRATIONS: Record<string, Record<number, Migration>> = {};

export class MigrationError extends Error {}

/**
 * Applies migrations step by step from `fromVersion` up to `SCHEMA_VERSION`.
 * Throws `MigrationError` when a step is missing or when data is from a newer app version.
 */
export function migrate(
  fileName: string,
  fromVersion: number,
  data: unknown,
  migrations: Record<string, Record<number, Migration>> = FILE_MIGRATIONS,
  targetVersion: number = SCHEMA_VERSION,
): unknown {
  if (fromVersion > targetVersion) {
    throw new MigrationError(`${fileName}: data version ${fromVersion} is newer than app`);
  }
  let current = data;
  for (let version = fromVersion; version < targetVersion; version += 1) {
    const step = migrations[fileName]?.[version];
    if (!step) {
      throw new MigrationError(`${fileName}: no migration from version ${version}`);
    }
    current = step(current);
  }
  return current;
}
