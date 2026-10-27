import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { time } from '$lib/utils/timing/time.ts';
import { UpNextMappedMock } from '$mocks/data/sync/mapped/UpNextMappedMock.ts';
import { UpNextResponseMock } from '$mocks/data/sync/response/UpNextResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { UP_NEXT_URL } from '$mocks/data/sync/UP_NEXT_URL.ts';
import { serveUpNext } from '$test/beds/dashboard/serveUpNext.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import type { UpNextResponse } from '@trakt/api';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { upNextQuery } from './upNextQuery.ts';

// Devs, one episode in; its next episode runs 60 minutes to the show's 52.
const DEVS_UP_NEXT: UpNextResponse = {
  show: ShowDevsResponseMock,
  progress: {
    aired: 8,
    completed: 1,
    last_watched_at: null,
    reset_at: null,
    next_episode: EpisodeSiloResponseMock,
    last_episode: null,
  },
};

const DEVS_WITHOUT_RUNTIME: UpNextResponse = {
  ...DEVS_UP_NEXT,
  progress: {
    ...DEVS_UP_NEXT.progress,
    next_episode: { ...EpisodeSiloResponseMock, runtime: null },
  },
};

function readUpNext() {
  return runQuery({
    factory: () => createTestBedQuery(upNextQuery()),
    waitFor: (result) => result.isFetched,
  }).then((result) => result.data);
}

describe('upNextQuery', () => {
  it('should map the next episode of each show, dropping a show with none', async () => {
    const entries = await readUpNext();

    expect(UpNextResponseMock).toHaveLength(2);
    expect(entries).toEqual(UpNextMappedMock);
  });

  it("should take the next episode's runtime over the show's", async () => {
    serveUpNext(() => HttpResponse.json([DEVS_UP_NEXT]));

    const entries = await readUpNext();

    expect(entries?.map(({ runtime }) => runtime)).toEqual([60]);
  });

  it('should take the show runtime for a next episode without one', async () => {
    serveUpNext(() => HttpResponse.json([DEVS_WITHOUT_RUNTIME]));

    const entries = await readUpNext();

    expect(entries?.map(({ runtime }) => runtime)).toEqual([52]);
  });

  it('should read null when the route has no content', async () => {
    serveUpNext(() => new HttpResponse(null, { status: 204 }));

    expect(await readUpNext()).toBeNull();
  });

  it('should ask for the first 18 shows by activity, newest first', async () => {
    const searches = recordSearches(UP_NEXT_URL, UpNextResponseMock);

    await readUpNext();

    // Every GET also carries the query's invalidation `marker`.
    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        sort_by: 'activity',
        sort_how: 'desc',
        extended: 'full,images',
        limit: '18',
        page: '1',
      }),
    ]);
  });

  it('should keep its data fresh for 15 minutes', () => {
    expect(upNextQuery().staleTime).toBe(time.minutes(15));
  });

  it('should refetch when the window regains focus', () => {
    expect(upNextQuery().refetchOnWindowFocus).toBe(true);
  });

  describe('invalidation', () => {
    it.each([
      InvalidateAction.MarkAsWatched('show'),
      InvalidateAction.MarkAsWatched('episode'),
      InvalidateAction.Drop('show'),
      InvalidateAction.Restore,
      InvalidateAction.Watchlisted('show'),
      InvalidateAction.Watchlisted('season'),
    ])('should refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        useQuery(upNextQuery())
      );

      expect(await invalidate(action)).toEqual([
        'GET /sync/progress/up_next',
      ]);
    });

    it.each([
      InvalidateAction.MarkAsWatched('movie'),
      InvalidateAction.Watchlisted('movie'),
      InvalidateAction.Watchlisted('episode'),
    ])('should not refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        useQuery(upNextQuery())
      );

      expect(await invalidate(action)).toEqual([]);
    });
  });
});
