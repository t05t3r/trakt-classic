import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { lookupPendingOverride } from '$test/beds/media-actions/lookupPendingOverride.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { currentUserRatingsQuery } from '$lib/features/auth/queries/currentUserRatingsQuery.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { screen } from '@testing-library/svelte';
import { http } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  PendingOverride,
  PendingOverrideKey,
} from './pendingOverrides.ts';
import { useOptimisticWrite } from './useOptimisticWrite.ts';

const MOVIE_KEY: PendingOverrideKey = {
  action: 'rating',
  targetKey: 'movie:916302',
};
const SHOW_KEY: PendingOverrideKey = {
  action: 'rating',
  targetKey: 'show:180770',
};
const INVALIDATION = InvalidateAction.Rated('movie');
const RATINGS_QUERY_ID = currentUserRatingsQuery().queryKey.at(0);

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
      url: 'http://localhost/users/me/ratings/movies',
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
      http.get('http://localhost/users/me/ratings/movies', () => {
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
});
