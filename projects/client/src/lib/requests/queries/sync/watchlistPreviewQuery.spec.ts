import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { time } from '$lib/utils/timing/time.ts';
import { WatchlistPreviewMappedMock } from '$mocks/data/sync/mapped/WatchlistPreviewMappedMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import {
  pagedResponse,
  type PagedResponseParams,
} from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { watchlistPreviewQuery } from './watchlistPreviewQuery.ts';

function serve(params: Omit<PagedResponseParams, 'body'> = {}) {
  server.use(
    http.get(
      WATCHLIST_URL,
      () => pagedResponse({ body: WatchlistPreviewResponseMock, ...params }),
    ),
  );
}

function readPreview() {
  return runQuery({
    factory: () => createTestBedQuery(watchlistPreviewQuery()),
    waitFor: (result) => result.isFetched,
  }).then((result) => result.data);
}

describe('watchlistPreviewQuery', () => {
  it('should map every type of watchlist item in rank order', async () => {
    const preview = await readPreview();

    expect(preview?.entries).toEqual(WatchlistPreviewMappedMock);
    expect(preview?.entries.map(({ type }) => type)).toEqual([
      'movie',
      'movie',
      'show',
      'show',
      'season',
      'episode',
    ]);
  });

  it('should read the item count of the whole watchlist', async () => {
    serve({ pageCount: 7, itemCount: 121 });

    const preview = await readPreview();

    expect(preview?.itemCount).toBe(121);
  });

  it('should leave the item count unknown without its header', async () => {
    serve();

    const preview = await readPreview();

    expect(preview?.entries).toHaveLength(6);
    expect(preview?.itemCount).toBeUndefined();
  });

  it('should ask for the first 18 items by rank with their images', async () => {
    const searches = recordSearches(
      WATCHLIST_URL,
      WatchlistPreviewResponseMock,
    );

    await readPreview();

    // Every GET also carries the query's invalidation `marker`.
    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        extended: 'full,images',
        limit: '18',
        page: '1',
      }),
    ]);
  });

  it('should keep its data fresh for 3 hours', () => {
    expect(watchlistPreviewQuery().staleTime).toBe(time.hours(3));
  });

  describe('invalidation', () => {
    it.each([
      InvalidateAction.Watchlisted('movie'),
      InvalidateAction.Watchlisted('show'),
      InvalidateAction.Watchlisted('season'),
      InvalidateAction.Watchlisted('episode'),
      InvalidateAction.MarkAsWatched('movie'),
      InvalidateAction.MarkAsWatched('show'),
      InvalidateAction.MarkAsWatched('episode'),
    ])('should refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        useQuery(watchlistPreviewQuery())
      );

      expect(await invalidate(action)).toEqual([
        'GET /sync/watchlist/all/rank/asc',
      ]);
    });

    it.each([
      InvalidateAction.Drop('show'),
      InvalidateAction.Restore,
    ])('should not refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        useQuery(watchlistPreviewQuery())
      );

      expect(await invalidate(action)).toEqual([]);
    });
  });
});
