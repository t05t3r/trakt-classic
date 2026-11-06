import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { WatchedInHistoryTarget } from '$lib/features/media-actions/isWatchedInHistory.ts';
import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { mediaFavoritesQuery } from '$lib/requests/queries/media/mediaFavoritesQuery.ts';
import { watchlistQuery } from '$lib/requests/queries/users/watchlistQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { WatchedWatchlistResponseMock } from '$mocks/data/users/response/WatchedWatchlistResponseMock.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { firstValueFrom, map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useWatchedPercentage } from './useWatchedPercentage.ts';

const PARAMS = { sortBy: 'rank', sortHow: 'asc' } as const;

function rowOfType(type: 'movie' | 'show') {
  return assertDefined(
    WatchlistPreviewResponseMock.find((row) => row.type === type),
  );
}

const WATCHED_ROWS = WatchedWatchlistResponseMock;
const WATCHED_MOVIE_ROW = assertDefined(WATCHED_ROWS.at(0));

const TWO_PAGE_COUNT = LIST_PAGE_SIZE + WATCHED_ROWS.length;

function secondPage() {
  return pagedResponse({ body: WATCHED_ROWS, page: 2, pageCount: 2 });
}

function listItemTarget(item: ListItem) {
  return toListItemCard(item).target;
}

function favoriteTarget({ item }: FavoritedEntry): WatchedInHistoryTarget {
  return 'episode' in item
    ? { type: 'show', id: item.id, episode: item.episode }
    : { type: 'movie', id: item.id };
}

function watchlistPercentage(count: number) {
  return useWatchedPercentage({
    query: watchlistQuery,
    params: PARAMS,
    count,
    toTarget: listItemTarget,
  });
}

describe('store: useWatchedPercentage', () => {
  it("should count a single page's watched items over the count", async () => {
    // The mocked favourites are Heretic, watched, and Silo, one episode in.
    const { percentage } = await renderSettledHistory(() => ({
      percentage: useWatchedPercentage({
        query: mediaFavoritesQuery,
        params: { slug: 'me' },
        count: 2,
        toTarget: favoriteTarget,
      }),
    }));

    expect(await readKnown(percentage)).toEqual({
      watched: 1,
      count: 2,
      percentage: 50,
    });
  });

  it("should read the grid's cached first page and fetch only the second", async () => {
    serveTwoPages({
      url: USER_WATCHLIST_URL,
      first: WatchlistPreviewResponseMock,
      second: secondPage,
    });
    const { grid, percentage } = await renderSettledHistory(() => ({
      grid: useInfiniteQuery(watchlistQuery({ ...PARAMS, page: 1 })),
      percentage: watchlistPercentage(TWO_PAGE_COUNT),
    }));
    await readKnown(grid.pipe(map(mapToEntries)));

    const requests = await captureRequests(() => readKnown(percentage), {
      pathIncludes: '/watchlist/',
    });

    // One GET, and only page 2 holds watched items.
    expect(requests).toEqual(['GET /users/me/watchlist/all/rank/asc']);
    expect(await readKnown(percentage)).toEqual({
      watched: 2,
      count: TWO_PAGE_COUNT,
      percentage: 1,
    });
  });

  it.each([
    { watched: 2, count: 3, percentage: 66 },
    { watched: 29, count: 100, percentage: 29 },
  ])(
    'should read $watched watched of $count as $percentage percent, rounded down',
    async ({ watched, count, percentage }) => {
      const body = Array.from(
        { length: count },
        (_, index) => index < watched ? WATCHED_MOVIE_ROW : rowOfType('movie'),
      );
      servePaged({ url: USER_WATCHLIST_URL, body });
      const store = await renderSettledHistory(() => ({
        percentage: watchlistPercentage(count),
      }));

      expect(await readKnown(store.percentage)).toEqual({
        watched,
        count,
        percentage,
      });
    },
  );

  it('should read an empty list as none watched without a request', async () => {
    const requests = await captureRequests(async () => {
      const { percentage, waitForLateRequests } = await renderStore(() => ({
        percentage: watchlistPercentage(0),
        waitForLateRequests: useWaitForLateRequests(),
      }));

      expect(await firstValueFrom(percentage)).toEqual({
        watched: 0,
        count: 0,
        percentage: 0,
      });
      await waitForLateRequests();
    }, { pathIncludes: '/watchlist/' });

    expect(requests).toEqual([]);
  });

  it('should read nothing until every page has landed', async () => {
    const second = holdResponse(secondPage);
    serveTwoPages({
      url: USER_WATCHLIST_URL,
      first: WatchlistPreviewResponseMock,
      second: second.answer,
    });
    const { percentage } = await renderSettledHistory(() => ({
      percentage: watchlistPercentage(TWO_PAGE_COUNT),
    }));
    const reads = collectDistinctStates(percentage);

    await second.requested;
    expect(reads).toEqual([undefined]);

    second.release();
    expect(await readKnown(percentage)).toEqual({
      watched: 2,
      count: TWO_PAGE_COUNT,
      percentage: 1,
    });
  });

  it('should read nothing until the history is known', async () => {
    const history = holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });
    const { grid, percentage } = await renderStore(() => ({
      grid: useInfiniteQuery(watchlistQuery({ ...PARAMS, page: 1 })),
      percentage: watchlistPercentage(WatchlistPreviewResponseMock.length),
    }));
    const reads = collectDistinctStates(percentage);

    await history.requested;
    await readKnown(grid.pipe(map(mapToEntries)));
    expect(reads).toEqual([undefined]);

    history.release();
    expect(await readKnown(percentage)).toEqual({
      watched: 0,
      count: WatchlistPreviewResponseMock.length,
      percentage: 0,
    });
  });
});
