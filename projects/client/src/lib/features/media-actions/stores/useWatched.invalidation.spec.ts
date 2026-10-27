import { OTHER_UNWATCHED_MOVIE } from '$mocks/data/media-actions/OTHER_UNWATCHED_MOVIE.ts';
import { SILO_EPISODE } from '$mocks/data/media-actions/SILO_EPISODE.ts';
import { UNWATCHED_MOVIE } from '$mocks/data/media-actions/UNWATCHED_MOVIE.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WatchedShowsMinimalResponseMock } from '$mocks/data/users/response/WatchedShowsMinimalResponseMock.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { ageLoadedData } from '$test/beds/query/ageLoadedData.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useWatched } from './useWatched.ts';

// The invalidation hook fires once per query id per module, so its probes keep their own file.
describe('store: useWatched, invalidation hook', () => {
  it('should read the history known and post a following add once a write on data 31 s old settles, refetching once per write', async () => {
    server.use(
      http.get(
        WATCHED_SHOWS_URL,
        () => pagedResponse({ body: WatchedShowsMinimalResponseMock }),
      ),
    );
    const { episode, history, waitForLateRequests } =
      await renderSettledHistory(
        () => ({
          episode: useWatched(SILO_EPISODE),
          waitForLateRequests: useWaitForLateRequests(),
        }),
      );
    ageLoadedData();

    const requests = await captureRequests(async () => {
      await episode.add();
      expect(await firstValueFrom(history)).not.toBeNull();
      await episode.add();
      await waitForLateRequests();
    });

    expect(requests).toEqual([
      'POST /sync/history',
      'GET /users/me/watched/shows',
      'POST /sync/history',
      'GET /users/me/watched/shows',
    ]);
  });

  it('should refuse another add while the refetch of a write on data 31 s old is held', async () => {
    const { first, other, history, waitForLateRequests } =
      await renderSettledHistory(
        () => ({
          first: useWatched(UNWATCHED_MOVIE),
          other: useWatched(OTHER_UNWATCHED_MOVIE),
          waitForLateRequests: useWaitForLateRequests(),
        }),
      );
    const movies = holdRequest({
      method: 'get',
      url: WATCHED_MOVIES_URL,
      answer: () => pagedResponse({ body: WatchedMoviesResponseMock }),
    });
    ageLoadedData();

    const requests = await captureRequests(async () => {
      const write = first.add();
      await movies.requested;
      expect(await firstValueFrom(history)).toBeNull();
      await other.add();
      movies.release();
      await write;
      await waitForLateRequests();
    });

    expect(requests).toEqual([
      'POST /sync/history',
      'GET /users/me/watched/movies',
    ]);
  });
});
