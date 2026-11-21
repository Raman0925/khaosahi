import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';

import {
  type AdCounters,
  type FullScreenAdKind,
  INITIAL_AD_COUNTERS,
  recordAction,
  recordFoodDetailView,
  recordFullScreenAdShown,
} from './logic/caps';

/** Persisted ad state: frequency counters and rewarded extras the user has unlocked. No health data. */
export const adsPersistedSchema = z.object({
  actionsSinceFullScreenAd: z.number().int().min(0),
  lastFullScreenAdAt: z.number().nullable(),
  lastInterstitialAt: z.number().nullable(),
  foodDetailViews: z.number().int().min(0),
  unlockedExtras: z.array(z.string()),
});

export type AdsPersisted = z.infer<typeof adsPersistedSchema>;

const DEFAULTS: AdsPersisted = { ...INITIAL_AD_COUNTERS, unlockedExtras: [] };

type AdsActions = {
  recordAction: () => void;
  recordFoodDetailView: () => void;
  recordFullScreenAdShown: (kind: FullScreenAdKind, now: number) => void;
  unlockExtra: (extraId: string) => void;
  reset: () => void;
};

export type AdsStoreState = AdsPersisted & AdsActions;

function countersOf(state: AdsPersisted): AdCounters {
  return {
    actionsSinceFullScreenAd: state.actionsSinceFullScreenAd,
    lastFullScreenAdAt: state.lastFullScreenAdAt,
    lastInterstitialAt: state.lastInterstitialAt,
    foodDetailViews: state.foodDetailViews,
  };
}

export const useAdsStore = create<AdsStoreState>()(
  persist(
    set => ({
      ...DEFAULTS,
      recordAction: () => set(state => recordAction(countersOf(state))),
      recordFoodDetailView: () => set(state => recordFoodDetailView(countersOf(state))),
      recordFullScreenAdShown: (kind, now) =>
        set(state => recordFullScreenAdShown(countersOf(state), now, kind)),
      unlockExtra: extraId =>
        set(state =>
          state.unlockedExtras.includes(extraId)
            ? state
            : { unlockedExtras: [...state.unlockedExtras, extraId] },
        ),
      reset: () => set(DEFAULTS),
    }),
    mmkvPersistOptions<AdsStoreState, AdsPersisted>('ads', adsPersistedSchema, {
      partialize: state => ({ ...countersOf(state), unlockedExtras: state.unlockedExtras }),
    }),
  ),
);

export function getAdCounters(): AdCounters {
  return countersOf(useAdsStore.getState());
}

registerStoreReset(() => useAdsStore.getState().reset());
