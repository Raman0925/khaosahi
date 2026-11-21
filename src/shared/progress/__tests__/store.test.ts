import { FileSystem } from 'react-native-file-access';

import { DATA_FILES, flushWrites } from '@/shared/storage';
import { filePath } from '@/shared/storage/files';
import { storage } from '@/shared/storage/mmkv';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';
import { selectMetricEntries, useProgressStore } from '../store';

const fs = FileSystem as unknown as MockFileSystem;

beforeEach(() => {
  fs.reset();
  storage.clearAll();
  useProgressStore.getState().reset();
});

describe('progress store', () => {
  it('adds, updates and removes entries and persists them', async () => {
    const store = useProgressStore.getState();
    await store.load();
    const a = store.add({ metric: 'weight', date: '2026-11-02', value: 80 });
    store.add({ metric: 'weight', date: '2026-11-01', value: 81 });
    store.add({ metric: 'uricAcid', date: '2026-11-01', value: 7.2 });
    useProgressStore.getState().update(a.id, { value: 79.5 });

    const weights = selectMetricEntries(useProgressStore.getState().entries, 'weight');
    expect(weights.map(e => [e.date, e.value])).toEqual([
      ['2026-11-01', 81],
      ['2026-11-02', 79.5],
    ]);

    await useProgressStore.getState().flush();
    await flushWrites();
    const saved = JSON.parse(fs.filesystem.get(filePath(DATA_FILES.progressLog))!);
    expect(saved.data).toHaveLength(3);

    useProgressStore.getState().remove(a.id);
    expect(useProgressStore.getState().entries).toHaveLength(2);
  });

  it('loads saved entries on startup', async () => {
    useProgressStore.getState().add({ metric: 'waist', date: '2026-11-01', value: 95 });
    await useProgressStore.getState().flush();
    useProgressStore.getState().reset();

    await useProgressStore.getState().load();
    expect(useProgressStore.getState().entries.map(e => e.value)).toEqual([95]);
  });

  it('rejects invalid entries', () => {
    expect(() =>
      useProgressStore.getState().add({ metric: 'weight', date: '01-11-2026', value: 80 }),
    ).toThrow();
  });
});
