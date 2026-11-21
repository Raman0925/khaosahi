import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';
import type { DateKey } from '@/shared/utils/dates';

import type { PlanKey } from './logic/schedule';
import { dateKeySchema, planKeySchema, type Ticks, ticksSchema } from './schema';

/**
 * Plan state (A3). Other modules rely on: `startDate` (local YYYY-MM-DD of plan day 1, or null
 * before a plan exists) — e.g. the 90-day retest reminder in shared/notifications.
 *
 * Use the functions in `./sync` (rollover, toggle, restart) rather than the raw setters so the
 * checklist history stays correct.
 */
const persistedSchema = z.object({
  startDate: dateKeySchema.nullable(),
  /** Profile (condition + diet) the plan was started for. */
  planKey: planKeySchema.nullable().default(null),
  /** Ticks for the current (not yet finalised) day. */
  ticks: ticksSchema.nullable().default(null),
});

type PersistedPlan = z.infer<typeof persistedSchema>;

type PlanState = PersistedPlan & {
  setStartDate: (startDate: DateKey | null) => void;
  /** Starts a fresh plan on `today` (day 1) with no ticks. */
  startPlan: (planKey: PlanKey, today: DateKey) => void;
  setPlanKey: (planKey: PlanKey) => void;
  setTicks: (ticks: Ticks) => void;
  reset: () => void;
};

const EMPTY: PersistedPlan = { startDate: null, planKey: null, ticks: null };

export const usePlanStore = create<PlanState>()(
  persist(
    set => ({
      ...EMPTY,
      setStartDate: startDate => set({ startDate }),
      startPlan: (planKey, today) =>
        set({ startDate: today, planKey, ticks: { dateKey: today, doneItemIds: [] } }),
      setPlanKey: planKey => set({ planKey }),
      setTicks: ticks => set({ ticks }),
      reset: () => set(EMPTY),
    }),
    mmkvPersistOptions<PlanState, PersistedPlan>('plan', persistedSchema, {
      partialize: state => ({
        startDate: state.startDate,
        planKey: state.planKey,
        ticks: state.ticks,
      }),
    }),
  ),
);

registerStoreReset(() => usePlanStore.getState().reset());
