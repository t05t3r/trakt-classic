import { lookupPendingOverride } from '$test/beds/media-actions/lookupPendingOverride.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
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

  it('should list the keys of one action in flight', () => {
    const key = { action: 'watched', targetKey: 'episode-listed' } as const;
    pendingOverrides.set({ ...key, value: true, requestId: 'listed' });
    pendingOverrides.set({
      action: 'rating',
      targetKey: 'episode-listed',
      value: 8,
      requestId: 'rated',
    });

    expect(pendingOverrides.inFlightOf('watched')).toEqual([key]);
  });

  it('should emit the keys of one action in flight as they change', () => {
    const key = { action: 'watched', targetKey: 'episode-seen' } as const;
    const seen = collectStates(pendingOverrides.inFlightOf$('watched'));

    pendingOverrides.set({ ...key, value: true, requestId: 'seen' });
    pendingOverrides.clear({ ...key, requestId: 'seen' });

    expect(seen).toEqual([[], [key], []]);
  });

  it('should emit each change to a looked-up key', () => {
    const key = { action: 'watched', targetKey: 'episode-live' } as const;
    const seen = collectStates(pendingOverrides.lookup$(key));

    pendingOverrides.set({ ...key, value: true, requestId: 'live' });
    pendingOverrides.set({
      action: 'watched',
      targetKey: 'episode-other',
      value: true,
      requestId: 'other',
    });
    pendingOverrides.clear({ ...key, requestId: 'live' });

    expect(seen.map((override) => override?.value))
      .toEqual([undefined, true, undefined]);
  });

  it('should emit the values of one action as they change', () => {
    pendingOverrides.reset();
    const drop = { action: 'drop', targetKey: 'show-values' } as const;
    const seen = collectStates(pendingOverrides.valuesOf$('drop'));

    pendingOverrides.set({ ...drop, value: true, requestId: 'drop' });
    pendingOverrides.set({ ...drop, value: false, requestId: 'restore' });
    pendingOverrides.clear({ ...drop, requestId: 'restore' });

    expect(seen.map((valueOf) => valueOf('show-values')))
      .toEqual([undefined, true, false, undefined]);
  });

  it('should read a value in flight over a kept one', () => {
    pendingOverrides.reset();
    const hide = { action: 'hide', targetKey: 'movie-values' } as const;
    const seen = collectStates(pendingOverrides.valuesOf$('hide'));

    pendingOverrides.set({ ...hide, value: true, requestId: 'kept' });
    pendingOverrides.keep({ ...hide, requestId: 'kept' });
    pendingOverrides.set({ ...hide, value: false, requestId: 'newer' });
    pendingOverrides.clear({ ...hide, requestId: 'newer' });

    expect(seen.map((valueOf) => valueOf('movie-values')))
      .toEqual([undefined, true, false, true]);
  });

  it('should not emit values for a change to another action', () => {
    pendingOverrides.reset();
    const watched = { action: 'watched', targetKey: 'episode-quiet' } as const;
    const seen = collectStates(pendingOverrides.valuesOf$('drop'));

    pendingOverrides.set({ ...watched, value: true, requestId: 'quiet' });
    pendingOverrides.clear({ ...watched, requestId: 'quiet' });

    expect(seen).toHaveLength(1);
  });

  it('should tell whether a write for any of the keys is in flight', () => {
    const first = { action: 'watched', targetKey: 'episode-first' } as const;
    const second = { action: 'watched', targetKey: 'episode-second' } as const;
    const seen = collectStates(pendingOverrides.isInFlight$([first, second]));

    pendingOverrides.set({ ...second, value: true, requestId: 'second' });
    pendingOverrides.set({ ...first, value: true, requestId: 'first' });
    pendingOverrides.clear({ ...second, requestId: 'second' });
    pendingOverrides.clear({ ...first, requestId: 'first' });

    expect(seen).toEqual([false, true, false]);
  });

  describe('once a write keeps its override', () => {
    const key = { action: 'watchlist', targetKey: 'movie-kept' } as const;

    it('should read the kept value after the write leaves flight', async () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'kept' });

      pendingOverrides.keep({ ...key, requestId: 'kept' });
      pendingOverrides.clear({ ...key, requestId: 'kept' });

      expect(await lookupPendingOverride(key)).toMatchObject({
        value: true,
        requestId: 'kept',
      });
    });

    it('should not keep an override another write holds in flight', async () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'older' });
      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });

      pendingOverrides.keep({ ...key, requestId: 'older' });
      pendingOverrides.clear({ ...key, requestId: 'newer' });

      expect(await lookupPendingOverride(key)).toBeUndefined();
    });

    it('should not count a kept override as in flight', () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'kept' });
      const inFlight = collectStates(pendingOverrides.isInFlight$([key]));

      pendingOverrides.keep({ ...key, requestId: 'kept' });

      expect(inFlight).toEqual([true, false]);
      expect(pendingOverrides.get(key)).toBeUndefined();
      expect(pendingOverrides.isAnyPending('watchlist')).toBe(false);
    });

    it('should not list a kept override as in flight', () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'kept' });
      pendingOverrides.keep({ ...key, requestId: 'kept' });

      expect(pendingOverrides.inFlightOf('watchlist')).toEqual([]);
    });

    it('should read a write in flight over the kept override, and the kept one once it clears', () => {
      const seen = collectStates(pendingOverrides.lookup$(key));
      pendingOverrides.set({ ...key, value: true, requestId: 'kept' });
      pendingOverrides.keep({ ...key, requestId: 'kept' });

      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });
      pendingOverrides.clear({ ...key, requestId: 'newer' });

      expect(seen.map((override) => override?.value))
        .toEqual([undefined, true, false, true]);
    });

    it('should let a later kept override replace the older one', async () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'older' });
      pendingOverrides.keep({ ...key, requestId: 'older' });

      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });
      pendingOverrides.keep({ ...key, requestId: 'newer' });

      expect(await lookupPendingOverride(key)).toMatchObject({
        value: false,
        requestId: 'newer',
      });
    });

    it('should drop the kept override once its wait resolves', async () => {
      const until = Promise.withResolvers<void>();
      pendingOverrides.set({ ...key, value: true, requestId: 'kept' });
      pendingOverrides.keep({
        ...key,
        requestId: 'kept',
        until: until.promise,
      });
      const beforeRead = await lookupPendingOverride(key);

      until.resolve();
      await until.promise;

      expect(beforeRead).toMatchObject({ value: true });
      expect(await lookupPendingOverride(key)).toBeUndefined();
    });

    it('should not drop a later kept override when the older wait resolves', async () => {
      const olderUntil = Promise.withResolvers<void>();
      pendingOverrides.set({ ...key, value: true, requestId: 'older' });
      pendingOverrides.keep({
        ...key,
        requestId: 'older',
        until: olderUntil.promise,
      });
      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });
      pendingOverrides.keep({ ...key, requestId: 'newer' });

      olderUntil.resolve();
      await olderUntil.promise;

      expect(await lookupPendingOverride(key)).toMatchObject({
        value: false,
        requestId: 'newer',
      });
    });

    it('should drop the kept override for the write in flight', async () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'older' });
      pendingOverrides.keep({ ...key, requestId: 'older' });
      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });

      pendingOverrides.dropKept({ ...key, requestId: 'newer' });
      pendingOverrides.clear({ ...key, requestId: 'newer' });

      expect(await lookupPendingOverride(key)).toBeUndefined();
    });

    it('should not drop the kept override for a write no longer in flight', async () => {
      pendingOverrides.set({ ...key, value: true, requestId: 'older' });
      pendingOverrides.set({ ...key, value: false, requestId: 'newer' });
      pendingOverrides.keep({ ...key, requestId: 'newer' });

      pendingOverrides.dropKept({ ...key, requestId: 'older' });

      expect(await lookupPendingOverride(key)).toMatchObject({
        value: false,
        requestId: 'newer',
      });
    });
  });
});
