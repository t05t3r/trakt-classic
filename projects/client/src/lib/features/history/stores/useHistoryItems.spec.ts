import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { toHistoryCard } from '$lib/features/history/toHistoryCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { HISTORY_EPISODES_URL } from '$mocks/data/users/HISTORY_EPISODES_URL.ts';
import { HISTORY_MOVIES_URL } from '$mocks/data/users/HISTORY_MOVIES_URL.ts';
import { HISTORY_SHOWS_URL } from '$mocks/data/users/HISTORY_SHOWS_URL.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { ActivityHistoryMappedMock } from '$mocks/data/users/mapped/ActivityHistoryMappedMock.ts';
import { MovieActivityHistoryMappedMock } from '$mocks/data/users/mapped/MovieActivityHistoryMappedMock.ts';
import { ShowActivityHistoryMappedMock } from '$mocks/data/users/mapped/ShowActivityHistoryMappedMock.ts';
import { SILO_PLAY_RESPONSE } from '$mocks/data/users/SILO_PLAY_RESPONSE.ts';
import { HISTORY_SEASONS_URL } from '$mocks/data/users/HISTORY_SEASONS_URL.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { describePagedReads } from '$test/beds/store/describePagedReads.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { describe, expect, it, vi } from 'vitest';
import { type HistoryItemsValues, useHistoryItems } from './useHistoryItems.ts';

const VALUES: HistoryItemsValues = {
  type: 'all',
  item: null,
  genres: null,
  range: {},
  page: 1,
};

const START_DATE = new Date('2025-01-01T00:00:00.000Z');
const END_DATE = new Date('2025-01-31T23:59:59.000Z');

// Episodes read the route Shows does, a page at a time.
const READS = [
  {
    type: 'all',
    url: HISTORY_URL,
    mapped: ActivityHistoryMappedMock,
  },
  {
    type: 'movies',
    url: HISTORY_MOVIES_URL,
    mapped: MovieActivityHistoryMappedMock,
  },
  {
    type: 'episodes',
    url: HISTORY_SHOWS_URL,
    mapped: ShowActivityHistoryMappedMock,
  },
] as const;

const LATEST = '2025-01-31T23:12:41.000Z';
const LATER = '2025-01-30T20:00:00.000Z';
const EARLIEST = '2025-01-02T08:30:00.000Z';

const DEVS_ROW = { ...SILO_PLAY_RESPONSE, id: 2, show: ShowDevsResponseMock };

function historyItems(values: Partial<HistoryItemsValues>) {
  const replacePage = vi.fn();
  const store = () => ({
    reading: useHistoryItems({
      values: { ...VALUES, ...values },
      replacePage,
    }),
  });

  return { store, replacePage };
}

function readSearch(url: string, values: Partial<HistoryItemsValues>) {
  const searches = recordSearches(url, []);
  const { store } = historyItems(values);

  return renderStore(store).then(async ({ reading }) => {
    await readingOf(reading, 'entries');

    return searches.map((search) => Object.fromEntries(search));
  });
}

describe('store: useHistoryItems', () => {
  describe.each(READS)('type $type', ({ type, url, mapped }) => {
    it('should read its route with the page, the limit, the range and the genres', async () => {
      const searches = await readSearch(url, {
        type,
        genres: 'drama',
        range: { startDate: START_DATE, endDate: END_DATE },
        page: 3,
      });

      expect(searches).toEqual([
        expect.objectContaining({
          page: '3',
          limit: String(HISTORY_PAGE_SIZE),
          genres: 'drama',
          start_at: START_DATE.toISOString(),
          end_at: END_DATE.toISOString(),
        }),
      ]);
    });

    it('should send no range and no genres when it has none', async () => {
      const [search] = await readSearch(url, { type });

      expect(search).toEqual(
        expect.objectContaining({
          page: '1',
          limit: String(HISTORY_PAGE_SIZE),
        }),
      );
      expect(search).not.toHaveProperty('genres');
      expect(search).not.toHaveProperty('start_at');
      expect(search).not.toHaveProperty('end_at');
    });

    describePagedReads({
      url,
      items: (page) => historyItems({ type, page }),
      cover: toListItemCover(assertDefined(mapped.at(0))),
    });
  });

  describe.each(READS)('type $type', ({ type, mapped }) => {
    it("should read loading, then the page's plays, each with its history card", async () => {
      const { store } = historyItems({ type });
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(kinds).toEqual(['loading', 'ready']);
      expect(ready.data.map((row) => row.entry)).toEqual(mapped);
      expect(ready.data.map((row) => row.card)).toEqual(
        mapped.map(toHistoryCard),
      );
    });
  });

  // The route, not the type, decides the read: Season reads Episodes yet has a route of its own.
  describe.each(
    [
      {
        type: 'movie',
        shown: 'movies',
        route: 'movies',
        url: HISTORY_MOVIES_URL,
      },
      {
        type: 'episode',
        shown: 'episodes',
        route: 'episodes',
        url: HISTORY_EPISODES_URL,
      },
      {
        type: 'show',
        shown: 'episodes',
        route: 'shows',
        url: HISTORY_SHOWS_URL,
      },
      {
        type: 'season',
        shown: 'episodes',
        route: 'seasons',
        url: HISTORY_SEASONS_URL,
      },
    ] as const,
  )('item $type', ({ type, shown, route, url }) => {
    const ITEM_ID = 456019;
    const ITEM_URL = `${url.replace('*', '')}/${ITEM_ID}`;
    const VALUES_OF_ITEM = {
      type: shown,
      item: { type, id: ITEM_ID },
    };

    it('should read its own route', async () => {
      servePaged({ url: ITEM_URL, body: [] });

      const requests = await captureRequests(
        async () => {
          const { reading } = await renderStore(
            historyItems(VALUES_OF_ITEM).store,
          );
          await readingOf(reading, 'entries');
        },
        { pathIncludes: '/history' },
      );

      expect(requests)
        .toEqual([`GET /users/me/history/${route}/${ITEM_ID}`]);
    });

    it('should send the page, the limit and the range, and drop the genres', async () => {
      const searches = await readSearch(ITEM_URL, {
        ...VALUES_OF_ITEM,
        genres: 'drama',
        range: { startDate: START_DATE, endDate: END_DATE },
        page: 3,
      });

      expect(searches).toEqual([
        expect.objectContaining({
          page: '3',
          limit: String(HISTORY_PAGE_SIZE),
          start_at: START_DATE.toISOString(),
          end_at: END_DATE.toISOString(),
        }),
      ]);
      expect(searches.at(0)).not.toHaveProperty('genres');
    });

    it('should count from the page headers', async () => {
      servePaged({ url: ITEM_URL, body: [], itemCount: 25 });
      const { reading } = await renderStore(
        historyItems(VALUES_OF_ITEM).store,
      );

      expect(await readingOf(reading, 'itemCount')).toBe(25);
    });
  });

  describe('type shows', () => {
    it("should read loading, then a row for each show, dated by its latest play, with the show's card and no history id", async () => {
      servePaged({
        url: HISTORY_SHOWS_URL,
        body: [
          { ...SILO_PLAY_RESPONSE, watched_at: LATEST },
          { ...DEVS_ROW, watched_at: LATER },
          { ...SILO_PLAY_RESPONSE, id: 3, watched_at: EARLIEST },
        ],
      });
      const { store } = historyItems({ type: 'shows' });
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(kinds).toEqual(['loading', 'ready']);
      expect(ready.data.map(({ entry }) => entry.watchedAt)).toEqual([
        new Date(LATEST),
        new Date(LATER),
      ]);
      expect(ready.data.map(({ entry }) => entry.id)).toEqual([
        undefined,
        undefined,
      ]);
      expect(ready.data.map(({ card }) => [card.target.type, card.target.id]))
        .toEqual([
          ['show', ShowSiloMappedMock.id],
          ['show', ShowDevsMappedMock.id],
        ]);
    });

    it('should count the shows, on one page', async () => {
      servePaged({
        url: HISTORY_SHOWS_URL,
        body: [SILO_PLAY_RESPONSE, {
          ...SILO_PLAY_RESPONSE,
          id: 3,
          watched_at: EARLIEST,
        }],
        itemCount: 2,
      });
      const { store } = historyItems({ type: 'shows' });
      const { reading } = await renderStore(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data).toHaveLength(1);
      expect(await readingOf(reading, 'itemCount')).toBe(1);
      expect(await readingOf(reading, 'pages')).toEqual({
        current: 1,
        total: 1,
      });
    });

    it("should give a show on two of the API's pages one row, dated by its latest play", async () => {
      serveTwoPages({
        url: HISTORY_SHOWS_URL,
        first: [{ ...SILO_PLAY_RESPONSE, watched_at: LATEST }],
        second: () =>
          pagedResponse({
            body: [{ ...SILO_PLAY_RESPONSE, id: 3, watched_at: EARLIEST }],
            page: 2,
            pageCount: 2,
          }),
      });
      const { store } = historyItems({ type: 'shows' });
      const { reading } = await renderStore(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map(({ entry }) => entry.watchedAt)).toEqual([
        new Date(LATEST),
      ]);
    });

    describe('with more shows than a page holds', () => {
      const SHOW_COUNT = HISTORY_PAGE_SIZE + 1;
      const ROWS = Array.from({ length: SHOW_COUNT }, (_, index) => ({
        ...SILO_PLAY_RESPONSE,
        id: index + 1,
        show: {
          ...ShowSiloResponseMock,
          ids: { ...ShowSiloResponseMock.ids, trakt: index + 1 },
        },
      }));

      it.each([
        { page: 1, shown: HISTORY_PAGE_SIZE, firstId: 1 },
        { page: 2, shown: 1, firstId: SHOW_COUNT },
      ])(
        'should read $shown shows on page $page',
        async ({ page, shown, firstId }) => {
          servePaged({ url: HISTORY_SHOWS_URL, body: ROWS });
          const { store } = historyItems({ type: 'shows', page });
          const { reading } = await renderStore(store);

          const ready = await nextOf(statusOf(reading), 'ready');

          expect(ready.data).toHaveLength(shown);
          expect(ready.data.at(0)?.card.target.id).toBe(firstId);
          expect(await readingOf(reading, 'itemCount')).toBe(SHOW_COUNT);
          expect(await readingOf(reading, 'pages')).toEqual({
            current: page,
            total: 2,
          });
        },
      );

      it('should clamp a page past the last', async () => {
        servePaged({ url: HISTORY_SHOWS_URL, body: ROWS });
        const { store, replacePage } = historyItems({ type: 'shows', page: 3 });
        const { reading } = await renderStore(store);
        const kinds = kindsOf(statusOf(reading));

        await vi.waitFor(() => expect(replacePage).toHaveBeenCalledWith(2));

        expect(kinds).toEqual(['loading']);
      });
    });

    it('should read a failed later page as error, and land every show on Retry', async () => {
      serveTwoPages({
        url: HISTORY_SHOWS_URL,
        first: [SILO_PLAY_RESPONSE],
        second: notFound,
      });
      const { store } = historyItems({ type: 'shows' });
      const { reading } = await renderStore(store);

      const failed = await nextOf(statusOf(reading), 'error');
      serveTwoPages({
        url: HISTORY_SHOWS_URL,
        first: [SILO_PLAY_RESPONSE],
        second: () =>
          pagedResponse({ body: [DEVS_ROW], page: 2, pageCount: 2 }),
      });
      failed.retry();
      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map(({ card }) => card.target.id)).toEqual([
        ShowSiloMappedMock.id,
        ShowDevsMappedMock.id,
      ]);
    });

    it('should read with the range and the genres, and share the plays between its pages', async () => {
      const searches = recordSearches(HISTORY_SHOWS_URL, []);
      const values = {
        type: 'shows',
        genres: 'drama',
        range: { startDate: START_DATE, endDate: END_DATE },
      } as const;
      const { first, second } = await renderStore(() => ({
        first: historyItems({ ...values, page: 1 }).store().reading,
        second: historyItems({ ...values, page: 2 }).store().reading,
      }));

      await Promise.all([
        readingOf(first, 'entries'),
        readingOf(second, 'entries'),
      ]);

      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        expect.objectContaining({
          page: '1',
          limit: String(MAX_PAGE_LIMIT),
          genres: 'drama',
          start_at: START_DATE.toISOString(),
          end_at: END_DATE.toISOString(),
        }),
      ]);
    });

    it("should carry a dropped show's date on the row whose target is that show", async () => {
      servePaged({ url: HISTORY_SHOWS_URL, body: [DEVS_ROW] });
      const { reading, dropped } = await renderSettledHistory(() => ({
        ...historyItems({ type: 'shows' }).store(),
        dropped: useUser().dropped,
      }));
      await readKnown(dropped);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map(({ card, droppedAt }) => [
        card.target.id,
        droppedAt,
      ])).toEqual([[ShowDevsMappedMock.id, DROPPED_AT]]);
    });
  });
});
