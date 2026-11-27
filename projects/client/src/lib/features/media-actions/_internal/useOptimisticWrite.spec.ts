import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { RATED_MOVIES_URL } from '$mocks/data/users/RATED_MOVIES_URL.ts';
import { lookupPendingOverride } from '$test/beds/media-actions/lookupPendingOverride.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { currentUserRatingsQuery } from '$lib/features/auth/queries/currentUserRatingsQuery.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { useHasCacheListeners } from '$test/beds/query/useHasCacheListeners.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { screen } from '@testing-library/svelte';
import { http } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type PendingOverride,
  type PendingOverrideKey,
  pendingOverrides,
} from './pendingOverrides.ts';
import {
  type OptimisticWrite,
  useOptimisticWrite,
} from './useOptimisticWrite.ts';

const MOVIE_KEY: PendingOverrideKey = {
  action: 'rating',
  targetKey: 'movie:916302',
};
const SHOW_KEY: PendingOverrideKey = {
  action: 'rating',
  targetKey: 'show:180770',
};
const INVALIDATION = InvalidateAction.Rated('movie');
const RATINGS_KEY = currentUserRatingsQuery().queryKey;
const RATINGS_QUERY_ID = RATINGS_KEY.at(0);

describe('useOptimisticWrite', () => {
  afterEach(() => {
    setNetwork('online');
    vi.useRealTimers();
  });

  it('should hold one override per key while the task runs', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const seen: Array<PendingOverride | undefined> = [];

    await run({
      keys: [MOVIE_KEY, SHOW_KEY],
      value: 7,
      task: async () => {
        seen.push(
          await lookupPendingOverride(MOVIE_KEY),
          await lookupPendingOverride(SHOW_KEY),
        );
      },
      invalidation: INVALIDATION,
    });

    expect(seen).toEqual([
      expect.objectContaining({ value: 7 }),
      expect.objectContaining({ value: 7 }),
    ]);
    expect(seen.at(0)).toHaveProperty('requestId', seen.at(1)?.requestId);
  });

  it('should refuse a write whose value a key already holds pending', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const gate = Promise.withResolvers<void>();
    const tasks: string[] = [];
    const first = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => {
        tasks.push('first');
        return gate.promise;
      },
      invalidation: INVALIDATION,
    });

    const second = await run({
      keys: [SHOW_KEY, MOVIE_KEY],
      value: 7,
      task: () => {
        tasks.push('second');
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
    });
    const showDuring = await lookupPendingOverride(SHOW_KEY);
    gate.resolve();

    expect([await first, second]).toEqual([true, false]);
    expect(tasks).toEqual(['first']);
    expect(showDuring).toBeUndefined();
  });

  it('should let a write with another value supersede one in flight, and post after it', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const firstGate = Promise.withResolvers<void>();
    const secondGate = Promise.withResolvers<void>();
    const tasks: number[] = [];
    const write = (value: number, gate: Promise<void>) =>
      run({
        keys: [MOVIE_KEY],
        value,
        task: () => {
          tasks.push(value);
          return gate;
        },
        invalidation: INVALIDATION,
      });

    const first = write(7, firstGate.promise);
    await vi.waitFor(() => expect(tasks).toEqual([7]));
    const second = write(3, secondGate.promise);
    const whileFirstRuns = await lookupPendingOverride(MOVIE_KEY);
    firstGate.resolve();
    const firstResult = await first;
    const afterFirst = await lookupPendingOverride(MOVIE_KEY);
    secondGate.resolve();

    expect([firstResult, await second]).toEqual([true, true]);
    expect(tasks).toEqual([7, 3]);
    expect([whileFirstRuns?.value, afterFirst?.value]).toEqual([3, 3]);
    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
  });

  it('should not post a write superseded while it waits in the queue, and resolve it false', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const gate = Promise.withResolvers<void>();
    const tasks: number[] = [];
    const write = (value: number, task: () => Promise<void>) =>
      run({
        keys: [MOVIE_KEY],
        value,
        task: () => {
          tasks.push(value);
          return task();
        },
        invalidation: INVALIDATION,
      });

    const inFlight = write(7, () => gate.promise);
    await vi.waitFor(() => expect(tasks).toEqual([7]));
    const superseded = write(3, () => Promise.resolve());
    const last = write(5, () => Promise.resolve());
    const whileQueued = await lookupPendingOverride(MOVIE_KEY);
    gate.resolve();

    expect(await Promise.all([inFlight, superseded, last])).toEqual([
      true,
      false,
      true,
    ]);
    expect(tasks).toEqual([7, 5]);
    expect(whileQueued).toEqual(expect.objectContaining({ value: 5 }));
    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
  });

  it('should trigger no refetch for a write superseded in the queue', async () => {
    const { run, watchlist, ratings } = await renderStore(() => ({
      ...useOptimisticWrite(),
      watchlist: useUser().watchlist,
      ratings: useUser().ratings,
    }));
    await firstValueFrom(watchlist.pipe(filter(Boolean)));
    await firstValueFrom(ratings.pipe(filter(Boolean)));

    const requests = await captureRequests(async () => {
      const superseded = run({
        keys: [MOVIE_KEY],
        value: 3,
        task: () => Promise.resolve(),
        invalidation: InvalidateAction.Watchlisted('movie'),
      });
      const last = run({
        keys: [MOVIE_KEY],
        value: 5,
        task: () => Promise.resolve(),
        invalidation: INVALIDATION,
      });
      await Promise.all([superseded, last]);
    });

    expect(requests.filter((request) => request.includes('/watchlist')))
      .toEqual([]);
    expect(requests).toContain('GET /users/me/ratings/movies');
  });

  it('should not retry a 429 for a write superseded while it waits, and resolve it false', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    vi.useFakeTimers();
    const tasks: number[] = [];
    const first = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: ({ onResponse }) => {
        tasks.push(7);
        onResponse(
          new Response(null, { status: 429, headers: { 'Retry-After': '1' } }),
        );
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
    });
    await vi.advanceTimersByTimeAsync(0);
    const second = run({
      keys: [MOVIE_KEY],
      value: 3,
      task: () => {
        tasks.push(3);
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
    });
    await vi.advanceTimersByTimeAsync(1000);

    expect(await Promise.all([first, second])).toEqual([false, true]);
    expect(tasks).toEqual([7, 3]);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('should post a write with no keys', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const tasks: string[] = [];

    const result = await run({
      keys: [],
      value: true,
      task: () => {
        tasks.push('posted');
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
    });

    expect(result).toBe(true);
    expect(tasks).toEqual(['posted']);
  });

  it('should refuse a write on a pending key when it does not supersede', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const gate = Promise.withResolvers<void>();
    const tasks: string[] = [];
    const first = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => gate.promise,
      invalidation: INVALIDATION,
    });

    const second = await run({
      keys: [SHOW_KEY, MOVIE_KEY],
      value: 3,
      task: () => {
        tasks.push('second');
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
      supersede: false,
    });
    const during = [
      await lookupPendingOverride(MOVIE_KEY),
      await lookupPendingOverride(SHOW_KEY),
    ];
    gate.resolve();

    expect([await first, second]).toEqual([true, false]);
    expect(tasks).toEqual([]);
    expect(during).toEqual([expect.objectContaining({ value: 7 }), undefined]);
  });

  it('should show the error toast of a superseded write that fails, and keep the newer override', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const firstStarted = Promise.withResolvers<void>();
    const firstGate = Promise.withResolvers<void>();
    const secondGate = Promise.withResolvers<void>();
    const first = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => {
        firstStarted.resolve();
        return firstGate.promise;
      },
      invalidation: INVALIDATION,
    });
    await firstStarted.promise;
    const second = run({
      keys: [MOVIE_KEY],
      value: 3,
      task: () => secondGate.promise,
      invalidation: INVALIDATION,
    });

    firstGate.reject(new TypeError('network'));
    const firstResult = await first;
    const toast = await screen.findByText("Couldn't save. Try again.");
    const afterFirst = await lookupPendingOverride(MOVIE_KEY);
    secondGate.resolve();

    expect([firstResult, await second]).toEqual([false, true]);
    expect(toast).toBeVisible();
    expect(afterFirst).toEqual(expect.objectContaining({ value: 3 }));
  });

  it('should clear the override of a superseding write that fails, so the Snapshot shows', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const firstStarted = Promise.withResolvers<void>();
    const gate = Promise.withResolvers<void>();
    const first = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => {
        firstStarted.resolve();
        return gate.promise;
      },
      invalidation: INVALIDATION,
    });
    await firstStarted.promise;
    const second = run({
      keys: [MOVIE_KEY],
      value: 3,
      task: () => Promise.reject(new TypeError('network')),
      invalidation: INVALIDATION,
    });

    gate.resolve();

    expect([await first, await second]).toEqual([true, false]);
    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    expect(await screen.findByText("Couldn't save. Try again.")).toBeVisible();
  });

  it('should take a write on a key once its earlier write settles', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    const write = () =>
      run({
        keys: [MOVIE_KEY],
        value: 7,
        task: () => Promise.resolve(),
        invalidation: INVALIDATION,
      });

    expect([await write(), await write()]).toEqual([true, true]);
  });

  it('should keep its overrides until the snapshot refetch settles', async () => {
    const { run, ratings } = await renderStore(() => ({
      ...useOptimisticWrite(),
      ratings: useUser().ratings,
    }));
    await firstValueFrom(ratings.pipe(filter(Boolean)));
    const { requested, release } = holdRequest({
      method: 'get',
      url: RATED_MOVIES_URL,
    });

    const write = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => Promise.resolve(),
      invalidation: INVALIDATION,
    });
    await requested;

    expect(await lookupPendingOverride(MOVIE_KEY)).toEqual(
      expect.objectContaining({ value: 7 }),
    );

    release();
    await write;

    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
  });

  it('should keep its overrides until a refetch that starts offline lands after reconnect', async () => {
    const { run, ratings, waitForQueryPaused } = await renderStore(() => ({
      ...useOptimisticWrite(),
      ratings: useUser().ratings,
      waitForQueryPaused: useWaitForQueryPaused(),
    }));
    await firstValueFrom(ratings.pipe(filter(Boolean)));
    const refetchPaused = waitForQueryPaused({ queryKey: [RATINGS_QUERY_ID] });
    const events: string[] = [];
    server.use(
      http.get(RATED_MOVIES_URL, () => {
        events.push('refetch');
      }),
    );

    const write = run({
      keys: [MOVIE_KEY],
      value: 7,
      task: () => {
        setNetwork('offline');
        return Promise.resolve();
      },
      invalidation: INVALIDATION,
    }).then((result) => {
      events.push('settled');
      return result;
    });
    await refetchPaused;
    const whileOffline = await settleWithin(write, NEGATIVE_CLAIM_WINDOW);
    const overrideWhileOffline = await lookupPendingOverride(MOVIE_KEY);

    setNetwork('online');
    const result = await write;

    expect(overrideWhileOffline).toEqual(expect.objectContaining({ value: 7 }));
    expect(whileOffline).toBe('pending');
    expect(result).toBe(true);
    expect(events).toEqual(['refetch', 'settled']);
    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
  });

  it('should clear its overrides once the write succeeds', async () => {
    const { run } = await renderStore(useOptimisticWrite);

    await run({
      keys: [MOVIE_KEY],
      value: null,
      task: () => Promise.resolve(),
      invalidation: INVALIDATION,
    });

    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
  });

  it('should clear its overrides and show the error toast when the write fails', async () => {
    const { run } = await renderStore(useOptimisticWrite);

    const result = await run({
      keys: [MOVIE_KEY],
      value: true,
      task: () => Promise.reject(new TypeError('network')),
      invalidation: INVALIDATION,
    });

    expect(result).toBe(false);
    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    expect(await screen.findByText("Couldn't save. Try again.")).toBeVisible();
  });

  it('should roll back without a toast after an expired Session', async () => {
    const { run } = await renderStore(useOptimisticWrite);
    sessionExpired.next();

    await run({
      keys: [MOVIE_KEY],
      value: true,
      task: () => Promise.resolve(),
      invalidation: INVALIDATION,
    });

    expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  describe('with a reader to keep its override until', () => {
    async function renderKeptWrite() {
      const store = await renderStore(() => ({
        ...useOptimisticWrite(),
        ...useInvalidator(),
        waitForQueriesIdle: useWaitForQueriesIdle(),
        hasCacheListeners: useHasCacheListeners(),
        ratings: useUser().ratings,
        watchlist: useUser().watchlist,
      }));
      await firstValueFrom(store.ratings.pipe(filter(Boolean)));
      await firstValueFrom(store.watchlist.pipe(filter(Boolean)));
      const write = (
        value: number,
        { task = () => Promise.resolve(), invalidation = INVALIDATION }: {
          task?: () => Promise<void>;
          invalidation?: OptimisticWrite['invalidation'];
        } = {},
      ) =>
        store.run({
          keys: [MOVIE_KEY],
          value,
          task,
          invalidation,
          keepUntil: [RATINGS_KEY],
        });
      return { ...store, write };
    }

    async function renderKeptA() {
      const store = await renderKeptWrite();
      failOnce(RATED_MOVIES_URL);
      const kept = await store.write(7);
      return { ...store, kept };
    }

    it('should keep its override out of flight after the reader fails its refetch', async () => {
      const { kept } = await renderKeptA();

      expect(kept).toBe(true);
      expect(await lookupPendingOverride(MOVIE_KEY)).toMatchObject({
        value: 7,
      });
      expect(await firstValueFrom(pendingOverrides.isInFlight$([MOVIE_KEY])))
        .toBe(false);
    });

    it('should clear its override once the reader reads in its refetch', async () => {
      const { write } = await renderKeptWrite();

      expect(await write(7)).toBe(true);
      expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    });

    it('should drop the kept override once the reader reads again', async () => {
      const { invalidate } = await renderKeptA();

      await invalidate(INVALIDATION);

      await vi.waitFor(async () =>
        expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined()
      );
    });

    it('should show the kept override again when a later write fails', async () => {
      const { write } = await renderKeptA();
      const posting = Promise.withResolvers<void>();

      const later = write(3, { task: () => posting.promise });
      const whilePosting = await lookupPendingOverride(MOVIE_KEY);
      posting.reject(new TypeError('network'));

      expect(await later).toBe(false);
      expect(whilePosting).toMatchObject({ value: 3 });
      expect(await lookupPendingOverride(MOVIE_KEY)).toMatchObject({
        value: 7,
      });
    });

    it('should drop the kept override when a later write lands and the reader reads', async () => {
      const { write } = await renderKeptA();

      expect(await write(3)).toBe(true);
      expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    });

    it('should keep a later write in place of the kept one when the reader fails again', async () => {
      const { write, invalidate } = await renderKeptA();
      failOnce(RATED_MOVIES_URL);

      expect(await write(3)).toBe(true);
      const kept = await lookupPendingOverride(MOVIE_KEY);
      await invalidate(INVALIDATION);

      expect(kept).toMatchObject({ value: 3 });
      await vi.waitFor(async () =>
        expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined()
      );
    });

    it('should not fall back to the kept override after the reader reads while a later write posts', async () => {
      const { write, invalidate } = await renderKeptA();
      const posting = Promise.withResolvers<void>();
      const started = Promise.withResolvers<void>();

      const later = write(3, {
        task: () => {
          started.resolve();
          return posting.promise;
        },
      });
      await started.promise;
      await invalidate(INVALIDATION);
      const whilePosting = await lookupPendingOverride(MOVIE_KEY);
      posting.reject(new TypeError('network'));

      expect(await later).toBe(false);
      expect(whilePosting).toMatchObject({ value: 3 });
      expect(await lookupPendingOverride(MOVIE_KEY)).toBeUndefined();
    });

    it('should neither keep nor drop for a write superseded after it posted', async () => {
      const { write, waitForQueriesIdle } = await renderKeptWrite();
      const slowRefetch = holdRequest({ method: 'get', url: WATCHLIST_URL });

      const superseded = write(7, {
        invalidation: [INVALIDATION, InvalidateAction.Watchlisted('movie')],
      });
      await slowRefetch.requested;
      await waitForQueriesIdle({ queryKey: RATINGS_KEY });
      failOnce(RATED_MOVIES_URL);
      const last = await write(3);
      slowRefetch.release();

      expect([await superseded, last]).toEqual([true, true]);
      expect(await lookupPendingOverride(MOVIE_KEY)).toMatchObject({
        value: 3,
      });
    });

    it('should leave no wait on the cache for a write with no keys whose reader fails its refetch', async () => {
      const { run, hasCacheListeners } = await renderKeptWrite();
      failOnce(RATED_MOVIES_URL);

      const result = await run({
        keys: [],
        value: 7,
        task: () => Promise.resolve(),
        invalidation: INVALIDATION,
        keepUntil: [RATINGS_KEY],
      });

      expect(result).toBe(true);
      expect(hasCacheListeners()).toBe(false);
    });

    it('should leave no wait on the cache for a write superseded after it posted', async () => {
      const { run, write, hasCacheListeners, waitForQueriesIdle } =
        await renderKeptWrite();
      const slowRefetch = holdRequest({ method: 'get', url: WATCHLIST_URL });
      failOnce(RATED_MOVIES_URL);

      const superseded = write(7, {
        invalidation: [INVALIDATION, InvalidateAction.Watchlisted('movie')],
      });
      await slowRefetch.requested;
      await waitForQueriesIdle({ queryKey: RATINGS_KEY });
      const last = await run({
        keys: [MOVIE_KEY],
        value: 3,
        task: () => Promise.resolve(),
        invalidation: InvalidateAction.Favorited('movie'),
      });
      slowRefetch.release();

      expect([last, await superseded]).toEqual([true, true]);
      expect(hasCacheListeners()).toBe(false);
    });

    it('should post the kept value again', async () => {
      const { write } = await renderKeptA();
      const tasks: string[] = [];

      const again = await write(7, {
        task: () => {
          tasks.push('posted');
          return Promise.resolve();
        },
      });

      expect(again).toBe(true);
      expect(tasks).toEqual(['posted']);
    });
  });

  describe('when it keeps its override until a reload', () => {
    async function writeUntilReload() {
      const { run } = await renderStore(() => ({
        ...useOptimisticWrite(),
        ratings: useUser().ratings,
      }));
      return run({
        keys: [MOVIE_KEY],
        value: true,
        task: () => Promise.resolve(),
        invalidation: INVALIDATION,
        keepUntil: 'session',
      });
    }

    it('should keep its override after a refetch that reads', async () => {
      expect(await writeUntilReload()).toBe(true);
      expect(await lookupPendingOverride(MOVIE_KEY)).toMatchObject({
        value: true,
      });
      expect(await firstValueFrom(pendingOverrides.isInFlight$([MOVIE_KEY])))
        .toBe(false);
    });

    it('should keep its override after a refetch that fails', async () => {
      failOnce(RATED_MOVIES_URL);

      expect(await writeUntilReload()).toBe(true);
      expect(await lookupPendingOverride(MOVIE_KEY)).toMatchObject({
        value: true,
      });
    });
  });
});
