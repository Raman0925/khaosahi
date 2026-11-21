import { FileSystem } from 'react-native-file-access';

import { cancelAllNotifications } from '@/shared/notifications';
import { usePlanStore } from '@/shared/plan';
import { usePreferences } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';
import { useProgressStore } from '@/shared/progress';
import {
  DATA_FILES,
  getNewestSnapshotPath,
  storage,
  writeDailySnapshot,
  writeJsonAtomic,
} from '@/shared/storage';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';
import { deleteAllData } from '../logic/deleteAllData';

jest.mock('@/shared/notifications', () => ({
  syncReminders: jest.fn(async () => undefined),
  cancelAllNotifications: jest.fn(async () => undefined),
}));

const fs = FileSystem as unknown as MockFileSystem;

async function fillEveryStore() {
  usePreferences.getState().setLanguage('hi');
  usePreferences.getState().setWeightUnit('lb');
  usePreferences.getState().completeOnboarding();
  useProfileStore.getState().saveProfile({
    condition: 'both',
    ageYears: 45,
    sex: 'female',
    heightCm: 160,
    weightKg: 70,
    waistCm: 90,
    dietType: 'veg',
    region: 'west',
    labs: { uricAcidMgDl: 7.5 },
  });
  usePlanStore.getState().setStartDate('2026-11-01');
  await useProgressStore.getState().load();
  useProgressStore.getState().add({ metric: 'weight', date: '2026-11-02', value: 70 });
  await useProgressStore.getState().flush();
  await writeJsonAtomic(DATA_FILES.checklistHistory, [{ day: 1 }]);
  await writeDailySnapshot(new Date(2026, 10, 2), { force: true });
}

beforeEach(() => {
  fs.reset();
  storage.clearAll();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('deleteAllData', () => {
  it('wipes MMKV, data files and snapshots, cancels notifications and resets stores', async () => {
    await fillEveryStore();
    expect(storage.getAllKeys().length).toBeGreaterThan(0);
    expect(fs.filesystem.size).toBeGreaterThan(0);
    expect(await getNewestSnapshotPath()).not.toBeNull();

    await deleteAllData();

    expect(cancelAllNotifications).toHaveBeenCalledTimes(1);
    expect(storage.getAllKeys()).toEqual([]);
    expect([...fs.filesystem.keys()]).toEqual([]);
    expect(await getNewestSnapshotPath()).toBeNull();

    const preferences = usePreferences.getState();
    expect(preferences.onboardingCompletedAt).toBeNull();
    expect(preferences.language).toBeNull();
    expect(preferences.weightUnit).toBe('kg');
    expect(useProfileStore.getState().profile).toBeNull();
    expect(usePlanStore.getState().startDate).toBeNull();
    expect(useProgressStore.getState().entries).toEqual([]);
  });

  it('drops a pending debounced write instead of saving it after the wipe', async () => {
    await useProgressStore.getState().load();
    useProgressStore.getState().add({ metric: 'weight', date: '2026-11-02', value: 70 });

    await deleteAllData();
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(fs.filesystem.size).toBe(0);
    expect(useProgressStore.getState().entries).toEqual([]);
  });

  it('runs the steps in order and still wipes if cancelling notifications fails', async () => {
    const calls: string[] = [];
    await deleteAllData({
      cancelAllNotifications: async () => {
        calls.push('cancel');
        throw new Error('no permission');
      },
      wipeAllStorage: async () => {
        calls.push('wipe');
      },
      resetAllStores: () => {
        calls.push('reset');
      },
    });
    expect(calls).toEqual(['cancel', 'wipe', 'reset', 'wipe']);
  });

  it('rejects when storage cannot be wiped', async () => {
    const resetAllStores = jest.fn();
    await expect(
      deleteAllData({
        cancelAllNotifications: async () => undefined,
        wipeAllStorage: async () => {
          throw new Error('io');
        },
        resetAllStores,
      }),
    ).rejects.toThrow('io');
    expect(resetAllStores).not.toHaveBeenCalled();
  });
});
