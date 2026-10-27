import { OTHER_UNWATCHED_MOVIE } from '$mocks/data/media-actions/OTHER_UNWATCHED_MOVIE.ts';
import { UNWATCHED_MOVIE } from '$mocks/data/media-actions/UNWATCHED_MOVIE.ts';
import { WatchedMoviesResponseMock } from '$mocks/data/users/response/WatchedMoviesResponseMock.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { renderSettledHistory } from '$test/beds/store/renderSettledHistory.ts';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useWatched } from './useWatched.ts';

// The invalidation hook fires once per query id per module, so this probe needs a module where it has seen none.
describe('store: useWatched, invalidation hook on a fresh module', () => {
  // Captures the load too, so a refetch the hook starts on data under 30 s old would show.
  it('should refuse another add while the refetch of a write on data under 30 s old is held', async () => {
    const requests = await captureRequests(async () => {
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
      const write = first.add();
      await movies.requested;
      expect(await firstValueFrom(history)).toBeNull();
      await other.add();
      movies.release();
      await write;
      await waitForLateRequests();
    });

    const post = requests.indexOf('POST /sync/history');
    expect(post).toBeGreaterThan(-1);
    // The load's requests race, so their order is not checked.
    expect(requests.slice(0, post).toSorted()).toEqual([
      'GET /users/me/watched/movies',
      'GET /users/me/watched/shows',
      'GET /users/settings',
    ]);
    expect(requests.slice(post)).toEqual([
      'POST /sync/history',
      'GET /users/me/watched/movies',
    ]);
  });
});
