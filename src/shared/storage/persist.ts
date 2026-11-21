import { createJSONStorage, type PersistOptions } from 'zustand/middleware';
import type { z } from 'zod';

import { zustandMmkvStorage } from './mmkv';
import { SCHEMA_VERSION } from './schemaVersion';

/**
 * Standard `persist` options for a zustand store kept in MMKV.
 * Persisted state is validated with `schema`; invalid data is dropped and defaults are used.
 * Only the keys of `schema` are persisted (actions are never stored).
 *
 * `migrate` receives the stored state and its version when it is older than SCHEMA_VERSION.
 */
export function mmkvPersistOptions<S, P>(
  name: string,
  schema: z.ZodType<P>,
  options: {
    partialize: (state: S) => P;
    migrate?: (persisted: unknown, version: number) => unknown;
  },
): PersistOptions<S, P> {
  return {
    name,
    version: SCHEMA_VERSION,
    storage: createJSONStorage(() => zustandMmkvStorage),
    partialize: options.partialize,
    migrate: (persisted, version) =>
      (options.migrate ? options.migrate(persisted, version) : persisted) as P,
    merge: (persisted, current) => {
      const parsed = schema.safeParse(persisted);
      if (!parsed.success) {
        if (persisted !== undefined && __DEV__) {
          console.warn(`[persist] invalid stored state for "${name}", using defaults`);
        }
        return current;
      }
      return { ...current, ...parsed.data };
    },
  };
}
