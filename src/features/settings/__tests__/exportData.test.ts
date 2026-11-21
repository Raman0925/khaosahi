import { FileSystem } from 'react-native-file-access';
import Share from 'react-native-share';

import { useProgressStore } from '@/shared/progress';
import { getNewestSnapshotPath, snapshotSchema, storage } from '@/shared/storage';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';
import { exportData, shareOptionsFor } from '../logic/exportData';

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn(async () => ({ success: true, message: '' })) },
}));

const fs = FileSystem as unknown as MockFileSystem;
const shareOpen = Share.open as jest.Mock;
const NOW = new Date(2026, 10, 21, 10, 0, 0);

beforeEach(async () => {
  fs.reset();
  storage.clearAll();
  useProgressStore.getState().reset();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('exportData', () => {
  it('saves pending changes and shares the newest snapshot as JSON', async () => {
    storage.set('preferences', '{"state":{"language":"hi"}}');
    await useProgressStore.getState().load();
    // Not flushed yet: export must save it first.
    useProgressStore.getState().add({ metric: 'weight', date: '2026-11-20', value: 72.5 });

    await expect(exportData(NOW)).resolves.toBe(true);

    const path = await getNewestSnapshotPath();
    expect(path).toMatch(/backup\/snapshot-2026-11-21\.json$/);
    expect(shareOpen).toHaveBeenCalledTimes(1);
    expect(shareOpen).toHaveBeenCalledWith({
      url: `file://${path}`,
      type: 'application/json',
      filename: 'khaosahi-backup-2026-11-21',
      failOnCancel: false,
    });

    const snapshot = snapshotSchema.parse(JSON.parse(fs.filesystem.get(path!)!));
    expect(snapshot.mmkv.preferences).toBe('{"state":{"language":"hi"}}');
    expect(snapshot.files['progress-log.json']?.data).toEqual([
      expect.objectContaining({ metric: 'weight', value: 72.5 }),
    ]);
  });

  it('overwrites an earlier snapshot from the same day', async () => {
    await exportData(NOW);
    await useProgressStore.getState().load();
    useProgressStore.getState().add({ metric: 'waist', date: '2026-11-21', value: 88 });
    await exportData(NOW);

    const path = await getNewestSnapshotPath();
    const snapshot = snapshotSchema.parse(JSON.parse(fs.filesystem.get(path!)!));
    expect(snapshot.files['progress-log.json']?.data).toEqual([
      expect.objectContaining({ metric: 'waist' }),
    ]);
  });

  it('returns false when the share sheet fails', async () => {
    shareOpen.mockRejectedValueOnce(new Error('no activity'));
    await expect(exportData(NOW)).resolves.toBe(false);
  });

  it('returns false and does not share when the snapshot cannot be written', async () => {
    const share = jest.fn(async () => undefined);
    const result = await exportData(NOW, {
      flushPendingWrites: async () => undefined,
      writeSnapshot: async () => null,
      getNewestSnapshotPath: async () => '/x.json',
      share,
    });
    expect(result).toBe(false);
    expect(share).not.toHaveBeenCalled();
  });

  it('builds share options for a path', () => {
    expect(shareOptionsFor('/data/files/backup/a.json', NOW).url).toBe(
      'file:///data/files/backup/a.json',
    );
  });
});
