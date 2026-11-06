import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { WatchlistPreviewMappedMock } from '$mocks/data/sync/mapped/WatchlistPreviewMappedMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { UnairedSeasonWatchlistResponseMock } from '$mocks/data/users/response/UnairedSeasonWatchlistResponseMock.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHLIST_SEGMENTS } from '$mocks/data/users/WATCHLIST_SEGMENTS.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import {
  describeListReadQuery,
  type ListReadParams,
} from '$test/beds/query/describeListReadQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { watchlistQuery, type WatchlistType } from './watchlistQuery.ts';

type WatchlistParams = ListReadParams<WatchlistType>;

function watchlist(
  { type, sortBy = 'rank', sortHow = 'asc', genres }: WatchlistParams = {},
) {
  return watchlistQuery({ type, sortBy, sortHow, filter: { genres } });
}

function readWatchlist(params?: WatchlistParams) {
  return runQuery({
    factory: () => createTestBedInfiniteQuery(watchlist(params)),
    mapper: mapToEntries,
  });
}

describeListReadQuery({
  name: 'watchlistQuery',
  list: 'watchlist',
  segments: WATCHLIST_SEGMENTS,
  query: watchlist,
  url: USER_WATCHLIST_URL,
  response: WatchlistPreviewResponseMock,
});

describe('watchlistQuery', () => {
  it('should ask for nothing hidden', async () => {
    const searches = recordSearches(
      USER_WATCHLIST_URL,
      WatchlistPreviewResponseMock,
    );

    await readWatchlist();

    expect(searches.map((search) => search.has('hide'))).toEqual([false]);
  });

  it('should map every type of watchlist item in rank order', async () => {
    expect(await readWatchlist()).toEqual(WatchlistPreviewMappedMock);
  });

  it.each(
    [
      ['seasons', 'season'],
      ['episodes', 'episode'],
    ] as const,
  )('should map the %s rows', async (type, itemType) => {
    const entries = await readWatchlist({ type });

    expect(entries).toHaveLength(1);
    expect(entries).toEqual(
      WatchlistPreviewMappedMock.filter((item) => item.type === itemType),
    );
  });

  it('should read a season with a null air date as aired at no known date', async () => {
    servePaged({
      url: USER_WATCHLIST_URL,
      body: UnairedSeasonWatchlistResponseMock,
    });

    expect(await readWatchlist()).toEqual([
      expect.objectContaining({
        entry: expect.objectContaining({
          season: expect.objectContaining({ airDate: MAX_DATE }),
        }),
      }),
    ]);
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
        createTestBedInfiniteQuery(watchlist())
      );

      expect(await invalidate(action)).toEqual([
        'GET /users/me/watchlist/all/rank/asc',
      ]);
    });

    it.each([
      InvalidateAction.Favorited('movie'),
      InvalidateAction.Drop('show'),
    ])('should not refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        createTestBedInfiniteQuery(watchlist())
      );

      expect(await invalidate(action)).toEqual([]);
    });
  });
});
