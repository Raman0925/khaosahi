import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';

import { type Profile, type ProfileInput, profileSchema } from './schema';

const persistedSchema = z.object({ profile: profileSchema.nullable() });

type ProfileState = {
  profile: Profile | null;
  /** Saves the profile (create or update). Validates; throws on invalid input. */
  saveProfile: (input: ProfileInput, now?: Date) => Profile;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      saveProfile: (input, now = new Date()) => {
        const timestamp = now.toISOString();
        const profile = profileSchema.parse({
          ...input,
          createdAt: get().profile?.createdAt ?? timestamp,
          updatedAt: timestamp,
        });
        set({ profile });
        return profile;
      },
      reset: () => set({ profile: null }),
    }),
    mmkvPersistOptions<ProfileState, z.infer<typeof persistedSchema>>('profile', persistedSchema, {
      partialize: state => ({ profile: state.profile }),
    }),
  ),
);

/** The saved profile, or `null` before onboarding finishes. */
export function useProfile(): Profile | null {
  return useProfileStore(state => state.profile);
}

registerStoreReset(() => useProfileStore.getState().reset());
