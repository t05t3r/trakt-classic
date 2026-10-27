import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { WatchedMoviesMappedMock } from '$mocks/data/users/mapped/WatchedMoviesMappedMock.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveHeaderlessPages } from '$test/beds/request/serveHeaderlessPages.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { currentUserWatchedMoviesQuery } from './currentUserWatchedMoviesQuery.ts';

const MOVIE_COUNT = Object.keys(WatchedMoviesResponseMock).length;

function readAllPages(limit: number) {
  return captureRequests(async () => {
    const { movies, waitForLateRequests } = await renderStore(() => ({
      movies: useSnapshot(currentUserWatchedMoviesQuery({ limit }), {
        select: (entries) => entries,
        whileUnsettled: 'hold',
      }),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const subscription = movies.subscribe();
    onTestFinished(() => subscription.unsubscribe());

    await readKnown(movies);
    await waitForLateRequests();
  }).then((requests) =>
    requests.filter((request) => request.endsWith('/watched/movies'))
  );
}

describe('currentUserWatchedMoviesQuery', () => {
  it('should request 250 watched movies by default', async () => {
    const searches = recordSearches(WATCHED_MOVIES_URL, {});

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(currentUserWatchedMoviesQuery()),
      mapper: mapToEntries,
    });

    expect(searches.map((search) => search.get('limit')))
      .to.deep.equal(['250']);
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
  it('should send one request when a headerless page is shorter than its limit', async () => {
    serveHeaderlessPages({
      url: WATCHED_MOVIES_URL,
      pages: [WatchedMoviesResponseMock, WatchedMoviesResponseMock],
    });

    const requests = await readAllPages(MOVIE_COUNT + 1);

    expect(requests).toEqual(['GET /users/me/watched/movies']);
  });

  it('should request the next page when a headerless page fills its limit', async () => {
    const fullPage = {
      ...WatchedMoviesResponseMock,
      '481': ['2024-12-20T20:00:00.000Z'],
    };
    serveHeaderlessPages({
      url: WATCHED_MOVIES_URL,
      pages: [fullPage, { '603': ['2024-12-21T20:00:00.000Z'] }],
    });

    const requests = await readAllPages(Object.keys(fullPage).length);

    expect(requests).toEqual([
      'GET /users/me/watched/movies',
      'GET /users/me/watched/movies',
    ]);
  });
});
