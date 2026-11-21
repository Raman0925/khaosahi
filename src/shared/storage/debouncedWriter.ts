import { writeJsonAtomic } from './files';
import { writeDailySnapshot } from './snapshot';

export const FILE_WRITE_DEBOUNCE_MS = 500;

export type DebouncedWriter<T> = {
  /** Schedules a write of `data`; only the latest data within the debounce window is written. */
  schedule: (data: T) => void;
  /** Writes any pending data now. */
  flush: () => Promise<void>;
  /** Drops any pending write (used by delete-all). */
  cancel: () => void;
};

/**
 * Debounced atomic writer for one data file. After each successful write it also takes the daily
 * snapshot (a no-op if one already exists for today).
 */
export function createDebouncedWriter<T>(
  fileName: string,
  delayMs: number = FILE_WRITE_DEBOUNCE_MS,
): DebouncedWriter<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { data: T } | null = null;

  const write = async (): Promise<void> => {
    if (!pending) {
      return;
    }
    const { data } = pending;
    pending = null;
    try {
      await writeJsonAtomic(fileName, data);
      await writeDailySnapshot();
    } catch (error) {
      console.warn(`[storage] failed to write ${fileName}`, error);
    }
  };

  return {
    schedule: data => {
      pending = { data };
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        write().catch(() => undefined);
      }, delayMs);
    },
    flush: async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      await write();
    },
    cancel: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
  };
}
