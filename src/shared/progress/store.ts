import { create } from 'zustand';
import { z } from 'zod';

import {
  createDebouncedWriter,
  DATA_FILES,
  loadDataFile,
  registerStoreReset,
} from '@/shared/storage';

import { METRICS } from './metrics';

/**
 * Progress log (weight, waist, labs). Owned by A4; A0 provides this contract so other features
 * (e.g. the plan's Day-90 summary) can read it. Values are stored in canonical units:
 * weight kg, waist cm, ALT/AST U/L, uric acid mg/dL, ultrasound grade 0–3 (0 = normal).
 */
export const progressEntrySchema = z.object({
  id: z.string().min(1),
  metric: z.enum(METRICS),
  /** Local date of the measurement, YYYY-MM-DD. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().finite(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProgressEntry = z.infer<typeof progressEntrySchema>;

export const progressLogSchema = z.array(progressEntrySchema);

const writer = createDebouncedWriter<ProgressEntry[]>(DATA_FILES.progressLog);

type ProgressState = {
  entries: ProgressEntry[];
  loaded: boolean;
  /** Loads the log from disk (file → snapshot → empty). Safe to call more than once. */
  load: () => Promise<void>;
  add: (entry: Omit<ProgressEntry, 'id' | 'createdAt' | 'updatedAt'>, now?: Date) => ProgressEntry;
  update: (id: string, changes: Partial<Pick<ProgressEntry, 'date' | 'value'>>, now?: Date) => void;
  remove: (id: string) => void;
  /** Writes pending changes now (e.g. before export). */
  flush: () => Promise<void>;
  reset: () => void;
};

function newId(now: Date): string {
  return `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useProgressStore = create<ProgressState>()((set, get) => {
  const commit = (entries: ProgressEntry[]) => {
    set({ entries });
    writer.schedule(entries);
  };
  return {
    entries: [],
    loaded: false,
    load: async () => {
      if (get().loaded) {
        return;
      }
      const entries = await loadDataFile(DATA_FILES.progressLog, progressLogSchema, []);
      // Entries added before the load finished are kept.
      set(state => ({ entries: [...entries, ...state.entries], loaded: true }));
    },
    add: (input, now = new Date()) => {
      const timestamp = now.toISOString();
      const entry = progressEntrySchema.parse({
        ...input,
        id: newId(now),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      commit([...get().entries, entry]);
      return entry;
    },
    update: (id, changes, now = new Date()) => {
      commit(
        get().entries.map(entry =>
          entry.id === id
            ? progressEntrySchema.parse({ ...entry, ...changes, updatedAt: now.toISOString() })
            : entry,
        ),
      );
    },
    remove: id => commit(get().entries.filter(entry => entry.id !== id)),
    flush: () => writer.flush(),
    reset: () => {
      writer.cancel();
      set({ entries: [], loaded: false });
    },
  };
});

registerStoreReset(() => useProgressStore.getState().reset());

/** Entries for one metric, oldest first (stable for charts). */
export function selectMetricEntries(entries: ProgressEntry[], metric: ProgressEntry['metric']) {
  return entries
    .filter(entry => entry.metric === metric)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}
