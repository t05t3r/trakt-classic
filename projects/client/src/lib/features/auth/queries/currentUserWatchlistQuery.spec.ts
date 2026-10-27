import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { WatchlistAllMappedMock } from '$mocks/data/sync/mapped/WatchlistAllMappedMock.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { currentUserWatchlistQuery } from './currentUserWatchlistQuery.ts';

describe('currentUserWatchlistQuery', () => {
  it('should request 250 items of every type, by rank, without extended info', async () => {
    const searches = recordSearches(WATCHLIST_URL, []);

    await runQuery({
      factory: () => createTestBedInfiniteQuery(currentUserWatchlistQuery()),
      mapper: mapToEntries,
    });

    expect(searches.map((search) => search.get('limit')))
      .toEqual(['250']);
    expect(searches.map((search) => search.has('extended')))
      .toEqual([false]);
  });

  it('should map each item to its own type, trakt id and listed date', async () => {
    const result = await runQuery({
      factory: () => createTestBedInfiniteQuery(currentUserWatchlistQuery()),
      mapper: mapToEntries,
    });

    expect(result).toEqual(WatchlistAllMappedMock);
  });

  it.each([
    ['movie is watchlisted', InvalidateAction.Watchlisted('movie')],
    ['show is watchlisted', InvalidateAction.Watchlisted('show')],
    ['season is watchlisted', InvalidateAction.Watchlisted('season')],
    ['episode is watchlisted', InvalidateAction.Watchlisted('episode')],
    ['movie is marked watched', InvalidateAction.MarkAsWatched('movie')],
    ['show is marked watched', InvalidateAction.MarkAsWatched('show')],
    ['episode is marked watched', InvalidateAction.MarkAsWatched('episode')],
  ])(
    'should refetch when a %s',
    async (_, action) => {
      const invalidate = await observeInvalidation(() =>
        createTestBedInfiniteQuery(currentUserWatchlistQuery())
      );

      const requests = await invalidate(action);

      expect(requests).toEqual(['GET /sync/watchlist/all/rank/asc']);
    },
  );

  it('should cache each start page apart', () => {
    expect(currentUserWatchlistQuery({ page: 2 }).queryKey)
      .not.toEqual(currentUserWatchlistQuery({ page: 1 }).queryKey);
  });
});
