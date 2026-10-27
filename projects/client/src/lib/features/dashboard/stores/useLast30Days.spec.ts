import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { server } from '$mocks/server.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { activityHistoryQuery } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { setNetwork } from '$test/beds/network/setNetwork.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { useWaitForQueryPaused } from '$test/beds/query/useWaitForQueryPaused.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLast30Days } from './useLast30Days.ts';

const HISTORY_QUERY_ID = activityHistoryQuery({ slug: 'me', limit: 1 })
  .queryKey.at(0);

function serveHistory(
  answer: () => Response = () =>
    pagedResponse({ body: ActivityHistoryResponseMock }),
) {
  const searches: URLSearchParams[] = [];
  server.use(
    http.get(HISTORY_URL, ({ request }) => {
      searches.push(new URL(request.url).searchParams);
      return answer();
    }),
  );

  return searches;
}

function readLast30Days() {
  return renderStore(() => ({
    ...useInvalidator(),
    waitForQueriesIdle: useWaitForQueriesIdle(),
    waitForQueryPaused: useWaitForQueryPaused(),
    status: useLast30Days(),
  }));
}

describe('store: useLast30Days', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-02-01T12:00:00.000Z'));
  });

  afterEach(() => {
    setNetwork('online');
    vi.useRealTimers();
  });

  it("should read the window's history as ready", async () => {
    const { status } = await readLast30Days();

    const ready = await nextOf(status, 'ready');

    expect(ready.data.days).toHaveLength(30);
    expect(ready.data.days.at(0)?.date)
      .toEqual(new Date('2025-01-03T00:00:00.000Z'));
    expect(ready.data.days.at(28)).toEqual({
      key: '2025-01-31',
      date: new Date('2025-01-31T00:00:00.000Z'),
      minutes: 171,
      episodes: { distinct: 1, plays: 1 },
      movies: { distinct: 1, plays: 1 },
    });
    expect(ready.data.totals).toEqual({
      minutes: 171,
      episodes: { distinct: 1, plays: 1 },
      movies: { distinct: 1, plays: 1 },
    });
    expect(ready.data.genres.map(({ slug, share }) => ({ slug, share })))
      .toEqual([
        { slug: 'drama', share: 0.25 },
        { slug: 'horror', share: 0.25 },
        { slug: 'science-fiction', share: 0.25 },
        { slug: 'thriller', share: 0.25 },
      ]);
  });

  it('should carry the clock read that set the window', async () => {
    const { status } = await readLast30Days();

    const ready = await nextOf(status, 'ready');

    expect(ready.data.now).toEqual(new Date('2025-02-01T12:00:00.000Z'));
  });

  it("should request every play from 29 days before today's local midnight", async () => {
    const searches = serveHistory();
    const { status } = await readLast30Days();

    await nextOf(status, 'ready');

    expect(searches.map((search) => ({
      startAt: search.get('start_at'),
      endAt: search.get('end_at'),
      limit: search.get('limit'),
    }))).toEqual([
      {
        startAt: '2025-01-03T00:00:00.000Z',
        endAt: null,
        limit: String(MAX_PAGE_LIMIT),
      },
    ]);
  });

  it('should start the window at the local midnight east of UTC', async () => {
    setTimeZone('Asia/Tokyo');
    vi.setSystemTime(new Date('2025-02-01T20:00:00.000Z'));
    const searches = serveHistory();
    const { status } = await readLast30Days();

    const ready = await nextOf(status, 'ready');

    expect(searches.map((search) => search.get('start_at')))
      .toEqual(['2025-01-03T15:00:00.000Z']);
    expect(ready.data.days.at(0)?.date)
      .toEqual(new Date('2025-01-03T15:00:00.000Z'));
  });

  it('should read empty when the window holds no play', async () => {
    serveHistory(() => pagedResponse({ body: [] }));
    const { status } = await readLast30Days();
    const kinds = kindsOf(status);

    await nextOf(status, 'empty');

    expect(kinds).toEqual(['loading', 'empty']);
  });

  it("should read empty when the window's plays sum to no minutes", async () => {
    serveHistory(() =>
      pagedResponse({
        body: [{
          id: 1,
          watched_at: '2025-01-31T23:12:41.000Z',
          action: 'watch',
          type: 'movie',
          movie: { ...MovieHereticResponseMock, runtime: 0 },
        }],
      })
    );
    const { status } = await readLast30Days();
    const kinds = kindsOf(status);

    await nextOf(status, 'empty');

    expect(kinds).toEqual(['loading', 'empty']);
  });

  it('should read error when the history fails, then ready once a retry lands', async () => {
    serveHistory(notFound);
    const { status } = await readLast30Days();
    const kinds = kindsOf(status);
    const failed = await nextOf(status, 'error');

    serveHistory();
    failed.retry();
    await nextOf(status, 'ready');

    expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
  });

  it('should read loading while the first load waits offline', async () => {
    const { status, waitForQueryPaused } = await readLast30Days();
    setNetwork('offline');
    const paused = waitForQueryPaused({ queryKey: [HISTORY_QUERY_ID] });
    const kinds = kindsOf(status);

    await paused;

    expect(kinds).toEqual(['loading']);
  });

  it('should keep reading ready while a watch refetches the history', async () => {
    const searches = serveHistory();
    const { invalidate, waitForQueriesIdle, status } = await readLast30Days();
    const kinds = kindsOf(status);
    await nextOf(status, 'ready');

    await invalidate(InvalidateAction.MarkAsWatched('movie'));
    await waitForQueriesIdle({ queryKey: [HISTORY_QUERY_ID] });

    expect(searches).toHaveLength(2);
    expect(kinds).toEqual(['loading', 'ready']);
  });
});
