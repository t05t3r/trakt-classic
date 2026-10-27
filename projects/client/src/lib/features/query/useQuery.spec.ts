import { currentUserWatchedShowsQuery } from '$lib/features/auth/queries/currentUserWatchedShowsQuery.ts';
import { setToken } from '$lib/features/auth/token.ts';
import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { time } from '$lib/utils/timing/time.ts';
import { RefreshResponseMock } from '$mocks/data/auth/response/RefreshResponseMock.ts';
import { WatchedShowsMinimalResponseMock } from '$mocks/data/users/response/WatchedShowsMinimalResponseMock.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { ageLoadedData } from '$test/beds/query/ageLoadedData.ts';
import { PAST_INVALIDATION_AGE } from '$test/beds/query/PAST_INVALIDATION_AGE.ts';
import { runStaleTimers } from '$test/beds/query/runStaleTimers.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { QueryObserverResult } from '@tanstack/query-core';
import { delay, http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { z } from 'zod';
import { useQueryClient } from './_internal/queryClientContext.ts';
import { useInvalidator } from './useInvalidator.ts';
import { useQuery } from './useQuery.ts';
import { useSnapshot } from './useSnapshot.ts';

// Every client keeps gcTime infinite, as on a server, so no gc timer outlives
// a test that runs query-core as in a browser.
vi.mock(
  import('$lib/features/query/createQueryClient.ts'),
  async (importOriginal) => {
    const { createQueryClient } = await importOriginal();

    return {
      createQueryClient: (props) => {
        const client = createQueryClient(props);
        const defaults = client.getDefaultOptions();
        client.setDefaultOptions({
          ...defaults,
          queries: { ...defaults.queries, gcTime: Infinity },
        });

        return client;
      },
    };
  },
);

const ACTION = InvalidateAction.Rated('movie');
const RESPONSE_DELAY = 20;
const STALE_TIMER_TTL = 50;

// The hook invalidates each query id once per module, so every test has its own key.
const probeQuery = (key: string, ttl: number | null) =>
  defineQuery({
    key,
    invalidations: [ACTION],
    dependencies: [],
    request: async ({ fetch }: ApiParams) => {
      const response = await rawApiFetch({ fetch, path: `/probe/${key}` });
      return { status: response.status, body: await response.json() };
    },
    mapper: (response: { body: string }) => response.body,
    schema: z.string(),
    ttl,
  });

type Timeline = {
  events: string[];
  inFlight: number;
};

// Logs each request's start, with the count then in flight, and its end.
function logRequest(timeline: Timeline, label: string) {
  timeline.inFlight += 1;
  timeline.events.push(`${label} start (${timeline.inFlight} in flight)`);

  return async () => {
    await delay(RESPONSE_DELAY);
    timeline.inFlight -= 1;
    timeline.events.push(`${label} end`);
  };
}

function serveProbe(key: string): Timeline {
  const timeline: Timeline = { events: [], inFlight: 0 };
  server.use(
    http.get(`http://localhost/probe/${key}`, async () => {
      await logRequest(timeline, 'GET')();
      return HttpResponse.json(key);
    }),
  );

  return timeline;
}

function serveTwoShowsPages(): Timeline {
  const timeline: Timeline = { events: [], inFlight: 0 };
  server.use(
    http.get(WATCHED_SHOWS_URL, async ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      await logRequest(timeline, `GET page=${page}`)();

      return page === 1
        ? pagedResponse({ body: WatchedShowsMinimalResponseMock, pageCount: 2 })
        : pagedResponse({ body: {}, page: 2, pageCount: 2 });
    }),
  );

  return timeline;
}

function isRefreshedSince(since: number) {
  return (result: QueryObserverResult<string>) =>
    result.dataUpdatedAt >= since && !result.isFetching;
}

type ProbeProps = {
  key: string;
  ttl: number | null;
  hasStaleTimers?: boolean;
};

async function renderProbe(
  { key, ttl, hasStaleTimers = false }: ProbeProps,
) {
  const options = probeQuery(key, ttl)();
  if (hasStaleTimers) runStaleTimers();
  const store = await renderStore(() => ({
    ...useInvalidator(),
    client: useQueryClient(),
    query: useQuery(options),
    // A second observer of the same query; none exists until a spec subscribes it.
    mounted: useQuery(options),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  const subscription = store.query.subscribe();
  onTestFinished(() => subscription.unsubscribe());
  await firstValueFrom(store.query.pipe(filter((result) => result.isSuccess)));

  return { ...store, queryKey: options.queryKey };
}

describe('store: useQuery', () => {
  afterEach(() => {
    setToken(null);
  });

  describe('one write on observed data 31 s old', () => {
    it('should send one request for a fresh query', async () => {
      const key = 'probeFresh';
      const timeline = serveProbe(key);
      const { invalidate, waitForLateRequests } = await renderProbe({
        key,
        ttl: time.hours(1),
      });
      timeline.events.splice(0);
      ageLoadedData();

      await invalidate(ACTION);
      timeline.events.push('write settled');
      await waitForLateRequests();

      expect(timeline.events).toEqual([
        'GET start (1 in flight)',
        'GET end',
        'write settled',
      ]);
    });

    it('should send one request and none after the write settles for a query already stale', async () => {
      const key = 'probeStale';
      const timeline = serveProbe(key);
      const { invalidate, waitForLateRequests } = await renderProbe({
        key,
        ttl: null,
      });
      timeline.events.splice(0);
      ageLoadedData();

      await invalidate(ACTION);
      timeline.events.push('write settled');
      await waitForLateRequests();

      expect(timeline.events).toEqual([
        'GET start (1 in flight)',
        'GET end',
        'write settled',
      ]);
    });

    it('should request each page of a two-page Snapshot once', async () => {
      const timeline = serveTwoShowsPages();
      const { invalidate, shows, waitForLateRequests } = await renderStore(
        () => ({
          ...useInvalidator(),
          shows: useSnapshot(currentUserWatchedShowsQuery({ limit: 1000 }), {
            select: (entries) => entries.length,
            whileUnsettled: 'unknown',
          }),
          waitForLateRequests: useWaitForLateRequests(),
        }),
      );
      const subscription = shows.subscribe();
      onTestFinished(() => subscription.unsubscribe());
      await readKnown(shows);
      timeline.events.splice(0);
      ageLoadedData();

      await invalidate(InvalidateAction.MarkAsWatched('episode'));
      timeline.events.push('write settled');
      await waitForLateRequests();

      expect(timeline.events).toEqual([
        'GET page=1 start (1 in flight)',
        'GET page=1 end',
        'GET page=2 start (1 in flight)',
        'GET page=2 end',
        'write settled',
      ]);
    });

    it('should renew the Session once when the request of the write meets a 401', async () => {
      const key = 'probeRefresh';
      serveProbe(key);
      const { invalidate, waitForLateRequests } = await renderProbe({
        key,
        ttl: time.hours(1),
      });
      const answered: string[] = [];
      setToken({ value: 'rejected' });
      server.use(
        http.get(`http://localhost/probe/${key}`, async ({ request }) => {
          await delay(RESPONSE_DELAY);
          const isRejected =
            request.headers.get('Authorization') === 'Bearer rejected';
          answered.push(isRejected ? 'GET 401' : 'GET 200');
          return isRejected
            ? new HttpResponse(null, { status: 401 })
            : HttpResponse.json(key);
        }),
        http.post('*/auth/refresh', async () => {
          await delay(RESPONSE_DELAY);
          answered.push('POST /auth/refresh');
          return HttpResponse.json(RefreshResponseMock);
        }),
      );
      ageLoadedData();

      const requests = await captureRequests(async () => {
        await invalidate(ACTION);
        await waitForLateRequests();
      });

      expect(requests).toEqual([
        `GET /probe/${key}`,
        'POST /auth/refresh',
        `GET /probe/${key}`,
      ]);
      expect(answered).toEqual([
        'GET 401',
        'POST /auth/refresh',
        'GET 200',
      ]);
    });
  });
  describe('its own refresh of observed data 31 s old', () => {
    it('should refetch once when the stale timer fires, and not again later in the session', async () => {
      const key = 'probeOwnOnce';
      const timeline = serveProbe(key);
      const { query, waitForLateRequests } = await renderProbe({
        key,
        ttl: STALE_TIMER_TTL,
        hasStaleTimers: true,
      });
      timeline.events.splice(0);
      ageLoadedData();
      const agedAt = Date.now();

      await firstValueFrom(query.pipe(filter(isRefreshedSince(agedAt))));
      vi.setSystemTime(Date.now() + PAST_INVALIDATION_AGE);
      await firstValueFrom(query.pipe(filter((result) => result.isStale)));
      await waitForLateRequests();

      expect(timeline.events).toEqual(['GET start (1 in flight)', 'GET end']);
    });

    it('should read the query fetching while the refetch the stale timer starts is held', async () => {
      const key = 'probeOwnHeld';
      serveProbe(key);
      const { query } = await renderProbe({
        key,
        ttl: STALE_TIMER_TTL,
        hasStaleTimers: true,
      });
      const held = holdRequest({
        method: 'get',
        url: `http://localhost/probe/${key}`,
        answer: () => HttpResponse.json(key),
      });
      ageLoadedData();

      await held.requested;

      expect((await firstValueFrom(query)).fetchStatus).toBe('fetching');
    });

    it('should join a refetch already running, and not refetch later in the session', async () => {
      const key = 'probeOwnMidFetch';
      const timeline = serveProbe(key);
      const { query, waitForLateRequests } = await renderProbe({
        key,
        ttl: STALE_TIMER_TTL,
        hasStaleTimers: true,
      });
      timeline.events.splice(0);
      ageLoadedData();
      const agedAt = Date.now();

      setNetwork('offline');
      setNetwork('online');
      await firstValueFrom(query.pipe(filter(isRefreshedSince(agedAt))));
      vi.setSystemTime(Date.now() + PAST_INVALIDATION_AGE);
      await firstValueFrom(query.pipe(filter((result) => result.isStale)));
      await waitForLateRequests();

      expect(timeline.events).toEqual(['GET start (1 in flight)', 'GET end']);
    });

    it('should refetch once a query that was invalidated without a refetch', async () => {
      const key = 'probeOwnIdleInvalidated';
      const timeline = serveProbe(key);
      const { client, queryKey, waitForLateRequests } = await renderProbe({
        key,
        ttl: time.hours(1),
      });
      timeline.events.splice(0);
      ageLoadedData();

      await client.invalidateQueries({
        queryKey,
        refetchType: 'none',
      });
      await waitForLateRequests();

      expect(timeline.events).toEqual(['GET start (1 in flight)', 'GET end']);
    });
  });

  describe('a mount on data 31 s old', () => {
    it('should send one request when a second subscriber mounts a stale query', async () => {
      const key = 'probeMount';
      const timeline = serveProbe(key);
      const { mounted, waitForLateRequests } = await renderProbe({
        key,
        ttl: null,
      });
      timeline.events.splice(0);
      ageLoadedData();
      const agedAt = Date.now();

      const mount = mounted.subscribe();
      onTestFinished(() => mount.unsubscribe());
      await firstValueFrom(mounted.pipe(filter(isRefreshedSince(agedAt))));
      await waitForLateRequests();

      expect(timeline.events).toEqual(['GET start (1 in flight)', 'GET end']);
    });
  });
});
