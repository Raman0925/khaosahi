import { create } from 'zustand';

import {
  createDebouncedWriter,
  DATA_FILES,
  loadDataFile,
  registerStoreReset,
} from '@/shared/storage';

import { type HistoryRow, historySchema } from './schema';

const writer = createDebouncedWriter<HistoryRow[]>(DATA_FILES.checklistHistory);

type HistoryState = {
  /** Finished days, oldest first, one row per date. */
  rows: HistoryRow[];
  loaded: boolean;
  /** Loads `checklist-history.json` (file → snapshot → empty). Safe to call more than once. */
  load: () => Promise<void>;
  /** Adds rows; a row for a date that already exists replaces it. */
  addRows: (rows: readonly HistoryRow[]) => void;
  flush: () => Promise<void>;
  reset: () => void;
};

/** Merges rows by date (later wins) and sorts oldest first. */
export function mergeRows(
  existing: readonly HistoryRow[],
  added: readonly HistoryRow[],
): HistoryRow[] {
  const byDate = new Map(existing.map(row => [row.date, row]));
  added.forEach(row => byDate.set(row.date, row));
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

let loading: Promise<void> | null = null;
let resetCount = 0;

export const useChecklistHistory = create<HistoryState>()((set, get) => ({
  rows: [],
  loaded: false,
  load: () => {
    if (get().loaded) {
      return Promise.resolve();
    }
    const generation = resetCount;
    loading ??= loadDataFile(DATA_FILES.checklistHistory, historySchema, []).then(fileRows => {
      if (generation !== resetCount) {
        return; // "Delete all data" ran while reading.
      }
      loading = null;
      const pending = get().rows;
      // Rows finalised before the file was read are kept (and win over the file).
      set({ rows: mergeRows(fileRows, pending), loaded: true });
      if (pending.length > 0) {
        writer.schedule(get().rows);
      }
    });
    return loading;
  },
  addRows: rows => {
    if (rows.length === 0) {
      return;
    }
    set({ rows: mergeRows(get().rows, rows) });
    // Until the file is loaded, writing would overwrite older history; `load` writes instead.
    if (get().loaded) {
      writer.schedule(get().rows);
    }
  },
  flush: () => writer.flush(),
  reset: () => {
    writer.cancel();
    loading = null;
    resetCount += 1;
    set({ rows: [], loaded: false });
  },
}));

registerStoreReset(() => useChecklistHistory.getState().reset());
