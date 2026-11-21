import { FileSystem } from 'react-native-file-access';

import { type ProfileInput, useProfileStore } from '@/shared/profile';
import { DATA_FILES, resetAllStores, storage, writeJsonAtomic } from '@/shared/storage';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';
import { useChecklistHistory } from '../history';
import { checklistForDate } from '../logic/checklist';
import { usePlanStore } from '../store';
import {
  initPlanSync,
  reconcilePlanWithProfile,
  restartPlan,
  rolloverPlanDay,
  stopPlanSync,
  toggleChecklistItem,
} from '../sync';

const fs = FileSystem as unknown as MockFileSystem;

const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h, 0, 0);

const profile: ProfileInput = {
  condition: 'fattyLiver',
  ageYears: 40,
  sex: 'male',
  heightCm: 170,
  weightKg: 80,
  waistCm: 95,
  dietType: 'veg',
  region: 'north',
  labs: {},
};

function todayItems(): string[] {
  const { planKey, startDate, ticks } = usePlanStore.getState();
  return checklistForDate(planKey!, startDate!, ticks!.dateKey).map(i => i.id);
}

beforeEach(() => {
  stopPlanSync();
  resetAllStores();
  fs.reset();
  storage.clearAll();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterAll(() => stopPlanSync());

describe('plan follows the profile', () => {
  it('does nothing without a profile', () => {
    reconcilePlanWithProfile(at(2026, 11, 21));
    expect(usePlanStore.getState().startDate).toBeNull();
  });

  it('starts the plan today when a profile first appears', () => {
    useProfileStore.getState().saveProfile(profile);
    reconcilePlanWithProfile(at(2026, 11, 21));
    expect(usePlanStore.getState()).toMatchObject({
      startDate: '2026-11-21',
      planKey: 'fattyLiver:veg',
      ticks: { dateKey: '2026-11-21', doneItemIds: [] },
    });
  });

  it('restarts when condition or diet changes, keeping finished days', () => {
    useProfileStore.getState().saveProfile(profile);
    reconcilePlanWithProfile(at(2026, 11, 21));
    toggleChecklistItem(todayItems()[0]!, at(2026, 11, 21));

    useProfileStore.getState().saveProfile({ ...profile, dietType: 'jain' });
    reconcilePlanWithProfile(at(2026, 11, 23));
    expect(usePlanStore.getState()).toMatchObject({
      startDate: '2026-11-23',
      planKey: 'fattyLiver:jain',
      ticks: { dateKey: '2026-11-23', doneItemIds: [] },
    });
    expect(useChecklistHistory.getState().rows.map(r => [r.date, r.done])).toEqual([
      ['2026-11-21', 1],
      ['2026-11-22', 0],
    ]);
  });

  it('does not restart for other profile edits', () => {
    useProfileStore.getState().saveProfile(profile);
    reconcilePlanWithProfile(at(2026, 11, 21));
    useProfileStore.getState().saveProfile({ ...profile, weightKg: 78 });
    reconcilePlanWithProfile(at(2026, 11, 25));
    expect(usePlanStore.getState().startDate).toBe('2026-11-21');
  });

  it('adopts a start date set without a plan key', () => {
    usePlanStore.getState().setStartDate('2026-11-20');
    useProfileStore.getState().saveProfile(profile);
    reconcilePlanWithProfile(at(2026, 11, 21));
    expect(usePlanStore.getState()).toMatchObject({
      startDate: '2026-11-20',
      planKey: 'fattyLiver:veg',
    });
    expect(useChecklistHistory.getState().rows.map(r => r.date)).toEqual(['2026-11-20']);
  });

  it('initPlanSync subscribes once and reacts to profile changes', async () => {
    jest.useFakeTimers({ now: at(2026, 11, 21) });
    try {
      initPlanSync();
      initPlanSync();
      expect(usePlanStore.getState().startDate).toBeNull();
      useProfileStore.getState().saveProfile(profile);
      expect(usePlanStore.getState().startDate).toBe('2026-11-21');
      await useChecklistHistory.getState().load();
      expect(useChecklistHistory.getState().loaded).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('daily checklist', () => {
  beforeEach(() => {
    useProfileStore.getState().saveProfile(profile);
    reconcilePlanWithProfile(at(2026, 11, 21));
  });

  it('toggles items on and off', () => {
    const [first] = todayItems();
    toggleChecklistItem(first!, at(2026, 11, 21, 10));
    expect(usePlanStore.getState().ticks?.doneItemIds).toEqual([first]);
    toggleChecklistItem(first!, at(2026, 11, 21, 11));
    expect(usePlanStore.getState().ticks?.doneItemIds).toEqual([]);
  });

  it('persists plan state to MMKV and restores it', async () => {
    const [first] = todayItems();
    toggleChecklistItem(first!, at(2026, 11, 21, 10));
    const raw = storage.getString('plan')!;
    expect((JSON.parse(raw) as { state: unknown }).state).toEqual({
      startDate: '2026-11-21',
      planKey: 'fattyLiver:veg',
      ticks: { dateKey: '2026-11-21', doneItemIds: [first] },
    });
    usePlanStore.setState({ startDate: null, planKey: null, ticks: null });
    storage.set('plan', raw); // as if the app restarted
    await usePlanStore.persist.rehydrate();
    expect(usePlanStore.getState().ticks?.doneItemIds).toEqual([first]);
  });

  it('drops invalid stored plan state', async () => {
    usePlanStore.setState({ startDate: null, planKey: null, ticks: null });
    storage.set('plan', JSON.stringify({ state: { startDate: 'bad', planKey: 'x' }, version: 1 }));
    await usePlanStore.persist.rehydrate();
    expect(usePlanStore.getState().startDate).toBeNull();
  });

  it('accepts older stored state that has only a start date', async () => {
    usePlanStore.setState({ startDate: null, planKey: null, ticks: null });
    storage.set('plan', JSON.stringify({ state: { startDate: '2026-11-01' }, version: 1 }));
    await usePlanStore.persist.rehydrate();
    expect(usePlanStore.getState()).toMatchObject({
      startDate: '2026-11-01',
      planKey: null,
      ticks: null,
    });
  });

  it('rolls over at midnight and back-fills missed days', () => {
    const items = todayItems();
    items.slice(0, 5).forEach(id => toggleChecklistItem(id, at(2026, 11, 21, 23)));

    rolloverPlanDay(at(2026, 11, 21, 23)); // same day: no-op
    expect(useChecklistHistory.getState().rows).toEqual([]);

    rolloverPlanDay(at(2026, 11, 24, 0));
    expect(usePlanStore.getState().ticks).toEqual({ dateKey: '2026-11-24', doneItemIds: [] });
    expect(useChecklistHistory.getState().rows.map(r => [r.date, r.planDay, r.done])).toEqual([
      ['2026-11-21', 1, 5],
      ['2026-11-22', 2, 0],
      ['2026-11-23', 3, 0],
    ]);
  });

  it('toggling on a new day first finalises the previous day', () => {
    toggleChecklistItem(todayItems()[0]!, at(2026, 11, 21));
    toggleChecklistItem('drink-water', at(2026, 11, 22));
    expect(useChecklistHistory.getState().rows).toHaveLength(1);
    expect(usePlanStore.getState().ticks).toEqual({
      dateKey: '2026-11-22',
      doneItemIds: ['drink-water'],
    });
  });

  it('starts fresh without touching history when the clock goes back', () => {
    rolloverPlanDay(at(2026, 11, 20));
    expect(usePlanStore.getState().ticks?.dateKey).toBe('2026-11-20');
    expect(useChecklistHistory.getState().rows).toEqual([]);
  });

  it('restartPlan starts at day 1 today and clears ticks', () => {
    toggleChecklistItem(todayItems()[0]!, at(2026, 11, 21));
    restartPlan(at(2026, 12, 1));
    expect(usePlanStore.getState()).toMatchObject({
      startDate: '2026-12-01',
      ticks: { dateKey: '2026-12-01', doneItemIds: [] },
    });
    expect(useChecklistHistory.getState().rows).toHaveLength(10);
  });
});

describe('checklist history file', () => {
  it('keeps rows finalised before the file loaded and writes the merge', async () => {
    jest.useFakeTimers();
    try {
      await writeJsonAtomic(DATA_FILES.checklistHistory, [
        { date: '2026-11-01', planDay: 1, done: 6, total: 6, itemIds: [] },
      ]);
      useChecklistHistory
        .getState()
        .addRows([{ date: '2026-11-02', planDay: 2, done: 1, total: 6, itemIds: ['a'] }]);
      await useChecklistHistory.getState().load();
      expect(useChecklistHistory.getState().rows.map(r => r.date)).toEqual([
        '2026-11-01',
        '2026-11-02',
      ]);
      await useChecklistHistory.getState().flush();
      const saved = JSON.parse(
        fs.filesystem.get(`/mock/DocumentDir/${DATA_FILES.checklistHistory}`)!,
      ) as { data: unknown[] };
      expect(saved.data).toHaveLength(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('replaces a row for the same date', () => {
    const { addRows } = useChecklistHistory.getState();
    addRows([{ date: '2026-11-02', planDay: 2, done: 1, total: 6, itemIds: [] }]);
    addRows([{ date: '2026-11-02', planDay: 2, done: 4, total: 6, itemIds: [] }]);
    expect(useChecklistHistory.getState().rows).toEqual([
      { date: '2026-11-02', planDay: 2, done: 4, total: 6, itemIds: [] },
    ]);
  });
});
