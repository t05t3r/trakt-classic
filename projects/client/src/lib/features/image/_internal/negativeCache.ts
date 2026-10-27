import { time } from '$lib/utils/timing/time.ts';

const NEGATIVE_TTL_MS = time.hours(1);
const MAX_ENTRIES = 10_000;

export function negativeCache() {
  const expiresAt = new Map<string, number>();

  function remainingTtlMs(path: string): number | undefined {
    const expiry = expiresAt.get(path);
    if (expiry === undefined) return undefined;

    const remaining = expiry - Date.now();
    if (remaining > 0) return remaining;

    expiresAt.delete(path);
    return undefined;
  }

  function evictOldestWhenFull(path: string): void {
    if (expiresAt.has(path)) return;
    if (expiresAt.size < MAX_ENTRIES) return;

    const oldestPath = expiresAt.keys().next().value;
    if (oldestPath !== undefined) expiresAt.delete(oldestPath);
  }

  function set(path: string): number {
    evictOldestWhenFull(path);
    expiresAt.set(path, Date.now() + NEGATIVE_TTL_MS);
    return NEGATIVE_TTL_MS;
  }

  return { remainingTtlMs, set };
}
