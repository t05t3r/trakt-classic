import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import {
  type MediaCard,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import {
  type ActivityHistory,
  activityHistoryQuery,
} from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
import { HISTORY_PAGE_SIZE } from '$lib/utils/HISTORY_PAGE_SIZE.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { ActivityHistoryMappedMock } from '$mocks/data/users/mapped/ActivityHistoryMappedMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import type { PagedResponseParams } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { describePagedReads } from '$test/beds/store/describePagedReads.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readingOf } from '$test/beds/store/readingOf.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { waitFor } from '@testing-library/svelte';
import type { Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { type CountRead, usePagedItems } from './usePagedItems.ts';

type HistoryItemsOptions = {
  page?: number;
  countRead?: CountRead;
  watched?: Observable<WatchedFilter | null>;
  toCard?: (entry: ActivityHistory) => MediaCard;
};

const HERETIC_ROW = assertDefined(
  ActivityHistoryResponseMock.find((row) => row.type === 'movie'),
);

// A store over the user's history, the paging read by a caller other than the lists.
function historyItems(
  { page = FIRST_PAGE, ...options }: HistoryItemsOptions = {},
) {
  const replacePage = vi.fn();
  const store = () => ({
    dropped: useUser().dropped,
    reading: usePagedItems({
      query: activityHistoryQuery,
      params: { slug: 'me', limit: HISTORY_PAGE_SIZE },
      page,
      pageSize: HISTORY_PAGE_SIZE,
      toCard: toMediaCard,
      toCover: toListItemCover,
      replacePage,
      ...options,
    }),
  });

  return { store, replacePage };
}

function serveHistory(params: PagedResponseParams) {
  servePaged({ url: HISTORY_URL, ...params });
}

describe('store: usePagedItems', () => {
  describePagedReads({
    url: HISTORY_URL,
    items: (page) => historyItems({ page }),
    cover: toListItemCover(assertDefined(ActivityHistoryMappedMock.at(0))),
  });

  describe('states', () => {
    it("should read loading, then the page's entries, each with its card", async () => {
      const { store } = historyItems();
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(kinds).toEqual(['loading', 'ready']);
      expect(ready.data.map((row) => row.entry)).toEqual(
        ActivityHistoryMappedMock,
      );
      expect(ready.data.map((row) => row.card)).toEqual(
        ActivityHistoryMappedMock.map(toMediaCard),
      );
    });
  });

  describe('counts', () => {
    it("should read a 'length' count read's counts from page 1 and replace a later page with page 1", async () => {
      const searches = recordSearches(HISTORY_URL, ActivityHistoryResponseMock);
      const { store, replacePage } = historyItems({
        page: 2,
        countRead: 'length',
      });
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      await waitFor(() => expect(replacePage).toHaveBeenCalledWith(1));

      expect(searches.map((search) => search.get('page'))).toEqual(['1']);
      expect(await readingOf(reading, 'itemCount')).toBe(2);
      expect(kinds).toEqual(['loading']);
    });
  });

  describe('a page past the last', () => {
    it('should read a later page that comes back empty as loading while its count read is pending', async () => {
      serveHistory({ body: [], page: 2, pageCount: 9, itemCount: 999 });
      const { store } = historyItems({
        page: 2,
        countRead: valueObservable<SectionStatus<number>>({ kind: 'loading' }),
      });
      const { reading } = await renderStore(store);
      const kinds = kindsOf(statusOf(reading));

      expect(await readingOf(reading, 'entries')).toEqual([]);
      expect(kinds).toEqual(['loading']);
    });

    it('should read a later page within the page headers that comes back empty as empty', async () => {
      serveHistory({ body: [], page: 2, pageCount: 2, itemCount: 60 });
      const { store, replacePage } = historyItems({ page: 2 });
      const { reading } = await renderStore(store);

      await nextOf(statusOf(reading), 'empty');
      await waitNegativeClaim();

      expect(replacePage).not.toHaveBeenCalled();
    });
  });

  describe('dropped', () => {
    it("should carry a dropped show's date on the show's card", async () => {
      serveHistory({ body: [HERETIC_ROW] });
      const { store } = historyItems({
        toCard: () => toMediaCard({ type: 'show', show: ShowDevsMappedMock }),
      });
      const { reading, dropped } = await renderSettledHistory(store);
      await readKnown(dropped);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => row.droppedAt)).toEqual([DROPPED_AT]);
    });

    it("should carry no date on a row that is not a show, though its id is a dropped show's", async () => {
      serveHistory({ body: [HERETIC_ROW] });
      const { store } = historyItems({
        toCard: () =>
          toMediaCard({
            type: 'movie',
            movie: { ...MovieHereticMappedMock, id: ShowDevsMappedMock.id },
          }),
      });
      const { reading, dropped } = await renderSettledHistory(store);
      await readKnown(dropped);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.at(0)).not.toHaveProperty('droppedAt');
    });
  });

  describe('watched filter', () => {
    it('should keep a watched row unfaded without a watched filter', async () => {
      serveHistory({ body: [HERETIC_ROW] });
      const { store } = historyItems();
      const { reading } = await renderSettledHistory(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => row.isFaded)).toEqual([false]);
    });

    it('should fade a watched row under fade', async () => {
      serveHistory({ body: [HERETIC_ROW] });
      const { store } = historyItems({ watched: valueObservable('fade') });
      const { reading } = await renderSettledHistory(store);

      const ready = await nextOf(statusOf(reading), 'ready');

      expect(ready.data.map((row) => row.isFaded)).toEqual([true]);
    });
  });
});
