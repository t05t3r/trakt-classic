import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { pendingOverrides } from './pendingOverrides.ts';
import { withPendingOverride } from './withPendingOverride.ts';

const KEY = { action: 'watchlist', targetKey: 'show-1' } as const;
const RATING_KEY = { action: 'rating', targetKey: 'movie-1' } as const;

const readListed = () =>
  withPendingOverride({
    key: KEY,
    snapshot: valueObservable<ReadonlySet<string> | undefined>(new Set()),
    fromSnapshot: (listed) => listed?.has(KEY.targetKey),
  });

const readRating = () =>
  withPendingOverride({
    key: RATING_KEY,
    snapshot: valueObservable(6),
    fromSnapshot: (rating): number | null => rating,
    fromOverride: (value) => typeof value === 'number' ? value : null,
  });

describe('withPendingOverride', () => {
  it('should read the snapshot, as not updating, with no override', async () => {
    const { value, isUpdating } = readListed();

    expect(await firstValueFrom(value)).toBe(false);
    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it('should read a write in flight over the snapshot, as updating', async () => {
    pendingOverrides.set({ ...KEY, value: true, requestId: 'request' });
    const { value, isUpdating } = readListed();

    expect(await firstValueFrom(value)).toBe(true);
    expect(await firstValueFrom(isUpdating)).toBe(true);
  });

  it('should read a kept override over the snapshot, as not updating', async () => {
    pendingOverrides.set({ ...KEY, value: true, requestId: 'request' });
    pendingOverrides.keep({ ...KEY, requestId: 'request' });
    const { value, isUpdating } = readListed();

    expect(await firstValueFrom(value)).toBe(true);
    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it("should read an override through the caller's own reading", async () => {
    pendingOverrides.set({ ...RATING_KEY, value: null, requestId: 'request' });
    const { value } = readRating();

    expect(await firstValueFrom(value)).toBeNull();
  });

  it('should read the snapshot through its reading once the override clears', async () => {
    pendingOverrides.set({ ...RATING_KEY, value: 9, requestId: 'request' });
    const { value } = readRating();
    const whilePending = await firstValueFrom(value);
    pendingOverrides.clear({ ...RATING_KEY, requestId: 'request' });

    expect(whilePending).toBe(9);
    expect(await firstValueFrom(value)).toBe(6);
  });
});
