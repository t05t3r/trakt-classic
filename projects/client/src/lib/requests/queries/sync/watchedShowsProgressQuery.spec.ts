import { WATCHED_PROGRESS_URL } from '$mocks/data/sync/WATCHED_PROGRESS_URL.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
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
import { watchedShowsProgressQuery } from './watchedShowsProgressQuery.ts';

const SILO_DATE = '2025-01-31T23:12:41.000Z';
const DEVS_DATE = '2025-01-30T20:00:00.000Z';
const SILO_ROW = watchedProgressRow(ShowSiloResponseMock, SILO_DATE);
const DEVS_ROW = watchedProgressRow(ShowDevsResponseMock, DEVS_DATE);

function readEntries() {
  return runQuery({
    factory: () => createTestBedInfiniteQuery(watchedShowsProgressQuery()),
    mapper: mapToEntries,
  });
}

describe('watchedShowsProgressQuery', () => {
  it('should map a dated row to its show and its date', async () => {
    servePaged({ url: WATCHED_PROGRESS_URL, body: [SILO_ROW] });

    expect(await readEntries()).toEqual([
      { show: ShowSiloMappedMock, watchedAt: new Date(SILO_DATE) },
    ]);
  });

  it.each([null, undefined])(
    'should drop a row whose date is %s, since that show has no Play',
    async (lastWatchedAt) => {
      servePaged({
        url: WATCHED_PROGRESS_URL,
        body: [
          watchedProgressRow(ShowDevsResponseMock, lastWatchedAt),
          SILO_ROW,
        ],
      });

      expect(await readEntries()).toEqual([
        { show: ShowSiloMappedMock, watchedAt: new Date(SILO_DATE) },
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
      (entries) => entries,
    );

    expect(await readKnown(snapshot)).toEqual([
      { show: ShowSiloMappedMock, watchedAt: new Date(SILO_DATE) },
      { show: ShowDevsMappedMock, watchedAt: new Date(DEVS_DATE) },
    ]);
  });

  it('should ask for the most a page holds, with the art', async () => {
    const searches = recordSearches(WATCHED_PROGRESS_URL, []);

    await readEntries();

    expect(searches.map((search) => Object.fromEntries(search))).toEqual([
      expect.objectContaining({
        extended: 'full,images',
        limit: String(MAX_PAGE_LIMIT),
        page: '1',
      }),
    ]);
  });

  it.each([
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
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
