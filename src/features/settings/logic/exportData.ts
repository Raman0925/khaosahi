import Share, { type ShareOptions } from 'react-native-share';

import { useProgressStore } from '@/shared/progress';
import { getNewestSnapshotPath, writeDailySnapshot } from '@/shared/storage';
import { toDateKey } from '@/shared/utils/dates';

export type ExportDataDeps = {
  flushPendingWrites: () => Promise<void>;
  writeSnapshot: (now: Date) => Promise<string | null>;
  getNewestSnapshotPath: () => Promise<string | null>;
  share: (options: ShareOptions) => Promise<unknown>;
};

const defaultDeps: ExportDataDeps = {
  flushPendingWrites: () => useProgressStore.getState().flush(),
  writeSnapshot: now => writeDailySnapshot(now, { force: true }),
  getNewestSnapshotPath,
  share: options => Share.open(options),
};

/** Share-sheet options for a snapshot file. `filename` has no extension (Android adds it). */
export function shareOptionsFor(path: string, now: Date): ShareOptions {
  return {
    url: `file://${path}`,
    type: 'application/json',
    filename: `khaosahi-backup-${toDateKey(now)}`,
    failOnCancel: false,
  };
}

/**
 * Exports the user's data: saves pending changes, writes a fresh snapshot and opens the share
 * sheet with it. Returns false on any failure (never throws). Cancelling the sheet is success.
 */
export async function exportData(
  now: Date = new Date(),
  deps: ExportDataDeps = defaultDeps,
): Promise<boolean> {
  try {
    await deps.flushPendingWrites();
    if ((await deps.writeSnapshot(now)) === null) {
      return false;
    }
    const path = await deps.getNewestSnapshotPath();
    if (path === null) {
      return false;
    }
    await deps.share(shareOptionsFor(path, now));
    return true;
  } catch (error) {
    console.warn('[settings] export failed', error);
    return false;
  }
}
