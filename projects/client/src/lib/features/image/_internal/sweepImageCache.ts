import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { time } from '$lib/utils/timing/time.ts';

const TEMP_FILE_MAX_AGE_MS = time.minutes(10);
const EVICT_TARGET_RATIO = 0.9;

type FileInfo = { path: string; size: number; mtimeMs: number };

async function collectFiles(dir: string): Promise<ReadonlyArray<FileInfo>> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);

    const info = await stat(fullPath).catch(() => undefined);
    return info
      ? [{ path: fullPath, size: info.size, mtimeMs: info.mtimeMs }]
      : [];
  }));

  return nested.flat();
}

function isTempFile(file: FileInfo): boolean {
  return file.path.endsWith('.tmp');
}

async function removeStaleTempFiles(
  files: ReadonlyArray<FileInfo>,
): Promise<void> {
  const cutoff = Date.now() - TEMP_FILE_MAX_AGE_MS;
  const stale = files.filter((file) =>
    isTempFile(file) && file.mtimeMs < cutoff
  );

  await Promise.all(stale.map((file) => rm(file.path).catch(() => undefined)));
}

type FilesToEvictParams = {
  oldestFirst: ReadonlyArray<FileInfo>;
  totalBytes: number;
  targetBytes: number;
};

function filesToEvict(
  { oldestFirst, totalBytes, targetBytes }: FilesToEvictParams,
): ReadonlyArray<FileInfo> {
  return oldestFirst.reduce(
    (state, file) =>
      state.bytesLeft <= targetBytes ? state : {
        bytesLeft: state.bytesLeft - file.size,
        toEvict: [...state.toEvict, file],
      },
    { bytesLeft: totalBytes, toEvict: [] as ReadonlyArray<FileInfo> },
  ).toEvict;
}

type SweepImageCacheParams = { dir: string; maxBytes: number };

export async function sweepImageCache(
  { dir, maxBytes }: SweepImageCacheParams,
): Promise<void> {
  const files = await collectFiles(dir);
  await removeStaleTempFiles(files);

  if (maxBytes <= 0) return;

  const cached = files.filter((file) => !isTempFile(file));
  const totalBytes = cached.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes <= maxBytes) return;

  const oldestFirst = [...cached].sort((a, b) => a.mtimeMs - b.mtimeMs);
  const toEvict = filesToEvict({
    oldestFirst,
    totalBytes,
    targetBytes: maxBytes * EVICT_TARGET_RATIO,
  });

  await Promise.all(
    toEvict.map((file) => rm(file.path).catch(() => undefined)),
  );
}
