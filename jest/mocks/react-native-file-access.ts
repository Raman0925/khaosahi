/**
 * In-memory mock of react-native-file-access with real directory semantics (the library's own
 * mock has no mkdir and a fixed ls). Covers the subset of the API the app uses.
 */
import { jest } from '@jest/globals';

export const Dirs = {
  CacheDir: '/mock/CacheDir',
  DocumentDir: '/mock/DocumentDir',
  MainBundleDir: '/mock/MainBundleDir',
};

const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/'));

class FileSystemMock {
  /** Files: absolute path → contents. */
  public filesystem = new Map<string, string>();
  /** Directories created with mkdir (DocumentDir and CacheDir always exist). */
  public dirs = new Set<string>();

  private dirExists(path: string): boolean {
    return Object.values(Dirs).includes(path) || this.dirs.has(path);
  }

  private assertParent(path: string): void {
    if (!this.dirExists(parentOf(path))) {
      throw new Error(`ENOENT: no such directory ${parentOf(path)}`);
    }
  }

  public exists = jest.fn(
    async (path: string) => this.filesystem.has(path) || this.dirExists(path),
  );

  public isDir = jest.fn(async (path: string) => this.dirExists(path));

  public mkdir = jest.fn(async (path: string) => {
    this.dirs.add(path);
    return path;
  });

  public ls = jest.fn(async (path: string) => {
    const prefix = `${path}/`;
    const names = new Set<string>();
    for (const key of [...this.filesystem.keys(), ...this.dirs]) {
      if (key.startsWith(prefix)) {
        names.add(key.slice(prefix.length).split('/')[0]!);
      }
    }
    return [...names];
  });

  public readFile = jest.fn(async (path: string, _encoding?: string) => {
    const data = this.filesystem.get(path);
    if (data === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return data;
  });

  public writeFile = jest.fn(async (path: string, data: string, _encoding?: string) => {
    this.assertParent(path);
    this.filesystem.set(path, data);
  });

  public mv = jest.fn(async (source: string, target: string) => {
    const data = this.filesystem.get(source);
    if (data === undefined) {
      throw new Error(`ENOENT: ${source}`);
    }
    this.assertParent(target);
    this.filesystem.set(target, data);
    this.filesystem.delete(source);
  });

  public unlink = jest.fn(async (path: string) => {
    if (this.dirs.has(path)) {
      const children = await this.ls(path);
      if (children.length > 0) {
        throw new Error(`ENOTEMPTY: ${path}`);
      }
      this.dirs.delete(path);
      return;
    }
    this.filesystem.delete(path);
  });

  /** Test helper: clears all files and directories. */
  public reset(): void {
    this.filesystem.clear();
    this.dirs.clear();
  }
}

export const FileSystem = new FileSystemMock();
export type MockFileSystem = FileSystemMock;
