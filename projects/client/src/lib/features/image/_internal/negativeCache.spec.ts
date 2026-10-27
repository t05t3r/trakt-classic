import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { negativeCache } from './negativeCache.ts';

describe('negativeCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should report a remaining TTL that counts down from the TTL it stamped', () => {
    const cache = negativeCache();
    const ttlMs = cache.set('a');

    vi.advanceTimersByTime(1000);

    expect(cache.remainingTtlMs('a')).toBe(ttlMs - 1000);
  });

  it('should return the TTL it stamped, matching the remaining TTL at that instant', () => {
    const cache = negativeCache();

    const ttlMs = cache.set('a');

    expect(ttlMs).toBe(cache.remainingTtlMs('a'));
  });

  it('should report no entry for a path that was never marked', () => {
    const cache = negativeCache();

    expect(cache.remainingTtlMs('never-set')).toBeUndefined();
  });

  it('should report no entry once a negative entry has expired', () => {
    const cache = negativeCache();
    const ttlMs = cache.set('a');

    vi.advanceTimersByTime(ttlMs);

    expect(cache.remainingTtlMs('a')).toBeUndefined();
  });

  it('should drop the oldest entry once the cap of 10,000 is reached', () => {
    const cache = negativeCache();

    Array.from({ length: 10_000 }, (_, i) => cache.set(`path-${i}`));
    const ttlMs = cache.set('path-10000');

    expect(cache.remainingTtlMs('path-0')).toBeUndefined();
    expect(cache.remainingTtlMs('path-10000')).toBe(ttlMs);
  });
});
