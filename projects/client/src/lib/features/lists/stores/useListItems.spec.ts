import { goto } from '$app/navigation';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { useListParams } from '$lib/features/lists/stores/useListParams.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { WatchlistPreviewMappedMock } from '$mocks/data/sync/mapped/WatchlistPreviewMappedMock.ts';
import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { WatchedWatchlistResponseMock } from '$mocks/data/users/response/WatchedWatchlistResponseMock.ts';
import { USER_WATCHLIST_URL } from '$mocks/data/users/USER_WATCHLIST_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { FAVORITES_PATH } from '$mocks/data/users/FAVORITES_PATH.ts';
import { FavoritedMediaResponseMock } from '$mocks/data/users/response/FavoritedMediaResponseMock.ts';
import { USER_FAVORITES_URL } from '$mocks/data/users/USER_FAVORITES_URL.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { server } from '$mocks/server.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { waitFor } from '@testing-library/svelte';
import { http, type JsonBodyType } from 'msw';
import { map, type Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import {
  type ListItems,
  type ListItemsValues,
  useListItems,
} from './useListItems.ts';

type WatchlistValues = ListItemsValues<(typeof LIST_TYPES.watchlist)[number]>;
type FavoritesValues = ListItemsValues<(typeof LIST_TYPES.favorites)[number]>;
type Reading = ListItems['reading'] extends Observable<infer R> ? R : never;

const VALUES: WatchlistValues = {
  sort: { by: 'rank', how: 'asc' },
  type: null,
  genre: null,
  page: 1,
};

const [WATCHED_MOVIE_ROW, WATCHED_SHOW_ROW] = WatchedWatchlistResponseMock;
const UNWATCHED_ROW = assertDefined(WatchlistPreviewResponseMock.at(0));
const DEVS_EPISODE_ROW = {
  ...assertDefined(
    WatchlistPreviewResponseMock.find((row) => row.type === 'episode'),
  ),
  show: ShowDevsResponseMock,
};

function itemsStore(values: Partial<WatchlistValues> = {}) {
  return () => ({
    ...useListItems({
      list: 'watchlist',
      params: useListParams({ types: LIST_TYPES.watchlist }),
      values: { ...VALUES, ...values },
    }),
    ...useInvalidator(),
    dropped: useUser().dropped,
  });
}

function renderFavorites(values: Partial<FavoritesValues> = {}) {
  return renderSettledHistory(() =>
    useListItems({
      list: 'favorites',
      params: useListParams({ types: LIST_TYPES.favorites }),
      values: { ...VALUES, ...values },
    })
  );
}

function renderItems(values: Partial<WatchlistValues> = {}) {
  return renderSettledHistory(itemsStore(values));
}

// Renders before the history is known, so a spec can watch it land.
function renderCold() {
  return renderStore(itemsStore());
}

function serveWatchlist(body: JsonBodyType) {
  servePaged({ url: USER_WATCHLIST_URL, body });
}

// The count read's answer: `count` items, under headers it ignores.
function countResponse(count: number) {
  return pagedResponse({
    body: Array.from({ length: count }, (_, index) => movieListItem(index + 1)),
    pageCount: 9,
    itemCount: 999,
  });
}

type GenreAnswers = {
  grid: () => Response;
  // Given the page the count read asks for.
  count: (page: string | null) => Response | Promise<Response>;
};

// The count read asks for the most a page holds; the grid asks for one page.
function serveGenre({ grid, count }: GenreAnswers) {
  server.use(
    http.get(USER_WATCHLIST_URL, ({ request }) => {
      const search = new URL(request.url).searchParams;
      return search.get('limit') === String(MAX_PAGE_LIMIT)
        ? count(search.get('page'))
        : grid();
    }),
  );
}

function genreGrid() {
  return pagedResponse({
    body: WatchlistPreviewResponseMock,
    pageCount: 9,
    itemCount: 999,
  });
}

function readyRows(reading: Observable<Reading>) {
  return nextOf(statusOf(reading), 'ready').then((ready) => ready.data);
}

// Each reading's status kind or, once ready, the titles it shows, a faded one marked.
function shownOf(reading: Observable<Reading>) {
  return collectDistinctStates(
    statusOf(reading).pipe(
      map((status) =>
        status.kind !== 'ready' ? status.kind : status.data
          .map(({ card, isFaded }) =>
            isFaded ? `${card.posterTitle} (faded)` : card.posterTitle
          )
          .join(', ')
      ),
    ),
  );
}

const FILTERED = [
  { filter: 'hide', shown: 'The Batman' },
  { filter: 'fade', shown: 'Heretic (faded), Devs (faded), The Batman' },
] as const;

describe('store: useListItems', () => {
  describe('rows', () => {
    it("should read the page's entries, each with its card", async () => {
      openAt(WATCHLIST_PATH);
      const { reading } = await renderItems();

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.entry)).toEqual(WatchlistPreviewMappedMock);
      expect(rows.map((row) => row.card.posterTitle)).toEqual([
        'The Batman',
        'Se7en',
        'Slow Horses',
        'Shōgun',
        'Silo',
        'House of the Dragon',
      ]);
    });

    it('should request the page it is given, of its type', async () => {
      openAt(`${WATCHLIST_PATH}?display=episode&page=2`);
      const searches = recordSearches(USER_WATCHLIST_URL, []);

      const requests = await captureRequests(async () => {
        const { reading } = await renderItems({ type: 'episode', page: 2 });
        await nextOf(statusOf(reading), 'empty');
      }, { pathIncludes: '/watchlist/' });

      expect(requests).toEqual(['GET /users/me/watchlist/episodes/rank/asc']);
      expect(searches.map((search) => search.get('page'))).toEqual(['2']);
    });
  });

  describe('watched filter', () => {
    it('should fade the watched rows under fade', async () => {
      openAt(`${WATCHLIST_PATH}?fade=watched`);
      serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);
      const { reading } = await renderItems();

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.isFaded)).toEqual([true, true, false]);
    });

    it('should leave every row unfaded without a filter', async () => {
      openAt(WATCHLIST_PATH);
      serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);
      const { reading } = await renderItems();

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.isFaded)).toEqual([false, false, false]);
    });

    it('should drop the watched rows under hide, leaving the counts', async () => {
      openAt(`${WATCHLIST_PATH}?hide=watched`);
      servePaged({
        url: USER_WATCHLIST_URL,
        body: [...WatchedWatchlistResponseMock, UNWATCHED_ROW],
        itemCount: 3,
      });
      const { reading } = await renderItems();

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.card.posterTitle)).toEqual(['The Batman']);
      expect(await readingOf(reading, 'itemCount')).toBe(3);
    });

    it.each(FILTERED)(
      'should show no watched card under $filter before the history lands',
      async ({ filter, shown }) => {
        openAt(`${WATCHLIST_PATH}?${filter}=watched`);
        serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);
        const history = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
        const { reading } = await renderCold();
        const states = shownOf(reading);

        await readKnown(reading.pipe(map(({ pages }) => pages.total)));
        await history.requested;
        history.release();
        await readyRows(reading);

        expect(states).toEqual(['loading', shown]);
      },
    );

    it.each(FILTERED)(
      'should keep the filter under $filter while a watch refetches the history',
      async ({ filter, shown }) => {
        openAt(`${WATCHLIST_PATH}?${filter}=watched`);
        serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);
        const { reading, invalidate } = await renderItems();
        await readyRows(reading);
        const states = shownOf(reading);
        const refetch = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });

        const invalidation = invalidate(
          InvalidateAction.MarkAsWatched('movie'),
        );
        await refetch.requested;
        refetch.release();
        await invalidation;

        expect(states).toEqual([shown]);
      },
    );

    it.each(FILTERED)(
      'should read a failed history read under $filter as error, and retry it',
      async ({ filter, shown }) => {
        openAt(`${WATCHLIST_PATH}?${filter}=watched`);
        serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);
        failOnce(WATCHED_MOVIES_URL);
        const { reading } = await renderCold();
        const states = shownOf(reading);

        const failed = await nextOf(statusOf(reading), 'error');
        failed.retry();
        await readyRows(reading);

        expect(states).toEqual(['loading', 'error', 'loading', shown]);
      },
    );

    it('should read a page that hide empties as empty and filtered', async () => {
      openAt(`${WATCHLIST_PATH}?hide=watched`);
      serveWatchlist([WATCHED_MOVIE_ROW]);
      const { reading } = await renderItems();

      await nextOf(statusOf(reading), 'empty');

      expect(await readingOf(reading, 'isFiltered')).toBe(true);
    });
  });

  describe('filtered', () => {
    it.each(
      [
        { values: {}, isFiltered: false },
        { values: { type: 'movie' }, isFiltered: true },
        { values: { genre: 'drama' }, isFiltered: true },
      ] as const,
    )(
      'should read $values as filtered: $isFiltered',
      async ({ values, isFiltered }) => {
        openAt(WATCHLIST_PATH);
        const { reading } = await renderItems(values);

        expect(await readingOf(reading, 'isFiltered')).toBe(isFiltered);
      },
    );
  });

  describe('dropped', () => {
    it("should carry a dropped show's date on its own row", async () => {
      openAt(WATCHLIST_PATH);
      serveWatchlist([WATCHED_SHOW_ROW, DEVS_EPISODE_ROW]);
      const { reading, dropped } = await renderItems();
      await readKnown(dropped);

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.droppedAt)).toEqual([
        DROPPED_AT,
        undefined,
      ]);
    });
  });

  describe('counts', () => {
    it('should read the item and page counts from the page headers', async () => {
      openAt(WATCHLIST_PATH);
      servePaged({
        url: USER_WATCHLIST_URL,
        body: WatchlistPreviewResponseMock,
        pageCount: 3,
        itemCount: 300,
      });
      const { reading } = await renderItems();

      expect(await readingOf(reading, 'itemCount')).toBe(300);
      expect(await readingOf(reading, 'pages')).toEqual({
        current: 1,
        total: 3,
      });
    });

    it('should read the counts under a genre filter from the count read', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama`);
      serveGenre({ grid: genreGrid, count: () => countResponse(121) });
      const { reading } = await renderItems({ genre: 'drama' });

      expect(await readingOf(reading, 'itemCount')).toBe(121);
      expect(
        await readKnown(reading.pipe(map(({ pages }) => pages.total))),
      ).toBe(2);
    });

    it('should read a failed count read under a genre filter as error, and land the page and its counts on Retry', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama`);
      serveGenre({ grid: genreGrid, count: notFound });
      const { reading } = await renderItems({ genre: 'drama' });

      const failed = await nextOf(statusOf(reading), 'error');
      const kinds = kindsOf(statusOf(reading));
      serveGenre({ grid: genreGrid, count: () => countResponse(121) });
      failed.retry();
      const rows = await readyRows(reading);

      expect(rows).toHaveLength(WatchlistPreviewResponseMock.length);
      expect(await readingOf(reading, 'itemCount')).toBe(121);
      expect(kinds).toEqual(['error', 'ready']);
    });

    it('should read a failed later page of the count read under a genre filter as error, and retry it', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama`);
      serveGenre({
        grid: genreGrid,
        count: (page) =>
          page === '2' ? notFound() : countResponse(MAX_PAGE_LIMIT),
      });
      const { reading } = await renderItems({ genre: 'drama' });

      const failed = await nextOf(statusOf(reading), 'error');
      const itemCounts = collectDistinctStates(
        reading.pipe(map(({ itemCount }) => itemCount)),
      );
      serveGenre({ grid: genreGrid, count: () => countResponse(121) });
      failed.retry();

      await waitFor(() => expect(itemCounts.at(-1)).toBe(121));
    });

    it("should sum the page's runtimes and take its first item's fanart", async () => {
      openAt(WATCHLIST_PATH);
      const { reading } = await renderItems();

      // 177 + 127 for the movies, 1576 + 599 for the shows, 545 for the season, 66 for the episode.
      expect(await readingOf(reading, 'minutes')).toBe(3090);
      expect(await readingOf(reading, 'cover')).toBe(
        itemOfType('movie').entry.cover.url.full,
      );
    });
  });

  describe('a page past the last', () => {
    it('should replace a page past the last with the last page', async () => {
      openAt(`${WATCHLIST_PATH}?page=5`);
      servePaged({
        url: USER_WATCHLIST_URL,
        body: [],
        page: 5,
        pageCount: 2,
        itemCount: 130,
      });
      const { reading } = await renderItems({ page: 5 });
      collectDistinctStates(reading);

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?page=2`)
      );
    });

    it('should read a page past the last as loading, never empty, until the replace', async () => {
      openAt(`${WATCHLIST_PATH}?page=5`);
      servePaged({
        url: USER_WATCHLIST_URL,
        body: [],
        page: 5,
        pageCount: 2,
        itemCount: 130,
      });
      const { reading } = await renderItems({ page: 5 });
      const kinds = kindsOf(statusOf(reading));

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?page=2`)
      );

      expect(kinds).toEqual(['loading']);
    });

    it("should replace a page past the count read's last page under a genre filter", async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama&page=2`);
      serveGenre({
        grid: () =>
          pagedResponse({ body: [], page: 2, pageCount: 9, itemCount: 999 }),
        count: () => countResponse(100),
      });
      const { reading } = await renderItems({ genre: 'drama', page: 2 });
      collectDistinctStates(reading);

      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?genres=drama`)
      );
    });

    it('should never read an empty page past the last under a genre filter before the count lands', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama&page=2`);
      const countRead = holdResponse(() => countResponse(100));
      serveGenre({
        grid: () =>
          pagedResponse({ body: [], page: 2, pageCount: 9, itemCount: 999 }),
        count: countRead.answer,
      });
      const { reading } = await renderItems({ genre: 'drama', page: 2 });
      const kinds = kindsOf(statusOf(reading));

      // The page has landed once its runtimes are summed.
      await readKnown(reading.pipe(map(({ minutes }) => minutes)));
      await countRead.requested;
      countRead.release();
      await waitFor(() =>
        expect(lastReplace()).toBe(`${WATCHLIST_PATH}?genres=drama`)
      );

      expect(kinds).toEqual(['loading']);
    });

    it("should not replace a later page on Retry after the count read's later page fails, until the whole count lands", async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama&page=5`);
      serveGenre({
        grid: genreGrid,
        count: (page) =>
          page === '2' ? notFound() : countResponse(MAX_PAGE_LIMIT),
      });
      const { reading } = await renderItems({ genre: 'drama', page: 5 });
      const failed = await nextOf(statusOf(reading), 'error');
      const itemCounts = collectDistinctStates(
        reading.pipe(map(({ itemCount }) => itemCount)),
      );
      // Two full pages and an empty third: five pages of the grid.
      serveGenre({
        grid: genreGrid,
        count: (page) => countResponse(page === '3' ? 0 : MAX_PAGE_LIMIT),
      });

      failed.retry();
      await waitFor(() => expect(itemCounts.at(-1)).toBe(2 * MAX_PAGE_LIMIT));
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
    });

    it('should not replace the page once its reading has no reader', async () => {
      openAt(`${WATCHLIST_PATH}?page=5`);
      const held = holdRequest({
        method: 'get',
        url: USER_WATCHLIST_URL,
        answer: () =>
          pagedResponse({ body: [], page: 5, pageCount: 2, itemCount: 130 }),
      });
      const { reading, waitForLateRequests } = await renderSettledHistory(
        () => ({
          ...useListItems({
            list: 'watchlist',
            params: useListParams({ types: LIST_TYPES.watchlist }),
            values: { ...VALUES, page: 5 },
          }),
          waitForLateRequests: useWaitForLateRequests(),
        }),
      );
      const subscription = reading.subscribe();
      await held.requested;

      subscription.unsubscribe();
      held.release();
      await waitForLateRequests();

      expect(goto).not.toHaveBeenCalled();
    });

    it('should keep a page within the list', async () => {
      openAt(`${WATCHLIST_PATH}?page=2`);
      servePaged({
        url: USER_WATCHLIST_URL,
        body: WatchlistPreviewResponseMock,
        page: 2,
        pageCount: 3,
      });
      const { reading } = await renderItems({ page: 2 });
      collectDistinctStates(reading);

      await readKnown(reading.pipe(map(({ pages }) => pages.total)));
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
    });
  });

  describe('watched', () => {
    it("should read the watched percentage from the grid's own first page", async () => {
      openAt(WATCHLIST_PATH);
      serveWatchlist([...WatchedWatchlistResponseMock, UNWATCHED_ROW]);

      const requests = await captureRequests(async () => {
        const { reading, percentage } = await renderSettledHistory(() => {
          const items = useListItems({
            list: 'watchlist',
            params: useListParams({ types: LIST_TYPES.watchlist }),
            values: VALUES,
          });

          return { reading: items.reading, percentage: items.watched(3) };
        });
        await readyRows(reading);

        expect(await readKnown(percentage)).toEqual({
          watched: 2,
          count: 3,
          percentage: 66,
        });
      }, { pathIncludes: '/watchlist/' });

      expect(requests).toEqual(['GET /users/me/watchlist/all/rank/asc']);
    });
  });

  describe('favorites', () => {
    it('should read the favourites with their ranks, each with its card', async () => {
      openAt(FAVORITES_PATH);
      const { reading } = await renderFavorites();

      const rows = await readyRows(reading);

      expect(rows.map((row) => row.entry.rank)).toEqual([1, 4]);
      expect(rows.map((row) => row.card.posterTitle)).toEqual([
        'Heretic',
        'Silo',
      ]);
    });

    it("should request the user's favourites of its type, sorted", async () => {
      openAt(`${FAVORITES_PATH}?display=movie&sort=title,asc`);

      const requests = await captureRequests(async () => {
        const { reading } = await renderFavorites({
          type: 'movie',
          sort: { by: 'title', how: 'asc' },
        });
        await readyRows(reading);
      }, { pathIncludes: '/favorites/' });

      expect(requests).toEqual(['GET /users/me/favorites/movies/title/asc']);
    });

    it('should send the genre filter on the favourites request', async () => {
      openAt(`${FAVORITES_PATH}?genres=drama`);
      const searches = recordSearches(
        USER_FAVORITES_URL,
        FavoritedMediaResponseMock,
      );
      const { reading } = await renderFavorites({ genre: 'drama' });

      await readyRows(reading);

      expect(searches.map((search) => search.get('genres'))).toEqual([
        'drama',
      ]);
    });

    it('should read the counts from the entries, not the headers', async () => {
      openAt(FAVORITES_PATH);
      servePaged({
        url: USER_FAVORITES_URL,
        body: FavoritedMediaResponseMock,
        pageCount: 9,
        itemCount: 999,
      });
      const { reading } = await renderFavorites();

      expect(await readingOf(reading, 'itemCount')).toBe(2);
      expect(await readingOf(reading, 'pages')).toEqual({
        current: 1,
        total: 1,
      });
    });

    it("should sum the favourites' runtimes and take the first one's fanart", async () => {
      openAt(FAVORITES_PATH);
      const { reading } = await renderFavorites();

      // 111 for Heretic, 900 for Silo.
      expect(await readingOf(reading, 'minutes')).toBe(1011);
      expect(await readingOf(reading, 'cover')).toBe(
        MovieHereticMappedMock.cover.url.full,
      );
    });

    it('should read page 1 under a later page and replace it, reading loading until then', async () => {
      openAt(`${FAVORITES_PATH}?page=2`);
      const searches = recordSearches(
        USER_FAVORITES_URL,
        FavoritedMediaResponseMock,
      );
      const { reading } = await renderFavorites({ page: 2 });
      const kinds = kindsOf(statusOf(reading));

      await waitFor(() => expect(lastReplace()).toBe(FAVORITES_PATH));

      expect(searches.map((search) => search.get('page'))).toEqual(['1']);
      expect(kinds).toEqual(['loading']);
    });

    it("should read the watched percentage from the grid's own page", async () => {
      openAt(FAVORITES_PATH);

      const requests = await captureRequests(async () => {
        const { reading, percentage } = await renderSettledHistory(() => {
          const items = useListItems({
            list: 'favorites',
            params: useListParams({ types: LIST_TYPES.favorites }),
            values: VALUES,
          });

          return { reading: items.reading, percentage: items.watched(2) };
        });
        await readyRows(reading);

        expect(await readKnown(percentage)).toEqual({
          watched: 1,
          count: 2,
          percentage: 50,
        });
      }, { pathIncludes: '/favorites/' });

      expect(requests).toEqual(['GET /users/me/favorites/all/rank/asc']);
    });
  });
});
