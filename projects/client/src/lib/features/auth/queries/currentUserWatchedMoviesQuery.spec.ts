import { WatchedMoviesMappedMock } from '$mocks/data/users/mapped/WatchedMoviesMappedMock.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { renderSnapshot } from '$test/beds/query/renderSnapshot.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveHeaderlessPages } from '$test/beds/request/serveHeaderlessPages.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { currentUserWatchedMoviesQuery } from './currentUserWatchedMoviesQuery.ts';

const MOVIE_COUNT = Object.keys(WatchedMoviesResponseMock).length;

function readAllPages(limit: number) {
  return captureRequests(async () => {
    const { snapshot, waitForLateRequests } = await renderSnapshot(
      currentUserWatchedMoviesQuery({ limit }),
      (entries) => entries,
    );

    await readKnown(snapshot);
    await waitForLateRequests();
  }, { pathIncludes: '/watched/movies' });
}

describe('currentUserWatchedMoviesQuery', () => {
  it('should request the most a page holds by default', async () => {
    const searches = recordSearches(WATCHED_MOVIES_URL, {});

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(currentUserWatchedMoviesQuery()),
      mapper: mapToEntries,
    });

    expect(searches.map((search) => search.get('limit')))
      .to.deep.equal([String(MAX_PAGE_LIMIT)]);
  });

  it('should query for watched movies', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(currentUserWatchedMoviesQuery()),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(WatchedMoviesMappedMock);
  });

  // Trakt sends this endpoint's pages without pagination headers.
  it('should read on past a page shorter than its limit until an empty one', async () => {
    serveHeaderlessPages({
      url: WATCHED_MOVIES_URL,
      pages: [
        WatchedMoviesResponseMock,
        { '603': ['2024-12-21T20:00:00.000Z'] },
      ],
    });

    const requests = await readAllPages(MOVIE_COUNT + 1);

    expect(requests).toEqual([
      'GET /users/me/watched/movies',
      'GET /users/me/watched/movies',
      'GET /users/me/watched/movies',
    ]);
  });
});
