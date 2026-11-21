import { FileSystem } from 'react-native-file-access';
import { z } from 'zod';

import { filePath, readJson, readJsonWithStatus, tmpPath, writeJsonAtomic } from '../files';
import { FILE_MIGRATIONS, migrate, MigrationError } from '../migrations';
import { SCHEMA_VERSION } from '../schemaVersion';

import type { MockFileSystem } from '../../../../jest/mocks/react-native-file-access';

const fs = FileSystem as unknown as MockFileSystem;

const schema = z.object({ items: z.array(z.number()) });
const FALLBACK = { items: [] as number[] };
const NAME = 'test.json';

beforeEach(() => {
  fs.reset();
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('files', () => {
  it('returns the fallback with status "missing" when the file does not exist', async () => {
    await expect(readJsonWithStatus(NAME, schema, FALLBACK)).resolves.toEqual({
      data: FALLBACK,
      status: 'missing',
    });
  });

  it('round-trips data inside a versioned envelope', async () => {
    await writeJsonAtomic(NAME, { items: [1, 2] });
    const raw = JSON.parse(fs.filesystem.get(filePath(NAME)) ?? '{}');
    expect(raw.schemaVersion).toBe(SCHEMA_VERSION);
    expect(typeof raw.updatedAt).toBe('string');
    await expect(readJson(NAME, schema, FALLBACK)).resolves.toEqual({ items: [1, 2] });
  });

  it('writes via a .tmp file and leaves no .tmp behind', async () => {
    await writeJsonAtomic(NAME, { items: [1] });
    expect(fs.writeFile).toHaveBeenCalledWith(tmpPath(NAME), expect.any(String), 'utf8');
    expect(fs.mv).toHaveBeenCalledWith(tmpPath(NAME), filePath(NAME));
    expect(fs.filesystem.has(tmpPath(NAME))).toBe(false);
  });

  it('returns status "invalid" for corrupt JSON', async () => {
    fs.filesystem.set(filePath(NAME), '{not json');
    await expect(readJsonWithStatus(NAME, schema, FALLBACK)).resolves.toEqual({
      data: FALLBACK,
      status: 'invalid',
    });
  });

  it('returns status "invalid" when data fails the schema', async () => {
    fs.filesystem.set(
      filePath(NAME),
      JSON.stringify({ schemaVersion: 1, updatedAt: 'x', data: { items: ['a'] } }),
    );
    expect((await readJsonWithStatus(NAME, schema, FALLBACK)).status).toBe('invalid');
  });

  it('keeps the previous file when a write is interrupted before rename', async () => {
    await writeJsonAtomic(NAME, { items: [1] });
    fs.mv.mockImplementationOnce(async () => {
      throw new Error('killed');
    });
    await expect(writeJsonAtomic(NAME, { items: [2] })).rejects.toThrow('killed');
    await expect(readJson(NAME, schema, FALLBACK)).resolves.toEqual({ items: [1] });
  });

  it('serialises concurrent writes so the last call wins', async () => {
    await Promise.all([
      writeJsonAtomic(NAME, { items: [1] }),
      writeJsonAtomic(NAME, { items: [2] }),
      writeJsonAtomic(NAME, { items: [3] }),
    ]);
    await expect(readJson(NAME, schema, FALLBACK)).resolves.toEqual({ items: [3] });
  });

  it('a failed write does not block later writes', async () => {
    fs.writeFile.mockImplementationOnce(async () => {
      throw new Error('disk full');
    });
    const first = writeJsonAtomic(NAME, { items: [1] });
    const second = writeJsonAtomic(NAME, { items: [2] });
    await expect(first).rejects.toThrow('disk full');
    await expect(second).resolves.toBeUndefined();
    await expect(readJson(NAME, schema, FALLBACK)).resolves.toEqual({ items: [2] });
  });
});

describe('migrations', () => {
  const migrations = {
    'a.json': {
      1: (d: unknown) => ({ ...(d as object), v2: true }),
      2: (d: unknown) => ({ ...(d as object), v3: true }),
    },
  };

  it('applies each step in order', () => {
    expect(migrate('a.json', 1, { x: 1 }, migrations, 3)).toEqual({ x: 1, v2: true, v3: true });
  });

  it('is a no-op at the current version', () => {
    expect(migrate('a.json', 3, { x: 1 }, migrations, 3)).toEqual({ x: 1 });
  });

  it('throws when a step is missing or data is from a newer app', () => {
    expect(() => migrate('b.json', 1, {}, migrations, 2)).toThrow(MigrationError);
    expect(() => migrate('a.json', 4, {}, migrations, 3)).toThrow(MigrationError);
  });

  it('readJson treats data from a newer app version as invalid instead of crashing', async () => {
    fs.filesystem.set(
      filePath(NAME),
      JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, updatedAt: 'x', data: { items: [] } }),
    );
    expect((await readJsonWithStatus(NAME, schema, FALLBACK)).status).toBe('invalid');
  });

  it('has no registered migrations at schema version 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(FILE_MIGRATIONS).toEqual({});
  });
});
