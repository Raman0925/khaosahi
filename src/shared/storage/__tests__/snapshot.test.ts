import { FileSystem } from 'react-native-file-access';
import { z } from 'zod';

import { DATA_FILES, filePath, tmpPath, writeJsonAtomic } from '../files';
import { MMKV_KEYS, storage } from '../mmkv';
import {
  getNewestSnapshotPath,
  listSnapshots,
  loadDataFile,
  snapshotSchema,
  wipeAllStorage,
  writeDailySnapshot,
} from '../snapshot';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';

const fs = FileSystem as unknown as MockFileSystem;

const logSchema = z.array(z.object({ v: z.number() }));

const day = (d: number) => new Date(2026, 10, d, 9, 0, 0);

beforeEach(() => {
  fs.reset();
  storage.clearAll();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('snapshot', () => {
  it('writes one snapshot per day containing MMKV and both data files', async () => {
    storage.set('preferences', '{"state":{}}');
    await writeJsonAtomic(DATA_FILES.progressLog, [{ v: 1 }]);

    const name = await writeDailySnapshot(day(1));
    expect(name).toBe('backup/snapshot-2026-11-01.json');

    const snapshot = snapshotSchema.parse(JSON.parse(fs.filesystem.get(filePath(name!))!));
    expect(snapshot.mmkv.preferences).toBe('{"state":{}}');
    expect(snapshot.mmkv[MMKV_KEYS.lastSnapshotDate]).toBe('2026-11-01');
    expect(snapshot.files[DATA_FILES.progressLog]?.data).toEqual([{ v: 1 }]);
    expect(snapshot.files[DATA_FILES.checklistHistory]).toBeNull();
  });

  it('does not rewrite on the same day unless forced', async () => {
    await writeDailySnapshot(day(1));
    const writesAfterFirst = fs.writeFile.mock.calls.length;
    await writeDailySnapshot(day(1));
    expect(fs.writeFile.mock.calls.length).toBe(writesAfterFirst);
    await writeDailySnapshot(day(1), { force: true });
    expect(fs.writeFile.mock.calls.length).toBeGreaterThan(writesAfterFirst);
  });

  it('keeps only the newest 3 snapshots', async () => {
    for (const d of [1, 2, 3, 4, 5]) {
      await writeDailySnapshot(day(d));
    }
    expect(await listSnapshots()).toEqual([
      'backup/snapshot-2026-11-05.json',
      'backup/snapshot-2026-11-04.json',
      'backup/snapshot-2026-11-03.json',
    ]);
    expect(await getNewestSnapshotPath()).toBe(filePath('backup/snapshot-2026-11-05.json'));
  });

  it('never throws when the file system fails', async () => {
    fs.writeFile.mockImplementationOnce(async () => {
      throw new Error('disk full');
    });
    await expect(writeDailySnapshot(day(1))).resolves.toBeNull();
  });
});

describe('loadDataFile', () => {
  it('reads a valid file', async () => {
    await writeJsonAtomic(DATA_FILES.progressLog, [{ v: 7 }]);
    await expect(loadDataFile(DATA_FILES.progressLog, logSchema, [])).resolves.toEqual([{ v: 7 }]);
  });

  it('recovers a corrupt file from the newest valid snapshot', async () => {
    await writeJsonAtomic(DATA_FILES.progressLog, [{ v: 1 }]);
    await writeDailySnapshot(day(1));
    await writeJsonAtomic(DATA_FILES.progressLog, [{ v: 2 }]);
    await writeDailySnapshot(day(2));
    // Newest snapshot holds a corrupt copy: recovery must skip it.
    const newest = filePath('backup/snapshot-2026-11-02.json');
    const parsed = JSON.parse(fs.filesystem.get(newest)!);
    parsed.files[DATA_FILES.progressLog].data = 'garbage';
    fs.filesystem.set(newest, JSON.stringify(parsed));

    fs.filesystem.set(filePath(DATA_FILES.progressLog), '{corrupt');
    await expect(loadDataFile(DATA_FILES.progressLog, logSchema, [])).resolves.toEqual([{ v: 1 }]);
  });

  it('falls back to defaults when nothing valid exists', async () => {
    fs.filesystem.set(filePath(DATA_FILES.progressLog), '{corrupt');
    await expect(loadDataFile(DATA_FILES.progressLog, logSchema, [])).resolves.toEqual([]);
  });
});

describe('wipeAllStorage', () => {
  it('removes MMKV data, data files, temp files and every snapshot', async () => {
    storage.set('profile', 'x');
    await writeJsonAtomic(DATA_FILES.progressLog, [{ v: 1 }]);
    await writeJsonAtomic(DATA_FILES.checklistHistory, []);
    await fs.mkdir(filePath('.tmp'));
    fs.filesystem.set(tmpPath(DATA_FILES.progressLog), 'partial');
    await writeDailySnapshot(day(1));

    await wipeAllStorage();

    expect(storage.getAllKeys()).toEqual([]);
    expect([...fs.filesystem.keys()]).toEqual([]);
    expect(await listSnapshots()).toEqual([]);
  });
});
