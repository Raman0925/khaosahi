import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';

/**
 * Plan state. A0 CONTRACT, owned and extended by A3 (plan generation, checklist, streaks).
 * Other modules rely on: `startDate` (local YYYY-MM-DD of plan day 1, or null before a plan
 * exists) — e.g. the 90-day retest reminder in shared/notifications. Keep that field and its
 * meaning when extending this store.
 */
const persistedSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});

type PlanState = z.infer<typeof persistedSchema> & {
  setStartDate: (startDate: string | null) => void;
  reset: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    set => ({
      startDate: null,
      setStartDate: startDate => set({ startDate }),
      reset: () => set({ startDate: null }),
    }),
    mmkvPersistOptions<PlanState, z.infer<typeof persistedSchema>>('plan', persistedSchema, {
      partialize: state => ({ startDate: state.startDate }),
    }),
  ),
);

registerStoreReset(() => usePlanStore.getState().reset());
