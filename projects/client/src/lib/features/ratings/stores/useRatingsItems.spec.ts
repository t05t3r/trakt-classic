import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import { UserRatingsMappedMock } from '$mocks/data/users/mapped/UserRatingsMappedMock.ts';
import { RATINGS_PATH } from '$mocks/data/users/RATINGS_PATH.ts';
import { UserRatingsResponseMock } from '$mocks/data/users/response/UserRatingsResponseMock.ts';
import { USER_RATINGS_URL } from '$mocks/data/users/USER_RATINGS_URL.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { describePagedReads } from '$test/beds/store/describePagedReads.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { describe, expect, it, vi } from 'vitest';
import { type RatingsItemsValues, useRatingsItems } from './useRatingsItems.ts';

const VALUES: RatingsItemsValues = {
  type: 'all',
  rating: 'all',
  page: 1,
};

type RatingsItemsOptions = Partial<RatingsItemsValues> & {
  filter?: WatchedFilter | null;
};

function ratingsItems({ filter = null, ...values }: RatingsItemsOptions = {}) {
  const replacePage = vi.fn();
  const store = () => ({
    reading: useRatingsItems({
      values: { ...VALUES, ...values },
      watched: valueObservable(filter),
      replacePage,
    }),
  });

  return { store, replacePage };
}

describe('store: useRatingsItems', () => {
  describePagedReads({
    url: USER_RATINGS_URL,
    items: (page) => ratingsItems({ page }),
    cover: toListItemCover(assertDefined(UserRatingsMappedMock.at(0))),
  });

  describe('states', () => {
    it("should read loading, then the page's ratings, each with its card", async () => {
      const { store } = ratingsItems();
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(kinds).toEqual(['loading', 'ready']);
      expect(ready.data.map((row) => row.entry)).toEqual(UserRatingsMappedMock);
      expect(ready.data.map((row) => row.card)).toEqual(
        UserRatingsMappedMock.map(toListItemCard),
      );
    });
  });

  describe('the read', () => {
    it('should read the page at the history page size', async () => {
      const searches = recordSearches(USER_RATINGS_URL, []);
      const { store } = ratingsItems({ page: 3 });
      const { reading } = await renderStore(store);

      await readingOf(reading, 'entries');

      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        expect.objectContaining({
          page: '3',
          limit: String(HISTORY_PAGE_SIZE),
        }),
      ]);
    });

    it('should carry the type and the rating to the request', async () => {
      const { store } = ratingsItems({ type: 'seasons', rating: '8' });

      const requests = await captureRequests(
        async () => {
          const { reading } = await renderStore(store);

          await readingOf(reading, 'entries');
        },
        { pathIncludes: RATINGS_PATH },
      );

      expect(requests).toEqual([`GET ${RATINGS_PATH}/seasons/8`]);
    });
  });

  describe('watched filter', () => {
    it('should keep every rating unfaded without a filter', async () => {
      const { store } = ratingsItems();
      const { reading } = await renderSettledHistory(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => row.isFaded)).toEqual([
        false,
        false,
        false,
        false,
      ]);
    });

    it('should fade the watched movie under fade', async () => {
      const { store } = ratingsItems({ filter: 'fade' });
      const { reading } = await renderSettledHistory(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => [row.entry.type, row.isFaded])).toEqual([
        ['movie', true],
        ['show', false],
        ['season', false],
        ['episode', false],
      ]);
    });

    it('should drop the watched movie under hide, leaving the counts and the entries', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock,
        pageCount: 3,
        itemCount: 150,
      });
      const { store } = ratingsItems({ filter: 'hide' });
      const { reading } = await renderSettledHistory(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => row.entry.type)).toEqual([
        'show',
        'season',
        'episode',
      ]);
      expect(await readingOf(reading, 'itemCount')).toBe(150);
      expect(await readingOf(reading, 'pages')).toEqual({
        current: 1,
        total: 3,
      });
      expect(await readingOf(reading, 'entries')).toEqual(
        UserRatingsMappedMock,
      );
    });

    it('should read a page that hide empties as empty, its entries keeping the hidden rating', async () => {
      servePaged({
        url: USER_RATINGS_URL,
        body: UserRatingsResponseMock.slice(0, 1),
      });
      const { store } = ratingsItems({ filter: 'hide' });
      const { reading } = await renderSettledHistory(store);

      await nextOf(statusOf(reading), 'empty');

      expect(await readingOf(reading, 'entries')).toEqual(
        UserRatingsMappedMock.slice(0, 1),
      );
    });
  });
});
