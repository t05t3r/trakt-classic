import { Buffer } from 'node:buffer';
import {
  type FileHandle,
  mkdir,
  open,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { time } from '$lib/utils/timing/time.ts';

const TOUCH_THRESHOLD_MS = time.days(1);

type DiskImageCacheParams = { dir: string };

type CachedImageFile = {
  readonly header: Uint8Array;
  readonly stream: ReadableStream<Uint8Array>;
  readonly size: number;
};

async function touchIfStale(
  handle: FileHandle,
  mtimeMs: number,
): Promise<void> {
  if (Date.now() - mtimeMs < TOUCH_THRESHOLD_MS) return;

  const now = new Date();
  await handle.utimes(now, now).catch(() => undefined);
}

async function readHeader(
  handle: FileHandle,
  length: number,
): Promise<Uint8Array> {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, 0);
  return buffer.subarray(0, bytesRead);
}

async function readFromHandle(
  handle: FileHandle,
  headerLength: number,
): Promise<CachedImageFile> {
  const { size, mtimeMs } = await handle.stat();
  await touchIfStale(handle, mtimeMs);
  const header = await readHeader(handle, headerLength);

  // The stream owns the handle from here and closes it when it ends or is cancelled.
  const stream = Readable.toWeb(
    handle.createReadStream({ start: 0 }),
  ) as ReadableStream<Uint8Array>;

  return { header, stream, size };
}

export function imageCache({ dir }: DiskImageCacheParams) {
  function resolve(path: string): string {
    return join(dir, path);
  }

  // One handle serves the whole hit, so a sweep evicting the file once it is open cannot break it.
  async function openFile(
    path: string,
    headerLength: number,
  ): Promise<CachedImageFile | undefined> {
    const handle = await open(resolve(path), 'r').catch(() => undefined);
    if (!handle) return undefined;

    return await readFromHandle(handle, headerLength).catch(async () => {
      await handle.close().catch(() => undefined);
      return undefined;
    });
  }

  async function write(path: string, bytes: Uint8Array): Promise<void> {
    const target = resolve(path);
    await mkdir(dirname(target), { recursive: true });

    const tmp = `${target}.${crypto.randomUUID()}.tmp`;
    await writeFile(tmp, bytes);
    await rename(tmp, target);
  }

  return { open: openFile, write };
}
