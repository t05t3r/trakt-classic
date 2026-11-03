import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHLIST_SEGMENTS } from '$mocks/data/users/WATCHLIST_SEGMENTS.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { renderSnapshot } from '$test/beds/query/renderSnapshot.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { describe, expect, it } from 'vitest';
import { watchlistGenreCountQuery } from './watchlistGenreCountQuery.ts';
import type { WatchlistType } from './watchlistQuery.ts';

const DRAMA = { filter: { genres: 'drama' } };
const FULL_PAGE = Array.from(
  { length: MAX_PAGE_LIMIT },
  (_, index) => movieListItem(index + 1),
);

type CountParams = {
  type?: WatchlistType;
  filter?: { genres?: string };
};

function renderCount(params: CountParams) {
  return renderSnapshot(watchlistGenreCountQuery(params), idsOf);
}

async function readCount(params: CountParams) {
  const { snapshot } = await renderCount(params);

  return readKnown(snapshot);
}

function requestCount(params: CountParams) {
  return captureRequests(() => readCount(params), {
    pathIncludes: '/watchlist/',
  });
}

describe('watchlistGenreCountQuery', () => {
  it('should read every page until a short one', async () => {
    serveTwoPages({
      url: USER_WATCHLIST_URL,
      first: FULL_PAGE,
      second: () =>
        pagedResponse({ body: [movieListItem(481)], page: 2, pageCount: 2 }),
    });

    const ids = await readCount(DRAMA);

    expect(ids).toHaveLength(MAX_PAGE_LIMIT + 1);
    expect(ids.at(-1)).toBe(481);
  });

  it('should stop at an empty page after a full one', async () => {
    serveTwoPages({
      url: USER_WATCHLIST_URL,
      first: FULL_PAGE,
      second: () => pagedResponse({ body: [], page: 2, pageCount: 2 }),
    });

    const requests = await captureRequests(async () => {
      expect(await readCount(DRAMA)).toHaveLength(MAX_PAGE_LIMIT);
    }, { pathIncludes: '/watchlist/' });

    expect(requests).toEqual([
      'GET /users/me/watchlist/all/rank/asc',
      'GET /users/me/watchlist/all/rank/asc',
    ]);
  });

  // Under a genre filter, both page headers count the whole watchlist.
  it('should stop at a short page whatever its page headers say', async () => {
    serveTwoPages({
      url: USER_WATCHLIST_URL,
      first: [movieListItem(481)],
      second: () =>
        pagedResponse({ body: [movieListItem(482)], page: 2, pageCount: 2 }),
    });

    expect(await readCount(DRAMA)).toEqual([481]);
  });

  it.each(WATCHLIST_SEGMENTS)(
    'should ask for the %s of the genre by rank',
    async (type) => {
      expect(await requestCount({ type, ...DRAMA })).toEqual([
        `GET /users/me/watchlist/${type}/rank/asc`,
      ]);
    },
  );

  it('should ask for 250 items of the genre without extended info', async () => {
    const searches = recordSearches(USER_WATCHLIST_URL, [movieListItem(481)]);

    await readCount(DRAMA);

    // Every GET also carries the query's invalidation `marker`.
    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        genres: 'drama',
        limit: String(MAX_PAGE_LIMIT),
        page: '1',
      }),
    ]);
    expect(searches.map((search) => search.has('extended'))).toEqual([false]);
  });

  it('should not be sent without a genre', async () => {
    const requests = await captureRequests(async () => {
      const { waitForLateRequests } = await renderCount({});

      await waitForLateRequests();
    }, { pathIncludes: '/watchlist/' });

    expect(requests).toEqual([]);
  });

  describe('invalidation', () => {
    it.each([
      InvalidateAction.Watchlisted('movie'),
      InvalidateAction.Watchlisted('show'),
      InvalidateAction.Watchlisted('season'),
      InvalidateAction.Watchlisted('episode'),
    ])('should refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        createTestBedInfiniteQuery(watchlistGenreCountQuery(DRAMA))
      );

      expect(await invalidate(action)).toEqual([
        'GET /users/me/watchlist/all/rank/asc',
      ]);
    });

    it.each([
      InvalidateAction.MarkAsWatched('movie'),
      InvalidateAction.Favorited('show'),
    ])('should not refetch on %s', async (action) => {
      const invalidate = await observeInvalidation(() =>
        createTestBedInfiniteQuery(watchlistGenreCountQuery(DRAMA))
      );

      expect(await invalidate(action)).toEqual([]);
    });
  });
});
