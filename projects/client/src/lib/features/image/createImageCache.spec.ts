// @vitest-environment node
import { rmSync } from 'node:fs';
import { mkdir, mkdtemp, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { time } from '$lib/utils/timing/time.ts';
import { POSTER_PATH } from '$mocks/data/images/POSTER_PATH.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createImageCache } from './createImageCache.ts';

const bytes = Uint8Array.from(
  { length: 200_000 },
  (_, i) => [0xff, 0xd8, 0xff].at(i) ?? i % 251,
);

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'image-cache-hit-'));
  const target = join(dir, POSTER_PATH);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('createImageCache: hit', () => {
  it('should report a miss when the file is not cached', async () => {
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(
      'movies/000/012/601/posters/thumb/0000000000.jpg.webp',
    );

    expect(entry).toBeUndefined();
  });

  it('should serve every byte when the file is evicted after the hit', async () => {
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(POSTER_PATH);
    // Synchronous, so the file is gone before any of the body is read.
    rmSync(join(dir, POSTER_PATH));
    const served = await new Response(entry?.body).arrayBuffer();

    expect(new Uint8Array(served)).toEqual(bytes);
  });

  it('should report a miss when the cached path is a directory', async () => {
    const directory = 'movies/000/012/601/posters/thumb/1111111111.jpg.webp';
    await mkdir(join(dir, directory), { recursive: true });
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(directory);

    expect(entry).toBeUndefined();
  });

  it('should serve a cached file with its sniffed content type', async () => {
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(POSTER_PATH);
    await entry?.body.cancel();

    expect(entry?.contentType).toBe('image/jpeg');
  });
});

describe('createImageCache: hit refreshes stale entries', () => {
  it('should bump the mtime of an entry older than one day', async () => {
    const stale = new Date(Date.now() - time.days(2));
    await utimes(join(dir, POSTER_PATH), stale, stale);
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(POSTER_PATH);
    await new Response(entry?.body).arrayBuffer();
    const { mtimeMs } = await stat(join(dir, POSTER_PATH));

    expect(Date.now() - mtimeMs).toBeLessThan(time.minutes(1));
  });

  it('should leave the mtime of a fresh entry alone', async () => {
    const recent = new Date(Date.now() - time.hours(1));
    await utimes(join(dir, POSTER_PATH), recent, recent);
    const before = await stat(join(dir, POSTER_PATH));
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const entry = await cache.hit(POSTER_PATH);
    await new Response(entry?.body).arrayBuffer();
    const after = await stat(join(dir, POSTER_PATH));

    expect(after.mtimeMs).toBe(before.mtimeMs);
  });
});

describe('createImageCache: startSweep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should schedule a single sweep interval when called twice', () => {
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    cache.startSweep();
    cache.startSweep();

    expect(vi.getTimerCount()).toBe(1);
  });
});

describe('createImageCache: negative entries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return from markNegative the TTL that negativeHit then reports', () => {
    const cache = createImageCache({ dir, maxBytes: 0, concurrency: 6 });

    const ttlMs = cache.markNegative(POSTER_PATH);

    expect(cache.negativeHit(POSTER_PATH)).toBe(ttlMs);
  });
});
