// @vitest-environment node
import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sweepImageCache } from './sweepImageCache.ts';

type WriteFileWithAgeParams = { path: string; bytes: number; ageMs: number };

async function writeFileWithAge(
  { path, bytes, ageMs }: WriteFileWithAgeParams,
): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, new Uint8Array(bytes));
  const mtime = new Date(Date.now() - ageMs);
  await utimes(path, mtime, mtime);
}

describe('sweepImageCache', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'image-cache-sweep-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('should evict the oldest files first until at 90% of the budget', async () => {
    await writeFileWithAge({
      path: join(dir, 'oldest.jpg'),
      bytes: 40,
      ageMs: 3000,
    });
    await writeFileWithAge({
      path: join(dir, 'middle.jpg'),
      bytes: 40,
      ageMs: 2000,
    });
    await writeFileWithAge({
      path: join(dir, 'newest.jpg'),
      bytes: 40,
      ageMs: 1000,
    });

    await sweepImageCache({ dir, maxBytes: 100 });

    const remaining = (await readdir(dir)).sort();
    expect(remaining).toEqual(['middle.jpg', 'newest.jpg']);
  });

  it('should do nothing when the total size is within budget', async () => {
    await writeFileWithAge({
      path: join(dir, 'a.jpg'),
      bytes: 40,
      ageMs: 1000,
    });

    await sweepImageCache({ dir, maxBytes: 100 });

    const remaining = (await readdir(dir)).sort();
    expect(remaining).toEqual(['a.jpg']);
  });

  it('should never evict when maxBytes is 0', async () => {
    await writeFileWithAge({
      path: join(dir, 'a.jpg'),
      bytes: 1000,
      ageMs: 5_000_000,
    });

    await sweepImageCache({ dir, maxBytes: 0 });

    const remaining = (await readdir(dir)).sort();
    expect(remaining).toEqual(['a.jpg']);
  });

  it('should remove temp files older than 10 minutes regardless of budget', async () => {
    await writeFileWithAge({
      path: join(dir, 'stale.abc123.tmp'),
      bytes: 10,
      ageMs: 11 * 60 * 1000,
    });
    await writeFileWithAge({
      path: join(dir, 'fresh.def456.tmp'),
      bytes: 10,
      ageMs: 1000,
    });

    await sweepImageCache({ dir, maxBytes: 0 });

    const remaining = (await readdir(dir)).sort();
    expect(remaining).toEqual(['fresh.def456.tmp']);
  });
});
