import { time } from '$lib/utils/timing/time.ts';
import { imageCache } from './_internal/imageCache.ts';
import { negativeCache } from './_internal/negativeCache.ts';
import { sniffImageType } from './_internal/sniffImageType.ts';
import { sweepImageCache } from './_internal/sweepImageCache.ts';

const HEADER_SNIFF_LENGTH = 12;
const SWEEP_INTERVAL_MS = time.hours(1);

type CreateImageCacheParams = {
  dir: string;
  maxBytes: number;
  concurrency: number;
};

function createConcurrencyLimiter(concurrency: number) {
  const queue: Array<() => void> = [];
  let active = 0;

  function acquire(): Promise<void> {
    if (active < concurrency) {
      active += 1;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => queue.push(resolve)).then(() => {
      active += 1;
    });
  }

  function release(): void {
    active -= 1;
    queue.shift()?.();
  }

  return { acquire, release };
}

export function createImageCache(
  { dir, maxBytes, concurrency }: CreateImageCacheParams,
) {
  const disk = imageCache({ dir });
  const negative = negativeCache();
  const limiter = createConcurrencyLimiter(concurrency);
  const inFlight = new Map<string, Promise<unknown>>();
  let sweepTimer: ReturnType<typeof setInterval> | undefined;

  async function hit(path: string) {
    const file = await disk.open(path, HEADER_SNIFF_LENGTH);
    if (!file) return undefined;

    return {
      body: file.stream,
      contentType: sniffImageType({ bytes: file.header, path }),
      contentLength: file.size,
    };
  }

  function write(path: string, bytes: Uint8Array): Promise<void> {
    return disk.write(path, bytes);
  }

  function negativeHit(path: string): number | undefined {
    return negative.remainingTtlMs(path);
  }

  function markNegative(path: string): number {
    return negative.set(path);
  }

  function coalesce<T>(path: string, run: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(path) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = (async () => {
      await limiter.acquire();
      try {
        return await run();
      } finally {
        limiter.release();
      }
    })().finally(() => inFlight.delete(path));

    inFlight.set(path, promise);
    return promise;
  }

  // A second startSweep on the same cache must not stack another interval.
  function startSweep(): void {
    if (sweepTimer) return;

    const run = () => sweepImageCache({ dir, maxBytes }).catch(() => undefined);
    run();
    sweepTimer = setInterval(run, SWEEP_INTERVAL_MS);
    sweepTimer.unref();
  }

  return { hit, write, negativeHit, markNegative, coalesce, startSweep };
}
