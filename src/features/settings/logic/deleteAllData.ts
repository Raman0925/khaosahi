import { cancelAllNotifications } from '@/shared/notifications';
import { resetAllStores, wipeAllStorage } from '@/shared/storage';

export type DeleteAllDataDeps = {
  cancelAllNotifications: () => Promise<void>;
  wipeAllStorage: () => Promise<void>;
  resetAllStores: () => void;
};

const defaultDeps: DeleteAllDataDeps = { cancelAllNotifications, wipeAllStorage, resetAllStores };

/**
 * Deletes every piece of user data: scheduled notifications, all MMKV keys, data files and
 * snapshots, then returns every in-memory store to its defaults. Resetting preferences clears
 * `onboardingCompletedAt`, so the navigator switches to onboarding by itself.
 *
 * Storage is wiped a second time after the reset: resetting the stores cancels their pending
 * debounced writes, and the second pass removes anything such a write saved during the first.
 * Throws if the storage could not be wiped (the caller shows an error and the user can retry).
 */
export async function deleteAllData(deps: DeleteAllDataDeps = defaultDeps): Promise<void> {
  try {
    await deps.cancelAllNotifications();
  } catch (error) {
    // Keep going: the user asked for their data to be deleted.
    console.warn('[settings] cancelling notifications failed', error);
  }
  await deps.wipeAllStorage();
  deps.resetAllStores();
  await deps.wipeAllStorage();
}
