import { LATEST_WATCHED_AT } from '$mocks/data/sync/LATEST_WATCHED_AT.ts';
import { WATCHED_PROGRESS_URL } from '$mocks/data/sync/WATCHED_PROGRESS_URL.ts';
import { WatchedProgressMappedMock } from '$mocks/data/sync/mapped/WatchedProgressMappedMock.ts';
import { WatchedProgressResponseMock } from '$mocks/data/sync/response/WatchedProgressResponseMock.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { time } from '$lib/utils/timing/time.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { renderSnapshot } from '$test/beds/query/renderSnapshot.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import {
  type WatchedShowsProgressParams,
  watchedShowsProgressQuery,
} from './watchedShowsProgressQuery.ts';

const DEVS_DATE = '2025-01-30T20:00:00.000Z';
const SILO_ROW = watchedProgressRow({
  show: ShowSiloResponseMock,
  lastWatchedAt: LATEST_WATCHED_AT,
});
const DEVS_ROW = watchedProgressRow({
  show: ShowDevsResponseMock,
  lastWatchedAt: DEVS_DATE,
});

const SORTED_PARAMS: WatchedShowsProgressParams = {
  sortBy: 'title',
  sortHow: 'asc',
  hideCompleted: true,
};

function readEntries(params?: WatchedShowsProgressParams) {
  return runQuery({
    factory: () =>
      createTestBedInfiniteQuery(watchedShowsProgressQuery(params)),
    mapper: mapToEntries,
  });
}

async function readWithSearches(params?: WatchedShowsProgressParams) {
  const searches = recordSearches(
    WATCHED_PROGRESS_URL,
    WatchedProgressResponseMock,
  );

  const entries = await readEntries(params);

  return {
    entries,
    searches: searches.map((search) => Object.fromEntries(search)),
  };
}

describe('watchedShowsProgressQuery', () => {
  describe('at the default params', () => {
    it('should ask for every show by its date added, newest first', async () => {
      const { searches } = await readWithSearches();

      expect(searches).toEqual([
        expect.objectContaining({
          extended: 'full,images',
          limit: String(MAX_PAGE_LIMIT),
          page: '1',
          sort_by: 'added',
          sort_how: 'desc',
        }),
      ]);
      expect(searches.at(0)).not.toHaveProperty('hide_completed');
    });

    it('should map each row to its show, its progress and its episodes', async () => {
      const { entries } = await readWithSearches();

      expect(entries).toEqual(WatchedProgressMappedMock);
    });

    it('should share one key with a call at the explicit defaults', () => {
      expect(watchedShowsProgressQuery().queryKey).toEqual(
        watchedShowsProgressQuery({
          page: 1,
          sortBy: 'added',
          sortHow: 'desc',
          hideCompleted: false,
        }).queryKey,
      );
    });
  });

  describe('at a sorted, hide-completed set', () => {
    it('should ask for its sort, hiding the completed shows', async () => {
      const { searches } = await readWithSearches(SORTED_PARAMS);

      expect(searches).toEqual([
        expect.objectContaining({
          extended: 'full,images',
          limit: String(MAX_PAGE_LIMIT),
          page: '1',
          sort_by: 'title',
          sort_how: 'asc',
          hide_completed: 'true',
        }),
      ]);
    });

    it('should map each row as at the default params', async () => {
      const { entries } = await readWithSearches(SORTED_PARAMS);

      expect(entries).toEqual(WatchedProgressMappedMock);
    });
  });

  it.each(
    [
      { sortBy: 'title' },
      { sortHow: 'asc' },
      { hideCompleted: true },
      { page: 2 },
    ] as const,
  )('should have a key of its own at %o alone', (params) => {
    expect(watchedShowsProgressQuery(params).queryKey).not.toEqual(
      watchedShowsProgressQuery().queryKey,
    );
  });

  it.each([null, undefined])(
    'should keep a row whose date is %s, with no episodes',
    async (lastWatchedAt) => {
      servePaged({
        url: WATCHED_PROGRESS_URL,
        body: [
          watchedProgressRow({
            show: ShowDevsResponseMock,
            lastWatchedAt,
          }),
        ],
      });

      expect(await readEntries()).toEqual([
        expect.objectContaining({
          show: ShowDevsMappedMock,
          lastWatchedAt: null,
          nextEpisode: null,
          lastEpisode: null,
        }),
      ]);
    },
  );

  it('should read every page the headers name', async () => {
    serveTwoPages({
      url: WATCHED_PROGRESS_URL,
      first: [SILO_ROW],
      second: () => pagedResponse({ body: [DEVS_ROW], page: 2, pageCount: 2 }),
    });

    const { snapshot } = await renderSnapshot(
      watchedShowsProgressQuery(),
      (entries) =>
        entries.map(({ show, lastWatchedAt }) => ({ show, lastWatchedAt })),
    );

    expect(await readKnown(snapshot)).toEqual([
      { show: ShowSiloMappedMock, lastWatchedAt: new Date(LATEST_WATCHED_AT) },
      { show: ShowDevsMappedMock, lastWatchedAt: new Date(DEVS_DATE) },
    ]);
  });

  it('should stay fresh for 15 minutes', () => {
    expect(watchedShowsProgressQuery().staleTime).toBe(time.minutes(15));
  });

  it.each([
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.HideProgress,
  ])('should refetch on %s', async (action) => {
    const invalidate = await observeInvalidation(() =>
      createTestBedInfiniteQuery(watchedShowsProgressQuery())
    );

    expect(await invalidate(action)).toEqual(['GET /sync/progress/watched']);
  });

  it('should not refetch on a movie Play', async () => {
    const invalidate = await observeInvalidation(() =>
      createTestBedInfiniteQuery(watchedShowsProgressQuery())
    );

    expect(await invalidate(InvalidateAction.MarkAsWatched('movie')))
      .toEqual([]);
  });
});
