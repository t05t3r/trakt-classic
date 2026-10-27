import { lookupPendingOverride } from '$test/beds/media-actions/lookupPendingOverride.ts';
import { describe, expect, it } from 'vitest';
import { type PendingOverride, pendingOverrides } from './pendingOverrides.ts';

describe('pendingOverrides', () => {
  it('should emit undefined for a key with no override', async () => {
    expect(
      await lookupPendingOverride({
        action: 'watched',
        targetKey: 'movie-none',
      }),
    )
      .toBeUndefined();
  });

  it('should emit the override set for a key', async () => {
    const override: PendingOverride = {
      action: 'watchlist',
      targetKey: 'movie-set',
      value: true,
      requestId: 'request-1',
    };

    pendingOverrides.set(override);

    expect(
      await lookupPendingOverride({
        action: 'watchlist',
        targetKey: 'movie-set',
      }),
    )
      .toEqual(override);
  });

  it('should let the newer override for a key replace the older one', async () => {
    const key = { action: 'rating', targetKey: 'movie-newer' } as const;

    pendingOverrides.set({ ...key, value: 6, requestId: 'older' });
    pendingOverrides.set({ ...key, value: 9, requestId: 'newer' });

    expect(await lookupPendingOverride(key)).toMatchObject({
      value: 9,
      requestId: 'newer',
    });
  });

  it('should keep overrides for different lists apart', async () => {
    const key = { action: 'list', targetKey: 'show-lists' } as const;

    pendingOverrides.set({ ...key, listId: 1, value: true, requestId: 'a' });
    pendingOverrides.set({ ...key, listId: 2, value: false, requestId: 'b' });

    expect(await lookupPendingOverride({ ...key, listId: 1 })).toMatchObject({
      value: true,
    });
    expect(await lookupPendingOverride({ ...key, listId: 2 })).toMatchObject({
      value: false,
    });
    expect(await lookupPendingOverride(key)).toBeUndefined();
  });

  it('should clear an override for the request that wrote it', async () => {
    const key = { action: 'favorite', targetKey: 'movie-clear' } as const;
    pendingOverrides.set({ ...key, value: true, requestId: 'owner' });

    pendingOverrides.clear({ ...key, requestId: 'owner' });

    expect(await lookupPendingOverride(key)).toBeUndefined();
  });

  it('should keep a newer override when an older request clears', async () => {
    const key = { action: 'drop', targetKey: 'show-stale' } as const;
    pendingOverrides.set({ ...key, value: true, requestId: 'older' });
    pendingOverrides.set({ ...key, value: false, requestId: 'newer' });

    pendingOverrides.clear({ ...key, requestId: 'older' });

    expect(await lookupPendingOverride(key)).toMatchObject({
      value: false,
      requestId: 'newer',
    });
  });

  it('should get the override held for a key', () => {
    const key = { action: 'list', targetKey: 'movie-get', listId: 3 } as const;

    const before = pendingOverrides.get(key);
    pendingOverrides.set({ ...key, value: true, requestId: 'get' });
    const during = pendingOverrides.get(key);
    const otherList = pendingOverrides.get({ ...key, listId: 4 });
    pendingOverrides.clear({ ...key, requestId: 'get' });

    expect([before, during?.value, otherList, pendingOverrides.get(key)])
      .toEqual([undefined, true, undefined, undefined]);
  });

  it('should tell whether any override is pending for an action', () => {
    pendingOverrides.reset();
    const key = { action: 'watched', targetKey: 'episode-any' } as const;

    const before = pendingOverrides.isAnyPending('watched');
    pendingOverrides.set({ ...key, value: true, requestId: 'any' });
    const during = pendingOverrides.isAnyPending('watched');
    const otherAction = pendingOverrides.isAnyPending('rating');
    pendingOverrides.clear({ ...key, requestId: 'any' });

    expect([
      before,
      during,
      otherAction,
      pendingOverrides.isAnyPending('watched'),
    ])
      .toEqual([false, true, false, false]);
  });

  it('should emit each change to a looked-up key', () => {
    const key = { action: 'watched', targetKey: 'episode-live' } as const;
    const seen: Array<boolean | number | null | undefined> = [];
    const subscription = pendingOverrides.lookup$(key).subscribe((override) =>
      seen.push(override?.value)
    );

    pendingOverrides.set({ ...key, value: true, requestId: 'live' });
    pendingOverrides.set({
      action: 'watched',
      targetKey: 'episode-other',
      value: true,
      requestId: 'other',
    });
    pendingOverrides.clear({ ...key, requestId: 'live' });
    subscription.unsubscribe();

    expect(seen).toEqual([undefined, true, undefined]);
  });

  it('should emit the overrides of one action as they change', () => {
    pendingOverrides.reset();
    const drop = { action: 'drop', targetKey: 'show-by-action' } as const;
    const seen: Array<ReadonlyArray<string>> = [];
    const subscription = pendingOverrides.byAction$('drop').subscribe(
      (overrides) =>
        seen.push(
          overrides.map(({ targetKey, value }) => `${targetKey}=${value}`),
        ),
    );

    pendingOverrides.set({ ...drop, value: true, requestId: 'drop' });
    pendingOverrides.set({ ...drop, value: false, requestId: 'restore' });
    pendingOverrides.clear({ ...drop, requestId: 'restore' });
    subscription.unsubscribe();

    expect(seen).toEqual([
      [],
      ['show-by-action=true'],
      ['show-by-action=false'],
      [],
    ]);
  });

  it('should not emit for a change to another action', () => {
    pendingOverrides.reset();
    const watched = { action: 'watched', targetKey: 'episode-quiet' } as const;
    const seen: Array<ReadonlyArray<unknown>> = [];
    const subscription = pendingOverrides.byAction$('drop').subscribe(
      (overrides) => seen.push(overrides),
    );

    pendingOverrides.set({ ...watched, value: true, requestId: 'quiet' });
    pendingOverrides.clear({ ...watched, requestId: 'quiet' });
    subscription.unsubscribe();

    expect(seen).toEqual([[]]);
  });
});
